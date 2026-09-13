SkillSense ICT Labour-Market Historical Dataset: 2005–2009
=============================================================

Purpose
-------
Synthetic historical/model-development scaffold for Rwanda's ICT labour-market evolution
during the infrastructure-focused period leading into and including NICI II.

Important provenance note
-------------------------
These role-level observations are SYNTHETIC. They are not official NISR measurements and
must not be presented to judges, partners, or users as observed historical employment counts.

The generation logic is informed by Rwanda's official ICT policy history:
- NICI I (2000–2005) established foundational policy, regulatory and institutional conditions.
- NICI II (2006–2010) emphasized communications infrastructure rollout, wider telecom-network
  coverage, additional operators, and the national fibre-optic backbone.
Therefore, networking/telecommunications, systems administration and technical support are
intentionally stronger in this 2005–2009 scaffold than newer specializations.

Dataset structure
-----------------
100 rows = 20 ICT role categories × 5 years (2005–2009)

Main model features
-------------------
year
sector
role_family
role
occupation_proxy
historical_role_status
role_demand_index
role_share_within_ict_pct
role_employment_proxy
emergence_year

Targets
-------
target_role_demand_index_1y
target_role_demand_index_2y

The 6-month target is intentionally blank because annual synthetic history is not a suitable
primary source for 6-month forecasting. SkillSense should use higher-frequency current job
posting data for short-horizon demand forecasting.

How to use with the 2010–2018 and 2019–2025 datasets
----------------------------------------------------
This dataset should be treated as the earliest historical stage:
2005–2009 = infrastructure and connectivity development
2010–2015 = ICT services and broader ICT adoption
2016–2018 = digital-transformation acceleration
2019–2025 = greater ICT specialization and modern digital roles

Do not train the model as though these synthetic role counts are ground truth.
Use them to prototype feature engineering and temporal-pattern learning, then validate and
re-calibrate against real job-posting observations and official published aggregate statistics
once accessible.
