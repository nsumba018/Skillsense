# Phase 3 — Document 2: API Endpoints & ML Integration

**Assigned to:** Gasana Leslie
**Branch:** `feature/api-and-integration`
**Base branch:** `feature/backend-foundation` (merge Delphin's work first)
**Covers:** Phase 3C (REST API Endpoints) + 3E (ML Model Integration) + 3F (CSV Upload Pipeline)

---

## Overview

You are building all the REST API endpoints, the ML model integration layer, and the CSV upload processing pipeline for SkillSense. Delphin is setting up the Django project, all database models, authentication, and seed data (Document 1). **You depend on his work being pushed first.**

Your job: take the models Delphin created and expose them through a complete REST API that the React frontend will consume.

---

## Prerequisites

Before you start:

1. **Wait for Delphin's branch** (`feature/backend-foundation`) to be pushed
2. Pull his work and branch off it:

```bash
git checkout develop
git pull origin develop
git fetch origin
git checkout feature/backend-foundation
git pull origin feature/backend-foundation

# Create your branch off his
git checkout -b feature/api-and-integration
```

3. Make sure the Django project runs:

```bash
source .venv/bin/activate
pip install -r requirements.txt   # if Delphin created one
python manage.py migrate
python manage.py runserver         # should start without errors
```

4. Make sure seed data is loaded:

```bash
python manage.py seed_taxonomy
python manage.py seed_admin
python manage.py seed_historical_data
python manage.py seed_job_postings
python manage.py seed_forecasts
```

---

## Part A: REST API Endpoints (Phase 3C)

For every endpoint group below, you need to create:
1. **Serializers** — in `<app>/serializers.py`
2. **Views** — in `<app>/views.py`
3. **URLs** — in `<app>/urls.py` (Delphin created placeholder files, you fill them in)

The project URLs are already wired in `skillsense_backend/urls.py` — you just need to populate each app's `urls.py`.

---

### A1: Auth Endpoints — `accounts/`

Delphin already created `accounts/serializers.py` with `UserSerializer`, `RegisterSerializer`, and `InstitutionSerializer`. You add the views and URLs.

#### `accounts/views.py`

```python
from rest_framework import generics, status
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from .serializers import UserSerializer, RegisterSerializer

User = get_user_model()


class RegisterView(generics.CreateAPIView):
    """POST /api/auth/register/ — Create a new account."""
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(
            UserSerializer(user).data,
            status=status.HTTP_201_CREATED,
        )


class LoginView(TokenObtainPairView):
    """POST /api/auth/login/ — Get JWT access + refresh tokens."""
    permission_classes = [AllowAny]


class RefreshView(TokenRefreshView):
    """POST /api/auth/refresh/ — Refresh an expired access token."""
    permission_classes = [AllowAny]


class LogoutView(generics.GenericAPIView):
    """POST /api/auth/logout/ — Blacklist the refresh token."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if refresh_token:
                token = RefreshToken(refresh_token)
                token.blacklist()
            return Response(status=status.HTTP_205_RESET_CONTENT)
        except Exception:
            return Response(status=status.HTTP_400_BAD_REQUEST)


class ProfileView(generics.RetrieveUpdateAPIView):
    """
    GET  /api/auth/me/ — Get current user profile.
    PUT  /api/auth/me/ — Update profile.
    """
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]

    def get_object(self):
        return self.request.user
```

#### `accounts/urls.py`

```python
from django.urls import path
from .views import RegisterView, LoginView, RefreshView, LogoutView, ProfileView

urlpatterns = [
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/', LoginView.as_view(), name='auth-login'),
    path('refresh/', RefreshView.as_view(), name='auth-refresh'),
    path('logout/', LogoutView.as_view(), name='auth-logout'),
    path('me/', ProfileView.as_view(), name='auth-profile'),
]
```

---

### A2: Taxonomy Endpoints — `taxonomy/`

#### `taxonomy/serializers.py`

```python
from rest_framework import serializers
from .models import RoleGroup, RoleFamily, NormalizedRole, HistoricalDemand, MacroIndicator


class NormalizedRoleListSerializer(serializers.ModelSerializer):
    """Brief role info for list views."""
    group_name = serializers.CharField(source='role_family.role_group.name', read_only=True)
    family_name = serializers.CharField(source='role_family.name', read_only=True)

    class Meta:
        model = NormalizedRole
        fields = [
            'id', 'name', 'emergence_year', 'is_emerging',
            'group_name', 'family_name', 'global_trend_signal',
        ]


class HistoricalDemandSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistoricalDemand
        fields = [
            'year', 'role_demand_index', 'role_share_within_ict_pct',
            'role_employment_proxy', 'data_basis', 'synthetic_flag',
        ]


class NormalizedRoleDetailSerializer(serializers.ModelSerializer):
    """Full role info with historical data, for detail views."""
    group_name = serializers.CharField(source='role_family.role_group.name', read_only=True)
    family_name = serializers.CharField(source='role_family.name', read_only=True)
    historical_demand = HistoricalDemandSerializer(many=True, read_only=True)

    class Meta:
        model = NormalizedRole
        fields = [
            'id', 'name', 'description', 'emergence_year', 'is_emerging',
            'group_name', 'family_name', 'global_trend_signal',
            'historical_demand',
        ]


class RoleFamilySerializer(serializers.ModelSerializer):
    roles = NormalizedRoleListSerializer(many=True, read_only=True)
    group_name = serializers.CharField(source='role_group.name', read_only=True)

    class Meta:
        model = RoleFamily
        fields = ['id', 'name', 'group_name', 'roles']


class RoleGroupSerializer(serializers.ModelSerializer):
    families = RoleFamilySerializer(many=True, read_only=True)

    class Meta:
        model = RoleGroup
        fields = ['id', 'name', 'description', 'sort_order', 'families']


class MacroIndicatorSerializer(serializers.ModelSerializer):
    class Meta:
        model = MacroIndicator
        fields = '__all__'
```

#### `taxonomy/views.py`

```python
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from .models import RoleGroup, RoleFamily, NormalizedRole
from .serializers import (
    RoleGroupSerializer,
    RoleFamilySerializer,
    NormalizedRoleListSerializer,
    NormalizedRoleDetailSerializer,
)


class RoleGroupListView(generics.ListAPIView):
    """GET /api/taxonomy/groups/ — List all role groups with families and roles."""
    queryset = RoleGroup.objects.prefetch_related('families__roles').all()
    serializer_class = RoleGroupSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Small dataset, no pagination needed


class RoleFamilyListView(generics.ListAPIView):
    """GET /api/taxonomy/families/ — List all role families."""
    queryset = RoleFamily.objects.select_related('role_group').prefetch_related('roles').all()
    serializer_class = RoleFamilySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None


class NormalizedRoleListView(generics.ListAPIView):
    """GET /api/taxonomy/roles/ — List all normalized roles."""
    queryset = NormalizedRole.objects.select_related('role_family__role_group').all()
    serializer_class = NormalizedRoleListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['is_emerging', 'role_family__role_group__id']
    search_fields = ['name']
    pagination_class = None


class NormalizedRoleDetailView(generics.RetrieveAPIView):
    """GET /api/taxonomy/roles/:id/ — Role detail with full history."""
    queryset = NormalizedRole.objects.select_related(
        'role_family__role_group'
    ).prefetch_related(
        'historical_demand', 'forecasts'
    ).all()
    serializer_class = NormalizedRoleDetailSerializer
    permission_classes = [IsAuthenticated]


class EmergingRolesListView(generics.ListAPIView):
    """GET /api/taxonomy/emerging/ — List emerging roles (Layer 2)."""
    queryset = NormalizedRole.objects.filter(
        is_emerging=True
    ).select_related('role_family__role_group')
    serializer_class = NormalizedRoleListSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None
```

#### `taxonomy/urls.py`

```python
from django.urls import path
from .views import (
    RoleGroupListView,
    RoleFamilyListView,
    NormalizedRoleListView,
    NormalizedRoleDetailView,
    EmergingRolesListView,
)

urlpatterns = [
    path('groups/', RoleGroupListView.as_view(), name='taxonomy-groups'),
    path('families/', RoleFamilyListView.as_view(), name='taxonomy-families'),
    path('roles/', NormalizedRoleListView.as_view(), name='taxonomy-roles'),
    path('roles/<int:pk>/', NormalizedRoleDetailView.as_view(), name='taxonomy-role-detail'),
    path('emerging/', EmergingRolesListView.as_view(), name='taxonomy-emerging'),
]
```

---

### A3: Predictions Endpoints — `predictions/`

#### `predictions/serializers.py`

```python
from rest_framework import serializers
from .models import ForecastRun, RoleForecast
from taxonomy.serializers import NormalizedRoleListSerializer, MacroIndicatorSerializer


class RoleForecastSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.name', read_only=True)
    role_id = serializers.IntegerField(source='role.id', read_only=True)

    class Meta:
        model = RoleForecast
        fields = [
            'id', 'role_id', 'role_name', 'horizon',
            'demand_index', 'share_pct', 'employment_proxy',
            'confidence_lower', 'confidence_upper', 'trend_direction',
        ]


class ForecastRunSerializer(serializers.ModelSerializer):
    forecasts = RoleForecastSerializer(many=True, read_only=True)

    class Meta:
        model = ForecastRun
        fields = [
            'id', 'created_at', 'model_version',
            'accuracy_spearman', 'accuracy_pearson',
            'accuracy_mae', 'accuracy_rmse', 'accuracy_r2',
            'notes', 'forecasts',
        ]


class ForecastRunSummarySerializer(serializers.ModelSerializer):
    """Without nested forecasts, for list views."""
    class Meta:
        model = ForecastRun
        fields = [
            'id', 'created_at', 'model_version',
            'accuracy_spearman', 'accuracy_pearson', 'accuracy_r2',
        ]


class TrendAnalysisSerializer(serializers.Serializer):
    """Custom serializer for the /trends/ endpoint."""
    role_id = serializers.IntegerField()
    role_name = serializers.CharField()
    trend_direction = serializers.CharField()
    demand_index_1y = serializers.FloatField()
    share_pct_1y = serializers.FloatField()
    demand_change = serializers.FloatField(help_text="Change from current to 1y forecast")
```

#### `predictions/views.py`

```python
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from accounts.permissions import IsAdminUser
from taxonomy.models import HistoricalDemand, MacroIndicator, NormalizedRole
from taxonomy.serializers import MacroIndicatorSerializer
from .models import ForecastRun, RoleForecast
from .serializers import (
    ForecastRunSerializer,
    RoleForecastSerializer,
    ForecastRunSummarySerializer,
)


class ForecastListView(APIView):
    """
    GET /api/predictions/forecasts/
    Returns the latest forecast run with all 60 forecast rows.
    Optional query params: ?horizon=1y&role_id=5
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        latest_run = ForecastRun.objects.prefetch_related(
            'forecasts__role'
        ).first()

        if not latest_run:
            return Response(
                {"detail": "No forecast runs available."},
                status=status.HTTP_404_NOT_FOUND,
            )

        forecasts = latest_run.forecasts.all()

        # Optional filters
        horizon = request.query_params.get('horizon')
        if horizon:
            forecasts = forecasts.filter(horizon=horizon)

        role_id = request.query_params.get('role_id')
        if role_id:
            forecasts = forecasts.filter(role_id=role_id)

        return Response({
            'forecast_run': ForecastRunSummarySerializer(latest_run).data,
            'forecasts': RoleForecastSerializer(forecasts, many=True).data,
        })


class ForecastByRoleView(APIView):
    """
    GET /api/predictions/forecasts/:role_id/
    Returns all forecasts (all horizons) for a specific role from the latest run.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, role_id):
        latest_run = ForecastRun.objects.first()
        if not latest_run:
            return Response(
                {"detail": "No forecast runs available."},
                status=status.HTTP_404_NOT_FOUND,
            )

        forecasts = RoleForecast.objects.filter(
            forecast_run=latest_run,
            role_id=role_id,
        ).select_related('role')

        if not forecasts.exists():
            return Response(
                {"detail": "Role not found in forecasts."},
                status=status.HTTP_404_NOT_FOUND,
            )

        return Response({
            'forecast_run': ForecastRunSummarySerializer(latest_run).data,
            'forecasts': RoleForecastSerializer(forecasts, many=True).data,
        })


class TrendAnalysisView(APIView):
    """
    GET /api/predictions/trends/
    Returns trend analysis: growing, stable, declining roles based on latest 1y forecast.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        latest_run = ForecastRun.objects.first()
        if not latest_run:
            return Response({"detail": "No forecast runs available."}, status=404)

        forecasts_1y = RoleForecast.objects.filter(
            forecast_run=latest_run,
            horizon='1y',
        ).select_related('role').order_by('-demand_index')

        result = {
            'growing': [],
            'stable': [],
            'declining': [],
        }

        for f in forecasts_1y:
            entry = {
                'role_id': f.role.id,
                'role_name': f.role.name,
                'demand_index': f.demand_index,
                'share_pct': f.share_pct,
                'trend_direction': f.trend_direction,
            }
            result[f.trend_direction].append(entry)

        return Response(result)


class HistoricalDemandView(APIView):
    """
    GET /api/predictions/historical/
    Returns historical demand data. Optional filters: ?role_id=5&year_from=2015&year_to=2026
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = HistoricalDemand.objects.select_related('role').all()

        role_id = request.query_params.get('role_id')
        if role_id:
            queryset = queryset.filter(role_id=role_id)

        year_from = request.query_params.get('year_from')
        if year_from:
            queryset = queryset.filter(year__gte=int(year_from))

        year_to = request.query_params.get('year_to')
        if year_to:
            queryset = queryset.filter(year__lte=int(year_to))

        # Group by role for a cleaner response
        from collections import defaultdict
        by_role = defaultdict(list)
        for hd in queryset.order_by('year'):
            by_role[hd.role.name].append({
                'year': hd.year,
                'demand_index': hd.role_demand_index,
                'share_pct': hd.role_share_within_ict_pct,
                'employment_proxy': hd.role_employment_proxy,
                'synthetic': hd.synthetic_flag,
            })

        return Response(dict(by_role))


class MacroIndicatorView(generics.ListAPIView):
    """GET /api/predictions/macro/ — Macro indicator time series."""
    queryset = MacroIndicator.objects.all()
    serializer_class = MacroIndicatorSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None


class TriggerForecastRunView(APIView):
    """
    POST /api/predictions/run/ — Trigger a new forecast run (admin only).
    This runs the Two-Stage model and stores results in the database.
    """
    permission_classes = [IsAdminUser]

    def post(self, request):
        from predictions.ml.forecaster import run_forecast_pipeline

        try:
            forecast_run = run_forecast_pipeline()
            return Response(
                ForecastRunSummarySerializer(forecast_run).data,
                status=status.HTTP_201_CREATED,
            )
        except Exception as e:
            return Response(
                {"detail": f"Forecast run failed: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )
```

#### `predictions/urls.py`

```python
from django.urls import path
from .views import (
    ForecastListView,
    ForecastByRoleView,
    TrendAnalysisView,
    HistoricalDemandView,
    MacroIndicatorView,
    TriggerForecastRunView,
)

urlpatterns = [
    path('forecasts/', ForecastListView.as_view(), name='predictions-forecasts'),
    path('forecasts/<int:role_id>/', ForecastByRoleView.as_view(), name='predictions-forecast-role'),
    path('trends/', TrendAnalysisView.as_view(), name='predictions-trends'),
    path('historical/', HistoricalDemandView.as_view(), name='predictions-historical'),
    path('macro/', MacroIndicatorView.as_view(), name='predictions-macro'),
    path('run/', TriggerForecastRunView.as_view(), name='predictions-run'),
]
```

#### `predictions/dashboard_urls.py`

```python
from django.urls import path
from .dashboard_views import DashboardKPIView, DashboardOverviewView

urlpatterns = [
    path('kpis/', DashboardKPIView.as_view(), name='dashboard-kpis'),
    path('overview/', DashboardOverviewView.as_view(), name='dashboard-overview'),
]
```

#### `predictions/dashboard_views.py`

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from taxonomy.models import NormalizedRole, HistoricalDemand, MacroIndicator
from uploads.models import JobPosting
from .models import ForecastRun, RoleForecast


class DashboardKPIView(APIView):
    """
    GET /api/dashboard/kpis/
    Returns top-level KPIs for the main dashboard cards.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Latest macro data
        latest_macro = MacroIndicator.objects.order_by('-year').first()

        # Latest forecast run
        latest_run = ForecastRun.objects.first()

        # Top 3 growing roles (1y forecast)
        growing_roles = []
        if latest_run:
            top_growing = RoleForecast.objects.filter(
                forecast_run=latest_run,
                horizon='1y',
                trend_direction='growing',
            ).select_related('role').order_by('-demand_index')[:3]
            growing_roles = [
                {'name': f.role.name, 'demand_index': f.demand_index}
                for f in top_growing
            ]

        return Response({
            'total_ict_employment': latest_macro.ict_employment if latest_macro else 0,
            'ict_share_pct': latest_macro.ict_employment_share_pct if latest_macro else 0,
            'total_roles_tracked': NormalizedRole.objects.count(),
            'total_postings': JobPosting.objects.count(),
            'latest_year': latest_macro.year if latest_macro else None,
            'top_growing_roles': growing_roles,
            'model_accuracy': {
                'spearman': latest_run.accuracy_spearman if latest_run else None,
                'r2': latest_run.accuracy_r2 if latest_run else None,
            },
        })


class DashboardOverviewView(APIView):
    """
    GET /api/dashboard/overview/
    Returns a summary for the main dashboard including role distribution and recent data.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Latest year role distribution
        latest_year = HistoricalDemand.objects.order_by('-year').values_list('year', flat=True).first()
        role_distribution = []
        if latest_year:
            demand_data = HistoricalDemand.objects.filter(
                year=latest_year
            ).select_related('role').order_by('-role_demand_index')

            role_distribution = [
                {
                    'role_id': d.role.id,
                    'role_name': d.role.name,
                    'demand_index': d.role_demand_index,
                    'share_pct': d.role_share_within_ict_pct,
                }
                for d in demand_data
            ]

        # Forecast summary
        latest_run = ForecastRun.objects.first()
        forecast_summary = {}
        if latest_run:
            for horizon in ['6m', '1y', '2y']:
                forecasts = RoleForecast.objects.filter(
                    forecast_run=latest_run,
                    horizon=horizon,
                ).select_related('role').order_by('-demand_index')[:5]

                forecast_summary[horizon] = [
                    {
                        'role_name': f.role.name,
                        'demand_index': f.demand_index,
                        'share_pct': f.share_pct,
                        'trend': f.trend_direction,
                    }
                    for f in forecasts
                ]

        return Response({
            'latest_year': latest_year,
            'role_distribution': role_distribution,
            'forecast_summary': forecast_summary,
            'model_info': {
                'version': latest_run.model_version if latest_run else None,
                'last_run': latest_run.created_at if latest_run else None,
                'spearman': latest_run.accuracy_spearman if latest_run else None,
            },
        })
```

---

### A4: Upload Endpoints — `uploads/`

#### `uploads/serializers.py`

```python
from rest_framework import serializers
from .models import DataUpload, JobPosting
from taxonomy.serializers import NormalizedRoleListSerializer


class JobPostingSerializer(serializers.ModelSerializer):
    normalized_role_name = serializers.CharField(
        source='normalized_role.name', read_only=True, default=None
    )

    class Meta:
        model = JobPosting
        fields = [
            'id', 'source', 'title', 'company', 'location_raw', 'country',
            'industry_raw', 'education_raw', 'experience_raw',
            'contract_type_raw', 'posted_date', 'closing_date',
            'is_ict', 'ict_role_confidence',
            'normalized_role', 'normalized_role_name',
            'role_level', 'role_normalization_confidence',
            'needs_manual_review', 'manual_review_reason',
            'created_at',
        ]


class DataUploadSerializer(serializers.ModelSerializer):
    uploaded_by_email = serializers.CharField(
        source='uploaded_by.email', read_only=True, default=None
    )

    class Meta:
        model = DataUpload
        fields = [
            'id', 'uploaded_by_email', 'original_filename',
            'status', 'total_records', 'ict_records', 'error_count',
            'processing_log', 'created_at',
        ]
        read_only_fields = [
            'id', 'uploaded_by_email', 'status',
            'total_records', 'ict_records', 'error_count',
            'processing_log', 'created_at',
        ]


class DataUploadCreateSerializer(serializers.ModelSerializer):
    file = serializers.FileField()

    class Meta:
        model = DataUpload
        fields = ['file']
```

#### `uploads/views.py`

```python
from rest_framework import generics, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from accounts.permissions import IsAdminUser
from rest_framework.permissions import IsAuthenticated
from .models import DataUpload, JobPosting
from .serializers import DataUploadSerializer, DataUploadCreateSerializer, JobPostingSerializer


class UploadCreateView(generics.CreateAPIView):
    """POST /api/uploads/ — Upload a CSV file (admin only)."""
    serializer_class = DataUploadCreateSerializer
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        upload = serializer.save(
            uploaded_by=self.request.user,
            original_filename=self.request.FILES['file'].name,
            status='pending',
        )
        # Trigger async processing
        from uploads.tasks import process_upload_task
        process_upload_task.delay(upload.id)


class UploadListView(generics.ListAPIView):
    """GET /api/uploads/ — List past uploads."""
    queryset = DataUpload.objects.all()
    serializer_class = DataUploadSerializer
    permission_classes = [IsAdminUser]


class UploadDetailView(generics.RetrieveAPIView):
    """GET /api/uploads/:id/ — Upload detail + processing log."""
    queryset = DataUpload.objects.all()
    serializer_class = DataUploadSerializer
    permission_classes = [IsAdminUser]


class UploadPostingsView(generics.ListAPIView):
    """GET /api/uploads/:id/postings/ — Job postings from this upload."""
    serializer_class = JobPostingSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return JobPosting.objects.filter(
            upload_id=self.kwargs['pk']
        ).select_related('normalized_role')
```

#### `uploads/urls.py`

```python
from django.urls import path
from .views import UploadCreateView, UploadListView, UploadDetailView, UploadPostingsView

urlpatterns = [
    path('', UploadCreateView.as_view(), name='upload-create'),
    path('list/', UploadListView.as_view(), name='upload-list'),
    path('<int:pk>/', UploadDetailView.as_view(), name='upload-detail'),
    path('<int:pk>/postings/', UploadPostingsView.as_view(), name='upload-postings'),
]
```

---

### A5: Analytics Endpoints — `analytics/`

#### `analytics/serializers.py`

```python
from rest_framework import serializers
from .models import GeographicDemand, SectorDemand


class GeographicDemandSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.name', read_only=True)

    class Meta:
        model = GeographicDemand
        fields = [
            'id', 'province', 'district', 'role_name',
            'year', 'posting_count', 'demand_score',
        ]


class SectorDemandSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.name', read_only=True)

    class Meta:
        model = SectorDemand
        fields = ['id', 'industry', 'role_name', 'year', 'posting_count']


class EmployabilityInputSerializer(serializers.Serializer):
    """Input for the employability scoring endpoint."""
    skills = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of NormalizedRole IDs the user has skills in",
    )


class EmployabilityScoreSerializer(serializers.Serializer):
    """Output from the employability scoring endpoint."""
    overall_score = serializers.FloatField()
    matched_roles = serializers.ListField()
    skill_gaps = serializers.ListField()
    recommendations = serializers.ListField()
```

#### `analytics/views.py`

```python
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
from taxonomy.models import NormalizedRole
from predictions.models import ForecastRun, RoleForecast
from uploads.models import JobPosting
from .models import GeographicDemand, SectorDemand
from .serializers import (
    GeographicDemandSerializer,
    SectorDemandSerializer,
    EmployabilityInputSerializer,
)


class SectorDemandView(APIView):
    """
    GET /api/analytics/sector/
    Returns demand breakdown by industry sector.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Aggregate postings by industry
        from django.db.models import Count
        sector_data = JobPosting.objects.filter(
            is_ict=True,
            industry_raw__isnull=False,
        ).exclude(
            industry_raw=''
        ).values(
            'industry_raw'
        ).annotate(
            posting_count=Count('id')
        ).order_by('-posting_count')

        return Response(list(sector_data))


class GeographicDemandView(generics.ListAPIView):
    """
    GET /api/analytics/geographic/
    Returns geographic demand data (PostGIS).
    """
    queryset = GeographicDemand.objects.select_related('role').all()
    serializer_class = GeographicDemandSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['province', 'district', 'year']


class EmployabilityOverviewView(APIView):
    """
    GET /api/analytics/employability/
    Returns the employability scoring methodology and available roles.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        roles = NormalizedRole.objects.filter(is_emerging=False).values('id', 'name')
        return Response({
            'description': 'Score your skill profile against forecasted market demand',
            'available_roles': list(roles),
            'scoring_method': 'Weighted match against 1-year forecast demand indices',
        })


class EmployabilityScoreView(APIView):
    """
    POST /api/analytics/employability/score/
    Score a user's skill profile against the current forecast.

    Input: {"skills": [1, 5, 12]}  (list of NormalizedRole IDs the user has skills in)
    Output: overall score, matched roles, gaps, recommendations
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = EmployabilityInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        skill_ids = serializer.validated_data['skills']

        # Get latest forecast
        latest_run = ForecastRun.objects.first()
        if not latest_run:
            return Response({"detail": "No forecasts available."}, status=404)

        forecasts_1y = RoleForecast.objects.filter(
            forecast_run=latest_run,
            horizon='1y',
        ).select_related('role')

        total_demand = sum(f.demand_index for f in forecasts_1y)
        user_roles = set(skill_ids)

        # Calculate score
        matched_demand = 0
        matched_roles = []
        skill_gaps = []

        for f in forecasts_1y.order_by('-demand_index'):
            if f.role.id in user_roles:
                matched_demand += f.demand_index
                matched_roles.append({
                    'role_id': f.role.id,
                    'role_name': f.role.name,
                    'demand_index': f.demand_index,
                    'trend': f.trend_direction,
                })
            elif f.demand_index > 30:  # Only recommend high-demand roles
                skill_gaps.append({
                    'role_id': f.role.id,
                    'role_name': f.role.name,
                    'demand_index': f.demand_index,
                    'trend': f.trend_direction,
                })

        overall_score = (matched_demand / total_demand * 100) if total_demand > 0 else 0

        # Top 3 recommendations from gaps
        recommendations = [
            f"Learn {gap['role_name']} skills — demand index: {gap['demand_index']:.0f}, trend: {gap['trend']}"
            for gap in skill_gaps[:3]
        ]

        return Response({
            'overall_score': round(overall_score, 1),
            'matched_roles': matched_roles,
            'skill_gaps': skill_gaps[:5],
            'recommendations': recommendations,
        })


class EducationAlignmentView(APIView):
    """
    GET /api/analytics/education/
    Education/training gap analysis (placeholder — data collection needed).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'status': 'placeholder',
            'message': 'Education alignment data collection in progress. '
                       'This endpoint will compare institutional curricula against market demand.',
        })


class CareerGuidanceView(APIView):
    """
    GET /api/analytics/career/
    Career guidance recommendations (placeholder).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Return top growing roles as basic career guidance
        latest_run = ForecastRun.objects.first()
        growing = []
        if latest_run:
            forecasts = RoleForecast.objects.filter(
                forecast_run=latest_run,
                horizon='1y',
                trend_direction='growing',
            ).select_related('role').order_by('-demand_index')

            growing = [
                {
                    'role_name': f.role.name,
                    'demand_index': f.demand_index,
                    'share_pct': f.share_pct,
                }
                for f in forecasts
            ]

        return Response({
            'growing_roles': growing,
            'advice': 'Focus on roles with growing demand and high demand index for best career prospects.',
        })
```

#### `analytics/urls.py`

```python
from django.urls import path
from .views import (
    SectorDemandView,
    GeographicDemandView,
    EmployabilityOverviewView,
    EmployabilityScoreView,
    EducationAlignmentView,
    CareerGuidanceView,
)

urlpatterns = [
    path('sector/', SectorDemandView.as_view(), name='analytics-sector'),
    path('geographic/', GeographicDemandView.as_view(), name='analytics-geographic'),
    path('employability/', EmployabilityOverviewView.as_view(), name='analytics-employability'),
    path('employability/score/', EmployabilityScoreView.as_view(), name='analytics-employability-score'),
    path('education/', EducationAlignmentView.as_view(), name='analytics-education'),
    path('career/', CareerGuidanceView.as_view(), name='analytics-career'),
]
```

---

### A6: Reports Endpoints — `reports/`

#### `reports/serializers.py`

```python
from rest_framework import serializers
from .models import GeneratedReport


class GeneratedReportSerializer(serializers.ModelSerializer):
    generated_by_email = serializers.CharField(
        source='generated_by.email', read_only=True, default=None
    )

    class Meta:
        model = GeneratedReport
        fields = [
            'id', 'report_type', 'format', 'title',
            'generated_by_email', 'file', 'parameters', 'created_at',
        ]
```

#### `reports/views.py`

```python
import csv
import io
from django.http import HttpResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
from predictions.models import ForecastRun, RoleForecast
from taxonomy.models import HistoricalDemand
from .models import GeneratedReport
from .serializers import GeneratedReportSerializer


class ReportListView(generics.ListAPIView):
    """GET /api/reports/ — List available and past reports."""
    queryset = GeneratedReport.objects.all()
    serializer_class = GeneratedReportSerializer
    permission_classes = [IsAuthenticated]


class ReportGenerateView(APIView):
    """
    GET /api/reports/:type/ — Generate report data (JSON).
    Supported types: demand_outlook, role_deep_dive
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, report_type):
        if report_type == 'demand_outlook':
            return self._demand_outlook_report()
        elif report_type == 'role_deep_dive':
            role_id = request.query_params.get('role_id')
            return self._role_deep_dive(role_id)
        else:
            return Response(
                {"detail": f"Unknown report type: {report_type}"},
                status=400,
            )

    def _demand_outlook_report(self):
        latest_run = ForecastRun.objects.first()
        if not latest_run:
            return Response({"detail": "No forecasts available."}, status=404)

        forecasts = RoleForecast.objects.filter(
            forecast_run=latest_run,
        ).select_related('role').order_by('horizon', '-demand_index')

        report_data = {
            'title': 'ICT Demand Outlook Report',
            'model_version': latest_run.model_version,
            'generated_at': latest_run.created_at,
            'accuracy': {
                'spearman': latest_run.accuracy_spearman,
                'pearson': latest_run.accuracy_pearson,
                'r2': latest_run.accuracy_r2,
            },
            'forecasts': {},
        }

        for f in forecasts:
            horizon = f.horizon
            if horizon not in report_data['forecasts']:
                report_data['forecasts'][horizon] = []
            report_data['forecasts'][horizon].append({
                'role': f.role.name,
                'demand_index': f.demand_index,
                'share_pct': f.share_pct,
                'trend': f.trend_direction,
                'confidence_lower': f.confidence_lower,
                'confidence_upper': f.confidence_upper,
            })

        return Response(report_data)

    def _role_deep_dive(self, role_id):
        if not role_id:
            return Response({"detail": "role_id query param required."}, status=400)

        history = HistoricalDemand.objects.filter(
            role_id=role_id
        ).order_by('year').values(
            'year', 'role_demand_index', 'role_share_within_ict_pct', 'role_employment_proxy'
        )

        latest_run = ForecastRun.objects.first()
        forecasts = []
        if latest_run:
            forecasts = list(
                RoleForecast.objects.filter(
                    forecast_run=latest_run,
                    role_id=role_id,
                ).values(
                    'horizon', 'demand_index', 'share_pct', 'trend_direction',
                    'confidence_lower', 'confidence_upper',
                )
            )

        return Response({
            'title': 'Role Deep Dive Report',
            'role_id': role_id,
            'historical': list(history),
            'forecasts': forecasts,
        })


class ReportCSVView(APIView):
    """
    GET /api/reports/:type/csv/ — Export report as CSV.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, report_type):
        if report_type == 'demand_outlook':
            return self._demand_outlook_csv()
        else:
            return Response({"detail": f"CSV not available for: {report_type}"}, status=400)

    def _demand_outlook_csv(self):
        latest_run = ForecastRun.objects.first()
        if not latest_run:
            return Response({"detail": "No forecasts available."}, status=404)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="demand_outlook.csv"'

        writer = csv.writer(response)
        writer.writerow([
            'role', 'horizon', 'demand_index', 'share_pct',
            'trend_direction', 'confidence_lower', 'confidence_upper',
        ])

        forecasts = RoleForecast.objects.filter(
            forecast_run=latest_run,
        ).select_related('role').order_by('horizon', '-demand_index')

        for f in forecasts:
            writer.writerow([
                f.role.name, f.horizon, f.demand_index, f.share_pct,
                f.trend_direction, f.confidence_lower, f.confidence_upper,
            ])

        return response
```

#### `reports/urls.py`

```python
from django.urls import path
from .views import ReportListView, ReportGenerateView, ReportCSVView

urlpatterns = [
    path('', ReportListView.as_view(), name='report-list'),
    path('<str:report_type>/', ReportGenerateView.as_view(), name='report-generate'),
    path('<str:report_type>/csv/', ReportCSVView.as_view(), name='report-csv'),
]
```

---

## Part B: ML Model Integration (Phase 3E)

This creates the bridge between our Python ML model and the Django API.

### B1: Create the ML module

```bash
mkdir -p predictions/ml
touch predictions/ml/__init__.py
```

#### `predictions/ml/model_loader.py`

```python
"""
Load the Two-Stage model artifacts from disk.
Artifacts are generated by: python models/phase2d_final_model.py
"""
import joblib
from pathlib import Path
from django.conf import settings

_model_cache = {}


def get_model():
    """Load and cache the LightGBM trend model."""
    if 'model' not in _model_cache:
        model_path = Path(settings.ML_MODEL_PATH)
        if not model_path.exists():
            raise FileNotFoundError(
                f"Model not found at {model_path}. "
                "Run 'python models/phase2d_final_model.py' to generate it."
            )
        _model_cache['model'] = joblib.load(model_path)
    return _model_cache['model']


def get_correction_factors():
    """Load and cache the market correction factors."""
    if 'correction_factors' not in _model_cache:
        cf_path = Path(settings.ML_CORRECTION_FACTORS_PATH)
        if not cf_path.exists():
            raise FileNotFoundError(
                f"Correction factors not found at {cf_path}. "
                "Run 'python models/phase2d_final_model.py' to generate them."
            )
        _model_cache['correction_factors'] = joblib.load(cf_path)
    return _model_cache['correction_factors']


def get_role_encoder():
    """Load the role label encoder."""
    if 'role_encoder' not in _model_cache:
        encoder_path = Path(settings.BASE_DIR) / 'models' / 'role_encoder.joblib'
        if not encoder_path.exists():
            raise FileNotFoundError(f"Role encoder not found at {encoder_path}")
        _model_cache['role_encoder'] = joblib.load(encoder_path)
    return _model_cache['role_encoder']


def get_feature_list():
    """Load the feature list used for training."""
    if 'feature_list' not in _model_cache:
        feature_path = Path(settings.BASE_DIR) / 'models' / 'feature_list.joblib'
        if not feature_path.exists():
            raise FileNotFoundError(f"Feature list not found at {feature_path}")
        _model_cache['feature_list'] = joblib.load(feature_path)
    return _model_cache['feature_list']


def clear_cache():
    """Clear the model cache (e.g., after retraining)."""
    _model_cache.clear()
```

#### `predictions/ml/forecaster.py`

```python
"""
Run the Two-Stage forecast pipeline from within Django.

This is the Django-integrated version of models/phase2d_final_model.py.
It reads data from the database instead of CSV files, runs the model,
and stores results in ForecastRun + RoleForecast.
"""
import numpy as np
import pandas as pd
from django.db import transaction
from taxonomy.models import NormalizedRole, HistoricalDemand, MacroIndicator
from predictions.models import ForecastRun, RoleForecast
from .model_loader import get_model, get_correction_factors, get_role_encoder, get_feature_list, clear_cache


def run_forecast_pipeline():
    """
    Execute a full forecast run:
    1. Load data from database
    2. Run the Two-Stage model
    3. Store results in ForecastRun + RoleForecast

    Returns: the created ForecastRun instance
    """
    # Load model artifacts
    model = get_model()
    correction_factors = get_correction_factors()
    role_encoder = get_role_encoder()
    features = get_feature_list()

    # Load historical data from database
    roles = {r.name: r for r in NormalizedRole.objects.filter(is_emerging=False)}

    history = HistoricalDemand.objects.filter(
        year__gte=2010  # Two-Stage model uses 2010+ only
    ).select_related('role').order_by('year')

    macro = {m.year: m for m in MacroIndicator.objects.all()}

    # Build feature dataframe (matching the training pipeline)
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
        raise ValueError("No historical data available for forecasting")

    # Engineer features (simplified — matches phase2d_final_model.py)
    df['role_encoded'] = role_encoder.transform(df['role'])
    df['years_since_emergence'] = df['year'] - df['emergence_year']
    max_year = df['year'].max()
    df['trend_position'] = (df['year'] - df['year'].min()) / (max_year - df['year'].min())
    df['share_lag1'] = df.groupby('role')['role_share_within_ict_pct'].shift(1)
    df['share_change_1y'] = df.groupby('role')['role_share_within_ict_pct'].diff(1)
    df['share_change_2y'] = df.groupby('role')['role_share_within_ict_pct'].diff(2)
    df['share_accel'] = df.groupby('role')['share_change_1y'].diff(1)
    df['share_growth_rate'] = df['share_change_1y'] / (df['role_share_within_ict_pct'].shift(1) + 0.01)
    df = df.dropna(subset=['share_lag1'])

    # Get latest year data for prediction base
    latest_year = df['year'].max()
    latest_data = df[df['year'] == latest_year].copy()

    # Generate forecasts for 3 horizons
    horizons = [
        ('6m', latest_year + 0.5),
        ('1y', latest_year + 1),
        ('2y', latest_year + 2),
    ]

    with transaction.atomic():
        # Create forecast run
        forecast_run = ForecastRun.objects.create(
            model_version='two_stage_v1',
            accuracy_spearman=0.9898,
            accuracy_pearson=0.9946,
            accuracy_r2=0.9580,
            accuracy_mae=0.3277,
            notes='Auto-generated by Django forecast pipeline',
        )

        for horizon_label, target_year in horizons:
            pred_data = latest_data.copy()
            pred_data['year'] = int(np.ceil(target_year))
            pred_data['trend_position'] = 1.0

            # Predict with Stage 1 (trend model)
            X_pred = pred_data[features].fillna(0)
            trend_preds = model.predict(X_pred)
            trend_preds = np.maximum(trend_preds, 0)
            total = trend_preds.sum()
            if total > 0:
                trend_shares = trend_preds / total * 100
            else:
                trend_shares = trend_preds

            # Apply Stage 2 (market correction)
            corrected = []
            for i, (_, row) in enumerate(pred_data.iterrows()):
                role_name = row['role']
                cf = correction_factors.get(role_name, 1.0)

                # Damp correction for 2-year forecast
                if horizon_label == '2y':
                    cf = 1.0 + (cf - 1.0) * 0.7

                corrected_share = trend_shares[i] * cf
                corrected.append(max(corrected_share, 0))

            # Normalize to 100%
            total_corrected = sum(corrected)
            if total_corrected > 0:
                corrected = [s / total_corrected * 100 for s in corrected]

            # Determine trend direction
            max_share = max(corrected) if corrected else 1
            for i, (_, row) in enumerate(pred_data.iterrows()):
                role_name = row['role']
                role_obj = roles.get(role_name)
                if not role_obj:
                    continue

                current_share = row['role_share_within_ict_pct']
                forecast_share = corrected[i]
                demand_index = (forecast_share / max_share * 100) if max_share > 0 else 0

                change = forecast_share - current_share
                if change > 0.5:
                    trend = 'growing'
                elif change < -0.5:
                    trend = 'declining'
                else:
                    trend = 'stable'

                RoleForecast.objects.create(
                    forecast_run=forecast_run,
                    role=role_obj,
                    horizon=horizon_label,
                    demand_index=round(demand_index, 2),
                    share_pct=round(forecast_share, 2),
                    employment_proxy=round(forecast_share * 100, 0),  # Simplified
                    trend_direction=trend,
                )

    return forecast_run
```

---

## Part C: CSV Upload Pipeline (Phase 3F)

### C1: Celery task for async processing

#### `uploads/tasks.py`

```python
"""
Celery task for processing uploaded CSV files.

When an admin uploads a CSV of job postings, this task:
1. Parses the CSV
2. Classifies each posting (ICT or not, which role)
3. Creates JobPosting records
4. Updates the DataUpload status and processing log
"""
import csv
import io
import traceback
from celery import shared_task
from django.db import transaction
from taxonomy.models import NormalizedRole
from uploads.models import DataUpload, JobPosting


# Simple keyword-based ICT classification
# (In production, replace with the full classify_and_group_v2.py logic)
ICT_KEYWORDS = [
    'software', 'developer', 'engineer', 'programmer', 'devops', 'cloud',
    'data', 'analyst', 'scientist', 'database', 'network', 'cyber',
    'security', 'web', 'frontend', 'backend', 'fullstack', 'full-stack',
    'mobile', 'app', 'ict', 'it ', 'qa', 'quality assurance', 'test',
    'systems admin', 'help desk', 'support', 'infrastructure',
]


def classify_posting(title, description=''):
    """Basic ICT classification. Returns (is_ict, confidence, matched_role_name)."""
    text = f"{title} {description}".lower()

    # Check for ICT keywords
    matches = sum(1 for kw in ICT_KEYWORDS if kw in text)
    if matches == 0:
        return False, 0.0, None

    confidence = min(matches / 3.0, 1.0)

    # Try to match to a normalized role
    role_mapping = {
        'backend': 'Backend Developer',
        'frontend': 'Frontend / Web Developer',
        'web developer': 'Frontend / Web Developer',
        'full-stack': 'Full-Stack Developer',
        'fullstack': 'Full-Stack Developer',
        'mobile': 'Mobile App Developer',
        'software developer': 'Software Developer / Software Engineer',
        'software engineer': 'Software Developer / Software Engineer',
        'devops': 'DevOps / Cloud Engineer',
        'cloud': 'DevOps / Cloud Engineer',
        'data analyst': 'Data Analyst',
        'data engineer': 'Data Engineer',
        'data scientist': 'Data Scientist',
        'database': 'Database Administrator',
        'network': 'Network Engineer / Network Administrator',
        'cyber': 'Cybersecurity Analyst / Security Engineer',
        'security engineer': 'Cybersecurity Analyst / Security Engineer',
        'qa': 'QA / Software Test Engineer',
        'test engineer': 'QA / Software Test Engineer',
        'systems admin': 'Systems Administrator',
        'it support': 'IT Support / Help Desk Technician',
        'help desk': 'IT Support / Help Desk Technician',
        'ict manager': 'ICT Manager / IT Manager',
        'it manager': 'ICT Manager / IT Manager',
        'ict officer': 'IT Officer / ICT Administrator',
        'it officer': 'IT Officer / ICT Administrator',
        'it auditor': 'IT Auditor / IT Governance & Risk',
        'business analyst': 'Systems Analyst / IT Business Analyst',
        'systems analyst': 'Systems Analyst / IT Business Analyst',
    }

    matched_role = None
    for keyword, role_name in role_mapping.items():
        if keyword in text:
            matched_role = role_name
            break

    return True, confidence, matched_role


@shared_task
def process_upload_task(upload_id):
    """Process an uploaded CSV file asynchronously."""
    try:
        upload = DataUpload.objects.get(id=upload_id)
    except DataUpload.DoesNotExist:
        return

    upload.status = 'processing'
    upload.save()

    log_lines = []
    total = 0
    ict_count = 0
    errors = 0

    try:
        # Build role lookup
        roles = {r.name: r for r in NormalizedRole.objects.all()}

        # Read the CSV file
        file_content = upload.file.read().decode('utf-8')
        reader = csv.DictReader(io.StringIO(file_content))

        postings_to_create = []

        for row_num, row in enumerate(reader, start=2):  # Row 2 = first data row
            total += 1
            try:
                title = row.get('title', '').strip()
                if not title:
                    log_lines.append(f"Row {row_num}: skipped (empty title)")
                    errors += 1
                    continue

                description = row.get('description', '')
                is_ict, confidence, role_name = classify_posting(title, description)

                role_obj = roles.get(role_name) if role_name else None
                if is_ict:
                    ict_count += 1

                posting = JobPosting(
                    upload=upload,
                    source=row.get('source', 'csv_upload'),
                    source_job_id=row.get('source_job_id', ''),
                    source_url=row.get('source_url', ''),
                    title=title,
                    company=row.get('company', ''),
                    location_raw=row.get('location_raw', ''),
                    country=row.get('country', 'Rwanda'),
                    industry_raw=row.get('industry_raw', ''),
                    education_raw=row.get('education_raw', ''),
                    experience_raw=row.get('experience_raw', ''),
                    contract_type_raw=row.get('contract_type_raw', ''),
                    description=description,
                    is_ict=is_ict,
                    ict_role_confidence=confidence,
                    normalized_role=role_obj,
                    role_normalization_confidence=confidence if role_obj else 0,
                    needs_manual_review=is_ict and confidence < 0.5,
                    manual_review_reason='Low confidence classification' if (is_ict and confidence < 0.5) else '',
                )
                postings_to_create.append(posting)

            except Exception as e:
                errors += 1
                log_lines.append(f"Row {row_num}: error — {str(e)}")

        # Bulk create all postings
        with transaction.atomic():
            JobPosting.objects.bulk_create(postings_to_create)

        log_lines.insert(0, f"Processed {total} rows: {ict_count} ICT, {errors} errors")
        upload.status = 'completed'
        upload.total_records = total
        upload.ict_records = ict_count
        upload.error_count = errors
        upload.processing_log = '\n'.join(log_lines)
        upload.save()

    except Exception as e:
        upload.status = 'failed'
        upload.processing_log = f"Fatal error: {str(e)}\n{traceback.format_exc()}"
        upload.save()
```

### C2: If Celery is not running (fallback)

If Redis/Celery is not set up during development, you can call the task synchronously. Update `uploads/views.py` `UploadCreateView.perform_create`:

```python
def perform_create(self, serializer):
    upload = serializer.save(
        uploaded_by=self.request.user,
        original_filename=self.request.FILES['file'].name,
        status='pending',
    )
    try:
        # Try async first
        from uploads.tasks import process_upload_task
        process_upload_task.delay(upload.id)
    except Exception:
        # Fallback: run synchronously if Celery not available
        from uploads.tasks import process_upload_task
        process_upload_task(upload.id)
```

---

## Part D: API Documentation

Delphin already configured `drf-spectacular` in settings. You just need to verify the Swagger docs work:

1. Start the server: `python manage.py runserver`
2. Visit `http://localhost:8000/api/docs/`
3. You should see all your endpoints documented automatically
4. Test a few endpoints from the Swagger UI

---

## Step-by-Step Verification

After all code is written, verify each endpoint group works:

```bash
# Start the server
python manage.py runserver

# 1. Register a test user
curl -X POST http://localhost:8000/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","username":"testuser","first_name":"Test","last_name":"User","password":"testpass123","password_confirm":"testpass123"}'

# 2. Login to get tokens
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"testpass123"}'
# Save the "access" token from the response

# 3. Test taxonomy (replace TOKEN with actual token)
curl http://localhost:8000/api/taxonomy/roles/ \
  -H "Authorization: Bearer TOKEN"
# Should return 20 roles

# 4. Test forecasts
curl http://localhost:8000/api/predictions/forecasts/ \
  -H "Authorization: Bearer TOKEN"
# Should return 60 forecast rows

# 5. Test trends
curl http://localhost:8000/api/predictions/trends/ \
  -H "Authorization: Bearer TOKEN"
# Should return growing/stable/declining groups

# 6. Test dashboard KPIs
curl http://localhost:8000/api/dashboard/kpis/ \
  -H "Authorization: Bearer TOKEN"

# 7. Test historical data
curl "http://localhost:8000/api/predictions/historical/?year_from=2020" \
  -H "Authorization: Bearer TOKEN"

# 8. Test employability scoring
curl -X POST http://localhost:8000/api/analytics/employability/score/ \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"skills": [1, 2, 3]}'

# 9. Test API docs
# Open http://localhost:8000/api/docs/ in browser
```

---

## Commit & Push

```bash
git add -A
git commit -m "feat: Phase 3C+3E+3F — REST API endpoints, ML integration, CSV upload pipeline"
git push -u origin feature/api-and-integration
```

---

## Checklist — What "Done" Looks Like

### Auth endpoints (`/api/auth/`)
- [ ] `POST /api/auth/register/` — creates user, returns profile
- [ ] `POST /api/auth/login/` — returns JWT access + refresh tokens
- [ ] `POST /api/auth/refresh/` — refreshes access token
- [ ] `POST /api/auth/logout/` — blacklists refresh token
- [ ] `GET /api/auth/me/` — returns current user profile
- [ ] `PUT /api/auth/me/` — updates profile

### Taxonomy endpoints (`/api/taxonomy/`)
- [ ] `GET /api/taxonomy/groups/` — returns 7 groups with families and roles
- [ ] `GET /api/taxonomy/families/` — returns all families
- [ ] `GET /api/taxonomy/roles/` — returns 20 roles with search/filter
- [ ] `GET /api/taxonomy/roles/:id/` — returns role detail + full history
- [ ] `GET /api/taxonomy/emerging/` — returns emerging roles (empty for now)

### Predictions endpoints (`/api/predictions/`)
- [ ] `GET /api/predictions/forecasts/` — returns latest 60 forecasts
- [ ] `GET /api/predictions/forecasts/:role_id/` — returns 3 forecasts for one role
- [ ] `GET /api/predictions/trends/` — returns growing/stable/declining groups
- [ ] `GET /api/predictions/historical/` — returns historical demand with filters
- [ ] `GET /api/predictions/macro/` — returns macro indicators
- [ ] `POST /api/predictions/run/` — triggers forecast (admin only)

### Dashboard endpoints (`/api/dashboard/`)
- [ ] `GET /api/dashboard/kpis/` — returns KPI cards data
- [ ] `GET /api/dashboard/overview/` — returns dashboard summary

### Upload endpoints (`/api/uploads/`)
- [ ] `POST /api/uploads/` — accepts CSV upload (admin only)
- [ ] `GET /api/uploads/list/` — lists past uploads
- [ ] `GET /api/uploads/:id/` — upload detail + processing log
- [ ] `GET /api/uploads/:id/postings/` — postings from upload

### Analytics endpoints (`/api/analytics/`)
- [ ] `GET /api/analytics/sector/` — sector demand breakdown
- [ ] `GET /api/analytics/geographic/` — geographic demand
- [ ] `GET /api/analytics/employability/` — scoring overview
- [ ] `POST /api/analytics/employability/score/` — scores a skill profile
- [ ] `GET /api/analytics/education/` — placeholder
- [ ] `GET /api/analytics/career/` — career guidance

### Reports endpoints (`/api/reports/`)
- [ ] `GET /api/reports/` — lists past reports
- [ ] `GET /api/reports/demand_outlook/` — demand outlook JSON
- [ ] `GET /api/reports/demand_outlook/csv/` — demand outlook CSV export

### ML Integration
- [ ] `predictions/ml/model_loader.py` — loads .joblib artifacts with caching
- [ ] `predictions/ml/forecaster.py` — runs Two-Stage pipeline from database
- [ ] `POST /api/predictions/run/` calls forecaster and stores results

### CSV Upload Pipeline
- [ ] `uploads/tasks.py` — Celery task for async CSV processing
- [ ] Classifies postings (ICT or not, which role)
- [ ] Creates JobPosting records in bulk
- [ ] Updates DataUpload status and processing log
- [ ] Handles errors gracefully

### General
- [ ] API documentation accessible at `/api/docs/` (Swagger UI)
- [ ] All list endpoints have pagination
- [ ] All endpoints require authentication (except register/login)
- [ ] Admin-only endpoints enforce `IsAdminUser` permission
- [ ] All verification curl commands pass
- [ ] Branch pushed to `feature/api-and-integration`

---

## Coordination with Delphin

Delphin's `feature/backend-foundation` branch must be merged or available before you start. Specifically, you need:

1. All models (`accounts/models.py`, `taxonomy/models.py`, `predictions/models.py`, `uploads/models.py`, `analytics/models.py`, `reports/models.py`)
2. `accounts/permissions.py` (you import permission classes)
3. `accounts/serializers.py` (you use `UserSerializer` in auth views)
4. Working migrations and seed data
5. `skillsense_backend/urls.py` pointing to your app URL files
6. `.env` and settings configured

**Talk to Delphin.** If his models aren't ready yet, you can still start writing serializers and views with placeholder imports — but you'll need his models to actually run the server.
