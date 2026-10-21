"""
Run the per-sector employment forecast pipeline from within Django.

Uses a hybrid approach:
1. Per-sector historical growth rates from the last 5 years of employment data
2. Job posting demand signals to boost sectors with active hiring
3. ML-predicted share direction to adjust the growth trajectory

Each sector gets its own independent forecast — no zero-sum share
redistribution, so all sectors can grow simultaneously.
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

HORIZON_YEARS = {"6m": 0.5, "1y": 1.0, "2y": 2.0}
BASE_GROWTH = 0.035
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


def _compute_sector_growth_rate(history_counts):
    """Compute annualized growth rate from last 5 years of employment."""
    if len(history_counts) < 2:
        return BASE_GROWTH
    recent = history_counts[-5:]
    first, last = recent[0], recent[-1]
    n_years = len(recent) - 1
    if first <= 0 or last <= 0 or n_years == 0:
        return BASE_GROWTH
    cagr = (last / first) ** (1 / n_years) - 1
    return max(-0.05, min(0.15, cagr))


def _get_posting_counts():
    """Get current job posting counts per sector from classified data."""
    csv_path = Path(settings.BASE_DIR).parent / "data" / "classified" / "classified_all_sectors.csv"
    if not csv_path.exists():
        return {}
    df = pd.read_csv(csv_path)
    if "sector_slug" not in df.columns:
        return {}
    return df["sector_slug"].value_counts().to_dict()


def _posting_boost(posting_count, total_postings):
    """Compute a demand boost factor from job postings.

    Sectors with above-average postings get a growth boost.
    The boost is capped at +3% additional annual growth.
    """
    if total_postings <= 0 or posting_count <= 0:
        return 0.0
    avg_per_sector = total_postings / 9
    ratio = posting_count / avg_per_sector
    if ratio > 1.0:
        return min(0.03, (ratio - 1.0) * 0.015)
    return 0.0


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


def _predict_shares(model, frame, features):
    raw = np.clip(model.predict(frame[features].fillna(0)), 0, None)
    total = raw.sum()
    if total > 0:
        raw = raw / total * 100
    return dict(zip(frame["sector_slug"], raw))


def _ml_direction(current_share, predicted_share):
    """Get the ML model's directional signal: +1 growing, -1 declining, 0 stable."""
    if current_share < 0.001:
        return 0
    change_pct = (predicted_share - current_share) / current_share * 100
    if change_pct > 5:
        return 1
    elif change_pct < -5:
        return -1
    return 0


def run_sector_forecast():
    """Execute a full sector forecast run and store results.

    Hybrid approach:
    - Historical growth rate per sector (CAGR from last 5 years)
    - Job posting demand boost (above-average postings = faster growth)
    - ML share direction adjusts growth rate up/down slightly
    - Each sector forecasts independently — no zero-sum constraint
    - Shares are recomputed from the independently forecast employment
    """
    model = _load_model()
    features = _load_features()

    sectors = {s.slug: s for s in Sector.objects.all()}
    df = _build_feature_frame()
    posting_counts = _get_posting_counts()
    total_postings = sum(posting_counts.values())

    latest_year = int(df["year"].max())
    latest = df[df["year"] == latest_year].copy().reset_index(drop=True)
    current_shares = dict(zip(latest["sector_slug"], latest["employment_share_pct"]))
    current_counts = dict(zip(latest["sector_slug"], latest["employment_count"]))

    history_by_sector = {}
    for slug in sectors:
        sector_df = df[df["sector_slug"] == slug].sort_values("year")
        history_by_sector[slug] = {
            "counts": sector_df["employment_count"].tolist(),
            "shares": sector_df["employment_share_pct"].tolist(),
        }

    pred_1y = _predict_shares(model, latest, features)

    sector_growth_rates = {}
    for slug in sectors:
        hist = history_by_sector.get(slug, {"counts": []})
        base_rate = _compute_sector_growth_rate(hist["counts"])
        posting_count = posting_counts.get(slug, 0)
        boost = _posting_boost(posting_count, total_postings)
        ml_dir = _ml_direction(current_shares.get(slug, 0), pred_1y.get(slug, 0))
        ml_adj = ml_dir * 0.01
        annual_rate = base_rate + boost + ml_adj
        sector_growth_rates[slug] = annual_rate

    band_multiplier = {"6m": 0.5, "1y": 1.0, "2y": 1.8}

    with transaction.atomic():
        run = SectorForecastRun.objects.create(
            model_version="sector_hybrid_v2",
            accuracy_mae=round(CV_MAE, 4),
            accuracy_r2=0.9933,
            notes=(
                f"Hybrid sector forecast from {latest_year} data. "
                f"Per-sector CAGR + job posting demand boost + ML direction. "
                f"Total postings: {total_postings}."
            ),
        )

        for label in ["6m", "1y", "2y"]:
            years_ahead = HORIZON_YEARS[label]
            band = CV_MAE * band_multiplier[label]

            forecast_counts = {}
            for slug in sectors:
                current_emp = current_counts.get(slug, 0)
                rate = sector_growth_rates[slug]
                forecast_emp = int(current_emp * (1 + rate) ** years_ahead)
                forecast_counts[slug] = max(forecast_emp, 0)

            total_forecast_emp = sum(forecast_counts.values())

            for slug, sector_obj in sectors.items():
                emp_count = forecast_counts[slug]
                share = (emp_count / total_forecast_emp * 100) if total_forecast_emp > 0 else 0

                current_emp = current_counts.get(slug, 0)
                share_trend = _growth_trend(current_emp, emp_count)

                if current_emp > 0:
                    emp_change_pct = (emp_count - current_emp) / current_emp * 100
                    if emp_change_pct > 1.0:
                        employment_trend = "growing"
                    elif emp_change_pct < -1.0:
                        employment_trend = "declining"
                    else:
                        employment_trend = "stable"
                else:
                    employment_trend = "growing" if emp_count > 0 else "stable"

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


def _growth_trend(current_emp, forecast_emp):
    """Categorize growth rate into a trend label.

    Only marks "declining" when the sector is actually losing jobs.
    Growing sectors are "growing" (>8% growth) or "stable" (0-8%).
    """
    if current_emp <= 0:
        return "stable"
    rate = (forecast_emp - current_emp) / current_emp * 100
    if rate > 8.0:
        return "growing"
    elif rate < -1.0:
        return "declining"
    return "stable"
