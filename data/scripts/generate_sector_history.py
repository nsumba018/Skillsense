#!/usr/bin/env python3
"""
SkillSense — Sector Employment History Generator
==================================================
Extracts sector-level employment from NISR LFS microdata (2017-2025)
and generates economically-plausible backcast data for 2010-2016.

Output feeds the SectorEmployment model for cross-sector comparison
and the ML pipeline for per-sector forecasting.
"""

import pandas as pd
import numpy as np
import os
import json
from datetime import datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)
LFS_BASE = os.path.join(DATA_DIR, "Labour_Force_Survey__2017-2024___Microdata", "datasets")
OUTPUT_DIR = os.path.join(DATA_DIR, "historical")

# ── ISIC indd03 → SkillSense sector mapping ─────────────────────
# Based on ISIC Rev 4 high-level sections as coded in Rwanda LFS

ISIC_TO_SECTOR = {
    1: "agriculture-environment",   # Agriculture, forestry, fishing
    2: "agriculture-environment",   # Mining and quarrying
    3: "engineering",               # Manufacturing
    4: "engineering",               # Electricity, gas, steam
    5: "engineering",               # Water supply, sewerage, waste
    6: "engineering",               # Construction
    7: "services-commerce",         # Wholesale and retail trade
    8: "services-commerce",         # Transportation and storage
    9: "services-commerce",         # Accommodation and food service
    10: "ict-technology",           # Information and communication
    11: "finance-business",         # Financial and insurance activities
    12: "services-commerce",        # Real estate activities
    13: "finance-business",         # Professional, scientific, technical
    14: "services-commerce",        # Administrative and support services
    15: "government-public-admin",  # Public administration and defence
    16: "education-research",       # Education
    17: "healthcare",               # Human health and social work
    18: "services-commerce",        # Arts, entertainment, recreation
    19: "services-commerce",        # Other service activities
    20: "services-commerce",        # Household employers
    21: "development-ngo",          # Extraterritorial organizations
}

SECTOR_NAMES = {
    "ict-technology": "ICT & Technology",
    "finance-business": "Finance & Business",
    "engineering": "Engineering",
    "healthcare": "Healthcare",
    "education-research": "Education & Research",
    "agriculture-environment": "Agriculture & Environment",
    "government-public-admin": "Government & Public Admin",
    "services-commerce": "Services & Commerce",
    "development-ngo": "Development & NGO",
}

# Rwanda GDP contribution by sector (% of GDP at current prices)
# Source: NISR GDP National Accounts 2024, Table 1 — computed from billion Rwf values
# 2025 extrapolated from 2024 (NISR data covers 1999-2024)
GDP_CONTRIBUTION = {
    "agriculture-environment": {
        2010: 25.3, 2011: 25.8, 2012: 26.4, 2013: 26.9, 2014: 26.8,
        2015: 25.7, 2016: 26.8, 2017: 28.5, 2018: 26.8, 2019: 25.0,
        2020: 27.8, 2021: 26.9, 2022: 27.7, 2023: 28.9, 2024: 27.2, 2025: 27.2,
    },
    "engineering": {
        2010: 15.3, 2011: 16.2, 2012: 16.6, 2013: 15.6, 2014: 15.4,
        2015: 15.7, 2016: 15.2, 2017: 15.1, 2018: 15.1, 2019: 17.4,
        2020: 17.4, 2021: 17.7, 2022: 18.4, 2023: 18.5, 2024: 18.4, 2025: 18.4,
    },
    "services-commerce": {
        2010: 33.6, 2011: 31.5, 2012: 31.0, 2013: 30.6, 2014: 30.7,
        2015: 31.5, 2016: 31.5, 2017: 30.7, 2018: 32.7, 2019: 32.5,
        2020: 30.5, 2021: 30.7, 2022: 30.1, 2023: 29.3, 2024: 31.9, 2025: 31.9,
    },
    "ict-technology": {
        2010: 2.2, 2011: 2.1, 2012: 2.3, 2013: 2.1, 2014: 2.1,
        2015: 2.2, 2016: 2.0, 2017: 1.7, 2018: 1.7, 2019: 2.0,
        2020: 2.0, 2021: 2.0, 2022: 1.5, 2023: 1.5, 2024: 1.6, 2025: 1.6,
    },
    "finance-business": {
        2010: 4.6, 2011: 4.6, 2012: 4.8, 2013: 5.1, 2014: 4.5,
        2015: 4.7, 2016: 4.5, 2017: 4.6, 2018: 4.7, 2019: 4.6,
        2020: 4.6, 2021: 4.8, 2022: 4.8, 2023: 4.4, 2024: 3.8, 2025: 3.8,
    },
    "government-public-admin": {
        2010: 5.9, 2011: 6.5, 2012: 6.4, 2013: 6.6, 2014: 6.4,
        2015: 6.8, 2016: 6.5, 2017: 6.4, 2018: 6.3, 2019: 6.0,
        2020: 6.1, 2021: 6.6, 2022: 6.4, 2023: 6.2, 2024: 5.5, 2025: 5.5,
    },
    "education-research": {
        2010: 2.5, 2011: 2.7, 2012: 2.9, 2013: 3.7, 2014: 3.6,
        2015: 3.4, 2016: 3.2, 2017: 3.0, 2018: 2.9, 2019: 2.8,
        2020: 1.7, 2021: 3.0, 2022: 3.6, 2023: 4.3, 2024: 4.0, 2025: 4.0,
    },
    "healthcare": {
        2010: 2.1, 2011: 1.9, 2012: 2.1, 2013: 2.3, 2014: 2.3,
        2015: 2.2, 2016: 2.0, 2017: 2.1, 2018: 1.8, 2019: 1.7,
        2020: 1.9, 2021: 1.7, 2022: 1.3, 2023: 0.9, 2024: 0.9, 2025: 0.9,
    },
    "development-ngo": {
        2010: 0.5, 2011: 0.5, 2012: 0.5, 2013: 0.5, 2014: 0.5,
        2015: 0.5, 2016: 0.5, 2017: 0.5, 2018: 0.5, 2019: 0.5,
        2020: 0.5, 2021: 0.5, 2022: 0.5, 2023: 0.5, 2024: 0.5, 2025: 0.5,
    },
}

# Rwanda total employment estimates (from NISR)
TOTAL_EMPLOYMENT = {
    2010: 2250000, 2011: 2400000, 2012: 2550000, 2013: 2700000,
    2014: 2850000, 2015: 3000000, 2016: 3100000, 2017: 3206474,
    2018: 3300000, 2019: 3273921, 2020: 3100000, 2021: 3250000,
    2022: 3400000, 2023: 3550000, 2024: 3700000, 2025: 3850000,
}


def extract_lfs_sector_employment(year):
    """Extract weighted sector employment from LFS microdata for a given year."""
    folder = os.path.join(LFS_BASE, f"Labour_Force_Survey_{year}", "dataset")
    if not os.path.exists(folder):
        return None

    files = [f for f in os.listdir(folder) if f.endswith('.csv')]
    if not files:
        return None

    df = pd.read_csv(os.path.join(folder, files[0]), usecols=lambda c: c in ('indd03', 'weight2'))

    if 'indd03' not in df.columns or 'weight2' not in df.columns:
        return None

    df = df.dropna(subset=['indd03'])
    df['sector_slug'] = df['indd03'].astype(int).map(ISIC_TO_SECTOR)
    df = df.dropna(subset=['sector_slug'])

    sector_emp = df.groupby('sector_slug')['weight2'].sum().to_dict()
    total = sum(sector_emp.values())

    result = {}
    for slug in SECTOR_NAMES:
        emp = sector_emp.get(slug, 0)
        result[slug] = {
            'employment_count': int(round(emp)),
            'employment_share_pct': round(emp / total * 100, 2) if total > 0 else 0,
        }

    return result, int(round(total))


def backcast_sector_employment(year, anchor_data, anchor_year):
    """Generate plausible employment estimates for years before LFS data.

    Uses GDP contribution proportions and total employment estimates
    to work backwards from the earliest LFS anchor point.
    """
    result = {}
    total_emp = TOTAL_EMPLOYMENT.get(year, 2250000)

    for slug in SECTOR_NAMES:
        anchor_share = anchor_data.get(slug, {}).get('employment_share_pct', 5.0)
        gdp_anchor = GDP_CONTRIBUTION.get(slug, {}).get(anchor_year, 5.0)
        gdp_target = GDP_CONTRIBUTION.get(slug, {}).get(year, 5.0)

        # Adjust share proportionally to GDP change, with dampening
        if gdp_anchor > 0:
            gdp_ratio = gdp_target / gdp_anchor
            dampened_ratio = 1.0 + (gdp_ratio - 1.0) * 0.6
            estimated_share = anchor_share * dampened_ratio
        else:
            estimated_share = anchor_share

        estimated_share = max(0.1, min(estimated_share, 90.0))
        emp_count = int(round(total_emp * estimated_share / 100))

        result[slug] = {
            'employment_count': emp_count,
            'employment_share_pct': round(estimated_share, 2),
        }

    return result, total_emp


def main():
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    print("=" * 60)
    print("SkillSense — Sector Employment History Generator")
    print("=" * 60)

    # Phase 1: Extract from LFS microdata (2017-2025)
    print("\n── Phase 1: Extracting from LFS microdata ──")
    lfs_data = {}
    totals = {}

    for year in range(2017, 2026):
        result = extract_lfs_sector_employment(year)
        if result:
            sector_data, total = result
            lfs_data[year] = sector_data
            totals[year] = total
            print(f"  {year}: {total:,} total employed across {len(sector_data)} sectors")
        else:
            print(f"  {year}: No data found")

    if not lfs_data:
        print("ERROR: No LFS data extracted!")
        return

    # Phase 2: Backcast 2010-2016
    print("\n── Phase 2: Backcasting 2010-2016 ──")
    anchor_year = min(lfs_data.keys())
    anchor_data = lfs_data[anchor_year]
    print(f"  Anchor year: {anchor_year}")

    backcast_data = {}
    for year in range(2010, anchor_year):
        sector_data, total = backcast_sector_employment(year, anchor_data, anchor_year)
        backcast_data[year] = sector_data
        totals[year] = total
        print(f"  {year}: {total:,} estimated total (backcast)")

    # Combine all years
    all_data = {**backcast_data, **lfs_data}

    # Phase 3: Build output rows
    print("\n── Phase 3: Building output ──")
    rows = []
    for year in sorted(all_data.keys()):
        is_synthetic = year < anchor_year
        total_emp = totals[year]

        for slug, data in all_data[year].items():
            gdp_pct = GDP_CONTRIBUTION.get(slug, {}).get(year)
            posting_count = 0

            rows.append({
                'sector_slug': slug,
                'sector_name': SECTOR_NAMES[slug],
                'year': year,
                'employment_count': data['employment_count'],
                'employment_share_pct': data['employment_share_pct'],
                'gdp_contribution_pct': gdp_pct,
                'posting_count': posting_count,
                'total_employment': total_emp,
                'data_source': f"NISR_LFS_{year}" if not is_synthetic else f"backcast_from_LFS_{anchor_year}",
                'synthetic_flag': is_synthetic,
            })

    df = pd.DataFrame(rows)

    # Save CSV
    out_csv = os.path.join(OUTPUT_DIR, "sector_employment_history_2010_2025.csv")
    df.to_csv(out_csv, index=False, encoding='utf-8')
    print(f"\nSaved {len(df)} rows to {out_csv}")

    # Save JSON
    out_json = os.path.join(OUTPUT_DIR, "sector_employment_history_2010_2025.json")
    df.to_json(out_json, orient='records', indent=2, force_ascii=False)
    print(f"Saved JSON to {out_json}")

    # Summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Years covered: {df['year'].min()}-{df['year'].max()}")
    print(f"Total rows: {len(df)}")
    print(f"Sectors: {df['sector_slug'].nunique()}")
    print(f"Synthetic rows: {df['synthetic_flag'].sum()} (2010-{anchor_year - 1})")
    print(f"LFS-based rows: {(~df['synthetic_flag']).sum()} ({anchor_year}-2025)")

    print(f"\n{'Sector':<30} {'2010':>10} {'2017':>10} {'2025':>10} {'Growth':>10}")
    print("-" * 70)
    for slug in sorted(SECTOR_NAMES.keys()):
        s = df[df['sector_slug'] == slug]
        emp_2010 = s[s['year'] == 2010]['employment_count'].values
        emp_2017 = s[s['year'] == 2017]['employment_count'].values
        emp_2025 = s[s['year'] == 2025]['employment_count'].values
        e10 = emp_2010[0] if len(emp_2010) > 0 else 0
        e17 = emp_2017[0] if len(emp_2017) > 0 else 0
        e25 = emp_2025[0] if len(emp_2025) > 0 else 0
        growth = f"{(e25/e10 - 1)*100:.0f}%" if e10 > 0 else "N/A"
        print(f"  {SECTOR_NAMES[slug]:<28} {e10:>10,} {e17:>10,} {e25:>10,} {growth:>10}")

    print(f"\nFinished: {datetime.now().isoformat()}")


if __name__ == "__main__":
    main()
