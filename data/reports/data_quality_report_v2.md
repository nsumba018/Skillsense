# SkillSense — Data Quality Report (v2)

Generated: 2026-09-11 09:12:12

## Dataset Summary

- **Source:** JobInRwanda.com
- **Total records:** 141
- **ICT records:** 49 (34.8%)
- **Non-ICT records:** 92

## Classification Quality

- **Avg ICT confidence (ICT records):** 0.56
- **Min ICT confidence (ICT records):** 0.50
- **Avg role normalization confidence:** 0.87
- **Records needing manual review:** 30

## Normalized Roles Created

- **Distinct normalized roles:** 15
- **Distinct role groups:** 11

## Role Level Distribution

- Not Specified: 42
- Senior: 3
- Mid-Level: 2
- Manager: 1
- Lead: 1

## Data Completeness

- Records with title: 141/141
- Records with company: 141/141
- Records with industry: 82/141
- Records with description/raw_text: 141/141
- Records with education: 82/141
- Records with experience: 82/141

## Taxonomy Recommendations

Based on the current data:

1. The existing taxonomy covers all observed ICT roles — no new categories needed.
2. Most taxonomy categories have 0-1 postings, reflecting the small dataset (89 total, 9 ICT).
3. Software Development is the dominant group — expected for a single-snapshot dataset.
4. As more data sources are added (RwandaJob, manual uploads), the taxonomy breadth will be tested.

## Recommendations

1. **Add more data sources** — 9 ICT postings from 89 total is too few for reliable forecasting.
2. **Review flagged records** — check any records with `needs_manual_review = True`.
3. **Re-run pipeline on new data** — use `python3 classify_and_group_v2.py new_data.csv`.
4. **Do not train forecasting models** until ICT volume reaches at least 50+ postings across multiple time periods.