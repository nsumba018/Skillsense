"""
Run the per-sector employment forecast pipeline from within Django.

Uses the pooled LightGBM model trained by ml/train_sector_model.py to
predict sector employment shares at 6m/1y/2y horizons for all 9 sectors.

Trend direction is computed from the last 3 year-over-year transitions
(2 historical + 1 forecast), not a single comparison. A sector is
"growing" or "declining" only when 2+ of 3 transitions agree.
"""
import numpy as np
import pandas as pd
import joblib
from pathlib import Path
from django.conf import settings
from django.db import transaction

from taxonomy.models import Sector, SectorEmployment
from predictions.models import SectorForecastRun, SectorForecast

_cache = {}

ARTIFACTS = Path(settings.BASE_DIR).parent / "ml" / "artifacts"

GROWTH_TOTAL_EMP = {"6m": 1.02, "1y": 1.04, "2y": 1.08}
CV_MAE = 1.08


def _load_model():
    if "sector_model" not in _cache:
        path = ARTIFACTS / "sector_model.joblib"
        if not path.exists():
            raise FileNotFoundError(
                f"Sector model not found at {path}. "
                "Run 'python ml/train_sector_model.py' first."
            )
        _cache["sector_model"] = joblib.load(path)
    return _cache["sector_model"]


def _load_encoder():
    if "sector_encoder" not in _cache:
        path = ARTIFACTS / "sector_encoder.joblib"
        if not path.exists():
            raise FileNotFoundError(f"Sector encoder not found at {path}.")
        _cache["sector_encoder"] = joblib.load(path)
    return _cache["sector_encoder"]


def _load_features():
    if "sector_features" not in _cache:
        path = ARTIFACTS / "sector_features.joblib"
        if not path.exists():
            raise FileNotFoundError(f"Sector feature list not found at {path}.")
        _cache["sector_features"] = joblib.load(path)
    return _cache["sector_features"]


def _compute_trajectory_trend(values):
    """Determine trend from a sequence of 3+ values by counting transitions.

    Looks at year-over-year changes. If 2+ transitions go the same
    direction (with >1% relative threshold to filter noise), that's the
    trend. Mixed signals = stable.
    """
    if len(values) < 2:
        return "stable"

    ups = 0
    downs = 0
    for i in range(1, len(values)):
        prev = values[i - 1]
        curr = values[i]
        if prev < 0.001:
            if curr > 0.001:
                ups += 1
            continue
        change_pct = (curr - prev) / prev * 100
        if change_pct > 1.0:
            ups += 1
        elif change_pct < -1.0:
            downs += 1

    if ups >= 2 and ups > downs:
        return "growing"
    if downs >= 2 and downs > ups:
        return "declining"
    return "stable"


def _build_feature_frame():
    """Build the feature DataFrame from SectorEmployment data."""
    history = (
        SectorEmployment.objects
        .select_related("sector")
        .order_by("sector__slug", "year")
    )

    rows = []
    for se in history:
        rows.append({
            "sector_slug": se.sector.slug,
            "year": se.year,
            "employment_count": se.employment_count,
            "employment_share_pct": se.employment_share_pct,
            "gdp_contribution_pct": se.gdp_contribution_pct or 0,
            "total_employment": se.employment_count / (se.employment_share_pct / 100)
            if se.employment_share_pct > 0 else 0,
        })

    df = pd.DataFrame(rows)
    if df.empty:
        raise ValueError("No SectorEmployment data. Load historical data first.")

    encoder = _load_encoder()
    df["sector_encoded"] = encoder.transform(df["sector_slug"])

    year_min, year_max = df["year"].min(), df["year"].max()
    span = max(year_max - year_min, 1)
    df["trend_position"] = (df["year"] - year_min) / span

    df = df.sort_values(["sector_slug", "year"]).reset_index(drop=True)
    df["share_lag1"] = df.groupby("sector_slug")["employment_share_pct"].shift(1)
    df["share_lag2"] = df.groupby("sector_slug")["employment_share_pct"].shift(2)
    df["share_change_1y"] = df.groupby("sector_slug")["employment_share_pct"].diff(1)
    df["gdp_change_1y"] = df.groupby("sector_slug")["gdp_contribution_pct"].diff(1)
    df["emp_gdp_ratio"] = (
        df["employment_share_pct"] / df["gdp_contribution_pct"].clip(lower=0.1)
    )

    for col in ["share_lag1", "share_lag2", "share_change_1y", "gdp_change_1y"]:
        df[col] = df[col].fillna(0)

    return df


def _get_recent_history(df, n_years=3):
    """Get the last n_years of share and employment data per sector."""
    latest_year = int(df["year"].max())
    cutoff = latest_year - n_years
    recent = df[df["year"] > cutoff].sort_values(["sector_slug", "year"])

    history = {}
    for slug in df["sector_slug"].unique():
        sector_rows = recent[recent["sector_slug"] == slug]
        history[slug] = {
            "shares": sector_rows["employment_share_pct"].tolist(),
            "counts": sector_rows["employment_count"].tolist(),
            "years": sector_rows["year"].tolist(),
        }
    return history


def _predict_shares(model, frame, features):
    raw = np.clip(model.predict(frame[features].fillna(0)), 0, None)
    total = raw.sum()
    if total > 0:
        raw = raw / total * 100
    return dict(zip(frame["sector_slug"], raw))


def _get_posting_counts():
    """Get current job posting counts per sector from classified data."""
    csv_path = Path(settings.BASE_DIR).parent / "data" / "classified" / "classified_all_sectors.csv"
    if not csv_path.exists():
        return {}
    df = pd.read_csv(csv_path)
    if "sector_slug" not in df.columns:
        return {}
    return df["sector_slug"].value_counts().to_dict()


def run_sector_forecast():
    """Execute a full sector forecast run and store results."""
    model = _load_model()
    features = _load_features()

    sectors = {s.slug: s for s in Sector.objects.all()}
    df = _build_feature_frame()
    posting_counts = _get_posting_counts()
    recent_history = _get_recent_history(df, n_years=3)

    latest_year = int(df["year"].max())
    latest = df[df["year"] == latest_year].copy().reset_index(drop=True)
    current_shares = dict(zip(latest["sector_slug"], latest["employment_share_pct"]))
    current_counts = dict(zip(latest["sector_slug"], latest["employment_count"]))

    total_emp_latest = latest["total_employment"].iloc[0] if len(latest) > 0 else 4_800_000

    # 1-year horizon
    pred_1y = _predict_shares(model, latest, features)

    # 2-year: simulate 1y state, predict again
    sim = latest.copy()
    sim["year"] = latest_year + 1
    year_min = df["year"].min()
    span = max(df["year"].max() - year_min, 1)
    sim["trend_position"] = (latest_year + 1 - year_min) / span
    sim["employment_share_pct"] = sim["sector_slug"].map(pred_1y)
    sim["share_lag1"] = sim["sector_slug"].map(current_shares)
    sim["share_change_1y"] = sim["employment_share_pct"] - sim["share_lag1"]
    sim["emp_gdp_ratio"] = (
        sim["employment_share_pct"] / sim["gdp_contribution_pct"].clip(lower=0.1)
    )
    pred_2y = _predict_shares(model, sim, features)

    # 6-month: halfway between current and 1y
    pred_6m = {
        slug: 0.5 * current_shares.get(slug, 0) + 0.5 * pred_1y.get(slug, 0)
        for slug in sectors
    }

    horizons = [
        ("6m", pred_6m, GROWTH_TOTAL_EMP["6m"]),
        ("1y", pred_1y, GROWTH_TOTAL_EMP["1y"]),
        ("2y", pred_2y, GROWTH_TOTAL_EMP["2y"]),
    ]

    band_multiplier = {"6m": 0.5, "1y": 1.0, "2y": 1.8}

    with transaction.atomic():
        run = SectorForecastRun.objects.create(
            model_version="sector_lgbm_v1",
            accuracy_mae=round(CV_MAE, 4),
            accuracy_r2=0.9933,
            notes=f"Per-sector forecast from {latest_year} data, pooled LightGBM. "
                  f"Trends use last 3 years + forecast trajectory.",
        )

        for label, shares, emp_mult in horizons:
            total_emp = int(total_emp_latest * emp_mult)
            band = CV_MAE * band_multiplier[label]

            for slug, sector_obj in sectors.items():
                share = shares.get(slug, 0)
                emp_count = int(total_emp * share / 100)

                hist = recent_history.get(slug, {"shares": [], "counts": []})

                share_trajectory = hist["shares"] + [share]
                share_trend = _compute_trajectory_trend(share_trajectory)

                emp_trajectory = hist["counts"] + [emp_count]
                employment_trend = _compute_trajectory_trend(emp_trajectory)

                SectorForecast.objects.create(
                    forecast_run=run,
                    sector=sector_obj,
                    horizon=label,
                    employment_share_pct=round(share, 2),
                    employment_count=emp_count,
                    gdp_contribution_pct=latest[
                        latest["sector_slug"] == slug
                    ]["gdp_contribution_pct"].iloc[0]
                    if slug in latest["sector_slug"].values else None,
                    confidence_lower=round(max(0, share - band), 2),
                    confidence_upper=round(share + band, 2),
                    share_trend=share_trend,
                    employment_trend=employment_trend,
                    posting_count=posting_counts.get(slug, 0),
                )

    return run
