# SkillSense — Rwanda Workforce Intelligence Platform

**Forecast which roles Rwanda will need — before the skills gap opens.**

SkillSense collects job postings from five Rwandan job boards, combines them with NISR Labour Force Survey microdata (2017–2024), and uses machine-learning forecasts to show policymakers, educators, and career advisors where the workforce is heading — and where the gaps are forming.

---

## The Problem

Rwanda's universities produce more graduates every year, but many leave with skills that don't match what employers are hiring for. Without a reliable signal showing which roles are growing and which are shrinking, curricula drift out of alignment and graduates struggle to find work. SkillSense exists to close that information gap — aligned with **NST2** and **Vision 2050** goals for human capital development and a knowledge-based economy.

## What It Does

| Feature | Description |
|---|---|
| **Job market analytics** | 919 job postings from 5 boards, 185 companies, 9 economic sectors |
| **ML demand forecasting** | 1-year and 3-year role demand predictions using LightGBM |
| **Education–labour gap analysis** | Compares university output with employer demand by sector |
| **Role-based dashboards** | Tailored views for 4 stakeholder types (see below) |
| **Student assessment** | Career advisors can assess student employability against market demand |
| **PDF reports** | Exportable workforce intelligence reports |

## Data Sources

| Source | Type | Records |
|---|---|---|
| **NISR Labour Force Surveys** | Official labour statistics (2017–2024) | Quarterly microdata |
| **BrighterMonday Rwanda** | Job board scraping | 467 postings |
| **JobInRwanda** | Job board scraping | 241 postings |
| **RwandaJob** | Job board scraping | 121 postings |
| **JobWebRwanda** | Job board scraping | 45 postings |
| **GreatRwandaJobs** | Job board scraping | 45 postings |

The raw and cleaned datasets are in the `data/` directory. NISR Labour Force Survey microdata (2017–2024) is in `data/Labour_Force_Survey__2017-2024___Microdata/`.

## Tech Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 19, TypeScript, Vite 8, Tailwind CSS v4, Recharts, Leaflet |
| **Backend** | Django 5, Django REST Framework, SimpleJWT authentication |
| **Database** | PostgreSQL 16 |
| **ML Pipeline** | Python, scikit-learn, LightGBM, pandas, NumPy |
| **Task Queue** | Celery + Redis |
| **Deployment** | Docker Compose, Nginx, Gunicorn |

## Architecture

```
┌─────────────┐     ┌──────────────────┐     ┌──────────────┐
│   React UI  │────▶│  Django REST API  │────▶│  PostgreSQL  │
│  (Vite/TS)  │◀────│  (DRF + JWT)     │◀────│              │
└─────────────┘     └────────┬─────────┘     └──────────────┘
                             │
                    ┌────────▼─────────┐
                    │  Celery Workers   │
                    │  (ML forecasts)   │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │   LightGBM Model │
                    │   + NISR Data    │
                    └──────────────────┘
```

## Platform Roles

SkillSense serves four types of users, each with a dedicated dashboard:

| Role | What they see |
|---|---|
| **Labour Market Analyst** | Sector trends, demand forecasts, hiring concentration maps |
| **Education & Curriculum Planner** | Skill gap analysis, curriculum-vs-market alignment, graduate output |
| **Career & Training Advisor** | Student assessment tools, employability scoring, placement planning |
| **Platform Administrator** | User management, system configuration, data pipeline status |

## Sample Login Credentials

The sign-in page displays these credentials. Use them to explore each dashboard:

| Role | Email | Password |
|---|---|---|
| Admin | `admin@skillsense.rw` | `admin123` |
| Labour Market Analyst | `analyst@skillsense.rw` | `analyst123` |
| Education Planner | `planner@skillsense.rw` | `planner123` |
| Career Advisor | `advisor@skillsense.rw` | `advisor123` |

## Getting Started

### Prerequisites

- Docker and Docker Compose
- Git

### Run with Docker Compose

```bash
# Clone the repository
git clone https://github.com/nsumba018/Skillsense.git
cd Skillsense

# Copy environment file
cp .env.example .env

# Start all services (PostgreSQL, Redis, Django, Celery, React)
docker-compose up --build

# In another terminal, run migrations and seed data
docker-compose exec backend python manage.py migrate
docker-compose exec backend python manage.py loaddata seed.json
```

The app will be available at:
- **Frontend:** http://localhost
- **Backend API:** http://localhost:8000
- **API Documentation (Swagger):** http://localhost:8000/api/docs/

### Run without Docker

**Backend:**
```bash
# Create a virtual environment
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Set up PostgreSQL and update .env
cp .env.example .env
# Edit .env with your database credentials

cd backend
python manage.py migrate
python manage.py runserver
```

**Frontend:**
```bash
cd frontend_pages
npm install
npm run dev
```

## Project Structure

```
Skillsense/
├── README.md                 # This file
├── backend/                  # Django REST API
│   ├── accounts/             # User auth, roles, JWT
│   ├── jobs/                 # Job postings, sectors, roles
│   ├── analytics/            # Forecasts, gap analysis
│   └── skillsense_backend/   # Django settings
├── frontend_pages/           # React frontend (Vite + TypeScript)
│   └── src/
│       ├── components/       # Reusable UI components
│       ├── pages/            # Route pages & dashboards
│       ├── services/         # API client
│       └── auth/             # Authentication context
├── data/                     # Datasets
│   ├── raw/                  # Raw scraped job postings (5 sources)
│   ├── cleaned/              # Processed and deduplicated data
│   ├── Labour_Force_Survey__2017-2024___Microdata/
│   ├── analytical/           # Analysis-ready datasets
│   └── scripts/              # Data processing scripts
├── ml/                       # Machine learning pipeline
│   ├── train_model.py        # Model training script
│   └── validate_and_forecast.py
├── docker-compose.yml        # Full-stack Docker setup
├── requirements.txt          # Python dependencies
└── .env.example              # Environment variable template
```

## ML Forecasting Pipeline

The forecasting model predicts role demand 1 and 3 years ahead:

1. **Feature engineering** — historical posting counts, sector distributions, growth rates
2. **Model training** — LightGBM gradient-boosted trees with cross-validation
3. **Correction factors** — calibrated against NISR labour force participation rates
4. **Output** — per-role demand forecasts with confidence intervals

To retrain:
```bash
source .venv/bin/activate
python ml/train_model.py
```

## API Documentation

The REST API is documented with OpenAPI/Swagger at `/api/docs/` when the backend is running. Key endpoints:

- `POST /api/auth/login/` — JWT authentication
- `GET /api/jobs/postings/` — Job postings with filters
- `GET /api/jobs/sectors/` — Sector breakdown
- `GET /api/analytics/forecasts/` — Demand forecasts
- `GET /api/analytics/gap-analysis/` — Education–labour gap data

## Screenshots

> _A demo video of the platform is available in the `demo/` directory._

## Team

Built by AUCA students as a final-year project in Information Technology.

**Contact:** nsumbaherve11@gmail.com

## License

This project was developed for the NISR 2026 Big Data Hackathon. By entering the competition, participants agree to assign intellectual property rights in their submitted work to the National Institute of Statistics of Rwanda (NISR).
