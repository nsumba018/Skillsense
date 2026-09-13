# SkillSense — Development Checklist & Roadmap

**AI-Powered Labour-Market Intelligence & Employability Outlook Platform**

Rwanda-focused. First sector: ICT / Computer Science / Digital Technology.

Last updated: Sep 11, 2026

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
- [x] SESSION_LOG.md with reproducible steps for all data work
- [x] PROJECT_SPEC.md updated with two-layer architecture

**Key files:**
- `skillsense_job_data/data/historical/*.csv` — training data
- `skillsense_job_data/data/current_ict/ict_job_postings_v2.csv` — validation data
- `skillsense_job_data/Labour_Force_Survey__2017-2024___Microdata/` — government microdata
- `skillsense_job_data/scripts/classify_and_group_v2.py` — classification pipeline

---

## Phase 1: Data Finalization

*Transform Dataset B (92 postings) into a 2026 row for Dataset A, creating the complete training set.*

**Depends on:** Phase 0 (done)

- [ ] Aggregate Dataset B by `normalized_role` to get `posting_share_pct` per role
- [ ] Estimate 2026 macro indicators (extrapolate from 2025 government LFS trends)
  - Total employment, ICT employment, ICT share, LFPR, unemployment rate, EPR, tertiary employment
- [ ] Calculate 2026 `role_employment_proxy` and `role_demand_index` for each role
- [ ] Handle the 4 historical-only roles with zero postings (IT Support, Telecom Tech, E-Gov Dev, Other ICT)
  - Assign `posting_share_pct = 0` or small residual based on trend
- [ ] Append 20 new rows (one per role) as year=2026 to Dataset A
- [ ] Recalculate `target_role_demand_index_1y` and `_2y` for 2024 and 2025 (they now have future data)
- [ ] Save updated historical CSVs (now 440 rows total: 2005-2026)
- [ ] Validate: zero nulls, role shares sum to 100%, max demand index = 100

**Output:** `data/historical/` files updated with 2026 row, ready for model training.

---

## Phase 2: ML Forecasting Model (Layer 1)

*Train, validate, and produce role demand forecasts.*

**Depends on:** Phase 1

### 2A: Model Training

- [ ] Load combined training data (440 rows, 2005-2026)
- [ ] Feature engineering:
  - Time features: year, years_since_emergence, trend position
  - Role features: role_share_within_ict_pct, role_employment_proxy
  - Macro features: ict_employment, ict_employment_share_pct, total_employment, unemployment_rate_pct, labour_force_participation_rate_pct, employment_to_population_ratio_pct, tertiary_employment_count
  - Lag features: role_demand_index_lag1, role_demand_index_lag2, role_share_change_1y
- [ ] Choose model approach:
  - **Option A:** Per-role time series (Prophet or ARIMA per role — good for trend capture)
  - **Option B:** Panel regression (single model across all roles — better for cross-role learning)
  - **Option C:** Gradient boosted trees (XGBoost/LightGBM — handles non-linear patterns)
  - Start with Option C (most flexible), compare against Option A
- [ ] Train/test split: train on 2005-2024, test on 2025-2026
- [ ] Train the model
- [ ] Evaluate: MAE, RMSE, R-squared on test set
- [ ] Cross-validate: rolling window validation

### 2B: Validation Against Current Market

- [ ] Compare model's predicted 2026 role distribution against Dataset B actual distribution
- [ ] Calculate correlation between predicted and actual role demand rankings
- [ ] Document validation results and model performance metrics
- [ ] Iterate on features/model if validation is poor

### 2C: Forecast Production

- [ ] Retrain on full dataset (2005-2026)
- [ ] Produce forecasts:
  - 6-month outlook (mid-2027)
  - 1-year outlook (2027)
  - 2-year outlook (2028)
- [ ] Output per role: forecasted `role_demand_index`, `role_share_within_ict_pct`, `role_employment_proxy`, confidence intervals
- [ ] Save model artifact (pickle/joblib) for Django backend to load
- [ ] Save forecast results as CSV for validation
- [ ] Document model: features used, hyperparameters, performance metrics

**Output files:**
- `models/skillsense_forecast_model.joblib` — trained model
- `models/forecast_results_2027_2028.csv` — forecast output
- `models/model_performance_report.md` — metrics and validation

**Technical specs:**
```python
# Model input (per row):
{
    "year": int,
    "role": str,                              # 20 categories
    "role_share_within_ict_pct": float,        # 0-100
    "role_employment_proxy": float,            # absolute count
    "ict_employment": int,                     # national ICT employment
    "ict_employment_share_pct": float,         # ICT % of total employment
    "total_employment": int,                   # national total employment
    "unemployment_rate_pct": float,
    "labour_force_participation_rate_pct": float,
    "employment_to_population_ratio_pct": float,
    "tertiary_employment_count": int,
    "role_demand_index_lag1": float,            # engineered
    "role_demand_index_lag2": float,            # engineered
    "years_since_emergence": int,              # engineered
}

# Model output (per role, per horizon):
{
    "role": str,
    "horizon": str,                            # "6m", "1y", "2y"
    "forecasted_demand_index": float,          # 0-100
    "forecasted_share_pct": float,             # 0-100
    "forecasted_employment_proxy": int,
    "confidence_lower": float,
    "confidence_upper": float,
    "trend_direction": str,                    # "growing", "stable", "declining"
}
```

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

- [ ] Main Dashboard page (Module 2) — KPIs, charts, alerts
- [ ] Data Upload page (Module 3) — CSV upload form, upload history, processing status
- [ ] Skills Taxonomy page (Module 5) — browse roles, families, groups
- [ ] Demand Prediction page (Module 6) — forecast charts, trend tables, horizon selector
- [ ] Employability page (Module 7) — skill profile input, score output
- [ ] Sector Intelligence page (Module 8) — industry breakdown charts
- [ ] Geographic Intelligence page (Module 9) — Rwanda map with PostGIS data
- [ ] Education Alignment page (Module 10) — gap analysis dashboard
- [ ] Career Guidance page (Module 11) — personalised recommendations
- [ ] Policy & Planning page (Module 12) — decision-support dashboard
- [ ] Reports page (Module 13) — report browser, PDF download
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
Phase 1  [NEXT]     Data Finalization (aggregate Dataset B → 2026 row)
   ↓
Phase 2             ML Model (train → validate → forecast)
   ↓
Phase 3             Django Backend (schema → API → auth → ML integration)
   ↓
Phase 4             Frontend Integration (wire React → Django)
   ↓
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

**Critical path:** Phase 1 → 2 → 3 → 4 → 5 (everything else branches off after Phase 5)

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
| Frontend source | `frontend/src/` |
| Frontend components | `frontend/src/components/` |
| Frontend feature hooks | `frontend/src/features/` |
| Auth stub (dev only) | `frontend/server/` |
| Django backend (to create) | `backend/` |
| ML models (to create) | `models/` |
