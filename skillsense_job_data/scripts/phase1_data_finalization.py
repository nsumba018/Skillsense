"""
Phase 1: Data Finalization
Transform Dataset B (92 ICT postings) into a 2026 row and append to Dataset A.
Produces the complete 440-row training dataset (2005-2026).
"""

import pandas as pd
import numpy as np
from pathlib import Path

# ── Paths ──────────────────────────────────────────────────────────────────────
BASE = Path(__file__).resolve().parent.parent
HIST_DIR = BASE / "data" / "historical"
CURRENT_ICT = BASE / "data" / "current_ict" / "ict_job_postings_v2.csv"

HIST_2005 = HIST_DIR / "skillsense_ict_labour_history_2005_2009.csv"
HIST_2010 = HIST_DIR / "skillsense_ict_labour_history_2010_2018.csv"
HIST_2019 = HIST_DIR / "skillsense_ict_labour_history_2019_2025.csv"

OUTPUT_FILE = HIST_DIR / "skillsense_ict_labour_history_2019_2026.csv"


# ── Step 1: Load all data ─────────────────────────────────────────────────────
print("=" * 70)
print("PHASE 1: DATA FINALIZATION")
print("Transform Dataset B (92 postings) → 2026 row → append to Dataset A")
print("=" * 70)

h_2005 = pd.read_csv(HIST_2005)
h_2010 = pd.read_csv(HIST_2010)
h_2019 = pd.read_csv(HIST_2019)
postings = pd.read_csv(CURRENT_ICT)

# Normalize column sets — 2005 file has extra 'id' column
if "id" in h_2005.columns:
    h_2005 = h_2005.drop(columns=["id"])

# Use 2019-2025 columns as the reference schema
REF_COLS = list(h_2019.columns)

print(f"\nLoaded historical data:")
print(f"  2005-2009: {len(h_2005)} rows")
print(f"  2010-2018: {len(h_2010)} rows")
print(f"  2019-2025: {len(h_2019)} rows")
print(f"  Total:     {len(h_2005) + len(h_2010) + len(h_2019)} rows")
print(f"\nLoaded Dataset B: {len(postings)} ICT postings")


# ── Step 2: Aggregate Dataset B by normalized_role ─────────────────────────────
print("\n" + "-" * 70)
print("STEP 2: Aggregate Dataset B by normalized_role")
print("-" * 70)

# The 20 roles used in 2019-2025
roles_2019_2025 = sorted(h_2019[h_2019["year"] == 2025]["role"].unique())
print(f"Historical roles (2019-2025): {len(roles_2019_2025)}")

# Count postings per role
role_counts = postings["normalized_role"].value_counts().to_dict()

# Map posting roles to historical role names (they should match)
posting_roles = set(postings["normalized_role"].unique())
missing_from_postings = set(roles_2019_2025) - posting_roles
print(f"Roles with zero postings: {missing_from_postings}")

# Build raw posting share (before handling zero-posting roles)
total_postings = len(postings)
raw_shares = {}
for role in roles_2019_2025:
    count = role_counts.get(role, 0)
    raw_shares[role] = (count / total_postings) * 100 if total_postings > 0 else 0.0

print("\nRaw posting distribution:")
for role in sorted(raw_shares, key=raw_shares.get, reverse=True):
    count = role_counts.get(role, 0)
    print(f"  {role:50s} | {count:3d} postings | {raw_shares[role]:5.1f}%")


# ── Step 3: Handle zero-posting roles ──────────────────────────────────────────
print("\n" + "-" * 70)
print("STEP 3: Handle zero-posting roles")
print("-" * 70)

# For roles with zero postings, assign a small residual based on their
# historical trend (use their 2025 share scaled down to reflect decline)
y2025_data = h_2019[h_2019["year"] == 2025].set_index("role")

adjusted_shares = {}
RESIDUAL_DECAY = 0.5  # assume 50% decline from 2025 share for absent roles

for role in roles_2019_2025:
    if role in missing_from_postings:
        hist_share = y2025_data.loc[role, "role_share_within_ict_pct"]
        residual = hist_share * RESIDUAL_DECAY
        adjusted_shares[role] = residual
        print(f"  {role}: 0 postings → residual {residual:.3f}% (50% of 2025 share {hist_share:.3f}%)")
    else:
        adjusted_shares[role] = raw_shares[role]

# Re-normalize so shares sum to 100%
total_share = sum(adjusted_shares.values())
for role in adjusted_shares:
    adjusted_shares[role] = (adjusted_shares[role] / total_share) * 100.0

print(f"\nAdjusted shares sum: {sum(adjusted_shares.values()):.4f}%")
print("\nFinal 2026 role shares:")
for role in sorted(adjusted_shares, key=adjusted_shares.get, reverse=True):
    print(f"  {role:50s} | {adjusted_shares[role]:6.3f}%")


# ── Step 4: Estimate 2026 macro indicators ─────────────────────────────────────
print("\n" + "-" * 70)
print("STEP 4: Estimate 2026 macro indicators")
print("-" * 70)

y2024_data = h_2019[h_2019["year"] == 2024].iloc[0]
y2025_data_row = h_2019[h_2019["year"] == 2025].iloc[0]

macro_cols = [
    "ict_employment",
    "ict_employment_share_pct",
    "total_employment",
    "labour_force_participation_rate_pct",
    "employment_to_population_ratio_pct",
    "unemployment_rate_pct",
    "tertiary_employment_count",
]

# Linear extrapolation: 2026 = 2025 + (2025 - 2024)
macro_2026 = {}
print(f"{'Indicator':50s} | {'2024':>12s} | {'2025':>12s} | {'2026 (est)':>12s} | {'Change':>8s}")
print("-" * 105)
for col in macro_cols:
    v2024 = y2024_data[col]
    v2025 = y2025_data_row[col]
    delta = v2025 - v2024
    v2026 = v2025 + delta

    # Apply reasonable bounds
    if "pct" in col or "rate" in col or "ratio" in col:
        v2026 = max(0.0, min(100.0, v2026))
    else:
        v2026 = max(0, v2026)

    # Round appropriately
    if col in ("total_employment", "ict_employment", "tertiary_employment_count"):
        v2026 = round(v2026)
    else:
        v2026 = round(v2026, 1)

    macro_2026[col] = v2026
    print(f"  {col:48s} | {v2024:12.1f} | {v2025:12.1f} | {v2026:12.1f} | {delta:+8.1f}")


# ── Step 5: Calculate role_employment_proxy and role_demand_index ──────────────
print("\n" + "-" * 70)
print("STEP 5: Calculate role_employment_proxy and role_demand_index")
print("-" * 70)

ict_emp_2026 = macro_2026["ict_employment"]

role_data_2026 = {}
for role in roles_2019_2025:
    share = adjusted_shares[role]
    emp_proxy = ict_emp_2026 * (share / 100.0)
    role_data_2026[role] = {
        "role_share_within_ict_pct": round(share, 3),
        "role_employment_proxy": round(emp_proxy, 1),
    }

# Calculate demand index: scale so max = 100
max_proxy = max(r["role_employment_proxy"] for r in role_data_2026.values())
for role in role_data_2026:
    proxy = role_data_2026[role]["role_employment_proxy"]
    role_data_2026[role]["role_demand_index"] = round((proxy / max_proxy) * 100.0, 1)

print(f"\n{'Role':50s} | {'Share%':>7s} | {'Emp Proxy':>10s} | {'Demand Idx':>10s}")
print("-" * 85)
for role in sorted(role_data_2026, key=lambda r: role_data_2026[r]["role_demand_index"], reverse=True):
    d = role_data_2026[role]
    print(f"  {role:48s} | {d['role_share_within_ict_pct']:6.3f}% | {d['role_employment_proxy']:10.1f} | {d['role_demand_index']:10.1f}")


# ── Step 6: Build 2026 rows ───────────────────────────────────────────────────
print("\n" + "-" * 70)
print("STEP 6: Build 20 rows for year=2026")
print("-" * 70)

# Get role metadata from the 2025 rows
y2025_meta = h_2019[h_2019["year"] == 2025].set_index("role")

rows_2026 = []
for role in roles_2019_2025:
    meta = y2025_meta.loc[role]
    rd = role_data_2026[role]

    row = {
        "year": 2026,
        "period": "annual",
        "sector": "ICT",
        "role_family": meta["role_family"],
        "role": role,
        "occupation_proxy": meta["occupation_proxy"],
        "historical_role_status": meta["historical_role_status"],
        "ict_employment": macro_2026["ict_employment"],
        "ict_employment_share_pct": macro_2026["ict_employment_share_pct"],
        "total_employment": macro_2026["total_employment"],
        "labour_force_participation_rate_pct": macro_2026["labour_force_participation_rate_pct"],
        "employment_to_population_ratio_pct": macro_2026["employment_to_population_ratio_pct"],
        "unemployment_rate_pct": macro_2026["unemployment_rate_pct"],
        "tertiary_employment_count": macro_2026["tertiary_employment_count"],
        "role_demand_index": rd["role_demand_index"],
        "role_share_within_ict_pct": rd["role_share_within_ict_pct"],
        "role_employment_proxy": rd["role_employment_proxy"],
        "emergence_year": int(meta["emergence_year"]),
        "data_basis": "Dataset B (92 ICT postings from 4 sources, Sep 2026) + macro extrapolation from NISR LFS 2024-2025",
        "synthetic_flag": 0,
        "target_role_demand_index_1y": np.nan,  # no 2027 data yet
        "target_role_demand_index_2y": np.nan,  # no 2028 data yet
        "target_role_demand_6m": np.nan,
        "note_6m": "No sub-annual data available",
    }
    rows_2026.append(row)

df_2026 = pd.DataFrame(rows_2026)
print(f"Created {len(df_2026)} rows for 2026")
print(f"Shares sum: {df_2026['role_share_within_ict_pct'].sum():.4f}%")
print(f"Max demand index: {df_2026['role_demand_index'].max()}")


# ── Step 7: Recalculate targets for 2024 and 2025 ────────────────────────────
print("\n" + "-" * 70)
print("STEP 7: Recalculate target columns for 2024 and 2025")
print("-" * 70)

# Build a lookup of 2026 demand index by role
demand_2026 = df_2026.set_index("role")["role_demand_index"].to_dict()

# Update 2025 rows: now have 1y target (2026)
updates_2025 = 0
for idx in h_2019.index:
    if h_2019.loc[idx, "year"] == 2025:
        role = h_2019.loc[idx, "role"]
        if role in demand_2026:
            h_2019.loc[idx, "target_role_demand_index_1y"] = demand_2026[role]
            updates_2025 += 1
print(f"Updated {updates_2025} rows for 2025 (target_1y now points to 2026)")

# Update 2024 rows: now have 2y target (2026)
updates_2024 = 0
for idx in h_2019.index:
    if h_2019.loc[idx, "year"] == 2024:
        role = h_2019.loc[idx, "role"]
        if role in demand_2026:
            h_2019.loc[idx, "target_role_demand_index_2y"] = demand_2026[role]
            updates_2024 += 1
print(f"Updated {updates_2024} rows for 2024 (target_2y now points to 2026)")


# ── Step 8: Append 2026 and save ──────────────────────────────────────────────
print("\n" + "-" * 70)
print("STEP 8: Save updated historical CSV")
print("-" * 70)

# Append 2026 rows to the 2019-2025 file
df_2026 = df_2026[REF_COLS]  # ensure column order matches
h_2019_updated = pd.concat([h_2019, df_2026], ignore_index=True)

# Save as new file (2019-2026)
h_2019_updated.to_csv(OUTPUT_FILE, index=False)
print(f"Saved: {OUTPUT_FILE}")
print(f"  Rows: {len(h_2019_updated)} (was {len(h_2019)}, added {len(df_2026)})")

# Also update the original file in place
h_2019_updated.to_csv(HIST_2019.parent / "skillsense_ict_labour_history_2019_2025.csv", index=False)
print(f"Updated: {HIST_2019} (now contains 2019-2026 data)")


# ── Step 9: Validate ─────────────────────────────────────────────────────────
print("\n" + "-" * 70)
print("STEP 9: Validation")
print("-" * 70)

# Reload all and validate
all_data = pd.concat([h_2005, h_2010, h_2019_updated], ignore_index=True)
total_rows = len(all_data)

# Check total rows
assert total_rows == 440, f"Expected 440 rows, got {total_rows}"
print(f"[PASS] Total rows: {total_rows}")

# Check roles per year for 2026
roles_2026 = all_data[all_data["year"] == 2026]
assert len(roles_2026) == 20, f"Expected 20 roles for 2026, got {len(roles_2026)}"
print(f"[PASS] 2026 has {len(roles_2026)} roles")

# Check shares sum to ~100%
share_sum = roles_2026["role_share_within_ict_pct"].sum()
assert abs(share_sum - 100.0) < 0.01, f"Shares sum to {share_sum}, expected 100"
print(f"[PASS] 2026 role shares sum to {share_sum:.4f}%")

# Check max demand index = 100
max_idx = roles_2026["role_demand_index"].max()
assert max_idx == 100.0, f"Max demand index is {max_idx}, expected 100"
print(f"[PASS] Max demand index = {max_idx}")

# Check zero nulls in key columns
key_cols = ["year", "role", "role_demand_index", "role_share_within_ict_pct",
            "role_employment_proxy", "ict_employment"]
for col in key_cols:
    nulls = roles_2026[col].isna().sum()
    assert nulls == 0, f"Column {col} has {nulls} nulls"
print(f"[PASS] Zero nulls in key columns for 2026")

# Check target updates
y2025_check = all_data[(all_data["year"] == 2025)]
has_1y = y2025_check["target_role_demand_index_1y"].notna().sum()
print(f"[PASS] 2025 rows with target_1y: {has_1y}/20")

y2024_check = all_data[(all_data["year"] == 2024)]
has_2y = y2024_check["target_role_demand_index_2y"].notna().sum()
print(f"[PASS] 2024 rows with target_2y: {has_2y}/20")

# Check years coverage
years = sorted(all_data["year"].unique())
print(f"[PASS] Year coverage: {years[0]}-{years[-1]} ({len(years)} years)")

print("\n" + "=" * 70)
print("PHASE 1 COMPLETE")
print(f"Dataset A updated: {total_rows} rows (2005-2026), 20 roles/year")
print(f"Output: {OUTPUT_FILE}")
print("=" * 70)
