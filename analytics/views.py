from django.db.models import Count, Q
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.parsers import FormParser, JSONParser, MultiPartParser
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
from accounts.permissions import IsEducationPlanner
from taxonomy.models import NormalizedRole
from predictions.models import ForecastRun, RoleForecast
from uploads.models import JobPosting
from .models import Curriculum, GeographicDemand
from .serializers import (
    CurriculumCreateSerializer, CurriculumDetailSerializer, CurriculumSerializer,
    EmployabilityInputSerializer, GeographicDemandSerializer,
)
from .services import geographic_summary, latest_forecast_map
from .skills import SKILL_ROLES


@extend_schema(responses=OpenApiTypes.OBJECT)
class SectorDemandView(APIView):
    """
    GET /api/analytics/sector/
    Returns demand breakdown by industry sector, from real job postings.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
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
    Returns geographic demand data.
    """
    queryset = GeographicDemand.objects.select_related('role').all()
    serializer_class = GeographicDemandSerializer
    permission_classes = [IsAuthenticated]
    filterset_fields = ['province', 'district', 'year']


@extend_schema(responses=OpenApiTypes.OBJECT)
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


@extend_schema(request=EmployabilityInputSerializer, responses=OpenApiTypes.OBJECT)
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

        latest_run = ForecastRun.objects.first()
        if not latest_run:
            return Response({"detail": "No forecasts available."}, status=404)

        forecasts_1y = RoleForecast.objects.filter(
            forecast_run=latest_run,
            horizon='1y',
        ).select_related('role')

        total_demand = sum(f.demand_index for f in forecasts_1y)
        user_roles = set(skill_ids)

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

        recommendations = [
            f"Learn {gap['role_name']} skills: demand index: {gap['demand_index']:.0f}, trend: {gap['trend']}"
            for gap in skill_gaps[:3]
        ]

        return Response({
            'overall_score': round(overall_score, 1),
            'matched_roles': matched_roles,
            'skill_gaps': skill_gaps[:5],
            'recommendations': recommendations,
        })


@extend_schema(responses=OpenApiTypes.OBJECT)
class EducationAlignmentView(APIView):
    """
    GET /api/analytics/education/
    Overview of the education-alignment module: how it scores a curriculum and how many are on file.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'status': 'available',
            'message': 'Upload a curriculum to see which forecast ICT roles it prepares graduates for, '
                       'and which in-demand skills it does not teach yet.',
            'method': 'Each course is read for ICT skills; alignment = share of each role\'s core skills '
                      'taught, weighted by that role\'s forecast demand.',
            'curricula_count': _curricula_for(request.user).count(),
            'skills_in_lexicon': len(SKILL_ROLES),
        })


def _curricula_for(user):
    if not user.is_authenticated:
        return Curriculum.objects.none()
    qs = Curriculum.objects.select_related('institution', 'uploaded_by').prefetch_related('courses')
    if user.is_admin_user:
        return qs
    q = Q(uploaded_by=user)
    if user.institution_id:
        q |= Q(institution_id=user.institution_id)
    return qs.filter(q)


class CurriculumListCreateView(generics.ListCreateAPIView):
    """
    GET  /api/analytics/education/curricula/: Curricula visible to you (own, or your institution's; all for admins).
    POST /api/analytics/education/curricula/: Submit a curriculum (CSV file and/or pasted course list).
    """
    permission_classes = [IsEducationPlanner]
    parser_classes = [MultiPartParser, FormParser, JSONParser]

    def get_queryset(self):
        return _curricula_for(self.request.user)

    def get_serializer_class(self):
        return CurriculumCreateSerializer if self.request.method == 'POST' else CurriculumSerializer

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['forecast_map'] = latest_forecast_map()
        return ctx

    @extend_schema(request=CurriculumCreateSerializer, responses={201: CurriculumDetailSerializer})
    def create(self, request, *args, **kwargs):
        serializer = CurriculumCreateSerializer(data=request.data, context=self.get_serializer_context())
        serializer.is_valid(raise_exception=True)
        curriculum = serializer.save()
        data = CurriculumDetailSerializer(curriculum, context=self.get_serializer_context()).data
        return Response(data, status=201)


class CurriculumDetailView(generics.RetrieveDestroyAPIView):
    """
    GET    /api/analytics/education/curricula/:id/: Curriculum with its alignment analysis against current forecasts.
    DELETE /api/analytics/education/curricula/:id/: Remove it.
    """
    permission_classes = [IsEducationPlanner]
    serializer_class = CurriculumDetailSerializer

    def get_queryset(self):
        return _curricula_for(self.request.user)

    def get_serializer_context(self):
        ctx = super().get_serializer_context()
        ctx['forecast_map'] = latest_forecast_map()
        return ctx


@extend_schema(responses=OpenApiTypes.OBJECT)
class GeographicSummaryView(APIView):
    """
    GET /api/analytics/geographic/summary/
    ICT job-posting demand by province and district (only postings that state a location in Rwanda).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response(geographic_summary())


@extend_schema(responses=OpenApiTypes.OBJECT)
class CareerGuidanceView(APIView):
    """
    GET /api/analytics/career/
    Career guidance recommendations (placeholder).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
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
