import pandas as pd
import numpy as np
import joblib
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from scipy.stats import spearmanr, pearsonr

# ── Load model artifacts from Colleague 1 ──────────────────────────
best_model     = joblib.load('models/artifacts/best_model.joblib')
role_encoder   = joblib.load('models/artifacts/role_encoder.joblib')
FEATURES       = joblib.load('models/artifacts/feature_list.joblib')
prophet_results = joblib.load('models/artifacts/prophet_results.joblib')

# ── Load datasets ───────────────────────────────────────────────────
df        = pd.read_csv('models/artifacts/engineered_dataset.csv')
dataset_b = pd.read_csv('skillsense_job_data/data/current_ict/ict_job_postings_v2.csv')

print(f"Model loaded. Engineered dataset: {df.shape[0]} rows.")
print(f"Dataset B: {dataset_b.shape[0]} postings.") 

# ── STEP 2: Validate against real 2026 postings (Phase 2B) ─────────

# Get 2025 rows and predict what 2026 demand looks like
df_2025 = df[df['year'] == 2025].copy()

for col in FEATURES:
    if col in df_2025.columns:
        df_2025[col] = df_2025[col].fillna(0)

predicted_2026 = best_model.predict(df_2025[FEATURES])
df_2025['predicted_demand_index_2026'] = predicted_2026

total_predicted = df_2025['predicted_demand_index_2026'].sum()
df_2025['predicted_share_2026'] = (
    df_2025['predicted_demand_index_2026'] / total_predicted * 100
)

model_predictions = df_2025[['role', 'predicted_demand_index_2026', 'predicted_share_2026']].copy()
model_predictions = model_predictions.sort_values('predicted_demand_index_2026', ascending=False)
print("\nModel predicted 2026 role distribution:")
print(model_predictions.to_string(index=False))

# Get actual distribution from Dataset B
actual_distribution = dataset_b['normalized_role'].value_counts().reset_index()
actual_distribution.columns = ['role', 'posting_count']
actual_distribution['actual_share_pct'] = (
    actual_distribution['posting_count'] / actual_distribution['posting_count'].sum() * 100
)
actual_distribution['actual_rank'] = range(1, len(actual_distribution) + 1)

print("\nActual 2026 role distribution (92 real postings):")
print(actual_distribution.to_string(index=False))

# Merge and calculate correlation
comparison = model_predictions.merge(actual_distribution, on='role', how='outer')
comparison['posting_count'] = comparison['posting_count'].fillna(0)
comparison['actual_share_pct'] = comparison['actual_share_pct'].fillna(0)
comparison['predicted_rank'] = comparison['predicted_demand_index_2026'].rank(ascending=False)
comparison['actual_rank'] = comparison['posting_count'].rank(ascending=False, method='min')

spearman_corr, spearman_p = spearmanr(
    comparison['predicted_rank'].fillna(20),
    comparison['actual_rank'].fillna(20)
)
pearson_corr, pearson_p = pearsonr(
    comparison['predicted_share_2026'].fillna(0),
    comparison['actual_share_pct'].fillna(0)
)

print(f"\n=== VALIDATION RESULTS ===")
print(f"Spearman rank correlation: {spearman_corr:.4f} (p={spearman_p:.4f})")
print(f"Pearson share correlation:  {pearson_corr:.4f} (p={pearson_p:.4f})")

# Save validation comparison
comparison.to_csv('models/reports/validation_comparison.csv', index=False)
print("\nSaved: models/reports/validation_comparison.csv")


# ── STEP 3: Retrain on full dataset ────────────────────────────────
from lightgbm import LGBMRegressor

df_model = pd.read_csv('models/artifacts/model_ready_dataset.csv')

X_full = df_model[FEATURES].fillna(0)
y_full = df_model['target_role_demand_index_1y'].fillna(0)

final_model = LGBMRegressor(
    n_estimators=300,
    max_depth=6,
    learning_rate=0.05,
    subsample=0.8,
    colsample_bytree=0.8,
    reg_alpha=0.1,
    reg_lambda=1.0,
    random_state=42,
    n_jobs=-1,
    verbose=-1,
)

final_model.fit(X_full, y_full)
print(f"\nFinal model trained on {X_full.shape[0]} rows (full dataset).")

# ── STEP 4: Produce forecasts ───────────────────────────────────────
df_2026 = df[df['year'] == 2026].copy()
roles = df_2026['role'].unique()
print(f"\nProducing forecasts for {len(roles)} roles...")

# -- 1-year forecast (2027) --
forecast_1y = df_2026.copy()
for col in FEATURES:
    if col in forecast_1y.columns:
        forecast_1y[col] = forecast_1y[col].fillna(0)

forecast_1y['forecasted_demand_index'] = final_model.predict(forecast_1y[FEATURES])
forecast_1y['forecasted_demand_index'] = forecast_1y['forecasted_demand_index'].clip(0, 100)
total_1y = forecast_1y['forecasted_demand_index'].sum()
forecast_1y['forecasted_share_pct'] = forecast_1y['forecasted_demand_index'] / total_1y * 100
ict_employment_2027 = forecast_1y['ict_employment'].iloc[0] * 1.15
forecast_1y['forecasted_employment_proxy'] = (
    forecast_1y['forecasted_share_pct'] / 100 * ict_employment_2027
).astype(int)
forecast_1y['horizon'] = '1y'
forecast_1y['forecast_year'] = 2027
print("1-year forecast (2027) done.")

# -- 2-year forecast (2028) --
forecast_2y = forecast_1y.copy()
forecast_2y['year'] = 2027
forecast_2y['trend_position'] = (2027 - 2005) / (2026 - 2005)
forecast_2y['years_since_emergence'] = (2027 - forecast_2y['emergence_year']).clip(lower=0)
forecast_2y['role_demand_index_lag1'] = df_2026['role_demand_index'].values
forecast_2y['role_demand_index_lag2'] = forecast_2y['role_demand_index_lag1']
forecast_2y['role_share_within_ict_pct'] = forecast_1y['forecasted_share_pct'].values
forecast_2y['role_employment_proxy'] = forecast_1y['forecasted_employment_proxy'].values
forecast_2y['ict_employment'] = ict_employment_2027
forecast_2y['total_employment'] = forecast_2y['total_employment'].iloc[0] * 1.03
forecast_2y['ict_employment_share_pct'] = (
    forecast_2y['ict_employment'] / forecast_2y['total_employment'] * 100
)
for col in FEATURES:
    if col in forecast_2y.columns:
        forecast_2y[col] = forecast_2y[col].fillna(0)
forecast_2y['forecasted_demand_index'] = final_model.predict(forecast_2y[FEATURES]).clip(0, 100)
total_2y = forecast_2y['forecasted_demand_index'].sum()
forecast_2y['forecasted_share_pct'] = forecast_2y['forecasted_demand_index'] / total_2y * 100
ict_employment_2028 = ict_employment_2027 * 1.12
forecast_2y['forecasted_employment_proxy'] = (
    forecast_2y['forecasted_share_pct'] / 100 * ict_employment_2028
).astype(int)
forecast_2y['horizon'] = '2y'
forecast_2y['forecast_year'] = 2028
print("2-year forecast (2028) done.")

# -- 6-month forecast (mid-2027) --
forecast_6m = forecast_1y.copy()
forecast_6m['forecasted_demand_index'] = (
    df_2026['role_demand_index'].values * 0.5
    + forecast_1y['forecasted_demand_index'].values * 0.5
).clip(0, 100)
total_6m = forecast_6m['forecasted_demand_index'].sum()
forecast_6m['forecasted_share_pct'] = forecast_6m['forecasted_demand_index'] / total_6m * 100
ict_employment_mid2027 = forecast_1y['ict_employment'].iloc[0] * 1.075
forecast_6m['forecasted_employment_proxy'] = (
    forecast_6m['forecasted_share_pct'] / 100 * ict_employment_mid2027
).astype(int)
forecast_6m['horizon'] = '6m'
forecast_6m['forecast_year'] = 2027
print("6-month forecast (mid-2027) done.")

# ── STEP 5: Confidence intervals + trend direction ──────────────────
RMSE = 5.68  # from training report (mean RMSE from cross-validation)

for forecast_df in [forecast_6m, forecast_1y, forecast_2y]:
    multiplier = {'6m': 1.0, '1y': 1.5, '2y': 2.0}[forecast_df['horizon'].iloc[0]]
    forecast_df['confidence_lower'] = (
        forecast_df['forecasted_demand_index'] - RMSE * multiplier
    ).clip(0, 100)
    forecast_df['confidence_upper'] = (
        forecast_df['forecasted_demand_index'] + RMSE * multiplier
    ).clip(0, 100)

current_2026 = df_2026.set_index('role')['role_demand_index']

def get_trend(row):
    current_val = current_2026.get(row['role'], 0)
    change_pct = ((row['forecasted_demand_index'] - current_val) / max(current_val, 1)) * 100
    if change_pct > 5:
        return 'growing'
    elif change_pct < -5:
        return 'declining'
    else:
        return 'stable'

forecast_6m['trend_direction'] = forecast_6m.apply(get_trend, axis=1)
forecast_1y['trend_direction'] = forecast_1y.apply(get_trend, axis=1)
forecast_2y['trend_direction'] = forecast_2y.apply(get_trend, axis=1)

print("\nTrend directions assigned.")
print(forecast_1y[['role', 'forecasted_demand_index', 'trend_direction']].to_string(index=False))

# ── STEP 6: Build final output + save all artifacts ─────────────────
OUTPUT_COLUMNS = [
    'role', 'horizon', 'forecast_year',
    'forecasted_demand_index', 'forecasted_share_pct', 'forecasted_employment_proxy',
    'confidence_lower', 'confidence_upper', 'trend_direction',
]

results = pd.concat([
    forecast_6m[OUTPUT_COLUMNS],
    forecast_1y[OUTPUT_COLUMNS],
    forecast_2y[OUTPUT_COLUMNS],
], ignore_index=True)

results = results.sort_values(['horizon', 'forecasted_demand_index'], ascending=[True, False])

for col in ['forecasted_demand_index', 'forecasted_share_pct', 'confidence_lower', 'confidence_upper']:
    results[col] = results[col].round(2)

print(f"\nFinal forecast: {results.shape[0]} rows (20 roles x 3 horizons)")
print(results[['role', 'horizon', 'forecasted_demand_index', 'forecasted_share_pct', 'trend_direction']].to_string(index=False))

# Save CSV
results.to_csv('models/forecast_results_2027_2028.csv', index=False)
print("\nSaved: models/forecast_results_2027_2028.csv")

# Save model artifacts
joblib.dump(final_model, 'models/skillsense_forecast_model.joblib')
joblib.dump(role_encoder, 'models/role_encoder.joblib')
joblib.dump(FEATURES, 'models/feature_list.joblib')
print("Saved: models/skillsense_forecast_model.joblib")
print("Saved: models/role_encoder.joblib")
print("Saved: models/feature_list.joblib") 




# ── STEP 7: Write performance report ───────────────────────────────
from datetime import date

growing_roles = forecast_1y[forecast_1y['trend_direction'] == 'growing']['role'].tolist()
declining_roles = forecast_1y[forecast_1y['trend_direction'] == 'declining']['role'].tolist()
top5_1y = forecast_1y.nlargest(5, 'forecasted_demand_index')[['role', 'forecasted_demand_index', 'forecasted_share_pct', 'trend_direction']]
top5_2y = forecast_2y.nlargest(5, 'forecasted_demand_index')[['role', 'forecasted_demand_index', 'forecasted_share_pct', 'trend_direction']]

report = f"""# SkillSense Model Performance Report

Generated: {date.today()}
Model type: LightGBM
Training data: 418 rows (20 roles x 2005-2026)

---

## 1. Training Performance (from Colleague 1)

| Metric | Value |
|--------|-------|
| Mean MAE (cross-validation) | 3.41 |
| Mean RMSE (cross-validation) | 5.68 |
| Mean R-squared | 0.9182 |

---

## 2. Market Validation (2026 predictions vs real postings)

| Metric | Value | Interpretation |
|--------|-------|----------------|
| Spearman rank correlation | {spearman_corr:.4f} | Poor (< 0.5) |
| Pearson share correlation | {pearson_corr:.4f} | Poor (< 0.5) |

### Key finding
The model underestimated DevOps/Cloud Engineer (predicted rank #19, actual rank #3).
This is a known limitation: DevOps grew rapidly in 2024-2026 — a trend the historical
data (2005-2023) did not capture. Recommended fix: weight recent years (2022-2026) more
heavily in the next training iteration (to be addressed with Colleague 1).

---

## 3. Forecast Summary

### 1-Year Outlook (2027) — Top 5 roles
{top5_1y.to_string(index=False)}

### 2-Year Outlook (2028) — Top 5 roles
{top5_2y.to_string(index=False)}

### Growing roles: {', '.join(growing_roles)}

### Declining roles: {', '.join(declining_roles)}

---

## 4. Limitations

- Validation correlation is poor (0.35) — DevOps/Cloud emergence not in historical data
- 6-month forecast is interpolated (no sub-annual training data)
- 2-year forecast compounds prediction error (wider confidence intervals)
- Small dataset (418 rows) limits model complexity

## 5. Data Sources

- Dataset A: Historical ICT labour data (2005-2026, NISR LFS verified)
- Dataset B: 92 real ICT postings (Sep 2026, 4 job boards)
"""

with open('models/model_performance_report.md', 'w') as f:
    f.write(report)
print("Saved: models/model_performance_report.md")
print("\n=== ALL DELIVERABLES COMPLETE ===") 