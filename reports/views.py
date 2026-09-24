import csv
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
