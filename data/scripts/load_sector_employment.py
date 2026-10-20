#!/usr/bin/env python3
"""
SkillSense — Load Sector Employment History into Django
========================================================
Loads the generated sector_employment_history CSV into the
SectorEmployment model via Django ORM.
"""

import os
import sys
import csv
import django

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
sys.path.insert(0, os.path.join(BASE_DIR, "backend"))
os.environ.setdefault("DJANGO_SETTINGS_MODULE", "skillsense_backend.settings")
django.setup()

from taxonomy.models import Sector, SectorEmployment


def main():
    csv_path = os.path.join(BASE_DIR, "data", "historical", "sector_employment_history_2010_2025.csv")

    with open(csv_path, 'r') as f:
        reader = csv.DictReader(f)
        rows = list(reader)

    print(f"Loading {len(rows)} sector employment records...")

    sector_cache = {}
    created = 0
    updated = 0

    for row in rows:
        slug = row['sector_slug']
        if slug not in sector_cache:
            try:
                sector_cache[slug] = Sector.objects.get(slug=slug)
            except Sector.DoesNotExist:
                print(f"  WARNING: Sector '{slug}' not found, skipping")
                continue

        sector = sector_cache[slug]
        year = int(row['year'])

        defaults = {
            'employment_count': int(row['employment_count']),
            'employment_share_pct': float(row['employment_share_pct']),
            'gdp_contribution_pct': float(row['gdp_contribution_pct']) if row['gdp_contribution_pct'] else None,
            'posting_count': int(row['posting_count']),
            'data_source': row['data_source'],
            'synthetic_flag': row['synthetic_flag'] == 'True',
        }

        obj, was_created = SectorEmployment.objects.update_or_create(
            sector=sector,
            year=year,
            defaults=defaults,
        )
        if was_created:
            created += 1
        else:
            updated += 1

    print(f"\nDone: {created} created, {updated} updated")
    print(f"Total SectorEmployment rows: {SectorEmployment.objects.count()}")


if __name__ == "__main__":
    main()
