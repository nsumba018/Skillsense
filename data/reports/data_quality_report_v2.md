# SkillSense — Data Quality Report (v2)

Generated: 2026-10-09 16:24:15

## Dataset Summary

- **Source:** JobInRwanda.com
- **Total records:** 201
- **ICT records:** 70 (34.8%)
- **Non-ICT records:** 131

## Classification Quality

- **Avg ICT confidence (ICT records):** 0.57
- **Min ICT confidence (ICT records):** 0.50
- **Avg role normalization confidence:** 0.87
- **Records needing manual review:** 41

## Normalized Roles Created

- **Distinct normalized roles:** 18
- **Distinct role groups:** 11

## Role Level Distribution

- Not Specified: 62
- Senior: 4
- Mid-Level: 2
- Lead: 1
- Manager: 1

## Data Completeness

- Records with title: 201/201
- Records with company: 201/201
- Records with industry: 173/201
- Records with description/raw_text: 181/201
- Records with education: 114/201
- Records with experience: 117/201

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