# SkillSense — Data Guide

**Understanding the data behind the predictions.**

Read this before starting any ML or backend work. It explains where the data comes from, how it is structured, what each feature means, and how everything connects to produce role demand forecasts.

---

## The Big Picture

SkillSense predicts which ICT roles will be in demand in Rwanda over the next 6 months, 1 year, and 2 years. To do this, it combines three datasets:

```
Dataset A                    Dataset B                    Dataset C
Historical ICT data          Current job postings         Government microdata
(2005-2026, 440 rows)        (92 ICT postings, 2026)      (NISR LFS, 2017-2025)
        |                           |                           |
        |    +---------+            |                           |
        +--->|         |<-----------+                           |
             | ML      |                                        |
             | Model   |<---------------------------------------+
             |         |            (verified the historical data)
             +---------+
                  |
                  v
        Role demand forecasts
        (6 months, 1 year, 2 years)
```

**In simple terms:**
- Dataset A tells the model how ICT roles have grown or declined over 22 years
- Dataset B tells the model what employers are hiring for right now
- Dataset C proves that Dataset A is anchored to real government statistics

The model learns patterns from the past and present, then projects forward.

---

## How We Got the Data

### Step 1: Scraping current job postings

We collected real job postings from 4 Rwandan job websites in September 2026:

| Source | Method | Raw postings | ICT postings |
|--------|--------|:---:|:---:|
| rwandajob.com | Manual HTML save (Cloudflare blocks automated scraping) | 59 | 45 |
| jobwebrwanda.com | Web fetch + parse | 19 | 19 |
| greatrwandajobs.com | Web fetch + parse | 16 | 16 |
| jobinrwanda.com | Python scraper (`scripts/scraper_jobinrwanda.py`) | 82 | 12 |
| **Total** | | **176** | **92** |

The scraper is a one-time development tool. It is NOT part of the production system. In production, an admin uploads new CSV files manually.

### Step 2: Classification pipeline

Every scraped job posting went through our classification pipeline (`scripts/classify_and_group_v2.py`):

```
Raw job posting
      |
      v
Is this an ICT job? ──── Evidence-based scoring
      |                   (title, industry, description, skills)
      |                   Score >= 0.45 → ICT
      |                   Score < 0.45 → Not ICT
      v
  ICT posting
      |
      v
What normalized role? ── Rule-based matching
      |                   (title patterns + context inference)
      |                   Maps to one of 20 standard roles
      v
  Classified posting
      |
      v
What role family/group? ── Taxonomy lookup
      |                     (role → family → group)
      v
  Final analytical record
```

**Why classification matters:** A job called "Solution Engineer" at an insurance company could be many things. Our pipeline reads the full job description, checks for ICT function evidence (programming, systems, databases, etc.), and only classifies it as ICT when the core occupational function is genuinely ICT. A finance manager who uses Excel is NOT an ICT role.

### Step 3: Role normalization and grouping

Job titles are messy. Employers use hundreds of different titles for similar work. We normalize them into a controlled taxonomy:

```
ORIGINAL TITLE                    NORMALIZED ROLE                       ROLE FAMILY
"Senior Java Software Engineer" → Software Developer / Software Eng. → Software Development
"Frontend Developer - React"    → Frontend / Web Developer            → Software & Web Development
"Network Administrator"         → Network Engineer / Network Admin    → Networks
"IT Internal Auditor"           → IT Auditor / IT Governance & Risk   → IT Governance & Audit
```

**Why this matters for forecasting:** Without normalization, the model would see "Java Developer", "Backend Software Engineer", and "Application Developer" as completely different roles with tiny individual demand. After normalization, they are all "Backend Developer" with meaningful combined demand that the model can actually learn from.

### Step 4: Historical data construction

We built 22 years of historical ICT labour data (2005-2026) by combining multiple sources:

| Period | Source | How it was built |
|--------|--------|-----------------|
| 2017-2025 | NISR Labour Force Survey microdata (Dataset C) | Computed from weighted individual-level survey records using ISIC Section J and ISCO-08 codes 25/35 |
| 2005-2016 | Census 2002 + EICV benchmarks | Back-extrapolated from known benchmarks, anchored to the 2017 government values |
| 2026 | Dataset B (92 ICT postings) | Aggregated posting shares + extrapolated macro indicators from 2024-2025 trends |

**Important:** The 2005-2016 role-level data is a synthetic scaffold — it represents plausible trends based on government anchors, but the individual role breakdowns are estimates, not direct measurements. The `synthetic_flag` column marks this. The 2017-2025 macro indicators are verified against real government data.

---

## The Three Datasets

### Dataset A — Historical ICT Labour Data (the training data)

**Location:** `skillsense_job_data/data/historical/`

**Files:**
- `skillsense_ict_labour_history_2005_2009.csv` — 100 rows (5 years x 20 roles)
- `skillsense_ict_labour_history_2010_2018.csv` — 180 rows (9 years x 20 roles)
- `skillsense_ict_labour_history_2019_2025.csv` — 160 rows (8 years x 20 roles, includes 2026)

**Total: 440 rows** (22 years x 20 roles per year)

**Structure:** One row = one role in one year.

Each row contains:

#### Identity columns

| Column | Description | Example |
|--------|-------------|---------|
| `year` | The year | 2026 |
| `period` | Time period type | "annual" |
| `sector` | Always ICT for this dataset | "ICT" |
| `role_family` | The broader role group | "Software Development" |
| `role` | The normalized ICT role (one of 20) | "Backend Developer" |
| `occupation_proxy` | Standard occupation classification reference | "Software developers / applications programmers" |
| `historical_role_status` | Whether this role has enough data to track | "trackable analytical role" |

#### Macro indicators (same for all 20 roles in a given year)

These describe the overall Rwandan labour market in that year:

| Column | Description | 2026 value |
|--------|-------------|:---:|
| `ict_employment` | Total number of people employed in ICT nationally | 246,017 |
| `ict_employment_share_pct` | ICT employment as a percentage of total employment | 4.8% |
| `total_employment` | Total national employment | 5,191,853 |
| `labour_force_participation_rate_pct` | Percentage of working-age population in the labour force | 40.5% |
| `employment_to_population_ratio_pct` | Percentage of working-age population that is employed | 36.4% |
| `unemployment_rate_pct` | National unemployment rate | 9.9% |
| `tertiary_employment_count` | Number employed in the services/tertiary sector | 2,820,588 |

**Why these matter:** The model uses macro indicators to understand the broader economic context. If total employment is growing and ICT's share is increasing, that amplifies role-level demand. If unemployment is high, demand may be suppressed.

#### Role-level features (unique per role per year)

These are the core features the model learns from:

| Column | Description | Example |
|--------|-------------|---------|
| `role_demand_index` | Demand score normalized 0-100 (100 = highest demand role that year) | 84.6 |
| `role_share_within_ict_pct` | This role's share of total ICT employment (all 20 roles sum to 100%) | 11.408% |
| `role_employment_proxy` | Estimated number of people in this role nationally | 28,067 |
| `emergence_year` | When this role first appeared in Rwanda's ICT market | 2016 |

**How these relate:**
- `role_employment_proxy` = `ict_employment` x (`role_share_within_ict_pct` / 100)
- `role_demand_index` = (`role_employment_proxy` / max_proxy_that_year) x 100
- The role with the highest employment proxy each year gets index = 100

#### Target columns (what the model predicts)

| Column | Description |
|--------|-------------|
| `target_role_demand_index_1y` | The demand index this role will have 1 year later |
| `target_role_demand_index_2y` | The demand index this role will have 2 years later |
| `target_role_demand_6m` | The demand index 6 months later (NaN — we only have annual data) |

**These are the prediction targets.** For example, if we are training on year 2023, the 1-year target is the actual demand index from 2024. The model learns: "given these features in 2023, the demand in 2024 was X." Then for 2026, it predicts 2027 and 2028.

#### Metadata columns

| Column | Description |
|--------|-------------|
| `data_basis` | Where this row's data came from |
| `synthetic_flag` | 1 = synthetic/estimated, 0 = derived from real data |
| `note_6m` | Notes about sub-annual data availability |

---

### Dataset B — Current ICT Job Postings (the validation data)

**Location:** `skillsense_job_data/data/current_ict/ict_job_postings_v2.csv`

**Total: 92 rows** — one row per ICT job posting.

This is the real-world evidence of what employers are hiring for right now. Each row is an actual job advertisement from a Rwandan job website.

**Key columns:**

| Column | Description |
|--------|-------------|
| `source` | Which website (rwandajob, jobwebrwanda, greatrwandajobs, jobinrwanda) |
| `title` | Original job title as posted |
| `company` | Employer name |
| `location_raw` | Location as written in the posting |
| `industry_raw` | Industry/sector |
| `is_ict` | True — all rows here are confirmed ICT |
| `ict_role_confidence` | How confident the classifier is (0.0 to 1.0) |
| `original_job_title` | Preserved original title (never overwritten) |
| `normalized_role` | Which of the 20 standard roles this maps to |
| `role_family` | The broader role group |
| `role_group` | The role group for analytics |
| `role_level` | Seniority (Intern, Junior, Mid-Level, Senior, etc.) |
| `role_normalization_confidence` | Confidence of the role mapping (0.0 to 1.0) |

**How Dataset B feeds into the model:**

Dataset B was aggregated into posting shares per role and transformed into the 2026 row of Dataset A (Phase 1). This is how current market reality enters the training data:

```
92 ICT postings
      |
      v
Count postings per normalized role
      |
      v
Calculate posting_share_pct per role
      |
      v
Combine with extrapolated 2026 macro indicators
      |
      v
Calculate role_employment_proxy and role_demand_index
      |
      v
20 new rows appended to Dataset A as year=2026
```

**Current role distribution (from the 92 postings):**

| Normalized Role | Postings | Share |
|----------------|:---:|:---:|
| IT Officer / ICT Administrator | 13 | 14.1% |
| Backend Developer | 11 | 12.0% |
| DevOps / Cloud Engineer | 9 | 9.8% |
| ICT Manager / IT Manager | 7 | 7.6% |
| Software Developer / Software Engineer | 7 | 7.6% |
| Frontend / Web Developer | 5 | 5.4% |
| QA / Software Test Engineer | 5 | 5.4% |
| Systems Analyst / IT Business Analyst | 5 | 5.4% |
| Data Analyst | 4 | 4.3% |
| Full-Stack Developer | 4 | 4.3% |
| Mobile App Developer | 4 | 4.3% |
| Systems Administrator | 4 | 4.3% |
| Network Engineer / Network Administrator | 3 | 3.3% |
| Data Engineer | 3 | 3.3% |
| Database Administrator | 3 | 3.3% |
| IT Auditor / IT Governance & Risk | 2 | 2.2% |
| Cybersecurity Analyst / Security Engineer | 2 | 2.2% |
| Data Scientist | 1 | 1.1% |
| IT Support / Help Desk Technician | 0 | 0.0% |
| Other ICT Technical Roles | 0 | 0.0% |

The 2 roles with zero postings were assigned small residual shares based on their historical trend (50% decay from 2025 share).

---

### Dataset C — NISR Labour Force Survey Microdata (the verification data)

**Location:** `skillsense_job_data/Labour_Force_Survey__2017-2024___Microdata/datasets/`

**Coverage:** 9 years (2017-2025), individual-level survey records from the Rwanda National Institute of Statistics.

**Purpose:** We used this government data to verify and anchor the macro indicators in Dataset A. We computed ICT employment counts from weighted survey records using:
- ISIC Section J (code 9) for industry classification
- ISCO-08 codes 25 and 35 for ICT occupations
- Survey weights (`weight2`) for population-level estimates

This dataset is NOT directly fed into the ML model. It was used during data construction to ensure Dataset A's macro indicators match official government statistics for 2017-2025.

---

## The 20 ICT Roles (Taxonomy)

Every job posting and every historical data point maps to one of these 20 normalized roles, organized into role families:

| Role Family | Normalized Role | In data since |
|-------------|----------------|:---:|
| **Software Development** | Software Developer / Software Engineer | 2005 |
| | Backend Developer | 2016 |
| | Frontend / Web Developer | 2014 |
| | Full-Stack Developer | 2018 |
| | Mobile App Developer | 2014 |
| **Software & Web Development** | Frontend / Web Developer | 2014 |
| **Systems Analysis** | Systems Analyst / IT Business Analyst | 2005 |
| **Data & Analytics** | Data Analyst | 2017 |
| | Data Engineer | 2019 |
| | Data Scientist | 2020 |
| **Data & Database** | Database Administrator | 2005 |
| **Networks** | Network Engineer / Network Administrator | 2005 |
| **Systems & Infrastructure** | Systems Administrator | 2005 |
| **IT Operations & Support** | IT Officer / ICT Administrator | 2005 |
| | IT Support / Help Desk Technician | 2005 |
| **Cybersecurity** | Cybersecurity Analyst / Security Engineer | 2018 |
| **Cloud & DevOps** | DevOps / Cloud Engineer | 2019 |
| **Software Quality** | QA / Software Test Engineer | 2016 |
| **ICT Management** | ICT Manager / IT Manager | 2005 |
| **IT Governance & Audit** | IT Auditor / IT Governance & Risk | 2017 |
| **Other ICT** | Other ICT Technical Roles | 2005 |

The `emergence_year` tells the model when a role first appeared. Roles that emerged recently (Data Scientist in 2020, DevOps in 2019) have shorter histories, which the model accounts for.

**Two additional roles existed only in 2005-2009:**
- ICT Applications / E-Government Developer
- Telecommunications / Network Technician

These were replaced by more specific roles in later periods as the ICT market matured.

---

## What the Model Will Learn

The ML model receives 440 rows (20 roles x 22 years). For each row, it sees:

**Input features:**
- Which role is this? (20 categories)
- What year? (time position)
- How many years since this role emerged? (role maturity)
- What is this role's share of ICT employment? (relative importance)
- How many people are estimated to work in this role? (absolute demand)
- What are the national macro indicators? (economic context)
- What was this role's demand index last year? And 2 years ago? (momentum)

**Target to predict:**
- What will this role's demand index be in 1 year? In 2 years?

**The training process:**

```
For each role-year row where we know the future:
    Model sees: features from year X
    Model learns: demand index in year X+1 and X+2

Then for 2026 (where we do NOT know the future):
    Model sees: features from 2026
    Model predicts: demand index for 2027 and 2028
```

**Example of what the model learns:**

```
Backend Developer in 2020:
  share = 5.8%, demand_index = 42.3, ict_employment = 97,000
  Actual 1-year-later demand_index (2021) = 47.1  ← model learns this pattern

Backend Developer in 2026:
  share = 11.4%, demand_index = 84.6, ict_employment = 246,000
  Predicted 1-year-later demand_index (2027) = ???  ← model predicts this
```

---

## Additional Analytical Data

Besides the main training data, the project includes several analytical datasets in `skillsense_job_data/data/analytical/`:

| File | Rows | What it contains |
|------|:---:|-----------------|
| `role_skill_demand.csv` | 76 | Which skills are demanded per role (e.g., Backend Developer needs Python, Django, SQL) |
| `skill_demand_monthly.csv` | 59 | Skill demand over time |
| `role_industry_monthly.csv` | 7 | Which industries hire which roles |
| `role_region_monthly.csv` | 5 | Geographic distribution of demand |
| `skillsense_role_forecasting_dataset.csv` | 6 | Prototype forecasting dataset with rolling averages and growth features |
| `data_dictionary.csv` | 67 | Field definitions for all datasets |

These support the dashboard analytics (sector intelligence, geographic intelligence, skill analysis) but are NOT the primary input to the forecasting model. The forecasting model trains on Dataset A.

---

## Data Flow Summary

```
SCRAPING (one-time, Sep 2026)
    |
    v
176 raw job postings from 4 websites
    |
    v
CLASSIFICATION PIPELINE (scripts/classify_and_group_v2.py)
    |
    ├── Is this ICT? (evidence-based scoring)
    ├── Which normalized role? (rule-based matching)
    ├── Which role family/group? (taxonomy lookup)
    └── What seniority level? (title + experience parsing)
    |
    v
92 classified ICT postings (Dataset B)
    |
    v
PHASE 1: DATA FINALIZATION (scripts/phase1_data_finalization.py)
    |
    ├── Aggregate postings by role → posting shares
    ├── Extrapolate 2026 macro indicators from 2024-2025 trends
    ├── Calculate role_employment_proxy and role_demand_index
    └── Append 20 rows (year=2026) to historical data
    |
    v
440-row training dataset (Dataset A, 2005-2026)
    |
    v
ML MODEL (Phase 2 — next)
    |
    ├── Train on 2005-2024
    ├── Validate on 2025-2026
    └── Forecast 2027-2028
    |
    v
Role demand forecasts (6 months, 1 year, 2 years)
    |
    v
DJANGO BACKEND → REST API → REACT FRONTEND → User dashboards
```

---

## Key Numbers to Remember

| Metric | Value |
|--------|:---:|
| Total historical rows | 440 |
| Years covered | 2005-2026 (22 years) |
| Roles per year | 20 |
| Current ICT postings | 92 |
| Job sources | 4 websites |
| Unique companies in postings | 40 |
| Role families | 12 |
| Forecast horizons | 6 months, 1 year, 2 years |
| Macro indicator columns | 7 |
| Role-level feature columns | 4 |
| Target columns | 3 |
