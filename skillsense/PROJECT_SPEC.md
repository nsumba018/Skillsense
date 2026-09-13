# SkillSense — Project Specification

**AI-Powered Labour-Market Intelligence & Employability Outlook Platform**

Rwanda-focused. First sector: ICT / Computer Science / Digital Technology.

---

## 1. What SkillSense Does

SkillSense predicts which ICT roles will be in demand in Rwanda over the next 6 months, 1 year, and 2 years. It tells policy makers, educators, career advisors, and researchers:

- Which ICT roles employers will need in 2027 and 2028
- Which skills are growing or declining
- Where demand is concentrated geographically
- How education and training should adapt
- How employable a given skill profile is against future market needs

---

## 2. How the Forecasting Works

### Training Data (what builds the model)

**Dataset A — Historical ICT Labour Data (2005–2025)**

Location: `skillsense_job_data/data/historical/`

- 420 rows across 3 CSVs (20 roles × 21 years)
- Role-demand indices, ICT employment counts, employment shares, unemployment rates, labour force participation, tertiary employment
- **2017–2025: Verified against NISR Labour Force Survey microdata** (from data.gov.rw)
  - ICT employment computed from weighted survey records using ISIC Section J (code 9) and ISCO-08 codes 25/35
  - Macro indicators (LFPR, unemployment rate, employment/population ratio) computed from individual-level survey weights
- **2005–2016: Back-extrapolated** from Census 2002 and EICV benchmarks, anchored to 2017 government values
- This is the primary training data for the forecasting model

**Dataset B — Current Real Job Postings (scraped, Sep 2026)**

Location: `skillsense_job_data/data/current_ict/`

- 92 ICT postings from 4 sources: RwandaJob (45), JobWebRwanda (19), GreatRwandaJobs (16), JobInRwanda (12)
- 18 normalized roles across 11 role groups, 40 unique companies
- Zero nulls, zero duplicates, 30 columns
- Purpose: validation data first, then aggregated into a 2026 row for Dataset A to extend the training series

**Dataset C — NISR Labour Force Survey Microdata (2017–2025)**

Location: `skillsense_job_data/Labour_Force_Survey__2017-2024___Microdata/`

- Individual-level survey records from NISR (downloaded from data.gov.rw)
- 9 years, ~70,000–102,000 records per year
- Used to compute the government-verified macro indicators in Dataset A
- Key columns: `weight2` (survey weight), `status1` (employment status), `indd03` (ISIC industry), `isco2digit` (ISCO occupation)

### The Model Development Process — Two Layers

The forecasting system has two layers that serve different purposes:

**Layer 1 — Local Demand Forecast (built first)**

Answers: *"Which existing ICT roles will grow or shrink in Rwanda?"*

```
Step 1: Train ML model on Dataset A (2005–2025, government-verified)
            ↓
Step 2: Model learns role-demand patterns over 21 years of data
            ↓
Step 3: Validate against Dataset B (92 current ICT postings, 2026)
            — Aggregate postings by role → compare distribution against
              what the model predicts for 2026
            — If model says "IT Officer demand is rising" and 14% of current
              postings are IT Officers — that's confirmation
            ↓
Step 4: If validation passes — model predictions match current reality
            ↓
Step 5: Transform Dataset B into a 2026 row for Dataset A
            — Aggregate 92 postings into role_share_within_ict_pct per role
            — Estimate 2026 macro indicators (extrapolate from 2025 LFS)
            — Calculate role_demand_index and role_employment_proxy
            — Append 20 new rows (one per role) to the time series
            — Model now has 2005–2026 (440 rows)
            ↓
Step 6: Model produces forecasts using ALL data (historical + current):
            — 6-month outlook
            — 1-year outlook (2027)
            — 2-year outlook (2028)
            ↓
Step 7: Forecasts feed the frontend dashboards
```

**Layer 2 — Global Trend Emergence Forecast (built later)**

Answers: *"Which new roles should Rwandans prepare for, even though nobody is hiring for them locally yet?"*

**The problem Layer 2 solves:**

Rwanda's current job market has zero postings for AI/ML Engineer, Prompt Engineer, MLOps Engineer, Computer Vision Engineer, NLP Engineer, Blockchain Developer, or IoT/Robotics Engineer. A model trained only on local data will never predict these roles. But Rwanda's ICT sector is growing rapidly (1.45% → 4.40% of employment in 8 years), and these roles will inevitably appear — the question is when.

**The pattern we already see in our data:**

Roles that become mainstream globally tend to appear in Rwanda 3–5 years later:
- DevOps Engineer — global mainstream ~2015, appears in Rwanda ~2018
- Data Scientist — global mainstream ~2016, barely visible in Rwanda 2025 (1 posting)
- Full-Stack Developer — global mainstream ~2014, appears in Rwanda ~2016

AI/ML Engineer became globally mainstream around 2022–2023 → expect Rwanda appearance ~2025–2028.

**How Layer 2 works:**

```
Step 1: Collect global ICT role trend data
            — Sources: LinkedIn Economic Graph, Indeed Hiring Lab,
              Stack Overflow Developer Survey, GitHub Octoverse,
              World Economic Forum Future of Jobs Report
            ↓
Step 2: Add emerging roles to the taxonomy
            — AI / ML Engineer, MLOps Engineer, Prompt Engineer,
              Computer Vision Engineer, NLP Engineer,
              Cloud/AI Solutions Architect, Blockchain Developer,
              IoT / Robotics Engineer
            — Set emergence_year = estimated future year
            — Initial role_share_within_ict_pct = 0
            ↓
Step 3: Add a global_trend_signal feature to the model
            — A score (0–100) per role per year representing global demand
            — The model learns: "when global signal is high but local share
              is near zero, growth is coming within 3–5 years"
            ↓
Step 4: Model outputs TWO types of predictions:
            — Existing role forecasts (from Layer 1)
            — Emerging role alerts: "AI/ML Engineer: 0 postings now,
              global trend score 92/100, expected in Rwanda by 2027
              with estimated 2–5% ICT share by 2029"
            ↓
Step 5: Frontend shows "Emerging Skills Radar" module
            — Separate from main demand forecasts
            — Tells students: "start learning these skills now"
            — Tells policy makers: "invest in training programs for these"
```

**Why Layer 2 is built later:**
- Layer 1 is independently valuable and has no data gaps
- Global trend data requires research to find reliable, accessible sources
- Layer 2 is an enhancement — it adds features to the model, doesn't change the architecture
- The taxonomy expansion and global signal collection can happen in parallel with Layer 1 deployment

### Data Collection (development-time only)

The scraper scripts are development tools only — NOT part of the production system. We run them manually to collect CSVs.

**Sources successfully used (Sep 2026):**

| Source | Method | Result |
|--------|--------|--------|
| jobinrwanda.com | Python scraper (`scripts/scraper_jobinrwanda.py`) | 82 raw → 12 ICT |
| rwandajob.com | Manual HTML save (Cloudflare blocks scraping) → local parse | 59 raw → 45 ICT |
| jobwebrwanda.com | Web fetch + parse | 19 ICT |
| greatrwandajobs.com | Web fetch + parse | 16 ICT |

**Sources that don't work:**
- rwandajob.com — Cloudflare protected, requires manual browser save
- jobportal.kora.rw — SSL certificate mismatch, cannot connect

Each collection is processed through the classification pipeline (`scripts/classify_and_group_v2.py`) to produce corrected, normalized ICT data. The target of 50–100 current ICT postings has been met (92 postings).

---

## 3. The Production System (what gets deployed)

### Data Input: Manual Upload Only

The deployed SkillSense system does NOT scrape websites. It accepts CSV uploads through an admin interface.

```
Admin uploads a CSV of job postings
        ↓
System classifies ICT / non-ICT
        ↓
System normalizes roles, extracts skills
        ↓
New data feeds into the trained model
        ↓
Model updates its forecasts
        ↓
Dashboards show updated predictions
```

This is the only way new data enters the production system. No automated pipelines, no scheduled scraping, no API integrations with job boards.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, Vite, TypeScript, Tailwind v4, Recharts |
| Backend API | Python, Django + Django REST Framework |
| Database | PostgreSQL + PostGIS (geographic intelligence) |
| ML/Forecasting | Python (library TBD — scikit-learn, Prophet, or similar) |
| Auth | JWT-based, role-scoped access |

### The 14 Modules

| # | Module | What it does |
|---|--------|-------------|
| 1 | **Authentication & RBAC** | JWT auth, role-based access (policy maker, education planner, career advisor, researcher, admin) scoped by institution |
| 2 | **Main Dashboard** | Live KPIs — top ICT roles, demand trends, ICT employment share, key alerts |
| 3 | **Data Upload & Management** | Admin uploads CSVs of job postings. System classifies, normalizes, and stores them. No automated ingestion. |
| 4 | **Data Processing** | Classification (ICT/non-ICT), role normalization, skill extraction, geographic/industry normalization — runs automatically on uploaded data |
| 5 | **Skills Taxonomy** | Controlled vocabulary of ICT roles and skills (based on ESCO/O*NET). Role → Family → Group hierarchy. |
| 6 | **AI Skills Demand Prediction** | Trained ML model forecasting role demand at 6 months, 1 year, 2 years |
| 7 | **Employability Prediction** | Scores how employable a skill profile is against predicted market demand |
| 8 | **Sector Intelligence** | Which industries hire which ICT roles, sector growth trends |
| 9 | **Geographic Intelligence** | Demand by province/district on Rwanda map (PostGIS) |
| 10 | **Education & Training Alignment** | Gap analysis — what institutions teach vs what employers need |
| 11 | **Career Guidance** | Recommendations for job seekers based on skills gaps and forecasted demand |
| 12 | **Policy & Planning** | Decision-support dashboards for MIFOTRA/RDB — workforce planning, training investment priorities |
| 13 | **Reporting & Analytics** | Exportable reports, PDF generation, analytics summaries |
| 14 | **User & Security Management** | Admin panel for users, roles, permissions, audit logs |

### User Roles

| Role | Access |
|------|--------|
| Policy Maker | Dashboard, forecasts, policy planning, reports |
| Education Planner | Skills gaps, training alignment, curriculum recommendations |
| Career Advisor | Career guidance, employability scores, role outlooks |
| Researcher | Full analytics, data exports, historical trends |
| Admin | Everything + user management + data uploads |

---

## 4. ICT Role Taxonomy

The system uses a controlled role hierarchy:

```
ROLE GROUP
  └── ROLE FAMILY
        └── NORMALIZED ROLE
              └── Original Job Title (preserved, never overwritten)
```

### Current Taxonomy (Layer 1 — 12 groups, 22 roles)

| Role Group | Normalized Roles |
|-----------|-----------------|
| Software Development | Software Developer / Software Engineer, Backend Developer, Frontend / Web Developer, Full-Stack Developer, Mobile App Developer |
| Systems Analysis | Systems Analyst / IT Business Analyst |
| Data & Analytics | Data Analyst, Data Engineer, Data Scientist |
| Data & Database | Database Administrator |
| Networks | Network Engineer / Network Administrator, Telecommunications / Network Technician |
| Systems & Infrastructure | Systems Administrator, IT Officer / ICT Administrator, IT Support / Help Desk Technician |
| Cybersecurity | Cybersecurity Analyst / Security Engineer |
| Cloud & DevOps | DevOps / Cloud Engineer |
| Software Quality | QA / Software Test Engineer |
| ICT Management | ICT Manager / IT Manager |
| IT Governance & Audit | IT Auditor / IT Governance & Risk |
| Other ICT | Other ICT Technical Roles |

### Emerging Roles Taxonomy (Layer 2 — to be added later)

These roles have strong global demand but zero or near-zero presence in Rwanda's current job market. They will be added to the taxonomy when Layer 2 is built.

| Role Group | Emerging Role | Global Status (2026) | Estimated Rwanda Appearance |
|-----------|--------------|---------------------|---------------------------|
| AI & Machine Learning | AI / ML Engineer | High demand globally | 2026–2028 |
| AI & Machine Learning | MLOps Engineer | Growing fast | 2027–2029 |
| AI & Machine Learning | Prompt Engineer / AI Application Developer | New category, growing | 2027–2029 |
| AI & Machine Learning | Computer Vision Engineer | Established | 2028–2030 |
| AI & Machine Learning | NLP Engineer | Established | 2028–2030 |
| Cloud & DevOps | Cloud/AI Solutions Architect | Growing | 2027–2029 |
| Emerging Tech | Blockchain / Web3 Developer | Niche but present | 2028–2030 |
| Emerging Tech | IoT / Robotics Engineer | Growing | 2029–2031 |

### Classification Rules

- A job is ICT only when its **core occupational function** is ICT
- A finance manager using ERP software is NOT ICT
- A project manager on a digital project is NOT a software engineer
- Title alone does not determine classification — full job context is used
- Original job titles are always preserved
- Seniority (Junior/Senior/Lead) is a separate field, not a different role

---

## 5. Current Project Status (Sep 11, 2026)

### Done — Data Layer

- [x] Dataset A: Historical ICT labour data 2005–2025 (420 rows, 20 roles × 21 years)
  - 2017–2025 verified against NISR LFS microdata from data.gov.rw
  - 2005–2016 back-extrapolated with government anchors
- [x] Dataset B: 92 current ICT postings from 4 sources (RwandaJob, JobWebRwanda, GreatRwandaJobs, JobInRwanda)
  - 18 normalized roles, 11 role groups, 40 companies, zero nulls
  - Target met (50–100 postings for model validation)
- [x] Dataset C: NISR LFS microdata (2017–2025) downloaded and processed
- [x] ICT classification pipeline v2 — handles all 4 source formats
- [x] Role normalization with controlled taxonomy (22 roles, 12 groups)
- [x] All output files generated (cleaned, normalization, analytical, reports)

### Done — Frontend

- [x] Frontend UI shells for ~6 modules (static, mock data)
- [x] Auth service stub (Express + SQLite, local dev only)

### Next — Layer 1 (Local Demand Forecast)

- [ ] Transform Dataset B into 2026 row and append to Dataset A (420 → 440 rows)
- [ ] Build and train the ML forecasting model on Dataset A
- [ ] Validate model predictions against Dataset B (current real demand)
- [ ] Produce 6-month, 1-year, 2-year role demand forecasts
- [ ] PostgreSQL database schema and setup
- [ ] FastAPI backend with REST API
- [ ] Real JWT authentication and RBAC
- [ ] Wire frontend to real API (replace mock data)
- [ ] Manual CSV upload interface in admin panel

### Next — Layer 2 (Global Trend Emergence Forecast)

- [ ] Research and collect global ICT role trend data (LinkedIn, Indeed, Stack Overflow, WEF)
- [ ] Add emerging roles to taxonomy (AI/ML Engineer, MLOps, Prompt Engineer, etc.)
- [ ] Add global_trend_signal feature to training data
- [ ] Build "Emerging Skills Radar" model and frontend module
- [ ] Estimate Rwanda appearance timelines for each emerging role

### Next — Remaining Modules

- [ ] Geographic intelligence (PostGIS)
- [ ] Employability scoring engine
- [ ] Education/training gap analysis
- [ ] Career guidance recommendation engine
- [ ] Reporting and PDF export
- [ ] Build remaining frontend module UIs

---

## 6. File Structure

```
AI-skills_predictive_system/
├── frontend/                          — React frontend + auth service
│   ├── src/                           — React app source
│   └── server/                        — Express auth service (dev)
├── skillsense_job_data/
│   ├── data/
│   │   ├── historical/                — Dataset A: 2005–2025, gov-aligned (training)
│   │   ├── current_ict/               — Dataset B: 92 ICT postings (validation)
│   │   ├── all_postings/              — All raw jobs with classification
│   │   └── analytical/                — Aggregated analytics
│   ├── raw/                           — Untouched scraped data (4 sources)
│   ├── cleaned/                       — Pipeline output (cleaned + ICT CSVs)
│   ├── normalization/                 — Role normalization + grouping
│   ├── reports/                       — Markdown reports
│   ├── scripts/                       — Dev-only tools (scraper, ETL, classifier)
│   ├── Labour_Force_Survey__2017-2024___Microdata/  — Dataset C: NISR gov microdata
│   │   └── datasets/                  — 9 years of individual-level LFS records
│   └── SESSION_LOG.md                 — Detailed log of all data work done
├── docs/                              — Project documents (PDFs)
└── PROJECT_SPEC.md                    — This file
```

---

## 7. Key Principles

1. **Classification quality before forecasting.** Bad role classification produces bad demand data produces bad predictions. The taxonomy must be trusted first.

2. **Manual upload only in production.** No automated scraping or pipelines in the deployed system. Admin uploads CSVs, system processes them.

3. **Scraping is a development activity.** Scripts exist to collect training/validation data. They are not part of the production system.

4. **Historical data trains, current data validates, then both predict.** The model learns patterns from 21 years of history, proves itself against current reality, then uses everything to forecast forward.

5. **Two layers: local demand + global emergence.** Layer 1 forecasts existing roles from local data. Layer 2 predicts emerging roles (AI/ML, etc.) using global trend signals. Layer 1 ships first — Layer 2 enhances it later without changing the architecture.

6. **Keep detail where data supports it, group where volume is low.** High-frequency roles get individual forecasts. Low-frequency roles fall back to group-level predictions.

7. **Never overwrite original data.** Raw titles, descriptions, and source references are always preserved. Classification and normalization are additional layers, not replacements.

8. **The frontend presents, the backend computes.** Components never hold analytical logic. The ML model and analytics engine run server-side.
