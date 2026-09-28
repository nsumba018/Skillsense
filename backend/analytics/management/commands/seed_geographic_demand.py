"""
Build GeographicDemand (ICT demand by province/district) from the job postings.

Usage:
    python manage.py seed_geographic_demand
"""
from django.core.management.base import BaseCommand

from analytics.services import geographic_summary, rebuild_geographic_demand


class Command(BaseCommand):
    help = 'Rebuild geographic ICT demand from job postings'

    def handle(self, *args, **options):
        rows = rebuild_geographic_demand()
        s = geographic_summary()
        self.stdout.write(self.style.SUCCESS(
            f"Geographic demand rebuilt: {rows} rows; "
            f"{s['located_postings']} of {s['total_ict_postings']} ICT postings have a location in Rwanda"
        ))
