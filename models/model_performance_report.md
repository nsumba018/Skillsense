# SkillSense Model Performance Report

Generated: 2026-09-16
Model type: LightGBM
Training data: 418 rows (20 roles x 2005-2026)

---

## 1. Training Performance (from Colleague 1)

| Metric | Value |
|--------|-------|
| Mean MAE (cross-validation) | 3.41 |
| Mean RMSE (cross-validation) | 5.68 |
| Mean R-squared | 0.9182 |

---

## 2. Market Validation (2026 predictions vs real postings)

| Metric | Value | Interpretation |
|--------|-------|----------------|
| Spearman rank correlation | 0.3524 | Poor (< 0.5) |
| Pearson share correlation | 0.3668 | Poor (< 0.5) |

### Key finding
The model underestimated DevOps/Cloud Engineer (predicted rank #19, actual rank #3).
This is a known limitation: DevOps grew rapidly in 2024-2026 — a trend the historical
data (2005-2023) did not capture. Recommended fix: weight recent years (2022-2026) more
heavily in the next training iteration (to be addressed with Colleague 1).

---

## 3. Forecast Summary

### 1-Year Outlook (2027) — Top 5 roles
                                  role  forecasted_demand_index  forecasted_share_pct trend_direction
Software Developer / Software Engineer                88.194082              9.682057       declining
                     Backend Developer                79.696482              8.749180          stable
        IT Officer / ICT Administrator                79.681042              8.747485       declining
     IT Support / Help Desk Technician                66.998511              7.355180         growing
              Frontend / Web Developer                61.038471              6.700880         growing

### 2-Year Outlook (2028) — Top 5 roles
                                  role  forecasted_demand_index  forecasted_share_pct trend_direction
Software Developer / Software Engineer                88.190879              9.525330       declining
        IT Officer / ICT Administrator                72.687597              7.850850       declining
                     Backend Developer                72.483840              7.828843       declining
     IT Support / Help Desk Technician                68.555242              7.404522         growing
                          Data Analyst                64.731808              6.991560         growing

### Growing roles: Cybersecurity Analyst / Security Engineer, Data Analyst, Data Engineer, Data Scientist, Frontend / Web Developer, IT Auditor / IT Governance & Risk, IT Support / Help Desk Technician, Other ICT Technical Roles, QA / Software Test Engineer

### Declining roles: DevOps / Cloud Engineer, ICT Manager / IT Manager, IT Officer / ICT Administrator, Software Developer / Software Engineer, Systems Administrator

---

## 4. Limitations

- Validation correlation is poor (0.35) — DevOps/Cloud emergence not in historical data
- 6-month forecast is interpolated (no sub-annual training data)
- 2-year forecast compounds prediction error (wider confidence intervals)
- Small dataset (418 rows) limits model complexity

## 5. Data Sources

- Dataset A: Historical ICT labour data (2005-2026, NISR LFS verified)
- Dataset B: 92 real ICT postings (Sep 2026, 4 job boards)
