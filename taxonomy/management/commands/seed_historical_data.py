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
                    year = int(float(row['year']))
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
