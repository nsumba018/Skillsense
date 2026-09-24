from django.db.models import Count
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
from taxonomy.models import NormalizedRole
from predictions.models import ForecastRun, RoleForecast
from uploads.models import JobPosting
from .models import GeographicDemand
from .serializers import GeographicDemandSerializer, EmployabilityInputSerializer


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
            f"Learn {gap['role_name']} skills — demand index: {gap['demand_index']:.0f}, trend: {gap['trend']}"
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
    Education/training gap analysis (placeholder — data collection needed).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            'status': 'placeholder',
            'message': 'Education alignment data collection in progress. '
                       'This endpoint will compare institutional curricula against market demand.',
        })


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
