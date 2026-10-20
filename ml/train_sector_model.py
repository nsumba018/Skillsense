#!/usr/bin/env python3
"""
SkillSense — Per-Sector Employment Forecaster (Training)
=========================================================
Trains sector-level employment forecasting models using the
SectorEmployment historical data (9 sectors × 15 years).

Two complementary approaches:
1. Per-sector Holt exponential smoothing — captures individual trends
2. Pooled LightGBM across all sectors — learns cross-sector patterns

Artifacts saved:
- sector_model.joblib     — pooled LightGBM model
- sector_encoder.joblib   — sector label encoder
- sector_features.joblib  — feature list
- holt_params.joblib      — per-sector Holt smoothing parameters

Run: python ml/train_sector_model.py
"""

import warnings
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from lightgbm import LGBMRegressor
from sklearn.metrics import mean_absolute_error, r2_score
from sklearn.preprocessing import LabelEncoder
from statsmodels.tsa.holtwinters import Holt

warnings.filterwarnings("ignore")

BASE = Path(__file__).resolve().parent.parent
HIST_CSV = BASE / "data" / "historical" / "sector_employment_history_2010_2025.csv"
ARTIFACTS = Path(__file__).resolve().parent / "artifacts"
ARTIFACTS.mkdir(parents=True, exist_ok=True)

FEATURES = [
    "year",
    "sector_encoded",
    "trend_position",
    "employment_share_pct",
    "gdp_contribution_pct",
    "share_lag1",
    "share_lag2",
    "share_change_1y",
    "gdp_change_1y",
    "emp_gdp_ratio",
]

TARGET = "target_share_1y"


def load_data() -> pd.DataFrame:
    print("=" * 60)
    print("STEP 1: LOAD SECTOR EMPLOYMENT HISTORY")
    print("=" * 60)

    df = pd.read_csv(HIST_CSV)
    print(f"Loaded {len(df)} rows: {df['sector_slug'].nunique()} sectors, "
          f"years {df['year'].min()}-{df['year'].max()}")
    print(f"Synthetic rows (backcast): {df['synthetic_flag'].sum()}")
    print(f"Real rows (LFS): {(~df['synthetic_flag']).sum()}")
    return df


def engineer_features(df: pd.DataFrame) -> pd.DataFrame:
    print("\n" + "=" * 60)
    print("STEP 2: FEATURE ENGINEERING")
    print("=" * 60)

    df = df.sort_values(["sector_slug", "year"]).reset_index(drop=True)

    sector_encoder = LabelEncoder()
    df["sector_encoded"] = sector_encoder.fit_transform(df["sector_slug"])
    joblib.dump(sector_encoder, ARTIFACTS / "sector_encoder.joblib")
    print(f"Sector encoder: {len(sector_encoder.classes_)} classes")

    year_min, year_max = df["year"].min(), df["year"].max()
    span = max(year_max - year_min, 1)
    df["trend_position"] = (df["year"] - year_min) / span

    df["share_lag1"] = df.groupby("sector_slug")["employment_share_pct"].shift(1)
    df["share_lag2"] = df.groupby("sector_slug")["employment_share_pct"].shift(2)
    df["share_change_1y"] = df.groupby("sector_slug")["employment_share_pct"].diff(1)
    df["gdp_change_1y"] = df.groupby("sector_slug")["gdp_contribution_pct"].diff(1)
    df["emp_gdp_ratio"] = df["employment_share_pct"] / df["gdp_contribution_pct"].clip(lower=0.1)

    df["target_share_1y"] = df.groupby("sector_slug")["employment_share_pct"].shift(-1)

    print(f"Engineered {len(df)} rows with {len(df.columns)} columns")
    return df


def train_pooled_model(df: pd.DataFrame):
    print("\n" + "=" * 60)
    print("STEP 3: POOLED LIGHTGBM MODEL")
    print("=" * 60)

    df_model = df.dropna(subset=[TARGET]).copy()
    for col in ["share_lag1", "share_lag2", "share_change_1y", "gdp_change_1y"]:
        df_model[col] = df_model[col].fillna(0)

    latest_year = df_model["year"].max()
    train = df_model[df_model["year"] < latest_year]
    test = df_model[df_model["year"] == latest_year]

    X_train, y_train = train[FEATURES], train[TARGET]
    X_test, y_test = test[FEATURES], test[TARGET]

    print(f"Train: {len(X_train)} rows (up to {latest_year - 1})")
    print(f"Test:  {len(X_test)} rows ({latest_year})")

    model = LGBMRegressor(
        n_estimators=200,
        max_depth=4,
        learning_rate=0.05,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=0.5,
        reg_lambda=1.0,
        min_child_samples=3,
        random_state=42,
        n_jobs=-1,
        verbose=-1,
    )
    model.fit(X_train, y_train)
    y_pred = model.predict(X_test)

    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)
    print(f"Test MAE: {mae:.4f}, R2: {r2:.4f}")

    print("\nPer-sector test results:")
    for slug in sorted(test["sector_slug"].unique()):
        mask = test["sector_slug"] == slug
        actual = y_test[mask].values
        pred = y_pred[mask.values]
        if len(actual) > 0:
            err = abs(actual[0] - pred[0])
            print(f"  {slug:<30} actual={actual[0]:6.2f}%  pred={pred[0]:6.2f}%  err={err:.2f}")

    joblib.dump(model, ARTIFACTS / "sector_model.joblib")
    joblib.dump(FEATURES, ARTIFACTS / "sector_features.joblib")
    print(f"\nSaved model -> {ARTIFACTS / 'sector_model.joblib'}")

    importance = pd.DataFrame({
        "feature": FEATURES,
        "importance": model.feature_importances_,
    }).sort_values("importance", ascending=False)
    print("\nFeature importance:")
    print(importance.to_string(index=False))

    return model, {"mae": mae, "r2": r2}


def train_holt_models(df: pd.DataFrame):
    print("\n" + "=" * 60)
    print("STEP 4: PER-SECTOR HOLT EXPONENTIAL SMOOTHING")
    print("=" * 60)

    holt_params = {}

    for slug in sorted(df["sector_slug"].unique()):
        sector_data = df[df["sector_slug"] == slug].sort_values("year")
        year_min = int(sector_data["year"].min())
        year_max = int(sector_data["year"].max())
        full_years = range(year_min, year_max + 1)
        full_idx = pd.date_range(start=str(year_min), periods=len(full_years), freq="YS")
        reindexed = sector_data.set_index("year")["employment_share_pct"].reindex(full_years).interpolate()
        ts = pd.Series(reindexed.values, index=full_idx)

        if ts.isna().any() or len(ts) < 4:
            print(f"  {slug}: skipped (too few data points or NaN)")
            continue

        train_ts = ts.iloc[:-1]
        test_val = ts.iloc[-1]

        try:
            fit = Holt(train_ts, initialization_method="estimated").fit(
                optimized=True, smoothing_level=None, smoothing_trend=None
            )
            forecast_1 = fit.forecast(1).iloc[0]
            err = abs(test_val - forecast_1)

            holt_params[slug] = {
                "alpha": fit.params["smoothing_level"],
                "beta": fit.params["smoothing_trend"],
                "level": fit.level[-1] if hasattr(fit, "level") else fit.params.get("initial_level", 0),
                "trend": fit.trend[-1] if hasattr(fit, "trend") else fit.params.get("initial_trend", 0),
                "last_year": int(train_ts.index[-1]),
            }

            print(f"  {slug:<30} α={fit.params['smoothing_level']:.3f} "
                  f"β={fit.params['smoothing_trend']:.3f}  "
                  f"pred={forecast_1:.2f}% actual={test_val:.2f}% err={err:.2f}")
        except Exception as e:
            import traceback
            print(f"  {slug:<30} FAILED: {e}")
            traceback.print_exc()

    joblib.dump(holt_params, ARTIFACTS / "holt_params.joblib")
    print(f"\nSaved Holt params for {len(holt_params)} sectors -> {ARTIFACTS / 'holt_params.joblib'}")
    return holt_params


def rolling_cv(df: pd.DataFrame):
    print("\n" + "=" * 60)
    print("STEP 5: ROLLING-WINDOW CROSS-VALIDATION")
    print("=" * 60)

    df_model = df.dropna(subset=[TARGET]).copy()
    for col in ["share_lag1", "share_lag2", "share_change_1y", "gdp_change_1y"]:
        df_model[col] = df_model[col].fillna(0)

    years = sorted(df_model["year"].unique())
    results = []

    for test_year in years[5:]:
        train_cv = df_model[df_model["year"] < test_year]
        test_cv = df_model[df_model["year"] == test_year]

        if len(test_cv) == 0 or len(train_cv) < 20:
            continue

        model_cv = LGBMRegressor(
            n_estimators=150, max_depth=4, learning_rate=0.05,
            min_child_samples=3, random_state=42, n_jobs=-1, verbose=-1,
        )
        model_cv.fit(train_cv[FEATURES], train_cv[TARGET])
        y_pred = model_cv.predict(test_cv[FEATURES])

        mae = mean_absolute_error(test_cv[TARGET], y_pred)
        r2 = r2_score(test_cv[TARGET], y_pred) if len(test_cv) > 1 else 0
        results.append({"test_year": test_year, "mae": mae, "r2": r2, "n": len(test_cv)})

    cv_df = pd.DataFrame(results)
    print(cv_df.to_string(index=False))
    print(f"\nMean MAE: {cv_df['mae'].mean():.4f}")
    print(f"Mean R2:  {cv_df['r2'].mean():.4f}")
    return cv_df


def main():
    df = load_data()
    df = engineer_features(df)
    model, lgbm_metrics = train_pooled_model(df)
    holt_params = train_holt_models(df)
    cv_df = rolling_cv(df)

    print("\n" + "=" * 60)
    print("SECTOR MODEL TRAINING COMPLETE")
    print("=" * 60)
    print(f"Pooled LightGBM — MAE: {lgbm_metrics['mae']:.4f}, R2: {lgbm_metrics['r2']:.4f}")
    print(f"Holt models fitted for {len(holt_params)} sectors")
    print(f"Cross-validation mean MAE: {cv_df['mae'].mean():.4f}")
    print(f"\nArtifacts saved to: {ARTIFACTS}")


if __name__ == "__main__":
    main()
