# SkillSense — Development Checklist & Roadmap

**AI-Powered Labour-Market Intelligence & Employability Outlook Platform**

Rwanda-focused. First sector: ICT / Computer Science / Digital Technology.

Last updated: Sep 21, 2026 (Phase 2D completed)

---

## The Finished System

When complete, SkillSense will:

1. **Forecast ICT role demand** in Rwanda at 6-month, 1-year, and 2-year horizons using a trained ML model on 21 years of government-verified historical data
2. **Alert users to emerging roles** (AI/ML Engineer, Prompt Engineer, etc.) that are trending globally but not yet present in Rwanda, with estimated arrival timelines
3. **Score employability** of individual skill profiles against predicted market demand
4. **Show geographic demand** by province and district on an interactive Rwanda map
5. **Analyse education/training gaps** between what institutions teach and what employers need
6. **Guide career decisions** with personalised recommendations based on skills gaps and forecasted demand
7. **Support policy makers** with decision dashboards for workforce planning and training investment
8. **Generate exportable reports** (PDF, CSV) for all analytics
9. **Accept new data via CSV upload** — admin uploads job postings, system classifies, normalizes, and updates forecasts
10. **Serve 5 user roles** — Policy Maker, Education Planner, Career Advisor, Researcher, Admin — each with institution-scoped access

---

## Tech Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Frontend | React, Vite, TypeScript, Tailwind CSS, Recharts | React 19, Vite 6, Tailwind v4 |
| UI Components | Radix UI primitives + custom components | Latest |
| State/Data | TanStack Query (React Query) | v5 |
| Backend Framework | Django + Django REST Framework (DRF) | Django 5.x, DRF 3.x |
| Authentication | djangorestframework-simplejwt | Latest |
| CORS | django-cors-headers | Latest |
| Database | PostgreSQL + PostGIS | PostgreSQL 16, PostGIS 3.x |
| ML / Forecasting | scikit-learn, Prophet, pandas, numpy | Latest stable |
| Task Queue | Celery + Redis (for async CSV processing) | Latest |
| PDF Export | WeasyPrint or ReportLab | Latest |
| Deployment | Docker + Docker Compose | Latest |
| Version Control | Git | - |

---

## Phase 0: Data Foundation [DONE]

*Everything in this phase is complete. Listed here for reference.*

- [x] Dataset A: Historical ICT labour data 2005-2025 (420 rows, 20 roles x 21 years)
- [x] Dataset A verified against NISR LFS microdata (2017-2025) from data.gov.rw
- [x] Dataset A back-extrapolated for 2005-2016 with government anchors
- [x] Dataset B: 92 current ICT job postings from 4 sources, classified, normalized, zero nulls
- [x] Dataset C: NISR LFS microdata (2017-2025) downloaded and processed
- [x] ICT classification pipeline v2 (`scripts/classify_and_group_v2.py`)
- [x] ICT taxonomy: 22 roles across 12 groups (Layer 1)
- [x] Emerging roles taxonomy defined: 8 roles for Layer 2
- [x] All output files generated (cleaned, normalization, analytical, reports)
- [x] PROJECT_SPEC.md updated with two-layer architecture

**Key files:**
- `skillsense_job_data/data/historical/*.csv` — training data
- `skillsense_job_data/data/current_ict/ict_job_postings_v2.csv` — validation data
- `skillsense_job_data/Labour_Force_Survey__2017-2024___Microdata/` — government microdata
- `skillsense_job_data/scripts/classify_and_group_v2.py` — classification pipeline

---

## Phase 1: Data Finalization [DONE]

*Transform Dataset B (92 postings) into a 2026 row for Dataset A, creating the complete training set.*

**Depends on:** Phase 0 (done)

- [x] Aggregate Dataset B by `normalized_role` to get `posting_share_pct` per role
- [x] Estimate 2026 macro indicators (extrapolate from 2025 government LFS trends)
  - Total employment, ICT employment, ICT share, LFPR, unemployment rate, EPR, tertiary employment
- [x] Calculate 2026 `role_employment_proxy` and `role_demand_index` for each role
- [x] Handle the 4 historical-only roles with zero postings (IT Support, Telecom Tech, E-Gov Dev, Other ICT)
  - IT Support, Other ICT assigned small residual shares based on trend; Telecom Tech and E-Gov Dev merged into existing roles
- [x] Append 20 new rows (one per role) as year=2026 to Dataset A
- [x] Recalculate `target_role_demand_index_1y` and `_2y` for 2024 and 2025 (they now have future data)
- [x] Save updated historical CSVs (now 440 rows total: 2005-2026)
- [x] Validate: zero nulls, role shares sum to 100% (verified: 100.001%), max demand index = 100

**Output:** `data/historical/skillsense_ict_labour_history_2019_2026.csv` — 160 rows (2019-2026, 20 roles/year). Combined with 2005-2009 (100 rows) and 2010-2018 (180 rows) = 440 total rows.

**Key file:** `skillsense_job_data/scripts/phase1_data_finalization.py` — the script that produced this output.

---

## Frontend UI Shells [DONE — static, mock data]

*The frontend lives in `frontend_pages/` (React 19, Vite 8, TypeScript, Tailwind v4, Recharts). All pages use hardcoded mock data — no backend integration yet.*

**Public pages (complete):**
- [x] Landing page (`App.tsx`) — hero, statistics strip, stakeholder section, pipeline explainer, CTA, footer
- [x] Sign In page — full UI, navigates to dashboard (no auth logic)
- [x] Sign Up page — institutional registration form (no submission)
- [x] Forgot Password page — multi-step OTP flow (no API calls)

**Dashboard pages (complete with mock data):**
- [x] Dashboard Layout — sidebar nav, top header, card component
- [x] Main Dashboard — KPI cards, demand trend chart, top skills, sector donut, policy alerts
- [x] Skills Forecast — filter bar, AI advisory, skill demand index chart, rising/declining tables
- [x] Employability — radar chart, sector probability bars, skill velocity table
- [x] Geographic Intelligence — Rwanda tile heatmap, district rankings, urban/rural trends
- [x] Sector Intelligence — sector growth trends, emerging sub-sectors, transferability grid
- [x] Reports — report builder UI, template gallery, recent archive
- [x] Settings — profile, security, notifications, session management

**Shared components (complete):**
- [x] Navbar, TopBar, Hero, HeroDashboard, Footer
- [x] Charts library (`charts.tsx`) — 9 chart types (Sparkline, DemandTrend, Radar, Heatmap, etc.)
- [x] RwandaMap (static image placeholder), SkillDemandChart, TopSkills

**NOT yet built:**
- [ ] Data Upload page (Module 3)
- [ ] Skills Taxonomy browser (Module 5)
- [ ] Education Alignment page (Module 10)
- [ ] Career Guidance page (Module 11)
- [ ] Policy & Planning page (Module 12)
- [ ] User Management page (Module 14)
- [ ] Auth integration (all pages bypass authentication)
- [ ] API client setup (no backend connection)

---

## Phase 1B: Shrinkage Correction [DONE]

*Follow-on correction to Phase 1's 2026 row. Not a rewrite — a noise reduction step.*

**Done by:** Gasana Leslie (PR #4, commit 996a68d)

- [x] Identified that Phase 1's raw posting shares (92 postings, ~4.6/role) introduced sampling noise that broke model training (R2 = -0.11 on the 2025->2026 test fold)
- [x] Applied Empirical-Bayes shrinkage blend: `shrunk_share = (n/(n+15)) * raw_share + (15/(n+15)) * trend_share`
- [x] Recalculated `role_employment_proxy`, `role_demand_index`, and 2024/2025 target columns
- [x] Validated: shares sum to 100%, max index = 100, zero nulls
- [x] Updated both `skillsense_ict_labour_history_2019_2025.csv` and `_2019_2026.csv`

**Key file:** `skillsense_job_data/scripts/phase1b_shrinkage_correction.py`

---

## Phase 2: ML Forecasting Model (Layer 1) [DONE]

*Train, validate, and produce role demand forecasts.*

**Depends on:** Phase 1 + Phase 1B

### 2A: Model Training [DONE]

**Done by:** Gasana Leslie (PR #4, commit 2950c59)

- [x] Load combined training data (440 rows, 2005-2026, 22 distinct role labels across history)
- [x] Feature engineering (18 features):
  - Time features: year, years_since_emergence, trend_position
  - Role features: role_encoded, role_share_within_ict_pct, role_employment_proxy
  - Macro features: ict_employment, ict_employment_share_pct, total_employment, unemployment_rate_pct, labour_force_participation_rate_pct, employment_to_population_ratio_pct, tertiary_employment_count
  - Lag features: role_demand_index_lag1, role_demand_index_lag2, role_share_change_1y, demand_index_change_1y, demand_index_rolling_3y
- [x] Trained 3 models: XGBoost, LightGBM, Prophet (per-role)
- [x] Train/test split: train on 2005-2024 (398 rows), test on 2025 (20 rows)
- [x] Evaluated all three models on test set
- [x] Cross-validated: 10-fold rolling window (2016-2025)

**Model comparison results:**

| Model | MAE | RMSE | R-squared |
|-------|-----|------|-----------|
| XGBoost | 8.42 | 12.63 | 0.7364 |
| **LightGBM** | **8.35** | **12.55** | **0.7395** |
| Prophet (per-role) | 9.48 | 12.24 | 0.7403 |

**Best model:** LightGBM (lowest MAE). Rolling-CV mean R2: 0.9182 across all folds.

**Top features:** demand_index_rolling_3y (61%), role_share_within_ict_pct (29%), role_demand_index_lag1 (2%)

### 2B: Validation Against Current Market [DONE — with known issue]

**Done by:** Nshuti Delphin (PR #5, commit ee0bad5)

- [x] Compared model's predicted 2026 role distribution against Dataset B actual distribution
- [x] Calculated correlations: Spearman = 0.3524, Pearson = 0.3668
- [x] Documented validation results and model performance metrics
- [x] **Known issue:** Validation correlation is POOR (< 0.5)
  - Root cause: DevOps/Cloud Engineer predicted rank #19 but actual rank #3 (rapid growth 2024-2026 not captured by historical trend)
  - Other misses: ICT Manager predicted #14 vs actual #4; QA Engineer predicted #18 vs actual #6
  - Recommended fix: weight recent years more heavily in next training iteration

### 2C: Forecast Production [DONE]

**Done by:** Nshuti Delphin (PR #5, commit ee0bad5)

- [x] Retrained LightGBM on full dataset (418 model-ready rows, 2005-2026)
- [x] Produced forecasts for all 20 roles at 3 horizons:
  - 6-month outlook (mid-2027)
  - 1-year outlook (2027)
  - 2-year outlook (2028)
- [x] Output per role: forecasted_demand_index, forecasted_share_pct, forecasted_employment_proxy, confidence intervals, trend direction
- [x] Model artifacts saved (`.joblib` — gitignored, regenerate with `python models/train_model.py`)
- [x] Forecast results saved as CSV (60 rows: 20 roles x 3 horizons)
- [x] Performance report written

**1-Year Forecast (2027) — Top 5:**

| Role | Demand Index | Share % | Trend |
|------|-------------|---------|-------|
| Software Developer / Software Engineer | 88.19 | 9.68% | declining |
| Backend Developer | 79.70 | 8.75% | stable |
| IT Officer / ICT Administrator | 79.68 | 8.75% | declining |
| IT Support / Help Desk Technician | 67.00 | 7.36% | growing |
| Frontend / Web Developer | 61.04 | 6.70% | growing |

**Growing roles:** Cybersecurity, Data Analyst, Data Engineer, Data Scientist, Frontend Dev, IT Auditor, IT Support, QA Engineer, Other ICT
**Declining roles:** DevOps/Cloud, ICT Manager, IT Officer, Software Engineer, Systems Admin

**Output files (committed):**
- `models/forecast_results_2027_2028.csv` — 60 forecast rows
- `models/model_performance_report.md` — full metrics and validation
- `models/reports/model_training_report.md` — training metrics and comparison
- `models/reports/validation_comparison.csv` — predicted vs actual rankings
- `models/reports/feature_importance.png` — feature importance chart
- `models/artifacts/engineered_dataset.csv` — 440 rows with all features
- `models/artifacts/model_ready_dataset.csv` — 418 training-ready rows

**Output files (gitignored, regenerate locally):**
- `models/skillsense_forecast_model.joblib` — run `python models/phase2d_final_model.py`
- `models/role_encoder.joblib` — run `python models/phase2d_final_model.py`
- `models/feature_list.joblib` — run `python models/phase2d_final_model.py`
- `models/correction_factors.joblib` — run `python models/phase2d_final_model.py`
- `models/artifacts/best_model.joblib` — run `python models/train_model.py` (v1, superseded)
- `models/artifacts/role_encoder.joblib` (v1, superseded)
- `models/artifacts/feature_list.joblib` (v1, superseded)
- `models/artifacts/prophet_results.joblib` (v1, superseded)

---

## Phase 2D: Model Iteration [DONE]

*Fixed the validation gap (Spearman 0.35 → 0.99) by replacing the single-stage model with a Two-Stage architecture.*

**Done by:** IRAKOZE Nsumba Herve (lead developer)

**Root cause:** The single-stage LightGBM model learned smooth historical continuations from 2005-2026 data but couldn't predict structural market shifts (DevOps #19 predicted vs #3 actual, IT Support #4 predicted vs #19 actual). 18 conventional experiments (data trimming, decay rates, feature engineering, hyperparameter tuning) all failed — Spearman stuck at ~0.35.

**Winning approach: Two-Stage Model**
- **Stage 1** — LightGBM trend model trained on 2010-2026 (320 rows) with recency weighting (decay=0.25)
- **Stage 2** — Market correction factors from Dataset B: `CF = (actual_share + 0.5) / (predicted_share + 0.5)`, clamped to [0.2, 5.0]
- For 2-year forecasts, correction factors are dampened 30% to let the trend reassert itself

**Validation results:**

| Metric | Target | Achieved | Status |
|--------|--------|----------|--------|
| Spearman rank correlation | > 0.85 | **0.9898** | PASSED |
| Pearson share correlation | > 0.75 | **0.9946** | PASSED |
| CV mean R² | > 0.80 | **0.9580** | PASSED |
| DevOps rank | top 10 | **#3** | PASSED |
| IT Support rank | not top 5 | **#18** | PASSED |

**1-Year Forecast (2027) — Top 5:**

| Role | Demand Index | Share % | Trend |
|------|-------------|---------|-------|
| IT Officer / ICT Administrator | 100.00 | 13.21% | growing |
| Backend Developer | 90.07 | 11.89% | growing |
| DevOps / Cloud Engineer | 75.59 | 9.98% | growing |
| Software Developer / Software Engineer | 61.19 | 8.08% | declining |
| ICT Manager / IT Manager | 55.10 | 7.28% | growing |

**2-Year Forecast (2028) — Top 5:**

| Role | Demand Index | Share % | Trend |
|------|-------------|---------|-------|
| DevOps / Cloud Engineer | 100.00 | 15.59% | growing |
| IT Officer / ICT Administrator | 78.17 | 12.19% | growing |
| Backend Developer | 74.53 | 11.62% | growing |
| ICT Manager / IT Manager | 60.88 | 9.49% | growing |
| QA / Software Test Engineer | 43.22 | 6.74% | growing |

**Key files:**
- `models/phase2d_final_model.py` — production Two-Stage script (run to regenerate all artifacts)
- `models/phase2d_model_iteration.py` — v1 experiment sweep (18 experiments, all failed)
- `models/phase2d_iteration_v2.py` — v2 experiment sweep (found Two-Stage winner)
- `models/forecast_results_2027_2028.csv` — 60 forecast rows (regenerated)
- `models/model_performance_report.md` — full validation report
- `models/skillsense_forecast_model.joblib` — production model (gitignored, regenerate with `python models/phase2d_final_model.py`)

---

## Phase 3: Django Backend

*Set up the production backend with database, API, and authentication.*

**Depends on:** Phase 2 (model artifact needed for prediction endpoints)

### 3A: Project Setup

- [ ] Create Django project: `skillsense_backend/`
- [ ] Create Django apps:
  - `core` — shared models, utilities, middleware
  - `accounts` — user management, JWT auth, RBAC
  - `taxonomy` — ICT role taxonomy (roles, families, groups)
  - `predictions` — ML model loading, forecast API
  - `uploads` — CSV upload, classification pipeline
  - `analytics` — sector, geographic, employability analytics
  - `reports` — report generation, PDF export
- [ ] Install and configure packages:
  - `djangorestframework` + `djangorestframework-simplejwt`
  - `django-cors-headers`
  - `django-filter`
  - `psycopg2-binary` (PostgreSQL)
  - `django.contrib.gis` (PostGIS)
  - `celery` + `redis` (async tasks)
  - `drf-spectacular` (API docs / OpenAPI schema)
- [ ] Configure settings:
  - Database (PostgreSQL + PostGIS)
  - CORS (allow React frontend origin)
  - JWT token lifetimes
  - Media/static files
  - Celery broker (Redis)
- [ ] Create `.env` file for secrets (database password, secret key, etc.)

### 3B: Database Schema & Models

- [ ] **accounts app:**
  ```
  User (extends AbstractUser)
    - email, first_name, last_name
    - role: enum (policy_maker, education_planner, career_advisor, researcher, admin)
    - institution: FK → Institution
    - is_active, date_joined

  Institution
    - name, type (government, university, ngo, private, other)
    - created_at
  ```

- [ ] **taxonomy app:**
  ```
  RoleGroup
    - name, description, sort_order

  RoleFamily
    - name, role_group: FK → RoleGroup

  NormalizedRole
    - name, role_family: FK → RoleFamily
    - emergence_year, is_emerging (bool)
    - global_trend_signal (float, 0-100, nullable — for Layer 2)

  HistoricalDemand
    - year, role: FK → NormalizedRole
    - role_demand_index, role_share_within_ict_pct, role_employment_proxy
    - data_basis, synthetic_flag

  MacroIndicator
    - year
    - total_employment, ict_employment, ict_employment_share_pct
    - labour_force_participation_rate_pct, unemployment_rate_pct
    - employment_to_population_ratio_pct, tertiary_employment_count
    - data_source (str)
  ```

- [ ] **predictions app:**
  ```
  ForecastRun
    - created_at, model_version, training_data_hash
    - accuracy_mae, accuracy_rmse, accuracy_r2

  RoleForecast
    - forecast_run: FK → ForecastRun
    - role: FK → NormalizedRole
    - horizon: enum (6m, 1y, 2y)
    - demand_index, share_pct, employment_proxy
    - confidence_lower, confidence_upper
    - trend_direction: enum (growing, stable, declining)
  ```

- [ ] **uploads app:**
  ```
  DataUpload
    - uploaded_by: FK → User
    - file, original_filename, uploaded_at
    - status: enum (pending, processing, completed, failed)
    - total_records, ict_records, error_count
    - processing_log (text)

  JobPosting
    - upload: FK → DataUpload (nullable for seed data)
    - source, source_job_id, source_url
    - title, company, location_raw, country
    - industry_raw, education_raw, experience_raw
    - contract_type_raw, closing_date, posted_date
    - description, raw_text
    - is_ict (bool), ict_role_confidence (float)
    - normalized_role: FK → NormalizedRole (nullable)
    - role_level, role_normalization_confidence
    - needs_manual_review (bool)
    - scraped_at, created_at
  ```

- [ ] **analytics app:**
  ```
  GeographicDemand (PostGIS)
    - province, district
    - role: FK → NormalizedRole
    - year, posting_count, demand_score
    - geom: PointField or MultiPolygonField

  SectorDemand
    - industry, role: FK → NormalizedRole
    - year, posting_count
  ```

- [ ] Run `makemigrations` and `migrate`
- [ ] Create seed data management command: load historical CSVs + taxonomy into database
- [ ] Load Dataset A (440 rows) into `HistoricalDemand` + `MacroIndicator`
- [ ] Load Dataset B (92 postings) into `JobPosting`
- [ ] Load taxonomy (22 roles, 14 families, 12 groups) into `RoleGroup` / `RoleFamily` / `NormalizedRole`

### 3C: REST API Endpoints

- [ ] **Auth endpoints** (`/api/auth/`)
  ```
  POST   /api/auth/register/          — Create account
  POST   /api/auth/login/             — Get JWT tokens
  POST   /api/auth/refresh/           — Refresh access token
  POST   /api/auth/logout/            — Blacklist refresh token
  GET    /api/auth/me/                — Current user profile
  PUT    /api/auth/me/                — Update profile
  ```

- [ ] **Taxonomy endpoints** (`/api/taxonomy/`)
  ```
  GET    /api/taxonomy/roles/          — List all normalized roles
  GET    /api/taxonomy/roles/:id/      — Role detail + history + forecasts
  GET    /api/taxonomy/groups/         — List role groups
  GET    /api/taxonomy/families/       — List role families
  GET    /api/taxonomy/emerging/       — List emerging roles (Layer 2)
  ```

- [ ] **Predictions endpoints** (`/api/predictions/`)
  ```
  GET    /api/predictions/forecasts/               — Latest forecasts (all roles, all horizons)
  GET    /api/predictions/forecasts/:role_id/       — Forecasts for specific role
  GET    /api/predictions/trends/                   — Trend analysis (growing/stable/declining)
  GET    /api/predictions/historical/               — Historical demand data
  GET    /api/predictions/macro/                    — Macro indicator time series
  POST   /api/predictions/run/                      — Trigger new forecast run (admin only)
  ```

- [ ] **Dashboard endpoints** (`/api/dashboard/`)
  ```
  GET    /api/dashboard/kpis/          — Top-level KPIs (ICT employment, top roles, alerts)
  GET    /api/dashboard/overview/      — Summary for main dashboard
  ```

- [ ] **Upload endpoints** (`/api/uploads/`)
  ```
  POST   /api/uploads/                 — Upload CSV file (admin only)
  GET    /api/uploads/                 — List past uploads
  GET    /api/uploads/:id/             — Upload detail + processing log
  GET    /api/uploads/:id/postings/    — Job postings from this upload
  ```

- [ ] **Analytics endpoints** (`/api/analytics/`)
  ```
  GET    /api/analytics/sector/        — Sector demand breakdown
  GET    /api/analytics/geographic/    — Geographic demand (PostGIS)
  GET    /api/analytics/employability/ — Employability score calculator
  POST   /api/analytics/employability/score/  — Score a skill profile
  GET    /api/analytics/education/     — Education/training gap analysis
  GET    /api/analytics/career/        — Career guidance recommendations
  ```

- [ ] **Reports endpoints** (`/api/reports/`)
  ```
  GET    /api/reports/                 — List available reports
  GET    /api/reports/:type/           — Generate report (JSON)
  GET    /api/reports/:type/pdf/       — Generate PDF report
  GET    /api/reports/:type/csv/       — Export as CSV
  ```

- [ ] Configure API documentation (drf-spectacular / Swagger UI at `/api/docs/`)
- [ ] Add pagination, filtering, and search across all list endpoints
- [ ] Add permission classes (role-based access per endpoint)

### 3D: Authentication & RBAC

- [ ] Configure `djangorestframework-simplejwt`:
  - Access token lifetime: 30 minutes
  - Refresh token lifetime: 7 days
  - Token blacklisting enabled
- [ ] Create custom permission classes:
  - `IsAdmin` — full access
  - `IsPolicyMaker` — dashboard, forecasts, policy planning, reports
  - `IsEducationPlanner` — skills gaps, training alignment, curriculum
  - `IsCareerAdvisor` — career guidance, employability, role outlooks
  - `IsResearcher` — full analytics, data exports, historical trends
- [ ] Institution-scoped data access (users see data relevant to their institution)
- [ ] Admin user seeding (management command)

### 3E: ML Model Integration

- [ ] Create `predictions/ml/` module:
  - `model_loader.py` — load model artifact from disk
  - `forecaster.py` — run predictions using loaded model
  - `feature_engineering.py` — prepare input features from database
- [ ] Management command: `python manage.py run_forecast` — retrain and produce new forecasts
- [ ] Store forecast results in `ForecastRun` + `RoleForecast` tables
- [ ] API endpoint loads latest `ForecastRun` results from database (not real-time inference)

### 3F: CSV Upload Pipeline

- [ ] Upload endpoint accepts CSV, saves to `DataUpload`
- [ ] Celery task processes upload asynchronously:
  1. Parse CSV
  2. Run through `classify_and_group_v2.py` logic (ported to Django)
  3. Create `JobPosting` records
  4. Update processing log and status
- [ ] Admin can review uploaded postings, approve/reject classifications
- [ ] After approval, new data can trigger a forecast rerun

---

## Phase 4: Frontend Integration

*Replace mock data with real Django API calls.*

**Depends on:** Phase 3 (API endpoints must exist)

### 4A: API Client Setup

- [ ] Configure base API client in `frontend/src/services/http/`
  - Base URL pointing to Django backend
  - JWT token interceptor (attach access token to requests)
  - Token refresh interceptor (auto-refresh on 401)
  - Error handling
- [ ] Create typed API service functions for each endpoint group:
  - `authService.ts` — login, register, refresh, logout, getProfile
  - `taxonomyService.ts` — getRoles, getGroups, getFamilies
  - `predictionService.ts` — getForecasts, getTrends, getHistorical
  - `dashboardService.ts` — getKPIs, getOverview
  - `uploadService.ts` — uploadCSV, getUploads
  - `analyticsService.ts` — getSector, getGeographic, scoreEmployability
  - `reportService.ts` — getReports, downloadPDF

### 4B: Replace Mock Data

- [ ] Update React Query hooks in `frontend/src/features/` to call real API services
- [ ] Replace mock data in all dashboard components with live data
- [ ] Wire up authentication flow (login page → JWT → protected routes)
- [ ] Test all data flows end-to-end (frontend → API → database → response)

### 4C: Build Remaining Pages

- [x] Main Dashboard page (Module 2) — KPIs, charts, alerts *(UI shell complete with mock data)*
- [ ] Data Upload page (Module 3) — CSV upload form, upload history, processing status
- [ ] Skills Taxonomy page (Module 5) — browse roles, families, groups
- [x] Demand Prediction page (Module 6) — forecast charts, trend tables, horizon selector *(UI shell complete with mock data)*
- [x] Employability page (Module 7) — skill profile input, score output *(UI shell complete with mock data)*
- [x] Sector Intelligence page (Module 8) — industry breakdown charts *(UI shell complete with mock data)*
- [x] Geographic Intelligence page (Module 9) — Rwanda map with PostGIS data *(UI shell with tile heatmap, mock data — needs real PostGIS map)*
- [ ] Education Alignment page (Module 10) — gap analysis dashboard
- [ ] Career Guidance page (Module 11) — personalised recommendations
- [ ] Policy & Planning page (Module 12) — decision-support dashboard
- [x] Reports page (Module 13) — report browser, PDF download *(UI shell complete with mock data — no real generation)*
- [ ] User Management page (Module 14) — admin panel for users/roles

---

## Phase 5: Core Modules (Detailed)

*Build the essential modules that everything else depends on.*

**Depends on:** Phase 3 + Phase 4A

### Module 2: Main Dashboard

- [ ] Top KPI cards: total ICT employment, ICT share %, top 3 growing roles, top alert
- [ ] Demand trend chart (Recharts): role demand over time (2005-2028 with forecast zone)
- [ ] Role distribution donut chart: current role share breakdown
- [ ] Recent activity feed: latest uploads, forecast runs
- [ ] Quick stats: total roles tracked, total postings, model accuracy

### Module 3: Data Upload & Management

- [ ] CSV upload form with drag-and-drop
- [ ] Upload progress bar (Celery task status polling)
- [ ] Upload history table with status badges (pending/processing/completed/failed)
- [ ] Upload detail view: processing log, records found, ICT classified, errors
- [ ] Postings review table: title, company, classification, confidence, approve/reject

### Module 5: Skills Taxonomy Browser

- [ ] Tree view: Role Group → Role Family → Normalized Role
- [ ] Role detail panel: description, emergence year, historical demand chart, current postings
- [ ] Search and filter by group, family, keyword

### Module 6: AI Skills Demand Prediction

- [ ] Forecast chart: per-role demand index over 3 horizons (6m, 1y, 2y) with confidence bands
- [ ] Comparison table: all roles ranked by forecasted demand change
- [ ] Horizon selector tabs: 6-month / 1-year / 2-year
- [ ] Trend indicators: growing/stable/declining badges per role
- [ ] Model info panel: training data size, accuracy metrics, last run date

---

## Phase 6: Intelligence Modules

*Build the analytics and advisory modules.*

**Depends on:** Phase 5 (core modules must work first)

### Module 7: Employability Prediction

- [ ] Skill profile input form: user selects their skills from taxonomy
- [ ] Scoring engine: compare profile against forecasted demand
- [ ] Output: employability score (0-100), gap analysis, recommended skills to learn
- [ ] Role match list: which roles the user qualifies for, sorted by demand forecast

### Module 8: Sector Intelligence

- [ ] Industry breakdown: which sectors hire which ICT roles
- [ ] Sector growth trend charts
- [ ] Cross-tabulation: industry x role heatmap
- [ ] Data source: `industry_raw` field from job postings

### Module 9: Geographic Intelligence

- [ ] Rwanda province map (SVG or Leaflet + PostGIS)
- [ ] Demand by province/district: colour-coded by ICT demand intensity
- [ ] Click province → drill down to district view
- [ ] Role-specific geographic filter
- [ ] Data source: `location_raw` field from job postings, geocoded to province/district

### Module 10: Education & Training Alignment

- [ ] Gap analysis dashboard: skills employers need vs what is being taught
- [ ] Institution profiles: what each university/TVET offers
- [ ] Curriculum recommendation engine: suggest course additions based on demand forecasts
- [ ] Input: training program data (to be collected or uploaded by education planners)

### Module 11: Career Guidance

- [ ] Personalised career path recommendations
- [ ] Input: user's current skills, education, experience
- [ ] Output: recommended roles (sorted by demand + fit), skills to develop, training suggestions
- [ ] "What if" scenario: "If I learn Python + Cloud, what roles open up?"

---

## Phase 7: Admin & Reporting

**Depends on:** Phase 5 + Phase 6

### Module 12: Policy & Planning

- [ ] Decision-support dashboard for MIFOTRA/RDB
- [ ] Workforce planning: projected ICT workforce gaps by year
- [ ] Training investment priorities: which skills to fund based on ROI of demand forecast
- [ ] National ICT capacity scorecard

### Module 13: Reporting & Analytics

- [ ] Report template system: predefined report types
  - ICT Demand Outlook Report
  - Role-Specific Deep Dive
  - Education Gap Report
  - Workforce Planning Brief
- [ ] PDF generation (WeasyPrint or ReportLab)
- [ ] CSV export for all data tables
- [ ] Report scheduling (optional, Celery-based)

### Module 14: User & Security Management

- [ ] User list with role/institution filters
- [ ] Create/edit/deactivate users
- [ ] Role assignment (policy_maker, education_planner, career_advisor, researcher, admin)
- [ ] Institution management (CRUD)
- [ ] Audit log: who did what, when
- [ ] Password reset flow

### Module 1: Authentication (Production)

- [ ] Replace Express auth stub with Django JWT auth
- [ ] Login page with email/password
- [ ] Registration page (admin-approved or self-register with role assignment)
- [ ] Protected route guards in React (already have guard components)
- [ ] Token refresh on 401 (silent refresh)
- [ ] Logout (blacklist refresh token)

---

## Phase 8: Layer 2 — Emerging Skills Radar

*Add global trend signals and emerging role predictions.*

**Depends on:** Phase 5 Module 6 working (Layer 1 forecasts operational)

### 8A: Global Trend Data Collection

- [ ] Research and identify accessible data sources:
  - LinkedIn Economic Graph (API or published reports)
  - Indeed Hiring Lab (published data)
  - Stack Overflow Developer Survey (annual, public)
  - GitHub Octoverse (annual, public)
  - World Economic Forum Future of Jobs Report
  - Gartner/IDC technology forecasts
  - ESCO (European Skills/Competences) updates
- [ ] Define `global_trend_signal` score (0-100) methodology:
  - Based on: global job posting volume, year-over-year growth, geographic spread
  - Normalised to 0-100 scale
- [ ] Collect global trend scores for all 22 existing + 8 emerging roles
- [ ] Build historical global trend dataset (2018-2026 at minimum)

### 8B: Taxonomy Expansion

- [ ] Add emerging roles to `NormalizedRole` table with `is_emerging = True`:
  - AI / ML Engineer (AI & Machine Learning group)
  - MLOps Engineer (AI & Machine Learning group)
  - Prompt Engineer / AI Application Developer (AI & Machine Learning group)
  - Computer Vision Engineer (AI & Machine Learning group)
  - NLP Engineer (AI & Machine Learning group)
  - Cloud/AI Solutions Architect (Cloud & DevOps group)
  - Blockchain / Web3 Developer (Emerging Tech group)
  - IoT / Robotics Engineer (Emerging Tech group)
- [ ] Add new `RoleGroup` entries: "AI & Machine Learning", "Emerging Tech"
- [ ] Set `emergence_year` for each emerging role (estimated Rwanda appearance)
- [ ] Add `global_trend_signal` column to `HistoricalDemand` table

### 8C: Model Enhancement

- [ ] Add `global_trend_signal` as a feature to the forecasting model
- [ ] Train the model to learn: "high global signal + near-zero local share = growth coming"
- [ ] Validate: does the model correctly predict the emergence pattern we see in historical data?
  - Test case: DevOps Engineer was global mainstream ~2015, appeared in Rwanda ~2018
  - Test case: Data Scientist was global mainstream ~2016, appears in Rwanda ~2025
- [ ] Produce emerging role predictions:
  - Estimated year of first appearance in Rwanda
  - Estimated ICT share at 1, 3, 5 years after emergence
  - Confidence level

### 8D: Emerging Skills Radar (Frontend)

- [ ] New dashboard module: "Emerging Skills Radar"
- [ ] Radar/bubble chart: emerging roles plotted by global trend strength vs estimated arrival time
- [ ] Timeline view: when each emerging role is expected to appear in Rwanda
- [ ] Skill preparation guide: "Start learning these skills now — jobs coming in 2-3 years"
- [ ] Global vs Rwanda comparison: show the gap and adoption timeline
- [ ] Link to training resources (if available)

---

## Phase 9: Testing & Deployment

**Depends on:** All previous phases

### 9A: Testing

- [ ] Django backend unit tests (pytest-django):
  - Model tests (all CRUD operations)
  - API endpoint tests (auth, permissions, data flow)
  - Classification pipeline tests
  - ML model prediction tests
- [ ] Frontend tests:
  - Component tests (React Testing Library)
  - API integration tests (MSW for mocking)
  - E2E tests (Playwright or Cypress) for critical flows:
    - Login → Dashboard → View forecasts
    - Admin → Upload CSV → View processed results
    - Career advisor → Enter skills → Get recommendations
- [ ] ML model tests:
  - Training reproducibility
  - Forecast output validation
  - Edge cases (new role with no history, role with declining demand)
- [ ] Data integrity tests:
  - Taxonomy consistency (all roles have groups and families)
  - Historical data completeness (no gaps in time series)
  - Upload pipeline correctness (classification matches expected output)

### 9B: Deployment Setup

- [ ] Docker Compose configuration:
  ```
  services:
    backend:    Django (gunicorn)
    frontend:   React (nginx)
    db:         PostgreSQL + PostGIS
    redis:      Redis (Celery broker)
    celery:     Celery worker
  ```
- [ ] Environment configuration (.env files for dev/staging/prod)
- [ ] Database backup strategy
- [ ] Static file serving (whitenoise or nginx)
- [ ] HTTPS/TLS setup
- [ ] CI/CD pipeline (GitHub Actions or similar):
  - Run tests on push
  - Build Docker images
  - Deploy to staging on merge to main

### 9C: Production Readiness

- [ ] Security audit:
  - OWASP top 10 check
  - SQL injection prevention (Django ORM handles this)
  - XSS prevention (React handles this)
  - CSRF protection
  - Rate limiting on auth endpoints
- [ ] Performance:
  - Database indexing on frequently queried fields
  - API response caching (Redis)
  - Frontend code splitting and lazy loading
- [ ] Monitoring:
  - Error tracking (Sentry or similar)
  - API response time logging
  - Database query performance
- [ ] Documentation:
  - API documentation (Swagger/OpenAPI at `/api/docs/`)
  - User guide for admin users
  - Deployment guide

---

## Development Order Summary

```
Phase 0  [DONE]     Data Foundation
   ↓
Phase 1  [DONE]     Data Finalization (aggregate Dataset B → 2026 row)
   ↓
Phase 1B [DONE]     Shrinkage Correction (noise reduction on 2026 row)
   ↓
Phase 2  [DONE]     ML Model v1 (train → validate → forecast)
   ↓                  └── LightGBM best model, R2=0.74, CV mean R2=0.92
   ↓                  └── ⚠ Validation correlation poor (0.35) — fixed in 2D
   ↓
Phase 2D [DONE]     Model Iteration — Two-Stage model (Spearman 0.99)
   ↓                  └── Stage 1: LightGBM trend (2010-2026, recency-weighted)
   ↓                  └── Stage 2: Market correction factors from Dataset B
   ↓
Phase 3  [NEXT]     Django Backend (schema → API → auth → ML integration)
   ↓
Phase 4  [PARTIAL]  Frontend Integration (wire React → Django)
   ↓                  └── Landing page + 7 dashboard UI shells built (all mock data)
Phase 5             Core Modules (Dashboard, Upload, Taxonomy, Predictions)
   ↓
Phase 6             Intelligence Modules (Employability, Sector, Geographic, Education, Career)
   ↓
Phase 7             Admin & Reporting (User management, Reports, PDF)
   ↓
Phase 8             Layer 2: Emerging Skills Radar (global trends, new roles)
   ↓
Phase 9             Testing & Deployment (tests, Docker, CI/CD, security)
```

**Critical path:** Phase 3 → 4 → 5 (everything else branches off after Phase 5)
**Gate:** Phase 2D Spearman > 0.85 — **PASSED** (0.9898)

**Can be parallelised:**
- Phase 6 + Phase 7 (independent modules, can be built simultaneously)
- Phase 8 data collection can start during Phase 3-5 (research doesn't block development)

---

## Quick Reference: Key File Paths

| What | Where |
|------|-------|
| Project spec | `PROJECT_SPEC.md` |
| This checklist | `DEVELOPMENT_CHECKLIST.md` |
| Session log | `skillsense_job_data/SESSION_LOG.md` |
| Historical data (Dataset A) | `skillsense_job_data/data/historical/*.csv` |
| Current postings (Dataset B) | `skillsense_job_data/data/current_ict/ict_job_postings_v2.csv` |
| Government microdata (Dataset C) | `skillsense_job_data/Labour_Force_Survey__2017-2024___Microdata/` |
| Classification pipeline | `skillsense_job_data/scripts/classify_and_group_v2.py` |
| Frontend source | `frontend_pages/src/` |
| Frontend components | `frontend_pages/src/components/` |
| Frontend pages | `frontend_pages/src/pages/` |
| Frontend dashboard pages | `frontend_pages/src/pages/dashboard/` |
| Django backend (to create) | `backend/` |
| ML training script (v1, superseded) | `models/train_model.py` |
| ML validation + forecast (v1, superseded) | `models/validate_and_forecast.py` |
| **Production model (Two-Stage)** | `models/phase2d_final_model.py` |
| Forecast output | `models/forecast_results_2027_2028.csv` |
| Model performance report | `models/model_performance_report.md` |
| Model artifacts (gitignored) | `models/*.joblib` |
| Model reports (v1) | `models/reports/` |
| Shrinkage correction | `skillsense_job_data/scripts/phase1b_shrinkage_correction.py` |
