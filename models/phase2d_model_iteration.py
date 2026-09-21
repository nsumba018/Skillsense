"""
Phase 2D: Model Iteration — Target Spearman > 0.85

Systematically tests data trimming, recency weighting, feature engineering,
and model tuning to improve validation correlation against real 2026 postings.

Run: python models/phase2d_model_iteration.py
"""

import warnings
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from lightgbm import LGBMRegressor
from scipy.stats import spearmanr, pearsonr
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.preprocessing import LabelEncoder
from xgboost import XGBRegressor

warnings.filterwarnings("ignore")

BASE = Path(__file__).resolve().parent.parent
HIST_DIR = BASE / "skillsense_job_data" / "data" / "historical"
ARTIFACTS = Path(__file__).resolve().parent / "artifacts"
REPORTS = Path(__file__).resolve().parent / "reports"
ARTIFACTS.mkdir(parents=True, exist_ok=True)
REPORTS.mkdir(parents=True, exist_ok=True)

TARGET = "target_role_demand_index_1y"


# ═══════════════════════════════════════════════════════════════════════
# STEP 0: LOAD RAW DATA
# ═══════════════════════════════════════════════════════════════════════

def load_raw_data():
    df_05 = pd.read_csv(HIST_DIR / "skillsense_ict_labour_history_2005_2009.csv")
    df_10 = pd.read_csv(HIST_DIR / "skillsense_ict_labour_history_2010_2018.csv")
    df_19 = pd.read_csv(HIST_DIR / "skillsense_ict_labour_history_2019_2026.csv")
    if "id" in df_05.columns:
        df_05 = df_05.drop(columns=["id"])
    df = pd.concat([df_05, df_10, df_19], ignore_index=True)
    return df


def load_dataset_b():
    return pd.read_csv(
        BASE / "skillsense_job_data" / "data" / "current_ict" / "ict_job_postings_v2.csv"
    )


# ═══════════════════════════════════════════════════════════════════════
# STEP 1: FEATURE ENGINEERING (improved)
# ═══════════════════════════════════════════════════════════════════════

def engineer_features(df, rolling_window=2):
    """Engineer all features. rolling_window controls the smoothing window."""
    df = df.copy()
    df = df.sort_values(["role", "year"]).reset_index(drop=True)

    # Time features
    df["years_since_emergence"] = (df["year"] - df["emergence_year"]).clip(lower=0)
    df["trend_position"] = (df["year"] - df["year"].min()) / (df["year"].max() - df["year"].min())

    # Role encoding
    role_encoder = LabelEncoder()
    df["role_encoded"] = role_encoder.fit_transform(df["role"])

    # Lag features
    df["role_demand_index_lag1"] = df.groupby("role")["role_demand_index"].shift(1)
    df["role_demand_index_lag2"] = df.groupby("role")["role_demand_index"].shift(2)
    df["role_share_change_1y"] = df.groupby("role")["role_share_within_ict_pct"].diff(1)
    df["demand_index_change_1y"] = df.groupby("role")["role_demand_index"].diff(1)

    # Rolling average (configurable window)
    df["demand_index_rolling"] = df.groupby("role")["role_demand_index"].transform(
        lambda x: x.rolling(window=rolling_window, min_periods=1).mean()
    )

    # NEW: Acceleration (2nd derivative) — detects roles speeding up or slowing down
    df["demand_index_accel"] = df.groupby("role")["demand_index_change_1y"].diff(1)

    # NEW: 2-year momentum
    df["demand_index_change_2y"] = df.groupby("role")["role_demand_index"].diff(2)

    # NEW: Relative growth rate (% change, not absolute)
    df["role_share_growth_rate"] = df["role_share_change_1y"] / df["role_share_within_ict_pct"].clip(lower=0.01)

    # NEW: Role's position in the lifecycle (young roles grow faster)
    df["lifecycle_stage"] = df["years_since_emergence"].apply(
        lambda x: 0 if x <= 2 else (1 if x <= 5 else (2 if x <= 10 else 3))
    )

    return df, role_encoder


def get_feature_list():
    return [
        "year",
        "years_since_emergence",
        "trend_position",
        "role_encoded",
        "role_share_within_ict_pct",
        "role_employment_proxy",
        "ict_employment",
        "ict_employment_share_pct",
        "total_employment",
        "unemployment_rate_pct",
        "labour_force_participation_rate_pct",
        "employment_to_population_ratio_pct",
        "tertiary_employment_count",
        "role_demand_index_lag1",
        "role_demand_index_lag2",
        "role_share_change_1y",
        "demand_index_change_1y",
        "demand_index_rolling",
        "demand_index_accel",
        "demand_index_change_2y",
        "role_share_growth_rate",
        "lifecycle_stage",
    ]


# ═══════════════════════════════════════════════════════════════════════
# STEP 2: VALIDATION FUNCTION
# ═══════════════════════════════════════════════════════════════════════

def validate_against_dataset_b(model, df, features, dataset_b):
    """
    Predict 2026 demand from 2025 features, compare against real postings.
    Returns (spearman, pearson, comparison_df).
    """
    df_2025 = df[df["year"] == 2025].copy()
    for col in features:
        if col in df_2025.columns:
            df_2025[col] = df_2025[col].fillna(0)

    predicted = model.predict(df_2025[features])
    df_2025["predicted_demand_index"] = predicted

    total_pred = df_2025["predicted_demand_index"].sum()
    df_2025["predicted_share"] = df_2025["predicted_demand_index"] / total_pred * 100

    model_pred = df_2025[["role", "predicted_demand_index", "predicted_share"]].copy()

    # Actual from Dataset B
    actual = dataset_b["normalized_role"].value_counts().reset_index()
    actual.columns = ["role", "posting_count"]
    actual["actual_share"] = actual["posting_count"] / actual["posting_count"].sum() * 100

    comp = model_pred.merge(actual, on="role", how="outer")
    comp["posting_count"] = comp["posting_count"].fillna(0)
    comp["actual_share"] = comp["actual_share"].fillna(0)
    comp["predicted_demand_index"] = comp["predicted_demand_index"].fillna(0)
    comp["predicted_share"] = comp["predicted_share"].fillna(0)

    comp["pred_rank"] = comp["predicted_demand_index"].rank(ascending=False)
    comp["actual_rank"] = comp["posting_count"].rank(ascending=False, method="min")

    sp, _ = spearmanr(comp["pred_rank"], comp["actual_rank"])
    pe, _ = pearsonr(comp["predicted_share"], comp["actual_share"])

    return sp, pe, comp


def rolling_cv_r2(df_model, features, model_class, model_params, sample_weight_col=None):
    """Run rolling-window CV starting from test_year=2020 to keep it fast."""
    results = []
    for test_year in range(2020, 2026):
        train = df_model[df_model["year"] <= test_year]
        test = df_model[df_model["year"] == test_year + 1]
        if len(test) == 0:
            continue

        X_tr, y_tr = train[features].fillna(0), train[TARGET]
        X_te, y_te = test[features].fillna(0), test[TARGET]
        if y_te.isna().all():
            continue

        m = model_class(**model_params)
        fit_kwargs = {}
        if sample_weight_col and sample_weight_col in train.columns:
            fit_kwargs["sample_weight"] = train[sample_weight_col].values
        m.fit(X_tr, y_tr, **fit_kwargs)
        y_pred = m.predict(X_te)
        results.append(r2_score(y_te, y_pred))

    return np.mean(results) if results else 0.0


# ═══════════════════════════════════════════════════════════════════════
# STEP 3: RUN EXPERIMENTS
# ═══════════════════════════════════════════════════════════════════════

def run_experiment(df_full, dataset_b, name, min_year, decay_rate, rolling_window,
                   model_class, model_params, use_weight=True):
    """Run one full experiment and return results."""
    # Trim data
    df = df_full[df_full["year"] >= min_year].copy()

    # Engineer features
    df, role_encoder = engineer_features(df, rolling_window=rolling_window)
    features = get_feature_list()

    # Prepare model-ready data
    df_model = df.dropna(subset=[TARGET]).copy()
    for col in ["role_demand_index_lag1", "role_demand_index_lag2",
                "role_share_change_1y", "demand_index_change_1y",
                "demand_index_accel", "demand_index_change_2y",
                "role_share_growth_rate"]:
        if col in df_model.columns:
            df_model[col] = df_model[col].fillna(0)

    # Add sample weights
    if use_weight and decay_rate > 0:
        df["sample_weight"] = np.exp(decay_rate * (df["year"] - df["year"].max()))
        df_model["sample_weight"] = np.exp(decay_rate * (df_model["year"] - df_model["year"].max()))

    # Train/test split
    train = df_model[df_model["year"] <= 2024]
    X_train = train[features].fillna(0)
    y_train = train[TARGET]

    model = model_class(**model_params)
    fit_kwargs = {}
    if use_weight and decay_rate > 0:
        fit_kwargs["sample_weight"] = train["sample_weight"].values
    model.fit(X_train, y_train, **fit_kwargs)

    # Validate against Dataset B
    sp, pe, comp = validate_against_dataset_b(model, df, features, dataset_b)

    # Rolling CV (quick, 2020-2025 only)
    cv_r2 = rolling_cv_r2(
        df_model, features, model_class, model_params,
        sample_weight_col="sample_weight" if (use_weight and decay_rate > 0) else None
    )

    # Check specific roles
    devops_rank = comp.loc[comp["role"] == "DevOps / Cloud Engineer", "pred_rank"].values
    devops_rank = devops_rank[0] if len(devops_rank) > 0 else 99
    it_support_rank = comp.loc[comp["role"] == "IT Support / Help Desk Technician", "pred_rank"].values
    it_support_rank = it_support_rank[0] if len(it_support_rank) > 0 else 99

    result = {
        "name": name,
        "min_year": min_year,
        "decay_rate": decay_rate,
        "rolling_window": rolling_window,
        "n_train_rows": len(train),
        "spearman": sp,
        "pearson": pe,
        "cv_r2": cv_r2,
        "devops_pred_rank": devops_rank,
        "it_support_pred_rank": it_support_rank,
    }
    return result, model, df, role_encoder, features, comp


def main():
    print("=" * 80)
    print("PHASE 2D: MODEL ITERATION — TARGET SPEARMAN > 0.85")
    print("=" * 80)

    df_full = load_raw_data()
    dataset_b = load_dataset_b()
    print(f"Loaded {df_full.shape[0]} rows, Dataset B: {dataset_b.shape[0]} postings\n")

    # ── Experiment grid ──────────────────────────────────────────────
    lgbm_base = {
        "n_estimators": 300, "max_depth": 6, "learning_rate": 0.05,
        "subsample": 0.8, "colsample_bytree": 0.8, "reg_alpha": 0.1,
        "reg_lambda": 1.0, "random_state": 42, "n_jobs": -1, "verbose": -1,
        "min_child_samples": 5,
    }
    lgbm_shallow = {**lgbm_base, "max_depth": 4, "learning_rate": 0.1, "n_estimators": 200}
    lgbm_deep_weighted = {**lgbm_base, "max_depth": 5, "min_child_samples": 3}
    xgb_base = {
        "n_estimators": 300, "max_depth": 6, "learning_rate": 0.05,
        "subsample": 0.8, "colsample_bytree": 0.8, "reg_alpha": 0.1,
        "reg_lambda": 1.0, "random_state": 42, "n_jobs": -1, "verbosity": 0,
    }

    experiments = [
        # Baseline: original setup
        ("A: baseline (2005+, no weight, 3y roll)", 2005, 0, 3, LGBMRegressor, lgbm_base, False),
        # Data trimming
        ("B: trim to 2010+", 2010, 0, 2, LGBMRegressor, lgbm_base, False),
        ("C: trim to 2015+", 2015, 0, 2, LGBMRegressor, lgbm_base, False),
        ("D: trim to 2017+ (gov-verified only)", 2017, 0, 2, LGBMRegressor, lgbm_base, False),
        # Recency weighting
        ("E: 2005+ decay=0.15", 2005, 0.15, 2, LGBMRegressor, lgbm_base, True),
        ("F: 2005+ decay=0.25", 2005, 0.25, 2, LGBMRegressor, lgbm_base, True),
        ("G: 2005+ decay=0.35", 2005, 0.35, 2, LGBMRegressor, lgbm_base, True),
        ("H: 2010+ decay=0.20", 2010, 0.20, 2, LGBMRegressor, lgbm_base, True),
        ("I: 2010+ decay=0.30", 2010, 0.30, 2, LGBMRegressor, lgbm_base, True),
        ("J: 2015+ decay=0.20", 2015, 0.20, 2, LGBMRegressor, lgbm_base, True),
        ("K: 2015+ decay=0.30", 2015, 0.30, 2, LGBMRegressor, lgbm_base, True),
        ("L: 2017+ decay=0.25", 2017, 0.25, 2, LGBMRegressor, lgbm_base, True),
        ("M: 2017+ decay=0.35", 2017, 0.35, 2, LGBMRegressor, lgbm_base, True),
        # Model tuning
        ("N: 2015+ decay=0.25 shallow", 2015, 0.25, 2, LGBMRegressor, lgbm_shallow, True),
        ("O: 2010+ decay=0.25 shallow", 2010, 0.25, 2, LGBMRegressor, lgbm_shallow, True),
        ("P: 2017+ decay=0.30 shallow", 2017, 0.30, 2, LGBMRegressor, lgbm_shallow, True),
        ("Q: 2015+ decay=0.25 XGBoost", 2015, 0.25, 2, XGBRegressor, xgb_base, True),
        ("R: 2017+ decay=0.30 deep", 2017, 0.30, 2, LGBMRegressor, lgbm_deep_weighted, True),
    ]

    results = []
    best_sp = -1
    best_result = None
    best_model = None
    best_df = None
    best_encoder = None
    best_features = None
    best_comp = None

    print(f"{'Experiment':<42s} | {'Spear':>6s} | {'Pears':>6s} | {'CV R2':>6s} | {'DevOps':>6s} | {'ITSup':>5s} | {'Rows':>4s}")
    print("-" * 95)

    for name, min_yr, decay, roll_w, model_cls, params, use_w in experiments:
        try:
            r, model, df_eng, enc, feats, comp = run_experiment(
                df_full, dataset_b, name, min_yr, decay, roll_w, model_cls, params, use_w
            )
            results.append(r)
            tag = ""
            if r["spearman"] > best_sp:
                best_sp = r["spearman"]
                best_result = r
                best_model = model
                best_df = df_eng
                best_encoder = enc
                best_features = feats
                best_comp = comp
                tag = " <-- BEST"
            print(f"{name:<42s} | {r['spearman']:6.4f} | {r['pearson']:6.4f} | {r['cv_r2']:6.4f} | #{int(r['devops_pred_rank']):>4d} | #{int(r['it_support_pred_rank']):>4d} | {r['n_train_rows']:>4d}{tag}")
        except Exception as e:
            print(f"{name:<42s} | FAILED: {e}")

    # ── Summary ──────────────────────────────────────────────────────
    print("\n" + "=" * 80)
    print("EXPERIMENT SUMMARY")
    print("=" * 80)

    results_df = pd.DataFrame(results).sort_values("spearman", ascending=False)
    print(results_df[["name", "spearman", "pearson", "cv_r2", "devops_pred_rank", "it_support_pred_rank"]].to_string(index=False))

    print(f"\n{'=' * 80}")
    print(f"BEST: {best_result['name']}")
    print(f"  Spearman:  {best_result['spearman']:.4f} (target: > 0.85)")
    print(f"  Pearson:   {best_result['pearson']:.4f} (target: > 0.75)")
    print(f"  CV R2:     {best_result['cv_r2']:.4f} (target: > 0.80)")
    print(f"  DevOps rank: #{int(best_result['devops_pred_rank'])} (target: top 10)")
    print(f"  IT Support rank: #{int(best_result['it_support_pred_rank'])} (target: not top 5)")
    print(f"{'=' * 80}")

    passed = (
        best_result["spearman"] > 0.85
        and best_result["pearson"] > 0.75
        and best_result["cv_r2"] > 0.80
        and best_result["devops_pred_rank"] <= 10
        and best_result["it_support_pred_rank"] > 5
    )

    if passed:
        print("\nACCEPTANCE GATE: PASSED")
    else:
        reasons = []
        if best_result["spearman"] <= 0.85:
            reasons.append(f"Spearman {best_result['spearman']:.4f} <= 0.85")
        if best_result["pearson"] <= 0.75:
            reasons.append(f"Pearson {best_result['pearson']:.4f} <= 0.75")
        if best_result["cv_r2"] <= 0.80:
            reasons.append(f"CV R2 {best_result['cv_r2']:.4f} <= 0.80")
        if best_result["devops_pred_rank"] > 10:
            reasons.append(f"DevOps rank #{int(best_result['devops_pred_rank'])} > 10")
        if best_result["it_support_pred_rank"] <= 5:
            reasons.append(f"IT Support rank #{int(best_result['it_support_pred_rank'])} <= 5")
        print(f"\nACCEPTANCE GATE: NOT YET MET — {', '.join(reasons)}")
        print("Proceeding with best available result for further iteration...\n")

    # ── Save best model artifacts ────────────────────────────────────
    print("\nSaving best model artifacts...")

    # Print the full comparison table for the best model
    print(f"\n{'=' * 80}")
    print(f"BEST MODEL — Role-by-role comparison:")
    print(f"{'=' * 80}")
    bc = best_comp.sort_values("actual_rank")
    print(bc[["role", "pred_rank", "actual_rank", "predicted_share", "actual_share"]].to_string(index=False))

    # Save artifacts
    joblib.dump(best_model, ARTIFACTS / "best_model.joblib")
    joblib.dump(best_encoder, ARTIFACTS / "role_encoder.joblib")
    joblib.dump(best_features, ARTIFACTS / "feature_list.joblib")
    best_df.to_csv(ARTIFACTS / "engineered_dataset.csv", index=False)

    df_model = best_df.dropna(subset=[TARGET]).copy()
    for col in ["role_demand_index_lag1", "role_demand_index_lag2",
                "role_share_change_1y", "demand_index_change_1y",
                "demand_index_accel", "demand_index_change_2y",
                "role_share_growth_rate"]:
        if col in df_model.columns:
            df_model[col] = df_model[col].fillna(0)
    df_model.to_csv(ARTIFACTS / "model_ready_dataset.csv", index=False)

    best_comp.to_csv(REPORTS / "validation_comparison.csv", index=False)
    results_df.to_csv(REPORTS / "phase2d_experiment_results.csv", index=False)

    print(f"\nSaved: models/artifacts/best_model.joblib ({best_result['name']})")
    print(f"Saved: models/reports/phase2d_experiment_results.csv")
    print(f"Saved: models/reports/validation_comparison.csv")

    print(f"\n{'=' * 80}")
    print("PHASE 2D EXPERIMENT SWEEP COMPLETE")
    print(f"{'=' * 80}")

    return best_result, best_model, best_df, best_encoder, best_features


if __name__ == "__main__":
    main()
