import csv
import os
from django.core.management.base import BaseCommand
from django.conf import settings
from predictions.models import ForecastRun, RoleForecast
from taxonomy.models import NormalizedRole


class Command(BaseCommand):
    help = "Seed forecast results from forecast_results_2027_2028.csv (Phase 2 output)"

    def handle(self, *args, **kwargs):
        csv_path = os.path.join(
            settings.BASE_DIR, 'models', 'forecast_results_2027_2028.csv'
        )

        if not os.path.exists(csv_path):
            self.stdout.write(self.style.ERROR(f"CSV not found: {csv_path}"))
            return

        run = ForecastRun.objects.create()

        roles = {r.normalized_title: r for r in NormalizedRole.objects.all()}
        created = 0
        skipped = 0

        with open(csv_path, encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                title = row.get('role', '').strip()
                role = roles.get(title)
                if not role:
                    skipped += 1
                    continue

                RoleForecast.objects.create(
                    forecast_run=run,
                    role=role,
                    horizon=row.get('horizon', '').strip(),
                    predicted_demand=float(row.get('predicted_demand', 0)),
                    lower_bound=float(row.get('lower_bound', 0)),
                    upper_bound=float(row.get('upper_bound', 0)),
                    trend_direction=row.get('trend_direction', 'stable').strip(),
                )
                created += 1

        self.stdout.write(self.style.SUCCESS(
            f"Forecasts seeded: {created} records, {skipped} skipped."
        ))
        