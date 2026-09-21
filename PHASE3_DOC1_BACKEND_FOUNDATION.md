# Phase 3 — Document 1: Backend Foundation

**Assigned to:** Nshuti Delphin
**Branch:** `feature/backend-foundation`
**Base branch:** `develop`
**Covers:** Phase 3A (Project Setup) + 3B (Database Schema & Models) + 3D (Authentication & RBAC) + Seed Data

---

## Overview

You are building the Django backend foundation for SkillSense. This includes creating the Django project, all database models, the authentication system, and seed data commands. Your colleague (Leslie) will build the API endpoints and ML integration on top of what you create here.

**Your work comes first.** Leslie depends on your models and auth system being in place before he can build API views. Coordinate with him — push your models early so he can start writing serializers and views.

---

## Prerequisites

Before you start, make sure you have:

```bash
# PostgreSQL 16 with PostGIS 3.x installed
sudo apt install postgresql-16 postgis postgresql-16-postgis-3

# Redis (for Celery broker)
sudo apt install redis-server

# Python 3.12+ with venv
python3 --version  # should be 3.12+

# Create and activate venv (project already has one)
cd /home/nsumba/Documents/FinalYearProject
source .venv/bin/activate
```

Create the database:

```sql
-- In psql as postgres superuser:
CREATE DATABASE skillsense_db;
CREATE USER skillsense_user WITH PASSWORD 'skillsense_dev_2026';
ALTER ROLE skillsense_user SET client_encoding TO 'utf8';
ALTER ROLE skillsense_user SET default_transaction_isolation TO 'read committed';
ALTER ROLE skillsense_user SET timezone TO 'UTC';
GRANT ALL PRIVILEGES ON DATABASE skillsense_db TO skillsense_user;

-- Enable PostGIS extension:
\c skillsense_db
CREATE EXTENSION postgis;
```

---

## Step 1: Create the Django Project

```bash
# From the project root
git checkout develop
git pull origin develop
git checkout -b feature/backend-foundation

# Install Django and all required packages
pip install django djangorestframework djangorestframework-simplejwt \
    django-cors-headers django-filter psycopg2-binary drf-spectacular \
    celery redis python-dotenv django-environ

# Create the Django project
django-admin startproject skillsense_backend .
# This creates manage.py in the project root and skillsense_backend/ settings package
```

**Important:** The `manage.py` should be at the project root (`/home/nsumba/Documents/FinalYearProject/manage.py`), NOT inside a subfolder.

### Create the Django apps

```bash
cd /home/nsumba/Documents/FinalYearProject

python manage.py startapp core
python manage.py startapp accounts
python manage.py startapp taxonomy
python manage.py startapp predictions
python manage.py startapp uploads
python manage.py startapp analytics
python manage.py startapp reports
```

This creates 7 app directories at the project root:
```
FinalYearProject/
├── manage.py
├── skillsense_backend/       # Django project settings
│   ├── __init__.py
│   ├── settings.py
│   ├── urls.py
│   ├── wsgi.py
│   └── asgi.py
├── core/                     # Shared models, utils
├── accounts/                 # User management, auth
├── taxonomy/                 # ICT role taxonomy
├── predictions/              # ML forecasts
├── uploads/                  # CSV upload pipeline
├── analytics/                # Sector, geographic, employability
├── reports/                  # Report generation
├── models/                   # ML scripts (already exists)
├── frontend_pages/           # React frontend (already exists)
├── skillsense_job_data/      # Data files (already exists)
└── ...
```

---

## Step 2: Configure Settings

### 2.1: Create `.env` file

Create `.env` at the project root (this file is gitignored — never commit it):

```env
# .env
SECRET_KEY=django-insecure-skillsense-dev-key-change-in-production-2026
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# Database
DB_NAME=skillsense_db
DB_USER=skillsense_user
DB_PASSWORD=skillsense_dev_2026
DB_HOST=localhost
DB_PORT=5432

# CORS
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:3000

# JWT
ACCESS_TOKEN_LIFETIME_MINUTES=30
REFRESH_TOKEN_LIFETIME_DAYS=7

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0

# ML Model
ML_MODEL_PATH=models/skillsense_forecast_model.joblib
ML_CORRECTION_FACTORS_PATH=models/correction_factors.joblib
```

**Make sure `.env` is in `.gitignore`.** Check and add if missing.

### 2.2: Update `skillsense_backend/settings.py`

Replace the default settings with a properly configured version:

```python
"""
SkillSense Backend — Django Settings
"""
import os
from pathlib import Path
from datetime import timedelta

import environ

# Build paths
BASE_DIR = Path(__file__).resolve().parent.parent

# Environment variables
env = environ.Env(
    DEBUG=(bool, False),
    ALLOWED_HOSTS=(list, ['localhost', '127.0.0.1']),
)
environ.Env.read_env(os.path.join(BASE_DIR, '.env'))

SECRET_KEY = env('SECRET_KEY')
DEBUG = env('DEBUG')
ALLOWED_HOSTS = env('ALLOWED_HOSTS')

# Application definition
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'django.contrib.gis',            # PostGIS support

    # Third-party
    'rest_framework',
    'rest_framework_simplejwt',
    'rest_framework_simplejwt.token_blacklist',
    'corsheaders',
    'django_filters',
    'drf_spectacular',

    # SkillSense apps
    'core',
    'accounts',
    'taxonomy',
    'predictions',
    'uploads',
    'analytics',
    'reports',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',       # Must be before CommonMiddleware
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'skillsense_backend.urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [],
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'skillsense_backend.wsgi.application'

# Database — PostgreSQL + PostGIS
DATABASES = {
    'default': {
        'ENGINE': 'django.contrib.gis.db.backends.postgis',
        'NAME': env('DB_NAME'),
        'USER': env('DB_USER'),
        'PASSWORD': env('DB_PASSWORD'),
        'HOST': env('DB_HOST', default='localhost'),
        'PORT': env('DB_PORT', default='5432'),
    }
}

# Custom user model
AUTH_USER_MODEL = 'accounts.User'

# Password validation
AUTH_PASSWORD_VALIDATORS = [
    {'NAME': 'django.contrib.auth.password_validation.UserAttributeSimilarityValidator'},
    {'NAME': 'django.contrib.auth.password_validation.MinimumLengthValidator'},
    {'NAME': 'django.contrib.auth.password_validation.CommonPasswordValidator'},
    {'NAME': 'django.contrib.auth.password_validation.NumericPasswordValidator'},
]

# Internationalization
LANGUAGE_CODE = 'en-us'
TIME_ZONE = 'Africa/Kigali'
USE_I18N = True
USE_TZ = True

# Static & Media files
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS
CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[
    'http://localhost:5173',
    'http://localhost:3000',
])
CORS_ALLOW_CREDENTIALS = True

# Django REST Framework
REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': (
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ),
    'DEFAULT_PERMISSION_CLASSES': (
        'rest_framework.permissions.IsAuthenticated',
    ),
    'DEFAULT_FILTER_BACKENDS': (
        'django_filters.rest_framework.DjangoFilterBackend',
        'rest_framework.filters.SearchFilter',
        'rest_framework.filters.OrderingFilter',
    ),
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 50,
    'DEFAULT_SCHEMA_CLASS': 'drf_spectacular.openapi.AutoSchema',
}

# JWT Configuration
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(minutes=int(env('ACCESS_TOKEN_LIFETIME_MINUTES', default=30))),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=int(env('REFRESH_TOKEN_LIFETIME_DAYS', default=7))),
    'ROTATE_REFRESH_TOKENS': True,
    'BLACKLIST_AFTER_ROTATION': True,
    'AUTH_HEADER_TYPES': ('Bearer',),
    'AUTH_TOKEN_CLASSES': ('rest_framework_simplejwt.tokens.AccessToken',),
}

# drf-spectacular (API docs)
SPECTACULAR_SETTINGS = {
    'TITLE': 'SkillSense API',
    'DESCRIPTION': 'AI-Powered Labour-Market Intelligence Platform for Rwanda ICT Sector',
    'VERSION': '1.0.0',
    'SERVE_INCLUDE_SCHEMA': False,
}

# Celery
CELERY_BROKER_URL = env('CELERY_BROKER_URL', default='redis://localhost:6379/0')
CELERY_RESULT_BACKEND = env('CELERY_RESULT_BACKEND', default='redis://localhost:6379/0')
CELERY_ACCEPT_CONTENT = ['json']
CELERY_TASK_SERIALIZER = 'json'
CELERY_RESULT_SERIALIZER = 'json'
CELERY_TIMEZONE = 'Africa/Kigali'

# ML Model paths
ML_MODEL_PATH = BASE_DIR / env('ML_MODEL_PATH', default='models/skillsense_forecast_model.joblib')
ML_CORRECTION_FACTORS_PATH = BASE_DIR / env('ML_CORRECTION_FACTORS_PATH', default='models/correction_factors.joblib')
```

### 2.3: Create Celery configuration

Create `skillsense_backend/celery.py`:

```python
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'skillsense_backend.settings')

app = Celery('skillsense_backend')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
```

Update `skillsense_backend/__init__.py`:

```python
from .celery import app as celery_app

__all__ = ('celery_app',)
```

### 2.4: Configure project URLs

Update `skillsense_backend/urls.py`:

```python
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

urlpatterns = [
    path('admin/', admin.site.urls),

    # API endpoints (Delphin will populate these)
    path('api/auth/', include('accounts.urls')),
    path('api/taxonomy/', include('taxonomy.urls')),
    path('api/predictions/', include('predictions.urls')),
    path('api/dashboard/', include('predictions.dashboard_urls')),
    path('api/uploads/', include('uploads.urls')),
    path('api/analytics/', include('analytics.urls')),
    path('api/reports/', include('reports.urls')),

    # API documentation
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    path('api/docs/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

**Note:** Each app needs an empty `urls.py` file for now. Create placeholder files:

```bash
# Create empty URL files so Django doesn't crash on startup
for app in accounts taxonomy predictions uploads analytics reports; do
    echo "from django.urls import path

urlpatterns = []
" > $app/urls.py
done

# predictions also needs dashboard_urls.py
echo "from django.urls import path

urlpatterns = []
" > predictions/dashboard_urls.py
```

---

## Step 3: Database Models

### 3.1: Core app — `core/models.py`

Shared abstract base model used by all other models:

```python
from django.db import models


class TimestampedModel(models.Model):
    """Abstract base model with created/updated timestamps."""
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        abstract = True
```

### 3.2: Accounts app — `accounts/models.py`

```python
from django.contrib.auth.models import AbstractUser
from django.db import models
from core.models import TimestampedModel


class Institution(TimestampedModel):
    """An organization that users belong to."""

    class InstitutionType(models.TextChoices):
        GOVERNMENT = 'government', 'Government'
        UNIVERSITY = 'university', 'University'
        NGO = 'ngo', 'NGO'
        PRIVATE = 'private', 'Private'
        OTHER = 'other', 'Other'

    name = models.CharField(max_length=255, unique=True)
    type = models.CharField(max_length=20, choices=InstitutionType.choices)
    description = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class User(AbstractUser):
    """Custom user model with role-based access and institution scope."""

    class UserRole(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        POLICY_MAKER = 'policy_maker', 'Policy Maker'
        EDUCATION_PLANNER = 'education_planner', 'Education Planner'
        CAREER_ADVISOR = 'career_advisor', 'Career Advisor'
        RESEARCHER = 'researcher', 'Researcher'

    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.RESEARCHER,
    )
    institution = models.ForeignKey(
        Institution,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users',
    )

    # Use email as the login field
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    class Meta:
        ordering = ['-date_joined']

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"

    @property
    def is_admin_user(self):
        return self.role == self.UserRole.ADMIN or self.is_superuser
```

### 3.3: Taxonomy app — `taxonomy/models.py`

This holds the ICT role taxonomy. The roles map directly to the 20 roles in our datasets.

```python
from django.db import models
from core.models import TimestampedModel


class RoleGroup(TimestampedModel):
    """Top-level grouping of ICT roles (e.g., 'Software Development', 'Data & Analytics')."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, default='')
    sort_order = models.IntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name


class RoleFamily(TimestampedModel):
    """Mid-level grouping (e.g., 'Backend Development' under 'Software Development')."""
    name = models.CharField(max_length=100)
    role_group = models.ForeignKey(
        RoleGroup,
        on_delete=models.CASCADE,
        related_name='families',
    )

    class Meta:
        ordering = ['role_group__sort_order', 'name']
        verbose_name_plural = 'Role families'
        unique_together = ['name', 'role_group']

    def __str__(self):
        return f"{self.role_group.name} → {self.name}"


class NormalizedRole(TimestampedModel):
    """A specific ICT role (e.g., 'Backend Developer', 'DevOps / Cloud Engineer').

    These are the 20 roles tracked in our historical dataset.
    """
    name = models.CharField(max_length=100, unique=True)
    role_family = models.ForeignKey(
        RoleFamily,
        on_delete=models.CASCADE,
        related_name='roles',
    )
    emergence_year = models.IntegerField(
        help_text="Year this role first appeared in Rwanda's ICT market"
    )
    is_emerging = models.BooleanField(
        default=False,
        help_text="True for Layer 2 emerging roles (AI/ML, etc.) not yet in Rwanda"
    )
    global_trend_signal = models.FloatField(
        null=True,
        blank=True,
        help_text="Global trend strength 0-100, nullable — for Layer 2 future use"
    )
    description = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class HistoricalDemand(models.Model):
    """One row per role per year — the historical demand dataset (Dataset A).

    440 rows total: 20 roles x 22 years (2005-2026).
    """
    year = models.IntegerField(db_index=True)
    role = models.ForeignKey(
        NormalizedRole,
        on_delete=models.CASCADE,
        related_name='historical_demand',
    )
    role_demand_index = models.FloatField(
        help_text="Demand index 0-100, max within each year = 100"
    )
    role_share_within_ict_pct = models.FloatField(
        help_text="Role's share of ICT employment in percent"
    )
    role_employment_proxy = models.FloatField(
        help_text="Estimated number of people employed in this role"
    )
    data_basis = models.CharField(
        max_length=100,
        blank=True,
        default='',
        help_text="Source of this data point (e.g., 'LFS_microdata', 'back_extrapolation')"
    )
    synthetic_flag = models.BooleanField(
        default=False,
        help_text="True if this row is back-extrapolated (2005-2016)"
    )

    class Meta:
        ordering = ['year', 'role__name']
        unique_together = ['year', 'role']

    def __str__(self):
        return f"{self.role.name} ({self.year})"


class MacroIndicator(models.Model):
    """National-level labour market indicators per year.

    One row per year (2005-2026). Used as features in the ML model.
    """
    year = models.IntegerField(unique=True)
    total_employment = models.BigIntegerField()
    ict_employment = models.IntegerField()
    ict_employment_share_pct = models.FloatField()
    labour_force_participation_rate_pct = models.FloatField()
    unemployment_rate_pct = models.FloatField()
    employment_to_population_ratio_pct = models.FloatField()
    tertiary_employment_count = models.BigIntegerField()
    data_source = models.CharField(
        max_length=100,
        blank=True,
        default='',
        help_text="e.g., 'NISR_LFS_2023', 'extrapolated'"
    )

    class Meta:
        ordering = ['year']

    def __str__(self):
        return f"Macro {self.year} (ICT: {self.ict_employment_share_pct:.1f}%)"
```

### 3.4: Predictions app — `predictions/models.py`

```python
from django.db import models
from core.models import TimestampedModel
from taxonomy.models import NormalizedRole


class ForecastRun(TimestampedModel):
    """A single execution of the forecasting pipeline.

    Each run produces forecasts for all roles at all horizons.
    The latest run is what the API serves.
    """
    model_version = models.CharField(
        max_length=50,
        help_text="e.g., 'two_stage_v1', 'lightgbm_v2'"
    )
    training_data_hash = models.CharField(
        max_length=64,
        blank=True,
        default='',
        help_text="SHA256 of training data for reproducibility"
    )
    accuracy_spearman = models.FloatField(
        null=True, blank=True,
        help_text="Spearman rank correlation against validation data"
    )
    accuracy_pearson = models.FloatField(
        null=True, blank=True,
        help_text="Pearson share correlation against validation data"
    )
    accuracy_mae = models.FloatField(null=True, blank=True)
    accuracy_rmse = models.FloatField(null=True, blank=True)
    accuracy_r2 = models.FloatField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Forecast Run {self.id} ({self.model_version}, {self.created_at:%Y-%m-%d})"


class RoleForecast(models.Model):
    """A single forecast: one role at one horizon from one forecast run.

    60 rows per run: 20 roles x 3 horizons (6m, 1y, 2y).
    """

    class Horizon(models.TextChoices):
        SIX_MONTHS = '6m', '6 Months'
        ONE_YEAR = '1y', '1 Year'
        TWO_YEARS = '2y', '2 Years'

    class TrendDirection(models.TextChoices):
        GROWING = 'growing', 'Growing'
        STABLE = 'stable', 'Stable'
        DECLINING = 'declining', 'Declining'

    forecast_run = models.ForeignKey(
        ForecastRun,
        on_delete=models.CASCADE,
        related_name='forecasts',
    )
    role = models.ForeignKey(
        NormalizedRole,
        on_delete=models.CASCADE,
        related_name='forecasts',
    )
    horizon = models.CharField(max_length=5, choices=Horizon.choices)
    demand_index = models.FloatField(
        help_text="Forecasted demand index 0-100"
    )
    share_pct = models.FloatField(
        help_text="Forecasted share of ICT employment in percent"
    )
    employment_proxy = models.FloatField(
        help_text="Forecasted number of people in this role"
    )
    confidence_lower = models.FloatField(
        null=True, blank=True,
        help_text="Lower bound of 90% confidence interval"
    )
    confidence_upper = models.FloatField(
        null=True, blank=True,
        help_text="Upper bound of 90% confidence interval"
    )
    trend_direction = models.CharField(
        max_length=10,
        choices=TrendDirection.choices,
    )

    class Meta:
        ordering = ['forecast_run', 'horizon', '-demand_index']
        unique_together = ['forecast_run', 'role', 'horizon']

    def __str__(self):
        return f"{self.role.name} ({self.horizon}): {self.demand_index:.1f}"
```

### 3.5: Uploads app — `uploads/models.py`

```python
from django.db import models
from django.conf import settings
from core.models import TimestampedModel
from taxonomy.models import NormalizedRole


class DataUpload(TimestampedModel):
    """A CSV file uploaded by an admin for processing."""

    class UploadStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PROCESSING = 'processing', 'Processing'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploads',
    )
    file = models.FileField(upload_to='uploads/%Y/%m/')
    original_filename = models.CharField(max_length=255)
    status = models.CharField(
        max_length=20,
        choices=UploadStatus.choices,
        default=UploadStatus.PENDING,
    )
    total_records = models.IntegerField(default=0)
    ict_records = models.IntegerField(default=0)
    error_count = models.IntegerField(default=0)
    processing_log = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.original_filename} ({self.status})"


class JobPosting(TimestampedModel):
    """A single job posting — either from seed data (Dataset B) or a CSV upload.

    Maps directly to the columns in ict_job_postings_v2.csv.
    """
    upload = models.ForeignKey(
        DataUpload,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='postings',
        help_text="Null for seed data (Dataset B)"
    )

    # Source info
    source = models.CharField(max_length=100)
    source_job_id = models.CharField(max_length=100, blank=True, default='')
    source_url = models.URLField(max_length=500, blank=True, default='')

    # Job details
    title = models.CharField(max_length=500)
    company = models.CharField(max_length=255, blank=True, default='')
    location_raw = models.CharField(max_length=255, blank=True, default='')
    country = models.CharField(max_length=100, default='Rwanda')
    industry_raw = models.CharField(max_length=255, blank=True, default='')
    education_raw = models.CharField(max_length=255, blank=True, default='')
    experience_raw = models.CharField(max_length=255, blank=True, default='')
    contract_type_raw = models.CharField(max_length=100, blank=True, default='')
    closing_date = models.DateField(null=True, blank=True)
    posted_date = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True, default='')
    raw_text = models.TextField(blank=True, default='')

    # ICT classification
    is_ict = models.BooleanField(default=False)
    ict_role_confidence = models.FloatField(
        default=0.0,
        help_text="Confidence that this posting is an ICT role (0-1)"
    )
    normalized_role = models.ForeignKey(
        NormalizedRole,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='postings',
    )
    role_level = models.CharField(max_length=50, blank=True, default='')
    role_normalization_confidence = models.FloatField(default=0.0)
    classification_reason = models.TextField(blank=True, default='')

    # Review
    needs_manual_review = models.BooleanField(default=False)
    manual_review_reason = models.CharField(max_length=255, blank=True, default='')

    # Timestamps
    scraped_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.company})"
```

### 3.6: Analytics app — `analytics/models.py`

```python
from django.contrib.gis.db import models as gis_models
from django.db import models
from core.models import TimestampedModel
from taxonomy.models import NormalizedRole


class GeographicDemand(TimestampedModel):
    """ICT demand by geographic location (province/district) — PostGIS enabled."""
    province = models.CharField(max_length=100, db_index=True)
    district = models.CharField(max_length=100, db_index=True)
    role = models.ForeignKey(
        NormalizedRole,
        on_delete=models.CASCADE,
        related_name='geographic_demand',
    )
    year = models.IntegerField()
    posting_count = models.IntegerField(default=0)
    demand_score = models.FloatField(
        default=0.0,
        help_text="Normalized demand intensity 0-100"
    )
    geom = gis_models.MultiPolygonField(
        srid=4326,
        null=True,
        blank=True,
        help_text="District boundary polygon (GeoJSON)"
    )

    class Meta:
        ordering = ['province', 'district', '-year']
        unique_together = ['province', 'district', 'role', 'year']

    def __str__(self):
        return f"{self.district}, {self.province} — {self.role.name} ({self.year})"


class SectorDemand(TimestampedModel):
    """ICT demand by industry sector."""
    industry = models.CharField(max_length=255, db_index=True)
    role = models.ForeignKey(
        NormalizedRole,
        on_delete=models.CASCADE,
        related_name='sector_demand',
    )
    year = models.IntegerField()
    posting_count = models.IntegerField(default=0)

    class Meta:
        ordering = ['industry', '-year']
        unique_together = ['industry', 'role', 'year']

    def __str__(self):
        return f"{self.industry} — {self.role.name} ({self.year})"
```

### 3.7: Reports app — `reports/models.py`

```python
from django.db import models
from django.conf import settings
from core.models import TimestampedModel


class GeneratedReport(TimestampedModel):
    """A generated report (PDF or CSV)."""

    class ReportType(models.TextChoices):
        DEMAND_OUTLOOK = 'demand_outlook', 'ICT Demand Outlook'
        ROLE_DEEP_DIVE = 'role_deep_dive', 'Role-Specific Deep Dive'
        EDUCATION_GAP = 'education_gap', 'Education Gap Report'
        WORKFORCE_PLANNING = 'workforce_planning', 'Workforce Planning Brief'

    class ReportFormat(models.TextChoices):
        PDF = 'pdf', 'PDF'
        CSV = 'csv', 'CSV'
        JSON = 'json', 'JSON'

    report_type = models.CharField(max_length=30, choices=ReportType.choices)
    format = models.CharField(max_length=10, choices=ReportFormat.choices)
    title = models.CharField(max_length=255)
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='generated_reports',
    )
    file = models.FileField(upload_to='reports/%Y/%m/', null=True, blank=True)
    parameters = models.JSONField(
        default=dict,
        blank=True,
        help_text="Parameters used to generate this report (filters, date range, etc.)"
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.report_type}, {self.format})"
```

---

## Step 4: Authentication & RBAC (Phase 3D)

### 4.1: Custom permission classes — `accounts/permissions.py`

```python
from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """Full access — admin users only."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin_user


class IsPolicyMaker(BasePermission):
    """Access to dashboard, forecasts, policy planning, reports."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ('admin', 'policy_maker') or request.user.is_superuser


class IsEducationPlanner(BasePermission):
    """Access to skills gaps, training alignment, curriculum."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ('admin', 'education_planner') or request.user.is_superuser


class IsCareerAdvisor(BasePermission):
    """Access to career guidance, employability, role outlooks."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ('admin', 'career_advisor') or request.user.is_superuser


class IsResearcher(BasePermission):
    """Access to full analytics, data exports, historical trends."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ('admin', 'researcher') or request.user.is_superuser


class IsAnyAuthenticated(BasePermission):
    """Any authenticated user with any role — used for shared read-only endpoints."""
    def has_permission(self, request, view):
        return request.user.is_authenticated
```

### 4.2: Account serializers — `accounts/serializers.py`

```python
from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Institution

User = get_user_model()


class InstitutionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Institution
        fields = ['id', 'name', 'type', 'description', 'created_at']
        read_only_fields = ['id', 'created_at']


class UserSerializer(serializers.ModelSerializer):
    institution = InstitutionSerializer(read_only=True)
    institution_id = serializers.PrimaryKeyRelatedField(
        queryset=Institution.objects.all(),
        source='institution',
        write_only=True,
        required=False,
        allow_null=True,
    )

    class Meta:
        model = User
        fields = [
            'id', 'email', 'username', 'first_name', 'last_name',
            'role', 'institution', 'institution_id',
            'is_active', 'date_joined',
        ]
        read_only_fields = ['id', 'is_active', 'date_joined']


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, min_length=8)
    password_confirm = serializers.CharField(write_only=True)
    institution_id = serializers.PrimaryKeyRelatedField(
        queryset=Institution.objects.all(),
        source='institution',
        required=False,
        allow_null=True,
    )

    class Meta:
        model = User
        fields = [
            'email', 'username', 'first_name', 'last_name',
            'password', 'password_confirm', 'role', 'institution_id',
        ]

    def validate(self, attrs):
        if attrs['password'] != attrs.pop('password_confirm'):
            raise serializers.ValidationError({"password_confirm": "Passwords do not match."})
        return attrs

    def create(self, validated_data):
        password = validated_data.pop('password')
        user = User(**validated_data)
        user.set_password(password)
        user.save()
        return user
```

### 4.3: Register admin models — `accounts/admin.py`

```python
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, Institution


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['email', 'first_name', 'last_name', 'role', 'institution', 'is_active']
    list_filter = ['role', 'is_active', 'institution']
    search_fields = ['email', 'first_name', 'last_name']
    ordering = ['-date_joined']

    fieldsets = BaseUserAdmin.fieldsets + (
        ('SkillSense', {'fields': ('role', 'institution')}),
    )


@admin.register(Institution)
class InstitutionAdmin(admin.ModelAdmin):
    list_display = ['name', 'type', 'created_at']
    list_filter = ['type']
    search_fields = ['name']
```

Register admin for other apps too. Create `taxonomy/admin.py`:

```python
from django.contrib import admin
from .models import RoleGroup, RoleFamily, NormalizedRole, HistoricalDemand, MacroIndicator


@admin.register(RoleGroup)
class RoleGroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'sort_order']
    ordering = ['sort_order']


@admin.register(RoleFamily)
class RoleFamilyAdmin(admin.ModelAdmin):
    list_display = ['name', 'role_group']
    list_filter = ['role_group']


@admin.register(NormalizedRole)
class NormalizedRoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'role_family', 'emergence_year', 'is_emerging']
    list_filter = ['is_emerging', 'role_family__role_group']
    search_fields = ['name']


@admin.register(HistoricalDemand)
class HistoricalDemandAdmin(admin.ModelAdmin):
    list_display = ['year', 'role', 'role_demand_index', 'role_share_within_ict_pct']
    list_filter = ['year', 'synthetic_flag']
    search_fields = ['role__name']


@admin.register(MacroIndicator)
class MacroIndicatorAdmin(admin.ModelAdmin):
    list_display = ['year', 'ict_employment', 'ict_employment_share_pct', 'unemployment_rate_pct']
    ordering = ['year']
```

---

## Step 5: Seed Data Management Commands

These commands load our existing CSV data into the database.

### 5.1: Taxonomy seed — `taxonomy/management/commands/seed_taxonomy.py`

Create the directory structure first:

```bash
mkdir -p taxonomy/management/commands
touch taxonomy/management/__init__.py
touch taxonomy/management/commands/__init__.py
```

```python
"""
Load the ICT role taxonomy into the database.

The 20 roles are organized into groups and families based on the
classification used in our dataset.

Usage:
    python manage.py seed_taxonomy
"""
from django.core.management.base import BaseCommand
from taxonomy.models import RoleGroup, RoleFamily, NormalizedRole


# Our complete taxonomy: group → family → roles
TAXONOMY = {
    "Software Development": {
        "sort_order": 1,
        "families": {
            "Backend Development": [
                {"name": "Backend Developer", "emergence_year": 2012},
            ],
            "Frontend Development": [
                {"name": "Frontend / Web Developer", "emergence_year": 2010},
            ],
            "Full-Stack Development": [
                {"name": "Full-Stack Developer", "emergence_year": 2014},
            ],
            "Mobile Development": [
                {"name": "Mobile App Developer", "emergence_year": 2013},
            ],
            "General Software": [
                {"name": "Software Developer / Software Engineer", "emergence_year": 2010},
            ],
            "Quality Assurance": [
                {"name": "QA / Software Test Engineer", "emergence_year": 2015},
            ],
        },
    },
    "Data & Analytics": {
        "sort_order": 2,
        "families": {
            "Data Analysis": [
                {"name": "Data Analyst", "emergence_year": 2015},
            ],
            "Data Engineering": [
                {"name": "Data Engineer", "emergence_year": 2017},
            ],
            "Data Science": [
                {"name": "Data Scientist", "emergence_year": 2020},
            ],
            "Database Management": [
                {"name": "Database Administrator", "emergence_year": 2010},
            ],
        },
    },
    "Infrastructure & Operations": {
        "sort_order": 3,
        "families": {
            "System Administration": [
                {"name": "Systems Administrator", "emergence_year": 2010},
            ],
            "Network Engineering": [
                {"name": "Network Engineer / Network Administrator", "emergence_year": 2010},
            ],
            "IT Support": [
                {"name": "IT Support / Help Desk Technician", "emergence_year": 2010},
            ],
            "IT Administration": [
                {"name": "IT Officer / ICT Administrator", "emergence_year": 2010},
            ],
        },
    },
    "Cloud & DevOps": {
        "sort_order": 4,
        "families": {
            "DevOps": [
                {"name": "DevOps / Cloud Engineer", "emergence_year": 2018},
            ],
        },
    },
    "Security & Governance": {
        "sort_order": 5,
        "families": {
            "Cybersecurity": [
                {"name": "Cybersecurity Analyst / Security Engineer", "emergence_year": 2016},
            ],
            "IT Governance": [
                {"name": "IT Auditor / IT Governance & Risk", "emergence_year": 2015},
            ],
        },
    },
    "Management & Analysis": {
        "sort_order": 6,
        "families": {
            "IT Management": [
                {"name": "ICT Manager / IT Manager", "emergence_year": 2010},
            ],
            "Business Analysis": [
                {"name": "Systems Analyst / IT Business Analyst", "emergence_year": 2012},
            ],
        },
    },
    "Other": {
        "sort_order": 99,
        "families": {
            "Other Technical": [
                {"name": "Other ICT Technical Roles", "emergence_year": 2010},
            ],
        },
    },
}


class Command(BaseCommand):
    help = 'Load the ICT role taxonomy (groups, families, roles) into the database'

    def handle(self, *args, **options):
        created_groups = 0
        created_families = 0
        created_roles = 0

        for group_name, group_data in TAXONOMY.items():
            group, g_created = RoleGroup.objects.get_or_create(
                name=group_name,
                defaults={'sort_order': group_data['sort_order']},
            )
            if g_created:
                created_groups += 1

            for family_name, roles in group_data['families'].items():
                family, f_created = RoleFamily.objects.get_or_create(
                    name=family_name,
                    role_group=group,
                )
                if f_created:
                    created_families += 1

                for role_data in roles:
                    role, r_created = NormalizedRole.objects.get_or_create(
                        name=role_data['name'],
                        defaults={
                            'role_family': family,
                            'emergence_year': role_data['emergence_year'],
                            'is_emerging': False,
                        },
                    )
                    if r_created:
                        created_roles += 1

        self.stdout.write(self.style.SUCCESS(
            f'Taxonomy loaded: {created_groups} groups, '
            f'{created_families} families, {created_roles} roles'
        ))
```

### 5.2: Historical data seed — `taxonomy/management/commands/seed_historical_data.py`

```python
"""
Load Dataset A (historical ICT labour data) into HistoricalDemand + MacroIndicator tables.

Reads from:
  - skillsense_job_data/data/historical/skillsense_ict_labour_history_2005_2009.csv
  - skillsense_job_data/data/historical/skillsense_ict_labour_history_2010_2018.csv
  - skillsense_job_data/data/historical/skillsense_ict_labour_history_2019_2026.csv

Usage:
    python manage.py seed_historical_data
"""
import csv
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from taxonomy.models import NormalizedRole, HistoricalDemand, MacroIndicator


DATA_DIR = Path(settings.BASE_DIR) / 'skillsense_job_data' / 'data' / 'historical'

CSV_FILES = [
    'skillsense_ict_labour_history_2005_2009.csv',
    'skillsense_ict_labour_history_2010_2018.csv',
    'skillsense_ict_labour_history_2019_2026.csv',
]


class Command(BaseCommand):
    help = 'Load Dataset A (440 historical rows) into HistoricalDemand + MacroIndicator'

    def handle(self, *args, **options):
        # Build role lookup
        roles = {r.name: r for r in NormalizedRole.objects.all()}
        if not roles:
            self.stderr.write(self.style.ERROR(
                'No roles found. Run "python manage.py seed_taxonomy" first.'
            ))
            return

        demand_created = 0
        macro_years_seen = set()

        for csv_file in CSV_FILES:
            filepath = DATA_DIR / csv_file
            if not filepath.exists():
                self.stderr.write(self.style.WARNING(f'File not found: {filepath}'))
                continue

            self.stdout.write(f'Loading {csv_file}...')

            with open(filepath, 'r') as f:
                reader = csv.DictReader(f)
                for row in reader:
                    year = int(row['year'])
                    role_name = row['role']

                    # Match role name to NormalizedRole
                    role_obj = roles.get(role_name)
                    if role_obj is None:
                        self.stderr.write(
                            self.style.WARNING(f'  Unknown role: {role_name} (year {year})')
                        )
                        continue

                    # Create HistoricalDemand
                    _, created = HistoricalDemand.objects.get_or_create(
                        year=year,
                        role=role_obj,
                        defaults={
                            'role_demand_index': float(row['role_demand_index']),
                            'role_share_within_ict_pct': float(row['role_share_within_ict_pct']),
                            'role_employment_proxy': float(row['role_employment_proxy']),
                            'data_basis': row.get('data_basis', ''),
                            'synthetic_flag': row.get('synthetic_flag', '0') in ('1', 'True', 'true', 'TRUE'),
                        },
                    )
                    if created:
                        demand_created += 1

                    # Create MacroIndicator (one per year)
                    if year not in macro_years_seen:
                        macro_years_seen.add(year)
                        MacroIndicator.objects.get_or_create(
                            year=year,
                            defaults={
                                'total_employment': int(float(row['total_employment'])),
                                'ict_employment': int(float(row['ict_employment'])),
                                'ict_employment_share_pct': float(row['ict_employment_share_pct']),
                                'labour_force_participation_rate_pct': float(row['labour_force_participation_rate_pct']),
                                'unemployment_rate_pct': float(row['unemployment_rate_pct']),
                                'employment_to_population_ratio_pct': float(row['employment_to_population_ratio_pct']),
                                'tertiary_employment_count': int(float(row['tertiary_employment_count'])),
                                'data_source': row.get('data_basis', ''),
                            },
                        )

        self.stdout.write(self.style.SUCCESS(
            f'Historical data loaded: {demand_created} demand rows, '
            f'{len(macro_years_seen)} macro years'
        ))
```

### 5.3: Job postings seed — `uploads/management/commands/seed_job_postings.py`

Create directory structure:

```bash
mkdir -p uploads/management/commands
touch uploads/management/__init__.py
touch uploads/management/commands/__init__.py
```

```python
"""
Load Dataset B (92 job postings) into JobPosting table.

Reads from:
  - skillsense_job_data/data/current_ict/ict_job_postings_v2.csv

Usage:
    python manage.py seed_job_postings
"""
import csv
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from taxonomy.models import NormalizedRole
from uploads.models import JobPosting


DATA_FILE = (
    Path(settings.BASE_DIR)
    / 'skillsense_job_data'
    / 'data'
    / 'current_ict'
    / 'ict_job_postings_v2.csv'
)


class Command(BaseCommand):
    help = 'Load Dataset B (92 job postings) into JobPosting table'

    def handle(self, *args, **options):
        if not DATA_FILE.exists():
            self.stderr.write(self.style.ERROR(f'File not found: {DATA_FILE}'))
            return

        roles = {r.name: r for r in NormalizedRole.objects.all()}
        created = 0

        with open(DATA_FILE, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                role_name = row.get('normalized_role', '')
                role_obj = roles.get(role_name)

                _, was_created = JobPosting.objects.get_or_create(
                    source=row.get('source', ''),
                    source_job_id=row.get('source_job_id', ''),
                    title=row.get('title', ''),
                    defaults={
                        'upload': None,  # Seed data, no upload record
                        'source_url': row.get('source_url', ''),
                        'company': row.get('company', ''),
                        'location_raw': row.get('location_raw', ''),
                        'country': row.get('country', 'Rwanda'),
                        'industry_raw': row.get('industry_raw', ''),
                        'education_raw': row.get('education_raw', ''),
                        'experience_raw': row.get('experience_raw', ''),
                        'contract_type_raw': row.get('contract_type_raw', ''),
                        'description': row.get('description', ''),
                        'raw_text': row.get('raw_text', ''),
                        'is_ict': row.get('is_ict', '').lower() in ('true', '1', 'yes'),
                        'ict_role_confidence': float(row.get('ict_role_confidence', 0) or 0),
                        'normalized_role': role_obj,
                        'role_level': row.get('role_level', ''),
                        'role_normalization_confidence': float(row.get('role_normalization_confidence', 0) or 0),
                        'classification_reason': row.get('classification_reason', ''),
                        'needs_manual_review': row.get('needs_manual_review', '').lower() in ('true', '1', 'yes'),
                        'manual_review_reason': row.get('manual_review_reason', ''),
                    },
                )
                if was_created:
                    created += 1

        self.stdout.write(self.style.SUCCESS(f'Job postings loaded: {created} rows'))
```

### 5.4: Admin user seed — `accounts/management/commands/seed_admin.py`

```bash
mkdir -p accounts/management/commands
touch accounts/management/__init__.py
touch accounts/management/commands/__init__.py
```

```python
"""
Create the initial admin user and default institutions.

Usage:
    python manage.py seed_admin
"""
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from accounts.models import Institution

User = get_user_model()


class Command(BaseCommand):
    help = 'Create default institutions and admin user'

    def handle(self, *args, **options):
        # Create default institutions
        institutions = [
            ('MIFOTRA', 'government'),
            ('Rwanda Development Board', 'government'),
            ('MINICT', 'government'),
            ('University of Rwanda', 'university'),
            ('Carnegie Mellon University Africa', 'university'),
            ('African Leadership University', 'university'),
        ]
        for name, inst_type in institutions:
            Institution.objects.get_or_create(
                name=name,
                defaults={'type': inst_type},
            )
        self.stdout.write(f'Created/verified {len(institutions)} institutions')

        # Create admin user
        if not User.objects.filter(email='admin@skillsense.rw').exists():
            User.objects.create_superuser(
                email='admin@skillsense.rw',
                username='admin',
                password='admin123456',   # Change in production!
                first_name='Admin',
                last_name='SkillSense',
                role='admin',
            )
            self.stdout.write(self.style.SUCCESS('Admin user created: admin@skillsense.rw'))
        else:
            self.stdout.write('Admin user already exists')
```

### 5.5: Forecast data seed — `predictions/management/commands/seed_forecasts.py`

```bash
mkdir -p predictions/management/commands
touch predictions/management/__init__.py
touch predictions/management/commands/__init__.py
```

```python
"""
Load the current forecast CSV into ForecastRun + RoleForecast tables.

Reads from:
  - models/forecast_results_2027_2028.csv

Usage:
    python manage.py seed_forecasts
"""
import csv
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from taxonomy.models import NormalizedRole
from predictions.models import ForecastRun, RoleForecast


FORECAST_FILE = Path(settings.BASE_DIR) / 'models' / 'forecast_results_2027_2028.csv'


class Command(BaseCommand):
    help = 'Load forecast CSV into ForecastRun + RoleForecast tables'

    def handle(self, *args, **options):
        if not FORECAST_FILE.exists():
            self.stderr.write(self.style.ERROR(f'File not found: {FORECAST_FILE}'))
            self.stderr.write('Run "python models/phase2d_final_model.py" first.')
            return

        roles = {r.name: r for r in NormalizedRole.objects.all()}

        # Create a ForecastRun record
        forecast_run = ForecastRun.objects.create(
            model_version='two_stage_v1',
            accuracy_spearman=0.9898,
            accuracy_pearson=0.9946,
            accuracy_r2=0.9580,
            accuracy_mae=0.3277,
            notes='Two-Stage model: LightGBM trend (2010-2026) + Dataset B correction factors',
        )

        created = 0
        with open(FORECAST_FILE, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                role_name = row['role']
                role_obj = roles.get(role_name)
                if role_obj is None:
                    self.stderr.write(self.style.WARNING(f'Unknown role: {role_name}'))
                    continue

                # Map horizon label to enum
                horizon_raw = row.get('horizon', '')
                if '6' in horizon_raw:
                    horizon = '6m'
                elif '2' in horizon_raw:
                    horizon = '2y'
                else:
                    horizon = '1y'

                RoleForecast.objects.create(
                    forecast_run=forecast_run,
                    role=role_obj,
                    horizon=horizon,
                    demand_index=float(row.get('forecasted_demand_index', 0)),
                    share_pct=float(row.get('forecasted_share_pct', 0)),
                    employment_proxy=float(row.get('forecasted_employment_proxy', 0)),
                    confidence_lower=float(row.get('confidence_lower', 0) or 0),
                    confidence_upper=float(row.get('confidence_upper', 0) or 0),
                    trend_direction=row.get('trend_direction', 'stable'),
                )
                created += 1

        self.stdout.write(self.style.SUCCESS(
            f'Forecast loaded: {created} rows in ForecastRun #{forecast_run.id}'
        ))
```

---

## Step 6: Run Migrations and Seed

Once all models are defined:

```bash
# Make migrations
python manage.py makemigrations accounts taxonomy predictions uploads analytics reports

# Apply migrations
python manage.py migrate

# Seed data (run in this order — taxonomy must be first)
python manage.py seed_taxonomy
python manage.py seed_admin
python manage.py seed_historical_data
python manage.py seed_job_postings
python manage.py seed_forecasts

# Verify
python manage.py shell -c "
from taxonomy.models import NormalizedRole, HistoricalDemand, MacroIndicator
from uploads.models import JobPosting
from predictions.models import ForecastRun, RoleForecast
print(f'Roles:     {NormalizedRole.objects.count()} (expect 20)')
print(f'History:   {HistoricalDemand.objects.count()} (expect 440)')
print(f'Macro:     {MacroIndicator.objects.count()} (expect 22)')
print(f'Postings:  {JobPosting.objects.count()} (expect 92)')
print(f'Forecasts: {RoleForecast.objects.count()} (expect 60)')
"
```

Expected output:
```
Roles:     20
History:   440
Macro:     22
Postings:  92
Forecasts: 60
```

---

## Step 7: Verify & Push

```bash
# Start Django dev server — should run without errors
python manage.py runserver

# Check admin panel at http://localhost:8000/admin/
# Login with admin@skillsense.rw / admin123456

# If everything works, commit and push
git add -A
git commit -m "feat: Phase 3A+3B+3D — Django project setup, all models, auth, seed data"
git push -u origin feature/backend-foundation
```

---

## Checklist — What "Done" Looks Like

- [ ] Django project created at root (`manage.py`, `skillsense_backend/`)
- [ ] 7 apps created: `core`, `accounts`, `taxonomy`, `predictions`, `uploads`, `analytics`, `reports`
- [ ] Settings configured: PostgreSQL+PostGIS, CORS, JWT, Celery, drf-spectacular
- [ ] `.env` file created (gitignored)
- [ ] Custom `User` model with email login, role field, institution FK
- [ ] `Institution` model
- [ ] Full taxonomy models: `RoleGroup`, `RoleFamily`, `NormalizedRole`
- [ ] `HistoricalDemand` and `MacroIndicator` models
- [ ] `ForecastRun` and `RoleForecast` models
- [ ] `DataUpload` and `JobPosting` models
- [ ] `GeographicDemand` (PostGIS) and `SectorDemand` models
- [ ] `GeneratedReport` model
- [ ] 5 custom permission classes (`IsAdminUser`, `IsPolicyMaker`, `IsEducationPlanner`, `IsCareerAdvisor`, `IsResearcher`)
- [ ] Account serializers (`UserSerializer`, `RegisterSerializer`, `InstitutionSerializer`)
- [ ] Admin site registration for all models
- [ ] 5 seed data management commands (`seed_taxonomy`, `seed_admin`, `seed_historical_data`, `seed_job_postings`, `seed_forecasts`)
- [ ] Migrations run successfully
- [ ] All seed data loaded (20 roles, 440 history, 22 macro, 92 postings, 60 forecasts)
- [ ] Django dev server starts without errors
- [ ] Admin panel accessible and shows all seeded data
- [ ] Placeholder `urls.py` files in every app (so Delphin can add views)
- [ ] Branch pushed to `feature/backend-foundation`

---

## Coordination with Leslie

Leslie is building the API endpoints and ML integration (Document 2). He depends on your models. **Push your branch early** (even before seed data is perfect) so he can start writing serializers and views against your model definitions. Key things he needs from you:

1. All model files committed (especially `taxonomy/models.py`, `predictions/models.py`, `uploads/models.py`)
2. The `accounts/permissions.py` file (he'll import your permission classes)
3. The `accounts/serializers.py` file (he'll use `UserSerializer` in auth views)
4. Working migrations (so he can `migrate` and have the tables)
5. Placeholder `urls.py` in every app (so the project URL config doesn't crash)

**Communicate when you push.** Tell Leslie: "Models are up on `feature/backend-foundation`, you can start building views."
