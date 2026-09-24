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
