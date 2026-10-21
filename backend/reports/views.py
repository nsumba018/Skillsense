import csv
from django.http import HttpResponse
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import generics
from django.db.models import Count
from predictions.models import ForecastRun, RoleForecast, SectorForecastRun, SectorForecast
from core.params import int_param
from taxonomy.models import HistoricalDemand, Sector, SectorEmployment
from uploads.models import JobPosting
from .models import GeneratedReport
from .pdf import demand_outlook_pdf, role_deep_dive_pdf, sector_detail_pdf, sector_outlook_pdf
from .serializers import GeneratedReportSerializer


class ReportListView(generics.ListAPIView):
    """GET /api/reports/ — List available and past reports."""
    queryset = GeneratedReport.objects.all()
    serializer_class = GeneratedReportSerializer
    permission_classes = [IsAuthenticated]


@extend_schema(parameters=[OpenApiParameter('role_id', OpenApiTypes.INT, description='Required for role_deep_dive')], responses=OpenApiTypes.OBJECT)
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
            role_id = int_param(request.query_params, 'role_id')
            return self._role_deep_dive(role_id)
        elif report_type == 'sector_outlook':
            return self._sector_outlook_report()
        elif report_type == 'sector_detail':
            sector = request.query_params.get('sector')
            if not sector:
                return Response({"detail": "sector query param required."}, status=400)
            return self._sector_detail_report(sector)
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
        if role_id is None:
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

    def _sector_outlook_report(self):
        run = SectorForecastRun.objects.first()
        if not run:
            return Response({"detail": "No sector forecasts available."}, status=404)

        forecasts = SectorForecast.objects.filter(
            forecast_run=run,
        ).select_related('sector').order_by('horizon', '-employment_count')

        emp_latest = {}
        for se in SectorEmployment.objects.select_related('sector').order_by('sector__slug', '-year'):
            if se.sector.slug not in emp_latest:
                emp_latest[se.sector.slug] = se.employment_count

        by_horizon = {}
        for f in forecasts:
            h = f.horizon
            if h not in by_horizon:
                by_horizon[h] = []
            current = emp_latest.get(f.sector.slug, 0)
            growth = round((f.employment_count - current) / current * 100, 1) if current > 0 else 0
            by_horizon[h].append({
                'sector': f.sector.name,
                'sector_slug': f.sector.slug,
                'employment_count': f.employment_count,
                'employment_share_pct': f.employment_share_pct,
                'growth_pct': growth,
                'employment_trend': f.employment_trend,
                'posting_count': f.posting_count,
                'confidence_lower': f.confidence_lower,
                'confidence_upper': f.confidence_upper,
            })

        return Response({
            'title': 'Cross-Sector Workforce Outlook',
            'model_version': run.model_version,
            'generated_at': run.created_at,
            'accuracy': {
                'mae': run.accuracy_mae,
                'r2': run.accuracy_r2,
            },
            'forecasts': by_horizon,
        })

    def _sector_detail_report(self, sector_slug):
        sector = Sector.objects.filter(slug=sector_slug).first()
        if not sector:
            return Response({"detail": f"Unknown sector: {sector_slug}"}, status=404)

        run = SectorForecastRun.objects.first()
        if not run:
            return Response({"detail": "No sector forecasts available."}, status=404)

        emp_qs = SectorEmployment.objects.filter(sector=sector).order_by('-year')
        current_emp = emp_qs.first().employment_count if emp_qs.exists() else 0
        emp_history = [
            {'year': e.year, 'employment_count': e.employment_count, 'share_pct': e.employment_share_pct}
            for e in emp_qs.order_by('year')
        ]

        forecasts_by_horizon = {}
        for f in SectorForecast.objects.filter(forecast_run=run, sector=sector).order_by('horizon'):
            growth = round((f.employment_count - current_emp) / current_emp * 100, 1) if current_emp > 0 else 0
            forecasts_by_horizon[f.horizon] = {
                'employment_count': f.employment_count,
                'employment_share_pct': f.employment_share_pct,
                'growth_pct': growth,
                'employment_trend': f.employment_trend,
                'confidence_lower': f.confidence_lower,
                'confidence_upper': f.confidence_upper,
            }

        postings = JobPosting.objects.filter(sector=sector)
        total_postings = postings.count()
        top_positions = list(
            postings.values('title')
            .annotate(count=Count('id'))
            .order_by('-count')[:15]
        )
        top_companies = list(
            postings.exclude(company='').values('company')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )
        top_locations = list(
            postings.exclude(location_raw='').values('location_raw')
            .annotate(count=Count('id'))
            .order_by('-count')[:10]
        )

        return Response({
            'title': f'{sector.name} — Sector Detail Report',
            'sector_name': sector.name,
            'sector_slug': sector.slug,
            'model_version': run.model_version,
            'generated_at': run.created_at,
            'accuracy': {'mae': run.accuracy_mae, 'r2': run.accuracy_r2},
            'current_employment': current_emp,
            'employment_history': emp_history,
            'forecasts': forecasts_by_horizon,
            'total_postings': total_postings,
            'top_positions': top_positions,
            'top_companies': [{'name': c['company'], 'count': c['count']} for c in top_companies],
            'top_locations': [{'location': l['location_raw'], 'count': l['count']} for l in top_locations],
        })


@extend_schema(responses={(200, 'text/csv'): OpenApiTypes.BINARY})
class ReportCSVView(APIView):
    """
    GET /api/reports/:type/csv/ — Export report as CSV.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, report_type):
        if report_type == 'demand_outlook':
            return self._demand_outlook_csv()
        elif report_type == 'sector_outlook':
            return self._sector_outlook_csv()
        elif report_type == 'sector_detail':
            sector = request.query_params.get('sector')
            if not sector:
                return Response({"detail": "sector query param required."}, status=400)
            return self._sector_detail_csv(sector)
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

    def _sector_outlook_csv(self):
        run = SectorForecastRun.objects.first()
        if not run:
            return Response({"detail": "No sector forecasts available."}, status=404)

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="sector_outlook.csv"'

        emp_latest = {}
        for se in SectorEmployment.objects.select_related('sector').order_by('sector__slug', '-year'):
            if se.sector.slug not in emp_latest:
                emp_latest[se.sector.slug] = se.employment_count

        writer = csv.writer(response)
        writer.writerow([
            'sector', 'horizon', 'employment_count', 'employment_share_pct',
            'growth_pct', 'employment_trend', 'posting_count',
            'confidence_lower', 'confidence_upper',
        ])

        forecasts = SectorForecast.objects.filter(
            forecast_run=run,
        ).select_related('sector').order_by('horizon', '-employment_count')

        for f in forecasts:
            current = emp_latest.get(f.sector.slug, 0)
            growth = round((f.employment_count - current) / current * 100, 1) if current > 0 else 0
            writer.writerow([
                f.sector.name, f.horizon, f.employment_count, f.employment_share_pct,
                growth, f.employment_trend, f.posting_count,
                f.confidence_lower, f.confidence_upper,
            ])

        return response

    def _sector_detail_csv(self, sector_slug):
        sector = Sector.objects.filter(slug=sector_slug).first()
        if not sector:
            return Response({"detail": f"Unknown sector: {sector_slug}"}, status=404)

        run = SectorForecastRun.objects.first()
        if not run:
            return Response({"detail": "No sector forecasts available."}, status=404)

        safe_name = sector.slug.replace('-', '_')
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="sector_detail_{safe_name}.csv"'

        writer = csv.writer(response)

        emp_qs = SectorEmployment.objects.filter(sector=sector).order_by('-year')
        current_emp = emp_qs.first().employment_count if emp_qs.exists() else 0

        writer.writerow(['--- Employment History ---'])
        writer.writerow(['year', 'employment_count', 'share_pct'])
        for e in emp_qs.order_by('year'):
            writer.writerow([e.year, e.employment_count, e.employment_share_pct])

        writer.writerow([])
        writer.writerow(['--- Forecasts ---'])
        writer.writerow(['horizon', 'employment_count', 'share_pct', 'growth_pct', 'trend', 'confidence_lower', 'confidence_upper'])
        for f in SectorForecast.objects.filter(forecast_run=run, sector=sector).order_by('horizon'):
            growth = round((f.employment_count - current_emp) / current_emp * 100, 1) if current_emp > 0 else 0
            writer.writerow([f.horizon, f.employment_count, f.employment_share_pct, growth, f.employment_trend, f.confidence_lower, f.confidence_upper])

        writer.writerow([])
        writer.writerow(['--- Top Positions ---'])
        writer.writerow(['title', 'postings'])
        postings = JobPosting.objects.filter(sector=sector)
        for row in postings.values('title').annotate(count=Count('id')).order_by('-count')[:15]:
            writer.writerow([row['title'], row['count']])

        writer.writerow([])
        writer.writerow(['--- Top Companies ---'])
        writer.writerow(['company', 'postings'])
        for row in postings.exclude(company='').values('company').annotate(count=Count('id')).order_by('-count')[:10]:
            writer.writerow([row['company'], row['count']])

        return response


@extend_schema(responses={(200, 'application/pdf'): OpenApiTypes.BINARY})
class ReportPDFView(APIView):
    """GET /api/reports/:type/pdf/ — Export report as PDF."""
    permission_classes = [IsAuthenticated]

    def get(self, request, report_type):
        gen = ReportGenerateView()
        gen.request = request

        if report_type == 'sector_outlook':
            resp = gen._sector_outlook_report()
            if resp.status_code != 200:
                return resp
            buf = sector_outlook_pdf(resp.data)
            filename = 'sector_outlook.pdf'

        elif report_type == 'sector_detail':
            sector = request.query_params.get('sector')
            if not sector:
                return Response({"detail": "sector query param required."}, status=400)
            resp = gen._sector_detail_report(sector)
            if resp.status_code != 200:
                return resp
            buf = sector_detail_pdf(resp.data)
            safe = sector.replace('-', '_')
            filename = f'sector_detail_{safe}.pdf'

        elif report_type == 'demand_outlook':
            resp = gen._demand_outlook_report()
            if resp.status_code != 200:
                return resp
            buf = demand_outlook_pdf(resp.data)
            filename = 'demand_outlook.pdf'

        elif report_type == 'role_deep_dive':
            role_id = int_param(request.query_params, 'role_id')
            if role_id is None:
                return Response({"detail": "role_id query param required."}, status=400)
            resp = gen._role_deep_dive(role_id)
            if resp.status_code != 200:
                return resp
            buf = role_deep_dive_pdf(resp.data)
            filename = f'role_deep_dive_{role_id}.pdf'

        else:
            return Response({"detail": f"PDF not available for: {report_type}"}, status=400)

        http_resp = HttpResponse(buf.read(), content_type='application/pdf')
        http_resp['Content-Disposition'] = f'attachment; filename="{filename}"'
        return http_resp
