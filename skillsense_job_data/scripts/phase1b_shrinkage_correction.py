"""
Phase 1B: Shrinkage Correction for the 2026 Row

Context: phase1_data_finalization.py (Herve) built the 2026 row of Dataset A
by aggregating Dataset B (92 scraped job postings) directly into
role_share_within_ict_pct. That is a valid FIRST pass, but with ~4.6
postings/role on average, the raw posting share is dominated by sampling
noise, not signal. Training a forecasting model against it produces
2025->2026 test R2 of -0.11 (worse than predicting the mean), even though
the same model scores R2 0.83-0.997 on every other year (see
models/reports/model_training_report.md, "Known Limitation" section).

This script does NOT rewrite phase1_data_finalization.py. It is a
follow-on correction: it re-derives the 2026 role_share_within_ict_pct
using an Empirical-Bayes-style shrinkage estimator that blends the raw
posting share with a trend-extrapolated share, weighted by how many
postings that role actually received. Roles with more postings are
trusted closer to the observed value; roles with few/zero postings shrink
toward the historical trend instead of being treated as a reliable
measurement.

    shrunk_share = (n / (n + K)) * raw_posting_share
                 + (K / (n + K)) * trend_extrapolated_share

    n = posting count for the role (0-13 here)
    K = smoothing constant (15) - a role needs ~15 postings before its
        raw share is weighted more than the trend
    trend_extrapolated_share = 2025_share + (2025_share - 2024_share),
        i.e. the same linear extrapolation phase1_data_finalization.py
        already uses for macro indicators, applied to role share instead

This also replaces the ad hoc "50% decay for zero-posting roles" rule
from phase1_data_finalization.py Step 3 with the same shrinkage formula
(n=0 -> full weight on trend, i.e. no assumed decline), which is more
principled than assuming an arbitrary 50% drop.

Run from anywhere: `python skillsense_job_data/scripts/phase1b_shrinkage_correction.py`
"""

import numpy as np
import pandas as pd
from pathlib import Path

# ── Paths ─────────────────────────────────────────────────────────────────
BASE = Path(__file__).resolve().parent.parent
HIST_DIR = BASE / "data" / "historical"
CURRENT_ICT = BASE / "data" / "current_ict" / "ict_job_postings_v2.csv"

HIST_2019_2026 = HIST_DIR / "skillsense_ict_labour_history_2019_2026.csv"
HIST_2019_2025 = HIST_DIR / "skillsense_ict_labour_history_2019_2025.csv"  # kept in sync, same content per Phase 1 convention

K = 15.0  # smoothing constant


def main():
    print("=" * 70)
    print("PHASE 1B: SHRINKAGE CORRECTION FOR THE 2026 ROW")
    print("=" * 70)

    h = pd.read_csv(HIST_2019_2026)
    postings = pd.read_csv(CURRENT_ICT)

    roles_2025 = sorted(h[h["year"] == 2025]["role"].unique())
    assert len(roles_2025) == 20, f"Expected 20 roles, got {len(roles_2025)}"

    y2024 = h[h["year"] == 2024].set_index("role")
    y2025 = h[h["year"] == 2025].set_index("role")
    y2026 = h[h["year"] == 2026].set_index("role")

    role_counts = postings["normalized_role"].value_counts().to_dict()

    # ── Step 1: raw posting share (same denominator Phase 1 used: n / 92) ──
    total_postings = len(postings)
    raw_share = {r: role_counts.get(r, 0) / total_postings * 100 for r in roles_2025}

    # ── Step 2: trend-extrapolated share (linear, same method Phase 1 used
    #    for macro indicators, applied to role_share_within_ict_pct) ──────
    trend_share = {}
    for r in roles_2025:
        s2024 = y2024.loc[r, "role_share_within_ict_pct"]
        s2025 = y2025.loc[r, "role_share_within_ict_pct"]
        trend = s2025 + (s2025 - s2024)
        trend_share[r] = max(0.0, trend)

    # ── Step 3: shrinkage blend ─────────────────────────────────────────
    print(f"\n{'Role':50s} | {'n':>3s} | {'raw%':>7s} | {'trend%':>7s} | {'weight(n)':>9s} | {'shrunk%':>7s}")
    print("-" * 100)
    shrunk_share = {}
    for r in roles_2025:
        n = role_counts.get(r, 0)
        w = n / (n + K)
        shrunk = w * raw_share[r] + (1 - w) * trend_share[r]
        shrunk_share[r] = shrunk
        print(f"  {r:48s} | {n:3d} | {raw_share[r]:6.3f}% | {trend_share[r]:6.3f}% | {w:9.3f} | {shrunk:6.3f}%")

    # Re-normalize so shares sum to 100%
    total = sum(shrunk_share.values())
    for r in shrunk_share:
        shrunk_share[r] = shrunk_share[r] / total * 100.0
    print(f"\nShrunk shares sum (before->after normalize): {total:.4f}% -> {sum(shrunk_share.values()):.4f}%")

    # ── Step 4: recompute role_employment_proxy and role_demand_index ──
    ict_emp_2026 = y2026["ict_employment"].iloc[0]
    proxy = {r: ict_emp_2026 * (shrunk_share[r] / 100.0) for r in roles_2025}
    max_proxy = max(proxy.values())
    demand_index = {r: round((proxy[r] / max_proxy) * 100.0, 1) for r in roles_2025}

    print(f"\n{'Role':50s} | {'old idx':>8s} | {'new idx':>8s} | {'delta':>7s}")
    print("-" * 85)
    old_idx = y2026["role_demand_index"].to_dict()
    for r in sorted(roles_2025, key=lambda r: demand_index[r], reverse=True):
        d = demand_index[r] - old_idx[r]
        print(f"  {r:48s} | {old_idx[r]:8.1f} | {demand_index[r]:8.1f} | {d:+7.1f}")

    # ── Step 5: write corrected values back into the 2026 rows ─────────
    for r in roles_2025:
        mask = (h["year"] == 2026) & (h["role"] == r)
        h.loc[mask, "role_share_within_ict_pct"] = round(shrunk_share[r], 3)
        h.loc[mask, "role_employment_proxy"] = round(proxy[r], 1)
        h.loc[mask, "role_demand_index"] = demand_index[r]
        h.loc[mask, "data_basis"] = (
            "Dataset B (92 ICT postings, Sep 2026) shrunk toward "
            "trend-extrapolated 2026 estimate (Empirical-Bayes blend, K=15) "
            "+ macro extrapolation from NISR LFS 2024-2025 -- see "
            "phase1b_shrinkage_correction.py"
        )

    # ── Step 6: recalculate dependent targets (2025 -> target_1y, 2024 -> target_2y) ──
    demand_2026_lookup = {r: demand_index[r] for r in roles_2025}
    for idx in h.index:
        if h.loc[idx, "year"] == 2025:
            r = h.loc[idx, "role"]
            if r in demand_2026_lookup:
                h.loc[idx, "target_role_demand_index_1y"] = demand_2026_lookup[r]
        elif h.loc[idx, "year"] == 2024:
            r = h.loc[idx, "role"]
            if r in demand_2026_lookup:
                h.loc[idx, "target_role_demand_index_2y"] = demand_2026_lookup[r]

    # ── Step 7: validate ─────────────────────────────────────────────
    roles_2026_final = h[h["year"] == 2026]
    assert len(roles_2026_final) == 20
    share_sum = roles_2026_final["role_share_within_ict_pct"].sum()
    assert abs(share_sum - 100.0) < 0.01, f"Shares sum to {share_sum}"
    assert roles_2026_final["role_demand_index"].max() == 100.0
    assert roles_2026_final[["role_demand_index", "role_share_within_ict_pct",
                              "role_employment_proxy"]].isna().sum().sum() == 0
    print(f"\n[PASS] 2026 shares sum to {share_sum:.4f}%, max demand index = 100, zero nulls")

    # ── Step 8: save (both filenames, matching Phase 1's convention) ──
    h.to_csv(HIST_2019_2026, index=False)
    h.to_csv(HIST_2019_2025, index=False)
    print(f"\nSaved -> {HIST_2019_2026}")
    print(f"Saved -> {HIST_2019_2025}")

    print("\n" + "=" * 70)
    print("PHASE 1B COMPLETE")
    print("=" * 70)


if __name__ == "__main__":
    main()
