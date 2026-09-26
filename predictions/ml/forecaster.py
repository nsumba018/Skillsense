"""
Run the Two-Stage forecast pipeline from within Django.

Django-integrated version of produce_forecasts() in models/phase2d_final_model.py.
It rebuilds the model features from the database (seeded from Dataset A), reuses
the trained LightGBM trend model (Stage 1) and the saved Dataset B market
correction factors (Stage 2), and stores results in ForecastRun + RoleForecast.
"""
import numpy as np
import pandas as pd
from django.db import transaction

from taxonomy.models import NormalizedRole, HistoricalDemand, MacroIndicator
from predictions.models import ForecastRun, RoleForecast
from .model_loader import get_model, get_correction_factors, get_role_encoder, get_feature_list

MIN_YEAR = 2010
# ICT employment growth applied on top of the latest actual year
GROWTH_6M, GROWTH_1Y, GROWTH_2Y_STEP = 1.075, 1.15, 1.12
# Confidence band = cross-validation MAE x horizon multiplier x 10 (demand-index scale)
CV_MAE = 0.3277
BAND_MULTIPLIER = {'6m': 1.0, '1y': 1.5, '2y': 2.5}
FORECAST_2Y_CF_DAMPING = 0.7


def _predict_shares(model, frame, features):
    """Stage 1: predicted next-year role shares (%), normalised to sum to 100."""
    raw = np.clip(model.predict(frame[features].fillna(0)), 0, None)
    return dict(zip(frame['role'], raw / raw.sum() * 100))


def _apply_correction(shares, correction_factors):
    """Stage 2: multiply by market correction factors and renormalise to 100."""
    corrected = {r: s * correction_factors.get(r, 1.0) for r, s in shares.items()}
    total = sum(corrected.values())
    return {r: v / total * 100 for r, v in corrected.items()}


def _trend_direction(forecast_share, current_share):
    if current_share < 0.01:
        return 'growing' if forecast_share > 0.5 else 'stable'
    change_pct = (forecast_share - current_share) / current_share * 100
    if change_pct > 5:
        return 'growing'
    if change_pct < -5:
        return 'declining'
    return 'stable'


def _build_feature_frame(role_encoder):
    history = HistoricalDemand.objects.filter(
        year__gte=MIN_YEAR
    ).select_related('role').order_by('year')
    macro = {m.year: m for m in MacroIndicator.objects.all()}

    rows = []
    for hd in history:
        m = macro.get(hd.year)
        if not m:
            continue
        rows.append({
            'year': hd.year,
            'role': hd.role.name,
            'role_share_within_ict_pct': hd.role_share_within_ict_pct,
            'role_demand_index': hd.role_demand_index,
            'role_employment_proxy': hd.role_employment_proxy,
            'ict_employment_share_pct': m.ict_employment_share_pct,
            'emergence_year': hd.role.emergence_year,
        })

    df = pd.DataFrame(rows)
    if df.empty:
        raise ValueError(
            "No historical data available for forecasting. "
            "Run 'python manage.py seed_taxonomy' and 'seed_historical_data' first."
        )

    df = df.sort_values(['role', 'year']).reset_index(drop=True)
    df['role_encoded'] = role_encoder.transform(df['role'])
    df['years_since_emergence'] = (df['year'] - df['emergence_year']).clip(lower=0)
    span = max(df['year'].max() - df['year'].min(), 1)
    df['trend_position'] = (df['year'] - df['year'].min()) / span
    df['share_lag1'] = df.groupby('role')['role_share_within_ict_pct'].shift(1)
    df['share_change_1y'] = df.groupby('role')['role_share_within_ict_pct'].diff(1)
    df['share_change_2y'] = df.groupby('role')['role_share_within_ict_pct'].diff(2)
    df['share_accel'] = df.groupby('role')['share_change_1y'].diff(1)
    df['share_growth_rate'] = df['share_change_1y'] / df['role_share_within_ict_pct'].clip(lower=0.01)
    return df, macro


def run_forecast_pipeline():
    """
    Execute a full forecast run and store it.

    Returns: the created ForecastRun instance
    """
    model = get_model()
    correction_factors = get_correction_factors()
    role_encoder = get_role_encoder()
    features = get_feature_list()

    role_objs = {r.name: r for r in NormalizedRole.objects.filter(is_emerging=False)}
    df, macro = _build_feature_frame(role_encoder)

    latest_year = int(df['year'].max())
    latest = df[df['year'] == latest_year].copy().reset_index(drop=True)
    roles = sorted(latest['role'])
    current_shares = dict(zip(latest['role'], latest['role_share_within_ict_pct']))
    ict_emp = macro[latest_year].ict_employment
    total_emp = macro[latest_year].total_employment

    # ---- 1-year horizon: latest-year features predict next year's shares ----
    corrected_1y = _apply_correction(_predict_shares(model, latest, features), correction_factors)
    ict_emp_1y = ict_emp * GROWTH_1Y

    # ---- 2-year horizon: simulate the 1y state, predict again, damped correction ----
    sim = latest.copy()
    sim['year'] = latest_year + 1
    sim['trend_position'] = (latest_year + 1 - df['year'].min()) / max(df['year'].max() - df['year'].min(), 1)
    sim['role_share_within_ict_pct'] = sim['role'].map(corrected_1y)
    sim['share_lag1'] = sim['role'].map(current_shares)
    sim['share_change_1y'] = sim['role_share_within_ict_pct'] - sim['share_lag1']
    sim['years_since_emergence'] = (sim['year'] - sim['emergence_year']).clip(lower=0)
    sim['ict_employment_share_pct'] = ict_emp_1y / (total_emp * 1.03) * 100
    damped = {r: 1.0 + (cf - 1.0) * FORECAST_2Y_CF_DAMPING for r, cf in correction_factors.items()}
    corrected_2y = _apply_correction(_predict_shares(model, sim, features), damped)
    ict_emp_2y = ict_emp_1y * GROWTH_2Y_STEP

    # ---- 6-month horizon: halfway between the latest actual and the 1y forecast ----
    shares_6m = {r: 0.5 * current_shares.get(r, 0) + 0.5 * corrected_1y.get(r, 0) for r in roles}
    ict_emp_6m = ict_emp * GROWTH_6M

    horizons = [('6m', shares_6m, ict_emp_6m), ('1y', corrected_1y, ict_emp_1y), ('2y', corrected_2y, ict_emp_2y)]

    with transaction.atomic():
        forecast_run = ForecastRun.objects.create(
            model_version='two_stage_v1',
            accuracy_spearman=0.9898,
            accuracy_pearson=0.9946,
            accuracy_r2=0.9580,
            accuracy_mae=CV_MAE,
            notes='Auto-generated by Django forecast pipeline (live re-run)',
        )

        for label, shares, emp in horizons:
            max_share = max(shares.values())
            band = CV_MAE * BAND_MULTIPLIER[label] * 10
            for role_name in roles:
                role_obj = role_objs.get(role_name)
                if role_obj is None:
                    continue
                share = shares[role_name]
                demand_index = share / max_share * 100 if max_share > 0 else 0
                RoleForecast.objects.create(
                    forecast_run=forecast_run,
                    role=role_obj,
                    horizon=label,
                    demand_index=round(demand_index, 2),
                    share_pct=round(share, 2),
                    employment_proxy=int(emp * share / 100),
                    confidence_lower=round(max(0, demand_index - band), 2),
                    confidence_upper=round(min(100, demand_index + band), 2),
                    trend_direction=_trend_direction(share, current_shares.get(role_name, 0)),
                )

    return forecast_run
