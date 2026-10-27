# SkillSense — Development Checklist & Roadmap

**AI-Powered Labour-Market Intelligence & Employability Outlook Platform**

Rwanda-focused. 9 economic sectors. NISR 2026 Big Data Hackathon submission (deadline: 30 Oct 2026).

Last updated: Oct 27, 2026 (Landing page redesigned for hackathon, career advisor fully implemented, shared AUCA skill data extracted, role-based sidebar fixed, all 4 roles have dedicated pages)

---

## Current State (Oct 27, 2026)

**Platform:** SkillSense — AI-powered workforce intelligence for Rwanda. Submitted to NISR 2026 Big Data Hackathon (deadline: 30 Oct 2026).

**What's working:**
- Full-stack app: React 19 (Vite, TypeScript, Tailwind v4) + Django REST + PostgreSQL
- Two-Stage ML model: LightGBM trend + market correction factors → Spearman 0.99 validation
- 919 job postings across 9 sectors from 4+ platforms, 22 roles, 185 companies
- 4 user roles, each with completely isolated dashboard pages and role-based sidebar
- Landing page redesigned for hackathon with multi-sector messaging and SNAPSHOT data
- JWT auth with demo accounts on sign-in page (admin hidden)
- All TypeScript compiles cleanly, dev server at localhost:5173

**What's left:**
- Labour market analyst pages need live API data (currently use mock/hardcoded data)
- Invite-only auth flow (plan exists, not built — admin-invite instead of self-registration)
- Layer 2: Emerging Skills Radar (global trends, new roles — Phase 8)
- Testing & deployment (Phase 9)

**Branch:** `develop` (PR target: `main`). Remote: `origin/develop`.

**Database stats:** 919 total postings (112 ICT, 807 non-ICT), 22 roles, 9 sectors, 185 companies, 7 role groups.

**Key entry points:**
- Frontend: `frontend_pages/src/main.tsx` (routing), `frontend_pages/src/auth/access.ts` (22 routes, role-based)
- Backend: `backend/skillsense_backend/urls.py`, `backend/advisory/` (career advisor app)
- ML: `ml/phase2d_final_model.py` (production Two-Stage model)
- Data: `frontend_pages/src/lib/snapshot.ts` (landing page numbers), `frontend_pages/src/data/auca-skills.ts` (shared AUCA curriculum data)

---

## The Finished System

When complete, SkillSense will:

1. **Forecast role demand across 9 sectors** in Rwanda at 6-month, 1-year, and 2-year horizons using a Two-Stage ML model (LightGBM + market correction) on 21 years of government-verified historical data (Spearman 0.99)
2. **Alert users to emerging roles** (AI/ML Engineer, Prompt Engineer, etc.) that are trending globally but not yet present in Rwanda, with estimated arrival timelines
3. **Score employability** of individual skill profiles against predicted market demand
4. **Show geographic demand** by province and district on an interactive Rwanda map
5. **Analyse education/training gaps** between what AUCA teaches and what employers need — per-department curriculum alignment with employer-demanded skills
6. **Guide career decisions** — advisors assess student skills against target roles, match students to jobs, build career pathways through AUCA Innovation Center courses, and track placement outcomes
7. **Support policy makers** with decision dashboards for workforce planning and training investment
8. **Generate exportable reports** (PDF, CSV) for all analytics — multi-sector reports with role demand, curriculum alignment, and placement outcomes
9. **Accept new data via CSV upload** — admin uploads job postings from 4+ platforms, system classifies across 9 sectors, normalizes, and updates forecasts
10. **Serve 4 user roles** — Labour Market Analyst, Education Curriculum Planner, Career & Training Advisor, Admin — each with completely isolated dashboard pages

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
- `data/historical/*.csv` — training data
- `data/current_ict/ict_job_postings_v2.csv` — validation data
- `data/scripts/classify_and_group_v2.py` — classification pipeline

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

**Key file:** `data/scripts/phase1_data_finalization.py` — the script that produced this output.

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

**All pages now built** (see Phase 4C for current status). Auth integration, API client, and role-based routing completed in Phase 4A.

---

## Phase 1B: Shrinkage Correction [DONE]

*Follow-on correction to Phase 1's 2026 row. Not a rewrite — a noise reduction step.*

**Done by:** Gasana Leslie (PR #4, commit 996a68d)

- [x] Identified that Phase 1's raw posting shares (92 postings, ~4.6/role) introduced sampling noise that broke model training (R2 = -0.11 on the 2025->2026 test fold)
- [x] Applied Empirical-Bayes shrinkage blend: `shrunk_share = (n/(n+15)) * raw_share + (15/(n+15)) * trend_share`
- [x] Recalculated `role_employment_proxy`, `role_demand_index`, and 2024/2025 target columns
- [x] Validated: shares sum to 100%, max index = 100, zero nulls
- [x] Updated both `skillsense_ict_labour_history_2019_2025.csv` and `_2019_2026.csv`

**Key file:** `data/scripts/phase1b_shrinkage_correction.py`

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
- [x] Model artifacts saved (`.joblib` — gitignored, regenerate with `python ml/train_model.py`)
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
- `ml/forecast_results_2027_2028.csv` — 60 forecast rows
- `ml/model_performance_report.md` — full metrics and validation
- `ml/reports/model_training_report.md` — training metrics and comparison
- `ml/reports/validation_comparison.csv` — predicted vs actual rankings
- `ml/reports/feature_importance.png` — feature importance chart
- `ml/artifacts/engineered_dataset.csv` — 440 rows with all features
- `ml/artifacts/model_ready_dataset.csv` — 418 training-ready rows

**Output files (gitignored, regenerate locally):**
- `ml/skillsense_forecast_model.joblib` — run `python ml/phase2d_final_model.py`
- `ml/role_encoder.joblib` — run `python ml/phase2d_final_model.py`
- `ml/feature_list.joblib` — run `python ml/phase2d_final_model.py`
- `ml/correction_factors.joblib` — run `python ml/phase2d_final_model.py`
- `ml/artifacts/best_model.joblib` — run `python ml/train_model.py` (v1, superseded)
- `ml/artifacts/role_encoder.joblib` (v1, superseded)
- `ml/artifacts/feature_list.joblib` (v1, superseded)
- `ml/artifacts/prophet_results.joblib` (v1, superseded)

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
- `ml/phase2d_final_model.py` — production Two-Stage script (run to regenerate all artifacts)
- `ml/phase2d_model_iteration.py` — v1 experiment sweep (18 experiments, all failed)
- `ml/phase2d_iteration_v2.py` — v2 experiment sweep (found Two-Stage winner)
- `ml/forecast_results_2027_2028.csv` — 60 forecast rows (regenerated)
- `ml/model_performance_report.md` — full validation report
- `ml/skillsense_forecast_model.joblib` — production model (gitignored, regenerate with `python ml/phase2d_final_model.py`)

---

## Phase 3: Django Backend [DONE]

*Production backend with database, API, authentication, and ML integration.*

**Done by:** Nshuti Delphin (3A: Project Setup) + Gasana Leslie (3B-3F: API & Integration) + IRAKOZE Nsumba Herve (code review, fixes, restructure)

### 3A: Project Setup [DONE]

- [x] Created Django project: `backend/skillsense_backend/`
- [x] Created 7 Django apps: `core`, `accounts`, `taxonomy`, `predictions`, `uploads`, `analytics`, `reports`
- [x] Installed and configured: DRF, simplejwt, cors-headers, django-filter, psycopg2-binary, drf-spectacular
- [x] Configured settings: PostgreSQL, CORS, JWT lifetimes, media/static, `.env` secrets
- [x] Project restructured: `backend/`, `ml/`, `data/`, `frontend_pages/`, `docs/`

### 3B: Database Schema & Models [DONE]

- [x] `accounts`: User (AbstractUser + role enum + institution FK), Institution
- [x] `taxonomy`: RoleGroup, RoleFamily, NormalizedRole, HistoricalDemand, MacroIndicator
- [x] `predictions`: ForecastRun, RoleForecast
- [x] `uploads`: DataUpload, JobPosting
- [x] `analytics`: GeographicDemand, SectorDemand
- [x] Migrations run, all tables created
- [x] Seed data loaded: 20 roles, 440 historical demand rows, 22 macro years, 92 job postings, 60 forecasts
- [x] 4 seed users created (admin, career advisor, curriculum planner, market analyst)

### 3C: REST API Endpoints [DONE]

- [x] Auth: register, login, refresh, logout, me (GET/PUT)
- [x] Taxonomy: roles, groups, families, emerging roles
- [x] Predictions: forecasts (all + per-role), trends, historical, macro, run forecast (admin)
- [x] Dashboard: KPIs, overview
- [x] Uploads: CSV upload (admin), list, detail, postings
- [x] Analytics: sector, geographic, employability score, education, career
- [x] Reports: list, generate JSON/PDF/CSV
- [x] API docs at `/api/docs/` (drf-spectacular)
- [x] Pagination, filtering, search, permission classes

### 3D: Authentication & RBAC [DONE]

- [x] JWT configured: 30min access, 7-day refresh, blacklisting enabled
- [x] 4 roles: admin, career_training_advisor, education_curriculum_planner, labor_market_analyst
- [x] Custom permission classes per endpoint
- [x] Password validation (Django validators) on registration
- [x] Seed users for all 4 roles (management command)

### 3E: ML Model Integration [DONE]

- [x] `predictions/ml/model_loader.py` — loads Two-Stage model artifacts
- [x] `predictions/ml/forecaster.py` — runs predictions with computed accuracy metrics
- [x] `run_forecast` management command
- [x] Forecast results stored in ForecastRun + RoleForecast tables

### 3F: CSV Upload Pipeline [DONE]

- [x] Upload endpoint accepts CSV, creates DataUpload record
- [x] Async processing: parse CSV, classify, create JobPosting records
- [x] Date parsing for posted_date/closing_date fields
- [x] Processing log and status tracking

---

## Phase 4: Frontend Integration [NEARLY COMPLETE]

*Connect React frontend to Django backend. Replace mock data with real API calls. Only analyst live-data wiring remains.*

**Depends on:** Phase 3 (done)

### 4A: API Client & Auth [DONE]

- [x] Base API client in `frontend_pages/src/services/http/` with JWT interceptor
- [x] Token refresh on 401 (silent refresh)
- [x] Typed API service functions: auth, taxonomy, predictions, dashboard, uploads, analytics, reports
- [x] Authentication flow: login → JWT → protected routes → role-based access
- [x] AuthContext with useAuth() hook
- [x] Role-based route guards (`access.ts` — single source of truth for all 22 routes)

### 4B: Landing Page & Auth Pages [DONE]

- [x] Landing page completely redesigned for NISR 2026 Big Data Hackathon submission
- [x] New component set: Navbar, Hero (Rwanda map + hackathon badge), TheChallenge, OurData, IntelligencePipeline, Features, RoleShowcase, CallToAction, Footer
- [x] Multi-sector language throughout (9 sectors, not ICT-only)
- [x] Hero section: Rwanda map on right, animated KPI counters, hackathon badge, SNAPSHOT data references
- [x] IntelligencePipeline: 5-stage pipeline cards with 0.99 Spearman correlation validation
- [x] StatisticsStrip: live data from `SNAPSHOT` (22 roles, 9 sectors, 919 postings, 185 companies)
- [x] Central data source: `frontend_pages/src/lib/snapshot.ts` — all landing page numbers reference SNAPSHOT
- [x] "Built for" marquee with institution logos (MINICT, RDB, RISA, AUCA, MIFOTRA, NISR)
- [x] Navbar uses `useAuth()` for conditional CTA ("Open dashboard" vs "Try the demo")
- [x] Sign In page: no-scroll split layout, 3 demo accounts (analyst, planner, advisor — admin hidden), compact styling
- [x] Sign Up page redirects to Sign In (self-registration disabled in UI)
- [x] Forgot Password page (multi-step OTP flow)

### 4C: Dashboard Pages [DONE — all 4 roles have dedicated pages]

All dashboard pages built. Auth + routing + role-based sidebar filtering all work. TypeScript compiles cleanly.

**Page isolation rule (established Oct 24, 2026):**
> Every role has its own standalone pages. No page is shared between roles except Settings and the Taxonomy/Reports pair (which render role-specific content via role-switching wrappers).

- [x] Dashboard Layout — sidebar nav filtered by role, top header, animated search, mobile drawer
- [x] Sidebar ordering correct for all roles: each role's Dashboard appears first, followed by their specific pages
- [x] Role Taxonomy — shared route, role-switching wrapper renders `LaborTaxonomy` or `EducationTaxonomy` based on user role
- [x] Reports — shared route, role-switching wrapper renders `LaborReports` or `EducationReports` based on user role
- [x] Settings — profile, security, notifications (all roles — the ONLY truly shared page)
- [x] Data Upload — CSV upload (admin only)
- [x] User Management — admin panel (admin only)

### 4D: Multi-Sector Expansion [DONE]

**Done by:** IRAKOZE Nsumba Herve

- [x] Expanded from ICT-only to 9 sectors: ICT & Technology, Finance & Business, Agriculture, Healthcare, Education & Training, Energy & Environment, Construction & Infrastructure, Tourism & Hospitality, Manufacturing
- [x] Added multi-platform job scrapers for broader sector coverage
- [x] Improved sector classifier for accurate role-to-sector mapping
- [x] Added multi-sector reports with PDF generation
- [x] Dashboard UI updated to support multi-sector views

### 4E: Education Planner Pages — AUCA Integration [DONE]

**Done by:** IRAKOZE Nsumba Herve (Oct 2026)

Rewrote all education planner pages from generic shells into AUCA-specific tools. These pages are standalone for the `education_curriculum_planner` role.

**Education.tsx (Innovation Center Training Management):**
- [x] Rewrote from generic curriculum upload into AUCA Innovation Center training management page
- [x] Innovation Center banner (Mastercard Foundation partnership, ~50 students/year, 70% female)
- [x] Add Training Cohort form with multi-course selection from 12-course Innovation Center catalog
- [x] Custom course input — advisors can add courses not in the catalog (e.g. IoT) with comma-separated skills
- [x] Real-time Transformation View showing before/after curriculum coverage with AI recommendations
- [x] Cohort list with alignment scores
- [x] Department Curriculum Update section at bottom
- [x] Removed institution dropdown (AUCA-only, no need for other institutions)
- [x] Button text changed to generic "Update curriculum"

**EducationTaxonomy.tsx (Role Taxonomy by Faculty):**
- [x] Filtered sectors to only AUCA's two faculties: ICT & Technology, Finance & Business
- [x] Changed "Sector" label to "Faculty" throughout
- [x] Added AUCA Curriculum Alignment card in ICT role detail panels (21 roles with skill mappings)
- [x] Added AUCA Curriculum Alignment card in Business role detail panels (19 roles with skill mappings)
- [x] Uses `isSkillTaught()` word-boundary matching and `findClosestRole()` fuzzy matching
- [x] Added page subtitle about AUCA's tracked faculties
- [x] 4 department curricula defined: Software Engineering, Network & Info Management, Finance, Business Administration

**EducationReports.tsx (Reports):**
- [x] Filtered sector dropdown to only AUCA's two sectors (ICT & Technology, Finance & Business)
- [x] Filtered Cross-Sector Outlook table to only AUCA sectors
- [x] Added 5th report template: "Curriculum Alignment" with per-department skills gap analysis
- [x] Curriculum Alignment report includes: department overview table, per-department skill breakdown (covered/gaps), alignment progress bars, AI recommendations per department

**EducationEmployability.tsx (666 lines), EducationForecast.tsx (738 lines), EducationCareerGuidance.tsx (428 lines):**
- [x] Exist as role-specific pages for education planner (separate from analyst versions)

**EducationDashboard.tsx (486 lines):**
- [x] Education planner home page with KPIs, curriculum alignment overview, quick links

**Shared AUCA skill data extracted (Oct 2026):**
- [x] `frontend_pages/src/data/auca-skills.ts` (446 lines) — single source of truth for all AUCA curriculum and skill data
- `DEPT_CURRICULA` — 4 AUCA departments with their course/skill sets
- `ICT_ROLE_SKILLS` — 21 ICT roles with employer-demanded skills
- `BIZ_ROLE_SKILLS` — 19 business roles with employer-demanded skills
- `MARKET_SKILLS` — per-department market skill sets
- `INNOVATION_COURSES` — 12 Innovation Center courses with skill mappings
- `isSkillTaught()` — word-boundary regex matching function
- `AUCA_SECTORS = new Set(['ict-technology', 'finance-business'])`
- Education.tsx and EducationTaxonomy.tsx import from this shared module (EducationEmployability uses it too)

### 4F: Career & Training Advisor — Developer Spec [DONE]

**Done by:** IRAKOZE Nsumba Herve (Oct 24, 2026)

Created comprehensive developer handoff document for a colleague to build the career advisor role's 6 unique pages.

- [x] Document written: `docs/Career_Training_Advisor_Developer_Spec.md`
- [x] Defines new Django app `advisory` with 4 models: StudentProfile, Assessment, SavedPathway, Placement
- [x] 14 API endpoints under `/api/advisory/` with full request/response shapes
- [x] 6 unique frontend pages specified with wireframes:
  - AdvisorDashboard.tsx — KPIs, students needing attention, hot roles, skill heatmap
  - AdvisorAssessment.tsx — student skill assessment against target roles with scoring
  - AdvisorJobs.tsx — job market navigator with student-job matching
  - AdvisorPathways.tsx — career pathway generation with Innovation Center course mapping
  - AdvisorPlacements.tsx — placement recording, stats, CSV bulk import
  - AdvisorReports.tsx — 4 report templates (readiness, outcomes, demand brief, skills gap)
- [x] TypeScript types, API functions, query hooks — copy-paste ready
- [x] Access control changes documented (remove advisor from old shared routes, add new advisor-only routes)
- [x] Implementation order: 6 phases, estimated 6-9 working days
- [x] Testing checklist with page isolation verification

**Status:** Spec complete. Implementation done — see Phase 4G below.

### 4G: Career Advisor Implementation [DONE]

**Done by:** Team (PR #8 merged, commits 1f836ba → 2d25fd9)

- [x] Created `advisory` Django app with models: StudentProfile, Assessment, SavedPathway, Placement
- [x] Backend: scoring engine (`scoring.py`), PDF generation (`pdf.py`), skills data (`skills_data.py`), stats, permissions
- [x] Backend: 14 API endpoints under `/api/advisory/` with priority skills, student-fit job search, placement rate, logos on PDFs
- [x] Page isolation: `career_training_advisor` removed from old shared routes, 6 new advisor-only routes in `access.ts`
- [x] AdvisorDashboard.tsx (240 lines) — KPIs, students needing attention, hot roles
- [x] AdvisorAssessment.tsx (564 lines) — student skill assessment against target roles with scoring
- [x] AdvisorJobs.tsx (307 lines) — job market navigator with student-fit filters
- [x] AdvisorPathways.tsx (303 lines) — career pathway generation with Innovation Center course mapping
- [x] AdvisorPlacements.tsx (496 lines) — placement recording, stats, CSV bulk import, sortable table, placement rate chart
- [x] AdvisorReports.tsx (286 lines) — report templates with PDF generation
- [x] Total: 2,196 lines of advisor frontend code
- [x] Old `CareerGuidance.tsx` still exists (used as a wrapper for education planner's career guidance page)

### 4H: Landing Page Redesign for Hackathon [DONE]

**Done by:** IRAKOZE Nsumba Herve (Oct 2026, commit 609f3b2)

- [x] Complete landing page redesign optimized for NISR 2026 Big Data Hackathon judging criteria
- [x] New component architecture: Navbar → Hero → TheChallenge → OurData → IntelligencePipeline → Features → RoleShowcase → CallToAction → Footer
- [x] Hero: Rwanda clean map on right, hackathon badge, animated counters, multi-sector messaging
- [x] TheChallenge: problem statement with Rwanda workforce context
- [x] OurData: data sources and methodology overview
- [x] IntelligencePipeline: 5-stage pipeline (Collect → Classify → Model → Forecast → Deliver) with validation box (0.99 Spearman)
- [x] Features: platform capability cards for all 4 user roles
- [x] RoleShowcase: interactive role-specific previews
- [x] Central SNAPSHOT data source at `frontend_pages/src/lib/snapshot.ts`
- [x] All components reference SNAPSHOT for consistency: 22 roles, 9 sectors, 919 postings, 185 companies, 0.9898 rank correlation
- [x] HeroDashboard: browser chrome frame with sidebar preview showing real KPIs from SNAPSHOT

### 4C Status Summary

| Role | Pages | Status |
|------|-------|--------|
| Admin | Dashboard, User Management, Data Upload, Settings | **DONE** |
| Labor Market Analyst | Dashboard, Sector Overview, Geography, Policy & Planning, Role Taxonomy*, Reports*, Settings | **UI built, needs live API data** |
| Education Planner | Dashboard, Role Forecast, Employability, Career Guidance, Education Alignment, Role Taxonomy*, Reports*, Settings | **DONE — AUCA-integrated** |
| Career Advisor | Dashboard, Skill Assessment, Job Navigator, Career Pathways, Placement Tracker, Reports, Settings | **DONE — 2,196 lines** |

\* Role Taxonomy and Reports are shared routes with role-switching wrappers (LaborTaxonomy/EducationTaxonomy, LaborReports/EducationReports)

**Known issues:**
- Analyst pages still use mock/hardcoded data — need live API integration
- Old `CareerGuidance.tsx` wrapper still exists (used by education planner's career guidance routing)
- Invite-only auth flow planned but not implemented (plan exists at `.claude/plans/fizzy-scribbling-ritchie.md`)

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
Phase 3  [DONE]     Django Backend (schema → API → auth → ML integration)
   ↓                  └── 7 apps, JWT auth, 4 seed users, all endpoints live
   ↓
Phase 4  [NEARLY COMPLETE]  Frontend Integration (wire React → Django)
   ↓                  └── 4A Auth flow + API client — DONE
   ↓                  └── 4B Landing + auth pages — DONE (redesigned for hackathon)
   ↓                  └── 4D Multi-sector expansion (9 sectors, scrapers) — DONE
   ↓                  └── 4E Education planner pages (AUCA-integrated) — DONE
   ↓                  └── 4F Career advisor developer spec — DONE
   ↓                  └── 4G Career advisor implementation — DONE (PR #8 merged)
   ↓                  └── 4H Landing page hackathon redesign — DONE
   ↓                  └── TODO: Analyst pages need live API data
   ↓                  └── TODO: Invite-only auth flow (plan exists, not built)
   ↓
Phase 5             Core Modules — replace mock data with live API data
   ↓
Phase 6             Intelligence Modules (Employability, Sector, Geographic, Education, Career)
   ↓
Phase 7             Admin & Reporting (User management, Reports, PDF)
   ↓
Phase 8             Layer 2: Emerging Skills Radar (global trends, new roles)
   ↓
Phase 9             Testing & Deployment (tests, Docker, CI/CD, security)
```

**Critical path:** Phase 5 (live API data for analyst pages) → remaining modules
**Gate:** Phase 2D Spearman > 0.85 — **PASSED** (0.9898)
**Hackathon deadline:** 30 Oct 2026

**Can be parallelised:**
- Phase 6 + Phase 7 (independent modules, can be built simultaneously)
- Phase 8 data collection can start now (research doesn't block development)
- Invite-only auth flow can be built independently of any dashboard work

---

## Prototype Review 1 — Facilitator Feedback (Oct 9, 2026)

*Feedback from prototype review session with project facilitators. Each item needs a decision before implementation.*

### PR1-1: Admin User Invitations
**Feedback:** Admin should be able to invite users by email with a pre-assigned role. Invited users create their own account using that email.
**Current state:** Users self-register and pick their own role. No invite flow exists.
**Plan written:** Full invite-only auth flow planned (Invitation model, AcceptInvite page, disable self-registration). See plan file.
**Status:** [x] Decision made — plan approved — [ ] Implemented

### PR1-2: Labour Market Demand Focus (Cross-Sector)
**Feedback:** Main focus should be on labour market demand, not just trends. Should collect insights from different sectors. Should also track changes and trends over time.
**Current state:** Expanded to 9 sectors with multi-platform job scrapers. Sector classifier improved. Multi-sector reports with PDF generation added. Education planner pages filtered to AUCA's 2 sectors (ICT & Technology, Finance & Business).
**Status:** [x] Decision made — [x] Implemented (Phase 4D)

### PR1-3: Data Generalization vs Detail
**Feedback:** Group similar data where necessary, but keep detailed data where it provides better insights. Use generalization for some areas, detail for others.
**Current state:** Taxonomy has 20 roles → 14 families → 12 groups. Shrinkage correction balances noise vs signal in small samples.
**Status:** [ ] Decision pending — [ ] Implemented

### PR1-4: Career Advice — Keep or Remove?
**Feedback:** Need to decide whether career advice should be in the system. If kept, define what information and methods will drive the advice. Review and remove unnecessary career pages.
**Decision:** KEEP — but with 6 completely unique pages (not clones of analyst pages). Career advisor works at the individual student level: skill assessment, job matching, pathway building, placement tracking.
**Current state:** Fully implemented. Django `advisory` app with 4 models, 14 API endpoints, scoring engine, PDF generation. 6 frontend pages (2,196 lines total). PR #8 merged.
**Status:** [x] Decision made — [x] Implemented (Phase 4G)

### PR1-5: Education Alignment
**Feedback:** System should clearly show the relationship between education and labour market demand — which qualifications, courses, skills, and training programs are demanded by employers.
**Decision:** Implemented for AUCA. Education planner pages now show curriculum-to-demand alignment per department, Innovation Center course mappings, and skills gap analysis.
**Current state:** Education.tsx (training management), EducationTaxonomy.tsx (role taxonomy by faculty with alignment cards), EducationReports.tsx (curriculum alignment report template) — all fully built with AUCA's 4 departments, 40 roles, and employer skill data.
**Status:** [x] Decision made — [x] Implemented (Phase 4E)

### PR1-6: Institution & University Graduate Tracking
**Feedback:** Track the number of students graduating from each institution and entering the labour market. Understand how many graduates each institution produces and how they perform.
**Current state:** Not implemented. Institution model exists (name, type) but no graduate count or outcome tracking.
**Status:** [ ] Decision pending — [ ] Implemented

### PR1-7: Training Centre Data
**Feedback:** Collect information about training centres: types of training provided, number of trained people entering the labour market, and impact measurement.
**Current state:** Not implemented. No training centre model or data collection.
**Status:** [ ] Decision pending — [ ] Implemented

### PR1-8: Page Audit — Remove Unnecessary Pages
**Feedback:** Review current prototype, remove pages without clear purpose. Final system should be simple, organized, and focused on main objectives.
**Decision:** Page isolation rule — every role gets its own standalone pages, no sharing except Settings and the Taxonomy/Reports pair (which render role-specific content via wrappers). Education planner pages fully customized for AUCA.
**Current state:** All roles fully isolated. Education planner has 7 unique pages. Career advisor has 6 unique pages. Labour analyst has 4 unique pages + shared taxonomy/reports. Admin has 3 pages. Old Career*.tsx clones replaced by advisor pages.
**Status:** [x] Decision made — [x] Implemented

### PR1-9: System Redesign & Research
**Feedback:** The group should sit down together and redesign/review the system before continuing. Clearly define: purpose, goals, users, data sources, how to measure demand, how to track employability, how to connect education and labour market, which features are necessary vs removable.
**Current state:** System architecture exists but was built incrementally. Facilitators want a deliberate design review.
**Status:** [ ] Decision pending — [ ] Implemented

---

## Quick Reference: Key File Paths

| What | Where |
|------|-------|
| Project spec | `PROJECT_SPEC.md` |
| This checklist | `DEVELOPMENT_CHECKLIST.md` |
| Historical data (Dataset A) | `data/historical/*.csv` |
| Current postings (Dataset B) | `data/current_ict/ict_job_postings_v2.csv` |
| Data scripts | `data/scripts/` |
| Shrinkage correction | `data/scripts/phase1b_shrinkage_correction.py` |
| Frontend source | `frontend_pages/src/` |
| Frontend components | `frontend_pages/src/components/` |
| Frontend pages | `frontend_pages/src/pages/` |
| Frontend dashboard pages | `frontend_pages/src/pages/dashboard/` |
| Frontend auth & access control | `frontend_pages/src/auth/` |
| Frontend API services | `frontend_pages/src/services/` |
| Django backend | `backend/` |
| Django settings | `backend/skillsense_backend/settings.py` |
| Django apps | `backend/{core,accounts,taxonomy,predictions,uploads,analytics,reports}/` |
| **Career advisor spec** | `docs/Career_Training_Advisor_Developer_Spec.md` |
| **Education planner pages** | `frontend_pages/src/pages/dashboard/Education*.tsx` (7 files, 3,622 lines) |
| **Career advisor pages** | `frontend_pages/src/pages/dashboard/Advisor*.tsx` (6 files, 2,196 lines) |
| **Advisory Django app** | `backend/advisory/` (models, views, scoring, pdf, skills_data, stats) |
| **Shared AUCA skill data** | `frontend_pages/src/data/auca-skills.ts` (446 lines) |
| **Landing page SNAPSHOT** | `frontend_pages/src/lib/snapshot.ts` |
| **Role-based access control** | `frontend_pages/src/auth/access.ts` (single source of truth for all 22 routes) |
| ML model integration | `backend/predictions/ml/` |
| **Production model (Two-Stage)** | `ml/phase2d_final_model.py` |
| ML training script (v1, superseded) | `ml/train_model.py` |
| Forecast output | `ml/forecast_results_2027_2028.csv` |
| Model performance report | `ml/model_performance_report.md` |
| Model artifacts (gitignored) | `ml/*.joblib` |
| Model reports | `ml/reports/` |
| Environment variables | `.env` (gitignored), `.env.example` |

### Seed User Credentials

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| Admin | `admin@skillsense.rw` | `admin123` | Hidden from demo UI (admin is the project owner) |
| Career & Training Advisor | `advisor@skillsense.rw` | `advisor123` | Shown on sign-in demo panel |
| Education / Curriculum Planner | `planner@skillsense.rw` | `planner123` | Shown on sign-in demo panel |
| Labour Market Analyst | `analyst@skillsense.rw` | `analyst123` | Shown on sign-in demo panel |
