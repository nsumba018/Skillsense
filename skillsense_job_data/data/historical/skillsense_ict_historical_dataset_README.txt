SkillSense ICT Historical Labour-Market Dataset — Prototype Training Scaffold

IMPORTANT
These CSV files are synthetic prototype datasets. They are NOT official NISR microdata and must not be presented as
observed counts of ICT jobs. They are designed to give the team a coherent feature structure and a controlled historical
role-demand pattern while the final real-data pipeline is being built.

WHY TWO PERIODS
- 2010–2018: longer historical context. NISR LFS begins in 2016; therefore pre-2017 role-level values are synthetic
  backcasts calibrated against available NISR historical statistics and ICT-sector signals.
- 2019–2025: higher-confidence macro context because the LFS moved to quarterly collection from 2019, while the uploaded
  annual 2025 workbook provides annual values for the major labor-market indicators.

ROLE TAXONOMY
Detailed roles are retained for roles that are relevant in the current Rwanda ICT labor market, including Software
Developer/Engineer, Full-Stack Developer, Data Analyst, Network Engineer, QA Engineer, DevOps/Cloud Engineer,
Cybersecurity Analyst, IT Officer/ICT Administrator and related roles. Low-volume/less-specific roles can be grouped
under Other ICT Technical Roles or a broader family.

MODEL-RELEVANT FIELDS
The strongest historical context fields are:
- ict_employment
- ict_employment_share_pct
- total_employment
- labour_force_participation_rate_pct
- employment_to_population_ratio_pct
- unemployment_rate_pct
- tertiary_employment_count where available
- role_demand_index
- role_share_within_ict_pct
- emergence_year
- target_role_demand_index_1y
- target_role_demand_index_2y

IMPORTANT TARGET DECISION
The production forecast target should ultimately be FUTURE ROLE DEMAND derived from actual, time-stamped job postings
and/or authorized vacancy records. The role_demand_index in these prototype files is only a synthetic scaffold.
The 6-month target is intentionally blank because a six-month target should come from higher-frequency current job data.

SOURCE CONTEXT
The uploaded NISR 2025 annual workbook contains annual labor-force, economic-activity and occupation indicators for
2017–2025. NISR documentation confirms that occupations and economic activities are coded using standardized national
classifications. NISR's 2016 LFS gives an earlier labor-market anchor. Current Job in Rwanda data supplied by the team
and current public postings informed the detailed modern ICT role taxonomy.

Recommended use:
Use these files to develop and test the data pipeline, feature engineering, model interfaces and frontend. Replace the
synthetic role-demand signals with real job-posting time series before making final accuracy claims.
