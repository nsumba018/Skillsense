from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from taxonomy.models import NormalizedRole, Sector, HistoricalDemand, MacroIndicator, SectorEmployment
from uploads.models import JobPosting
from .models import ForecastRun, RoleForecast, SectorForecastRun, SectorForecast


@extend_schema(responses=OpenApiTypes.OBJECT)
class DashboardKPIView(APIView):
    """
    GET /api/dashboard/kpis/
    Returns top-level KPIs for the main dashboard cards.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        latest_macro = MacroIndicator.objects.order_by('-year').first()
        latest_run = ForecastRun.objects.first()

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

        sector_summary = []
        latest_sector_run = SectorForecastRun.objects.first()
        if latest_sector_run:
            sector_forecasts = SectorForecast.objects.filter(
                forecast_run=latest_sector_run,
                horizon='1y',
            ).select_related('sector').order_by('-employment_share_pct')
            sector_summary = [
                {
                    'sector_name': sf.sector.name,
                    'sector_slug': sf.sector.slug,
                    'sector_color': sf.sector.color,
                    'employment_share_pct': sf.employment_share_pct,
                    'employment_count': sf.employment_count,
                    'share_trend': sf.share_trend,
                    'employment_trend': sf.employment_trend,
                    'posting_count': sf.posting_count,
                }
                for sf in sector_forecasts
            ]

        total_sectors = Sector.objects.count()

        return Response({
            'total_ict_employment': latest_macro.ict_employment if latest_macro else 0,
            'ict_share_pct': latest_macro.ict_employment_share_pct if latest_macro else 0,
            'total_roles_tracked': NormalizedRole.objects.count(),
            'total_postings': JobPosting.objects.count(),
            'total_sectors': total_sectors,
            'latest_year': latest_macro.year if latest_macro else None,
            'top_growing_roles': growing_roles,
            'sector_forecasts': sector_summary,
            'model_accuracy': {
                'spearman': latest_run.accuracy_spearman if latest_run else None,
                'r2': latest_run.accuracy_r2 if latest_run else None,
            },
        })


@extend_schema(responses=OpenApiTypes.OBJECT)
class DashboardOverviewView(APIView):
    """
    GET /api/dashboard/overview/
    Returns a summary for the main dashboard including role distribution and recent data.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
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

        sector_overview = []
        latest_sector_run = SectorForecastRun.objects.first()
        if latest_sector_run:
            for horizon in ['6m', '1y', '2y']:
                sf_list = SectorForecast.objects.filter(
                    forecast_run=latest_sector_run,
                    horizon=horizon,
                ).select_related('sector').order_by('-employment_share_pct')
                sector_overview.append({
                    'horizon': horizon,
                    'sectors': [
                        {
                            'sector_name': sf.sector.name,
                            'sector_slug': sf.sector.slug,
                            'employment_share_pct': sf.employment_share_pct,
                            'employment_count': sf.employment_count,
                            'share_trend': sf.share_trend,
                            'employment_trend': sf.employment_trend,
                        }
                        for sf in sf_list
                    ],
                })

        return Response({
            'latest_year': latest_year,
            'role_distribution': role_distribution,
            'forecast_summary': forecast_summary,
            'sector_forecast_summary': sector_overview,
            'model_info': {
                'version': latest_run.model_version if latest_run else None,
                'last_run': latest_run.created_at if latest_run else None,
                'spearman': latest_run.accuracy_spearman if latest_run else None,
            },
        })
