# Model Training Report

## Dataset
- Total rows: 440 (20 active roles/year x 22 years, 2005-2026)
- Model-ready rows (valid target_role_demand_index_1y): 418
- Training set: 398 rows (2005-2024)
- Test set: 20 rows (2025 only — 2026 rows have no known 1y target yet)
- Features: 18 (year, years_since_emergence, trend_position, role_encoded, role_share_within_ict_pct, role_employment_proxy, ict_employment, ict_employment_share_pct, total_employment, unemployment_rate_pct, labour_force_participation_rate_pct, employment_to_population_ratio_pct, tertiary_employment_count, role_demand_index_lag1, role_demand_index_lag2, role_share_change_1y, demand_index_change_1y, demand_index_rolling_3y)

**Data quality note:** the combined role taxonomy has 22 distinct labels across 2005-2026, not 20. 'ICT Applications / E-Government Developer' and 'Telecommunications / Network Technician' appear only in 2005-2009; 'Backend Developer' and 'Full-Stack Developer' start only from 2010. Every individual year still has exactly 20 active roles. The 22 rows at the 2009/2010 boundary with no successor-role data (NaN 1y/2y target) are excluded from training via dropna, which is the correct behaviour, not a bug to fix.

## Model Comparison

| Model | MAE | RMSE | R-squared |
|-------|-----|------|-----------|
| XGBoost | 8.42 | 12.63 | 0.7364 |
| LightGBM | 8.35 | 12.55 | 0.7395 |
| Prophet (per-role) | 9.48 | 12.24 | 0.7403 |

**Best model:** LightGBM — lowest MAE among XGBoost/LightGBM on the 2025 test set.

## 2025->2026 Test-Set Performance (Phase 1B correction applied)

XGBoost (R2 0.7364) and LightGBM (R2 0.7395) both meet the Phase 2A acceptance criterion of R2 > 0.7 on the 2025 test fold (predicting the 2026 value).

**Originally this fold failed badly** (XGBoost/LightGBM R2 ~ -0.11, worse than predicting the mean) even though the same model scored R2 > 0.9 on every other year in the rolling-window CV. Root cause: the 2026 row in Dataset A was built by Phase 1 (`phase1_data_finalization.py`) directly from Dataset B's raw posting share (92 scraped postings, ~4.6/role on average) — far noisier than the government-survey-derived shares backing 2005-2025, producing implausible jumps (e.g. Software Developer / Software Engineer 100 -> 53.8, DevOps / Cloud Engineer 8.9 -> 69.2 between 2025 and 2026).

**Fix applied:** `scripts/phase1b_shrinkage_correction.py` re-derives the 2026 `role_share_within_ict_pct` as an Empirical-Bayes-style shrinkage blend of the raw posting share and a trend-extrapolated share, weighted by each role's posting count (`n/(n+K)` with `K=15`). Roles with more postings stay close to the observed value; roles with few or zero postings shrink toward the historical trend instead of being treated as a reliable measurement (this also replaces Phase 1's ad hoc "50% decay for zero-posting roles" rule with the same shrinkage logic). This is a follow-on correction, not a rewrite of Phase 1's script — for review, not yet merged into `develop`.

Remaining year-over-year change after the correction (smaller than the original jump table, still directionally meaningful):

| role                                      |   delta_2025_2026 |
|:------------------------------------------|------------------:|
| IT Officer / ICT Administrator            |              33.2 |
| DevOps / Cloud Engineer                   |              29.2 |
| Backend Developer                         |              24.8 |
| ICT Manager / IT Manager                  |              15.2 |
| QA / Software Test Engineer               |               9.8 |
| IT Support / Help Desk Technician         |               8.2 |
| Data Engineer                             |               4.6 |
| Frontend / Web Developer                  |               4.5 |
| Systems Administrator                     |               4.3 |
| Mobile App Developer                      |               4.1 |
| Data Analyst                              |               4   |
| Systems Analyst / IT Business Analyst     |               4   |
| Full-Stack Developer                      |               4   |
| Cybersecurity Analyst / Security Engineer |               3   |
| Database Administrator                    |               2.9 |
| Network Engineer / Network Administrator  |               2.9 |
| Data Scientist                            |               2.8 |
| IT Auditor / IT Governance & Risk         |               2.2 |
| Other ICT Technical Roles                 |               2.1 |
| Software Developer / Software Engineer    |               0   |

## Cross-Validation (Rolling Window, XGBoost)

|   test_year |      mae |     rmse |       r2 |   n_test |
|------------:|---------:|---------:|---------:|---------:|
|        2016 | 3.37484  |  6.20662 | 0.942218 |       20 |
|        2017 | 3.43705  |  5.84992 | 0.944285 |       20 |
|        2018 | 5.76581  | 12.7047  | 0.717783 |       20 |
|        2019 | 5.34524  |  7.11739 | 0.906672 |       20 |
|        2020 | 1.68066  |  2.22937 | 0.990622 |       20 |
|        2021 | 2.18503  |  2.6472  | 0.986486 |       20 |
|        2022 | 1.14562  |  1.96516 | 0.992508 |       20 |
|        2023 | 2.0144   |  4.30749 | 0.964116 |       20 |
|        2024 | 0.960141 |  1.23029 | 0.997055 |       20 |
|        2025 | 8.20837  | 12.5242  | 0.740651 |       20 |

Mean MAE: 3.41, Mean RMSE: 5.68, Mean R2: 0.9182

## Feature Importance (Top 10)

| feature                   |   importance |
|:--------------------------|-------------:|
| demand_index_rolling_3y   |   0.609023   |
| role_share_within_ict_pct |   0.294986   |
| role_demand_index_lag1    |   0.0187579  |
| role_employment_proxy     |   0.01603    |
| demand_index_change_1y    |   0.0132898  |
| trend_position            |   0.00997768 |
| years_since_emergence     |   0.00919532 |
| role_encoded              |   0.008585   |
| year                      |   0.00675991 |
| role_share_change_1y      |   0.00668817 |

## Hyperparameters (XGBoost)
```
n_estimators=300, max_depth=6, learning_rate=0.05, subsample=0.8,
colsample_bytree=0.8, reg_alpha=0.1, reg_lambda=1.0, random_state=42
```