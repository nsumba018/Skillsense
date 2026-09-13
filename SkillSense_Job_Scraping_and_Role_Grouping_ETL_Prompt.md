# SkillSense — One-Time Job Data Collection + Reusable ETL + Role Grouping + Forecasting Dataset Prompt

You are joining an ongoing final-year Software Engineering project called **SkillSense**.

Do not treat this as a new project.

Your task is to understand the project's current direction and then build the **initial Rwanda job-posting dataset and data-processing foundation** that will later support the SkillSense forecasting and labor-market intelligence system.

---

## 1. PROJECT IDENTITY

**Project name:** SkillSense

**Project direction:** AI-Powered Labor-Market Intelligence and Employability Outlook Platform

SkillSense is a Rwanda-focused labor-market intelligence platform.

Its first implementation sector is:

**ICT / Computer Science / Digital Technology**

The architecture is intended to support additional sectors later, but the current implementation must focus on ICT.

The central idea is:

```text
Historical Labor-Market Context
        +
Current Employer Demand
        +
Normalized Roles
        +
Role Relationships / Role Groups
        +
Skills
        +
Time Trends
        +
Geography
        +
Industry
        +
Employment Evidence where available
        ↓
Labor-Market Intelligence
        ↓
Future Role-Demand Forecast
        ↓
Employability Outlook
        ↓
Skills / Training Recommendations
```

---

## 2. THE PROBLEM SKILLSENSE IS SOLVING

SkillSense is not simply a job-board search system.

The problem is that labor-market information is fragmented, and it is difficult to clearly understand:

- which ICT roles employers demand
- how demand for roles changes over time
- which related roles belong to the same broader professional area
- which roles are growing
- which roles are declining or becoming less prominent
- which skills are associated with those roles
- which skills are emerging
- where roles are demanded geographically
- which industries are hiring those roles
- what employers are currently asking for
- what future demand may look like
- how education and training can align with changing market needs

SkillSense should turn job-posting data and historical labor-market evidence into structured intelligence.

Examples of questions the system should eventually answer:

> What ICT roles are currently most demanded in Rwanda?

> What has happened to Software Engineering demand over time?

> Which roles are related to Backend Development?

> What is the combined demand for related Software Development roles?

> Which skills are common across related roles?

> Which skills are becoming more important?

> Which ICT roles are emerging?

> Which regions have the strongest demand for a particular role or role group?

> Which industries are hiring for that role?

> What is the expected demand for the role over the next 6, 12, and 24 months?

> What skills should a learner consider developing to prepare for a high-demand role?

---

## 3. MOST IMPORTANT CONCEPTUAL DECISION

The **primary unit of prediction is ROLE DEMAND**.

The system is not primarily predicting individual programming languages or individual student outcomes.

The hierarchy should be:

```text
SECTOR
   ↓
ROLE FAMILY / ROLE GROUP
   ↓
NORMALIZED ROLE
   ↓
SKILLS
```

For example:

```text
ICT
  ↓
Software Development
  ↓
Full-Stack Developer
  ↓
React, JavaScript, TypeScript, SQL, Docker, Git
```

Another example:

```text
ICT
  ↓
Networks
  ↓
Network Engineer / Network Administrator
  ↓
Routing, Switching, Cisco, TCP/IP, Network Security
```

The main forecasting target is:

**future demand for a normalized role**

and, where useful:

**future demand for a broader related-role group**

---

## 4. IMPORTANT NEW REQUIREMENT — RELATED ROLE GROUPING

SkillSense must NOT display every job title as if every title were a completely independent labor-market role.

There may be many different titles representing closely related work.

Examples:

```text
Software Engineer
Software Developer
Java Developer
Backend Software Engineer
Backend Developer
Software Developer – Backend
Application Developer
```

Some of these may need to be treated as related roles.

Similarly:

```text
Network Engineer
Network Administrator
Network Specialist
Network & Systems Engineer
```

may be closely related.

And:

```text
IT Support Officer
IT Support Technician
Help Desk Technician
Technical Support Officer
```

may represent the same broader role area.

Therefore SkillSense needs **two levels of role representation**.

### Level 1 — Normalized Role

A specific analytical role.

Examples:

- Backend Developer
- Frontend / Web Developer
- Full-Stack Developer
- Data Analyst
- Network Engineer / Network Administrator
- Systems Administrator
- QA / Software Test Engineer

### Level 2 — Related Role Group

A broader grouping that connects closely related normalized roles.

Examples:

```text
Software Development
    ├── Software Developer / Software Engineer
    ├── Backend Developer
    ├── Frontend / Web Developer
    ├── Full-Stack Developer
    └── Mobile App Developer
```

or:

```text
Network & Infrastructure
    ├── Network Engineer / Network Administrator
    ├── Telecommunications / Network Technician
    └── Systems Administrator
```

The exact grouping should be data-driven and reviewed rather than blindly invented.

---

## 5. WHY ROLE GROUPING IS IMPORTANT

Role grouping serves several purposes.

### A. Better system presentation

The system can show:

```text
Software Development
Total current postings: 186

Software Engineer        79
Backend Developer        42
Full-Stack Developer     38
Frontend / Web Developer 21
Mobile App Developer      6
```

This provides both a broad picture and detailed role values.

### B. Better analysis

A role with 6 postings may not contain enough information for a stable independent model, but its broader role group may have sufficient observations.

### C. Better forecasting

SkillSense can forecast:

- individual normalized roles where data is sufficient
- broader related-role groups where individual demand is too sparse

### D. Better user recommendations

A learner interested in "Software Development" can see several related roles and their skills.

### E. Better handling of changing job titles

Employers may change titles over time while describing substantially similar work.

Role grouping helps SkillSense maintain continuity.

---

## 6. ROLE GROUPING MUST NOT DESTROY DETAIL

Do NOT collapse everything into broad categories.

SkillSense should preserve detail for popular roles.

For example:

Do NOT convert everything into:

```text
Software
Networking
Data
Security
```

Instead:

```text
Software Development
    Software Engineer
    Backend Developer
    Frontend / Web Developer
    Full-Stack Developer
    Mobile App Developer
```

At the same time, if the data shows a very low-volume role, it may be represented under an appropriate broader role group.

The final taxonomy should therefore be:

```text
SECTOR
    ↓
ROLE FAMILY / ROLE GROUP
    ↓
NORMALIZED ROLE
    ↓
ORIGINAL JOB TITLE
```

---

## 7. CURRENT ICT ROLE TAXONOMY

Use the following as the starting analytical taxonomy.

### Software Development

- Software Developer / Software Engineer
- Backend Developer
- Frontend / Web Developer
- Full-Stack Developer
- Mobile App Developer

### Systems Analysis

- Systems Analyst / IT Business Analyst

### Data & Analytics

- Data Analyst
- Data Engineer
- Data Scientist

### Data & Database

- Database Administrator

### Networks

- Network Engineer / Network Administrator
- Telecommunications / Network Technician

### Systems & Infrastructure

- Systems Administrator

### IT Operations & Support

- IT Officer / ICT Administrator
- IT Support / Help Desk Technician

### Cybersecurity

- Cybersecurity Analyst / Security Engineer

### Cloud & DevOps

- DevOps / Cloud Engineer

### Software Quality

- QA / Software Test Engineer

### ICT Management

- ICT Manager / IT Manager

### IT Governance & Audit

- IT Auditor / IT Governance & Risk

### Other ICT

- Other ICT Technical Roles

This is our current SkillSense analytical taxonomy.

Do not silently replace it.

You may recommend changes only when the collected data clearly shows that a modification is necessary.

---

## 8. HISTORICAL DATA ALREADY EXISTS

SkillSense already has historical ICT labor-market data.

The current historical structure is:

```text
2005–2009
ICT infrastructure / connectivity development stage

2010–2018
ICT expansion and service-development stage

2019–2025
digital transformation and ICT specialization stage
```

The historical dataset is designed to represent changing ICT-market structure over time.

The early period gives more importance to areas such as:

- networking
- telecommunications
- systems administration
- IT support
- infrastructure

Later periods allow stronger representation of:

- software engineering
- web development
- data
- cybersecurity
- QA
- cloud
- DevOps
- other specialized ICT roles

This historical data helps SkillSense understand broad temporal evolution.

---

## 9. IMPORTANT HISTORICAL-DATA PROVENANCE RULE

The detailed historical role-level data is a **synthetic research/model-development scaffold** where official public granular role-level measurements were unavailable.

It must NOT be presented as official NISR role-level observations.

Official published labor-market statistics are used as reference/anchor information where available.

Historical synthetic rows must remain clearly marked as synthetic.

Do not fabricate additional historical facts.

---

## 10. THE NEXT DATASET — DATASET B

The next major dataset is:

**Dataset B — Rwanda Job-Posting Demand Dataset**

Primary sources:

1. Job in Rwanda
   https://www.jobinrwanda.com/

2. RwandaJob
   https://www.rwandajob.com/

The job-posting dataset provides current employer-demand evidence.

Conceptually:

```text
Historical Data
    =
How the ICT labor market evolved

Job-Posting Data
    =
What employers are demanding now
```

These signals will later support:

```text
Historical Context
+
Current Role Demand
+
Role Groups
+
Skills
+
Temporal Trends
        ↓
Forecasting
```

---

## 11. COLLECTION STRATEGY — VERY IMPORTANT

There are TWO separate phases.

### PHASE 1 — ONE-TIME SCRAPE

For this task, collect as much publicly accessible job-posting data as reasonably possible from:

- Job in Rwanda
- RwandaJob

This is a **ONE-TIME BASELINE COLLECTION**.

Do NOT build a continuous scraper at this stage.

Do NOT build:

- cron jobs
- daily scraping
- weekly scraping
- automatic recurring crawling
- continuous website monitoring
- background scraping services

The objective is to build a strong baseline dataset.

### PHASE 2 — REUSABLE MANUAL INGESTION PIPELINE

Later, new scraped data will be manually provided to SkillSense.

Example:

```text
new_jobs_2026_09.csv
```

Then:

```text
manual upload
      ↓
validation
      ↓
cleaning
      ↓
deduplication
      ↓
role normalization
      ↓
role grouping
      ↓
ICT classification
      ↓
skill extraction
      ↓
location normalization
      ↓
industry normalization
      ↓
append new records
      ↓
recalculate aggregates
      ↓
update forecasting dataset
      ↓
model update/retraining when appropriate
```

The pipeline must be designed to be reusable and incremental.

The initial scraping is one-time.

The ETL/integration design is reusable.

---

## 12. DO NOT RE-SCRAPE OLD DATA AUTOMATICALLY

The future system will receive new files manually.

Example:

```text
Initial baseline
      +
September 2026 job file
      ↓
Updated dataset
```

Then:

```text
Updated dataset
      +
October 2026 job file
      ↓
Further updated dataset
```

The pipeline must identify which records are genuinely new.

---

## 13. IDEMPOTENT INGESTION

Running the same input file twice must NOT create duplicate records.

Use:

- source
- source_job_id
- source_url
- content hash / raw_hash

and additional similarity logic where necessary.

The ingestion process must be safe to rerun.

---

## 14. PERMITTED COLLECTION

Only collect publicly accessible data that the websites permit us to access.

Respect:

- robots.txt where applicable
- site terms and policies
- reasonable request rates
- technical restrictions

Do not bypass:

- CAPTCHAs
- login barriers
- anti-bot mechanisms
- authentication
- paywalls
- access controls

If a public API, sitemap, structured-data feed, search page or permitted endpoint exists, consider using it.

The goal is trustworthy collection rather than aggressive scraping.

---

## 15. RAW DATA COLLECTION

For every accessible job posting, attempt to capture:

```text
source
source_job_id
source_url
title
company
description
responsibilities
requirements
qualifications
skills_raw
location_raw
industry_raw
category_raw
employment_type_raw
contract_type_raw
experience_raw
education_raw
languages_raw
salary_raw
application_deadline
posted_date
closing_date
scraped_at
job_status
raw_text
```

Capture additional fields when available.

If unavailable:

```text
NULL
```

Do not guess.

Preserve original source values.

---

## 16. RAW VS CLEAN VS ANALYTICAL DATA

Maintain these layers:

```text
RAW
  ↓
CLEANED
  ↓
NORMALIZED
  ↓
ANALYTICAL
  ↓
MODEL-READY
```

Never overwrite raw source data.

Every analytical record should be traceable back to its source posting.

---

## 17. DEDUPLICATION

The same posting may appear:

- several times on one website
- on both websites
- under different URLs
- with slightly different titles
- with modified descriptions

Create:

```text
duplicate_group_id
is_duplicate
duplicate_confidence
canonical_job_id
```

Use evidence from:

- source job ID
- URL
- normalized title
- company
- location
- dates
- description similarity
- content hash

Do not merge genuinely different jobs from the same company.

---

## 18. JOB TITLE NORMALIZATION

Preserve:

```text
original_job_title
```

Then create:

```text
normalized_role
role_family
role_group
role_level
role_cluster
occupation_proxy
role_normalization_confidence
```

The normalization process should use evidence from:

- title
- description
- responsibilities
- requirements
- skills
- industry/category

Examples:

```text
"Senior Java Software Engineer"
→ Backend Developer
→ Software Development
```

```text
"Frontend Developer – React"
→ Frontend / Web Developer
→ Software Development
```

```text
"Network Administrator"
→ Network Engineer / Network Administrator
→ Networks
```

Do not rely on title keywords alone.

Read the job content when necessary.

---

## 19. RELATED ROLE GROUPING

This is a required analytical step.

Create a relationship between:

```text
original title
→ normalized role
→ role group
```

For example:

```text
Software Development
    ├── Software Developer / Software Engineer
    ├── Backend Developer
    ├── Frontend / Web Developer
    ├── Full-Stack Developer
    └── Mobile App Developer
```

The system should be able to calculate demand at BOTH levels:

```text
normalized_role demand
```

and:

```text
role_group demand
```

Example:

```text
Software Development
    Total postings = 186

    Software Engineer = 79
    Backend Developer = 42
    Full-Stack Developer = 38
    Frontend / Web Developer = 21
    Mobile App Developer = 6
```

This is a major SkillSense requirement.

---

## 20. HOW TO IDENTIFY RELATED ROLES

Use a combination of:

1. controlled taxonomy
2. title normalization
3. description similarity
4. skill overlap
5. semantic similarity / embeddings if appropriate
6. occupation proxies
7. expert review / rule validation

Do not rely exclusively on an LLM.

A useful workflow is:

```text
Job title
   +
Job description
   +
Extracted skills
        ↓
semantic representation
        ↓
candidate role similarity
        ↓
taxonomy rules
        ↓
confidence score
        ↓
normalized role
        ↓
role group
```

If embeddings are used, store:

```text
role_similarity_score
group_similarity_score
normalization_confidence
```

Use deterministic rules for obvious cases and semantic similarity for ambiguous cases.

---

## 21. ROLE GROUPING AND LOW-DATA ROLES

A normalized role should have enough observations for meaningful analysis.

Therefore calculate:

```text
role_posting_count
unique_employer_count
time_coverage_months
```

Then determine whether a role is:

```text
High-volume
Medium-volume
Low-volume
Insufficient-data
```

Low-volume roles can still appear in the system.

But the forecast engine should determine whether there is enough data for independent forecasting.

Where appropriate:

```text
Low-volume normalized role
        ↓
related role group
        ↓
group-level forecast
```

Do not simply delete rare roles.

---

## 22. ICT CLASSIFICATION

Create:

```text
sector
is_ict
ict_role_confidence
classification_reason
```

Use:

- job title
- description
- responsibilities
- requirements
- skills
- category
- industry

Do not classify a job as ICT simply because it requires generic computer literacy.

For example:

```text
Accountant + Excel
```

should normally NOT become an ICT role.

The objective is to identify genuine ICT labor demand.

---

## 23. SKILL EXTRACTION

Create the relationship:

```text
ROLE → SKILLS
```

Extract skills only when supported by job content.

Fields:

```text
skill_name_raw
skill_name_normalized
skill_category
skill_type
skill_requirement_type
skill_evidence
skill_confidence
```

Potential categories:

- Programming Languages
- Frameworks
- Libraries
- Databases
- Cloud
- DevOps
- Cybersecurity
- Networking
- Operating Systems
- Data & Analytics
- AI / Machine Learning
- Software Engineering
- Testing / QA
- Tools
- Platforms
- Certifications
- Business / Functional Skills
- Soft Skills

Distinguish where possible:

```text
required
preferred
mentioned
```

Do not invent skills.

---

## 24. ROLE-SKILL RELATIONSHIP DATA

Create a structured table:

```text
normalized_role
role_group
skill_name_normalized
year
month
posting_count
skill_frequency
skill_share_within_role
employer_count
```

This allows the system to understand:

```text
Role
    ↓
Skills
```

and:

```text
Role Group
    ↓
Shared Skills
```

These relationships must be derived from actual advertisements.

---

## 25. LOCATION NORMALIZATION

Create:

```text
location_raw
city
district
province
region
country
location_type
remote_flag
```

Do not invent geographic information.

This supports:

```text
ROLE × REGION
```

and:

```text
ROLE GROUP × REGION
```

analysis.

---

## 26. INDUSTRY NORMALIZATION

Create normalized industry categories such as:

- Banking / Finance
- Insurance
- Telecommunications
- Government / Public Sector
- NGO / Development
- Education
- Healthcare
- Technology / Software
- Consulting
- Manufacturing
- Retail
- Agriculture
- Energy
- Construction
- Logistics
- Other

Preserve the original industry value.

---

## 27. EXPERIENCE AND EDUCATION

Extract:

```text
minimum_experience_years
maximum_experience_years
experience_category
education_level
degree_field
certification_required
certification_preferred
```

Do not infer when the source does not provide evidence.

---

## 28. EMPLOYMENT CHARACTERISTICS

Extract:

```text
employment_type
contract_type
full_time
part_time
internship
temporary
permanent
fixed_term
freelance
remote
hybrid
onsite
```

---

## 29. TEMPORAL FEATURES

This is essential because SkillSense predicts future role demand.

Create:

```text
posted_date
closing_date
scraped_at
year
quarter
month
week
month_index
days_open
```

Then create:

```text
role × month
role_group × month
skill × month
role × region × month
role_group × region × month
role × industry × month
```

---

## 30. ROLE-DEMAND ANALYTICAL FEATURES

For every normalized role and time period calculate candidate features such as:

```text
job_posting_count
unique_employer_count
role_share_within_ict
role_rank
role_rank_change
month_over_month_growth
quarter_over_quarter_growth
year_over_year_growth
rolling_3_month_demand
rolling_6_month_demand
rolling_12_month_demand
posting_velocity
new_employer_count
repeat_employer_count
employer_growth
```

Also create the equivalent features for:

```text
role_group
```

This allows both:

```text
specific role demand
```

and:

```text
related-role group demand
```

---

## 31. SKILL-DEMAND FEATURES

Calculate:

```text
skill_posting_count
skill_demand_share_pct
number_of_roles_requiring_skill
number_of_employers_requiring_skill
year_over_year_growth
rolling_3_month_skill_demand
rolling_6_month_skill_demand
rolling_12_month_skill_demand
skill_emergence_score
```

---

## 32. EMERGING ROLE DETECTION

SkillSense should distinguish:

- established
- growing
- stable
- emerging
- potentially declining

Possible features:

```text
first_seen_date
recent_growth_rate
posting_velocity
employer_adoption_growth
role_share_growth
emerging_role_score
```

Do not call a role emerging because of one advertisement.

Use explicit evidence thresholds.

---

## 33. EMERGING SKILL DETECTION

Likewise calculate:

```text
first_seen_date
recent_skill_growth
role_coverage
employer_adoption_growth
skill_share_growth
emerging_skill_score
```

---

## 34. PRIMARY FORECAST TARGET

The primary forecasting target is:

**FUTURE ROLE DEMAND**

Possible targets:

```text
future_job_posting_count
future_demand_index
future_role_growth
```

The raw job-posting count must remain available.

A normalized 0–100 demand index may be used for comparison, but do not discard raw counts.

---

## 35. ROLE-GROUP FORECASTING

SkillSense may produce forecasts at two levels.

### Specific role forecast

Example:

```text
Backend Developer
Current monthly demand: 18
Forecast 6 months: 24
Forecast 12 months: 31
```

### Related-role group forecast

Example:

```text
Software Development
Current combined demand: 79
Forecast 6 months: 98
Forecast 12 months: 121
```

The system should show the relationship between the group-level value and its component roles.

For example:

```text
Software Development
    Current:
        Software Engineer       35%
        Backend Developer       27%
        Full-Stack Developer    22%
        Frontend Developer      13%
        Mobile Developer         3%

    Forecast:
        Group demand: +18%
```

Do not fabricate these values.

They must be calculated from the underlying data/model.

---

## 36. ROLE-LEVEL + GROUP-LEVEL PREDICTION STRATEGY

Use this principle:

```text
Enough data for normalized role?
        |
       YES
        ↓
Forecast normalized role
        |
       ALSO
        ↓
Aggregate component roles
        ↓
Role-group intelligence
```

If a normalized role has insufficient observations:

```text
Insufficient role data
        ↓
Check related role group
        ↓
Enough group data?
     /        \
   YES         NO
    ↓           ↓
Group forecast  Insufficient Data
```

Do not force an unreliable role-level forecast.

---

## 37. FORECAST HORIZONS

User-facing SkillSense forecasts are:

```text
6 months
12 months
24 months
```

Every forecast must preserve:

```text
data_cutoff_date
forecast_start_date
forecast_end_date
forecast_horizon_months
```

Example:

```text
Data through: July 2026

6-month outlook:
August 2026 – January 2027

12-month outlook:
August 2026 – July 2027

24-month outlook:
August 2026 – July 2028
```

The system must be able to return:

```text
INSUFFICIENT DATA
```

instead of fabricating a forecast.

---

## 38. MONTHLY MODEL DATASET

The preferred prediction unit is:

```text
ONE ROW = ONE ROLE × ONE MONTH
```

and separately:

```text
ONE ROW = ONE ROLE GROUP × ONE MONTH
```

Do NOT make the primary forecasting dataset:

```text
one row = one job advertisement
```

The raw job-level table should remain available, but the forecasting table must be time-series based.

---

## 39. MODEL FEATURES

Candidate role-demand prediction features include:

```text
year
month
quarter
role_group
normalized_role
sector
region
industry
job_posting_count
unique_employer_count
role_share_within_ict
role_group_share_within_ict
rolling_3m_demand
rolling_6m_demand
rolling_12m_demand
mom_growth
qoq_growth
yoy_growth
posting_velocity
employer_growth
new_employer_count
repeat_employer_count
average_experience_required
entry_level_share
bachelor_required_share
master_required_share
remote_share
permanent_contract_share
fixed_term_share
skill_diversity
top_skill_1
top_skill_2
top_skill_3
top_skill_4
top_skill_5
```

Do not assume all features will be useful.

Evaluate them empirically.

---

## 40. FEATURE IMPORTANCE

Do not claim a feature contributes "100%" to prediction.

After a real model is developed, evaluate importance using appropriate methods such as:

- permutation importance
- SHAP
- model-based feature importance
- temporal correlation analysis where appropriate

The output should identify the strongest predictors based on evidence from the actual dataset.

---

## 41. TARGET CREATION

For historical modeling, create future targets by shifting the role-demand time series.

Potential internal targets:

```text
target_demand_1_month
target_demand_3_month
target_demand_6_month
target_demand_12_month
```

The final product reports:

```text
6 months
12 months
24 months
```

Only create a target when enough future observations exist.

---

## 42. TIME-SERIES LEAKAGE

This is mandatory.

When predicting future demand:

**Only use information available before the prediction cutoff.**

Example:

When predicting October 2026 demand, do not use November 2026 or later information as an input.

Use time-based splitting:

```text
TRAIN
    ↓
VALIDATION
    ↓
TEST
```

Do not randomly shuffle the entire time series before splitting.

---

## 43. HISTORICAL DATA + JOB-POSTING DATA

Do not blindly concatenate synthetic historical role counts with job-posting counts as if they were the same variable.

Maintain provenance.

Conceptually:

```text
Historical labor-market context
        +
Job-posting demand signal
```

These are related but not automatically identical measures.

Determine later whether a defensible calibration or feature-fusion approach is appropriate.

Do not manufacture a continuous historical series just to make the model look stronger.

---

## 44. ROLE GROUPING + HISTORICAL DATA

The role-group concept should also be used when interpreting historical information.

For older periods where detailed modern roles were not separately measurable, broader occupation proxies may be more appropriate.

For newer job-posting data, detailed normalized roles can be used where evidence supports them.

This allows:

```text
Historical broad role context
        +
Current detailed role demand
```

without pretending historical sources measured modern job titles exactly.

---

## 45. DATA QUALITY

Create a data-quality report containing:

```text
total_raw_records
total_clean_records
duplicate_records
duplicate_percentage
missing_titles
missing_company
missing_description
missing_posted_date
missing_location
missing_industry
missing_skills
missing_experience
missing_education
```

Also identify:

- suspicious records
- inconsistent dates
- bad URLs
- duplicate employers
- unusual titles
- classification uncertainty
- role-group ambiguity

---

## 46. ROLE TAXONOMY QUALITY REPORT

Create a report showing:

```text
original_job_title
normalized_role
role_group
classification_confidence
normalization_confidence
number_of_occurrences
```

Also identify titles that require manual review.

This is important because role normalization directly affects forecasting.

---

## 47. ROLE-GROUP QUALITY REPORT

Create a report showing:

```text
role_group
normalized_role
posting_count
unique_employer_count
monthly_coverage
share_of_ict_demand
```

Use it to determine whether groups are too broad or too narrow.

---

## 48. REQUIRED OUTPUT FILES

Produce at minimum:

```text
raw_job_postings.csv

cleaned_job_postings.csv

ict_job_postings.csv

role_normalization.csv

role_grouping.csv

job_role_monthly.csv

job_role_group_monthly.csv

skill_demand_monthly.csv

role_skill_demand.csv

role_group_skill_demand.csv

role_region_monthly.csv

role_group_region_monthly.csv

role_industry_monthly.csv

role_group_industry_monthly.csv

skillsense_role_forecasting_dataset.csv

skillsense_role_group_forecasting_dataset.csv

source_statistics.csv

data_dictionary.csv

scraping_report.md

data_quality_report.md

role_taxonomy_report.md

exploratory_analysis.md
```

---

## 49. RECOMMENDED DIRECTORY STRUCTURE

```text
skillsense_job_data/

├── raw/
│   ├── jobinrwanda/
│   └── rwandajob/
│
├── cleaned/
│   ├── raw_job_postings.csv
│   ├── cleaned_job_postings.csv
│   └── ict_job_postings.csv
│
├── normalization/
│   ├── role_normalization.csv
│   └── role_grouping.csv
│
├── analytical/
│   ├── job_role_monthly.csv
│   ├── job_role_group_monthly.csv
│   ├── skill_demand_monthly.csv
│   ├── role_skill_demand.csv
│   ├── role_group_skill_demand.csv
│   ├── role_region_monthly.csv
│   ├── role_group_region_monthly.csv
│   ├── role_industry_monthly.csv
│   └── role_group_industry_monthly.csv
│
├── modeling/
│   ├── skillsense_role_forecasting_dataset.csv
│   └── skillsense_role_group_forecasting_dataset.csv
│
├── reports/
│   ├── scraping_report.md
│   ├── data_quality_report.md
│   ├── role_taxonomy_report.md
│   └── exploratory_analysis.md
│
└── metadata/
    └── data_dictionary.csv
```

---

## 50. FUTURE MANUAL-UPDATE COMPATIBILITY

The data model must be designed so that later we can provide:

```text
new_job_postings.csv
```

and the system can:

```text
validate
    ↓
deduplicate
    ↓
normalize
    ↓
group
    ↓
extract skills
    ↓
classify
    ↓
append
    ↓
recalculate monthly aggregates
    ↓
update model datasets
```

The future pipeline must not require rewriting the whole project.

---

## 51. MODEL RETRAINING SHOULD BE SEPARATE

Uploading new data should update the data layer first.

Do NOT automatically retrain the model after every upload.

Instead:

```text
new data
    ↓
data update
    ↓
quality checks
    ↓
aggregate update
    ↓
determine whether enough new data exists
    ↓
retrain/update model when appropriate
```

This should be a controlled process.

---

## 52. EMPLOYABILITY OUTLOOK

SkillSense will eventually combine:

```text
current role demand
historical trend
recent growth
forecast demand
employer breadth
skill demand
geographic demand
industry breadth
experience requirements
```

to create a role-level Employability Outlook.

Potential statuses:

```text
Very Strong Outlook
Strong Outlook
Moderate Outlook
Stable / Uncertain
Weak Outlook
Insufficient Data
```

These must eventually be based on explicit analytical rules.

Do not invent the labels from intuition alone.

---

## 53. DATA-SUFFICIENCY RULE

SkillSense must prefer:

```text
INSUFFICIENT DATA
```

over:

```text
FAKE FORECAST
```

For example:

```text
"Insufficient monthly observations for a reliable 24-month forecast."
```

This is expected behavior.

---

## 54. FINAL ANALYSIS AFTER COLLECTION

After building the dataset, provide:

1. Number of postings collected from each source.
2. Earliest and latest accessible posting dates.
3. Number of unique postings.
4. Number of ICT postings.
5. Number of normalized ICT roles.
6. Number of role groups.
7. Number of unique skills.
8. Number of geographic areas.
9. Number of industries.
10. Monthly coverage.
11. Missing months.
12. Duplicate percentage.
13. Most demanded ICT roles.
14. Most demanded role groups.
15. Fastest-growing ICT roles.
16. Fastest-growing role groups.
17. Most demanded skills.
18. Fastest-growing skills.
19. Emerging roles.
20. Emerging skills.
21. Most important role-skill relationships.
22. Demand by region.
23. Demand by industry.
24. Entry-level demand.
25. Experience distribution.
26. Education requirements.
27. Roles with enough data for forecasting.
28. Roles with insufficient data.
29. Role groups suitable for fallback forecasting.
30. Whether 6-month forecasting is supported.
31. Whether 12-month forecasting is supported.
32. Whether 24-month forecasting is supported.
33. Data limitations and source bias.
34. Recommended final predictive features.
35. Recommended targets.
36. Recommended role-group adjustments.

---

## 55. DO NOT FABRICATE

Never invent:

- jobs
- companies
- dates
- locations
- salaries
- skills
- experience
- education
- demand counts
- role relationships
- forecast values

When information is unavailable:

```text
NULL
```

or:

```text
Not available
```

Use clear provenance.

---

## 56. THE COMPLETE SKILLSENSE PIPELINE

The intended long-term intelligence chain is:

```text
HISTORICAL LABOR-MARKET DATA
        +
CURRENT JOB POSTINGS
        ↓
RAW DATA
        ↓
CLEANING
        ↓
DEDUPLICATION
        ↓
ICT CLASSIFICATION
        ↓
ROLE NORMALIZATION
        ↓
RELATED ROLE GROUPING
        ↓
SKILL EXTRACTION
        ↓
LOCATION / INDUSTRY NORMALIZATION
        ↓
TIME-SERIES AGGREGATION
        ↓
ROLE DEMAND
        +
ROLE-GROUP DEMAND
        +
SKILL DEMAND
        +
ROLE-SKILL RELATIONSHIPS
        +
GEOGRAPHIC DEMAND
        +
INDUSTRY DEMAND
        ↓
EMERGING ROLE / SKILL DETECTION
        ↓
FORECASTING
        ↓
6 / 12 / 24-MONTH OUTLOOK
        ↓
EMPLOYABILITY OUTLOOK
        ↓
RECOMMENDATIONS
```

---

## 57. CRITICAL DESIGN PRINCIPLE FOR THIS TASK

Do not think of this task as:

> "Scrape two job websites."

Think of it as:

> **Build the current Rwanda employer-demand layer of SkillSense.**

The scraper is only the initial collection mechanism.

The important output is a trustworthy analytical dataset where:

```text
JOB POSTING
    ↓
NORMALIZED ROLE
    ↓
RELATED ROLE GROUP
    ↓
SKILLS
    ↓
ROLE DEMAND OVER TIME
    ↓
ROLE-GROUP DEMAND OVER TIME
    ↓
GEOGRAPHIC DEMAND
    ↓
INDUSTRY DEMAND
    ↓
EMERGING SIGNALS
    ↓
FUTURE ROLE DEMAND
```

---

## 58. FINAL INSTRUCTION TO YOU

First research the permitted public structures of:

- Job in Rwanda
- RwandaJob

Then perform the one-time baseline collection.

Then build the transformation logic needed to turn the raw postings into the analytical datasets described above.

Pay special attention to **role normalization and related-role grouping**, because those are central to SkillSense.

The final system must let us see both:

```text
specific role values
```

and:

```text
combined values of related roles
```

For example:

```text
Software Development
    ├── Software Engineer
    ├── Backend Developer
    ├── Full-Stack Developer
    ├── Frontend Developer
    └── Mobile Developer
```

and:

```text
Software Development:
    Current demand = sum of valid component-role postings

Software Engineer:
    Current demand = its own postings

Backend Developer:
    Current demand = its own postings
```

For forecasting:

- forecast individual roles where enough data exists
- use role-group forecasting where individual-role data is insufficient
- clearly show which level was forecast
- show the underlying role values supporting the group result
- never fabricate missing values

The final deliverable must therefore support both:

**"What is happening to this role?"**

and:

**"What is happening to the broader family of related roles?"**

That dual-level design is a required part of SkillSense.
