from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from accounts.permissions import IsAdminUser
from core.params import int_param
from taxonomy.models import HistoricalDemand, MacroIndicator
from taxonomy.serializers import MacroIndicatorSerializer
from .models import ForecastRun, RoleForecast
from .serializers import (
    ForecastRunSerializer,
    RoleForecastSerializer,
    ForecastRunSummarySerializer,
)


@extend_schema(parameters=[OpenApiParameter('horizon', OpenApiTypes.STR, description='6m, 1y or 2y'), OpenApiParameter('role_id', OpenApiTypes.INT, description='Filter to one role')], responses=OpenApiTypes.OBJECT)
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

        horizon = request.query_params.get('horizon')
        if horizon:
            forecasts = forecasts.filter(horizon=horizon)

        role_id = int_param(request.query_params, 'role_id')
        if role_id is not None:
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

    @extend_schema(operation_id='predictions_forecast_by_role', responses=OpenApiTypes.OBJECT)
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


@extend_schema(responses=OpenApiTypes.OBJECT)
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


@extend_schema(parameters=[OpenApiParameter('role_id', OpenApiTypes.INT, description=''), OpenApiParameter('year_from', OpenApiTypes.INT, description=''), OpenApiParameter('year_to', OpenApiTypes.INT, description='')], responses=OpenApiTypes.OBJECT)
class HistoricalDemandView(APIView):
    """
    GET /api/predictions/historical/
    Returns historical demand data. Optional filters: ?role_id=5&year_from=2015&year_to=2026
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        queryset = HistoricalDemand.objects.select_related('role').all()

        role_id = int_param(request.query_params, 'role_id')
        if role_id is not None:
            queryset = queryset.filter(role_id=role_id)

        year_from = int_param(request.query_params, 'year_from')
        if year_from is not None:
            queryset = queryset.filter(year__gte=year_from)

        year_to = int_param(request.query_params, 'year_to')
        if year_to is not None:
            queryset = queryset.filter(year__lte=year_to)

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


@extend_schema(request=None, responses={201: ForecastRunSummarySerializer})
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
