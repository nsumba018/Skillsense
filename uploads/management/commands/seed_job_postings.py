"""
Load Dataset B (92 job postings) into JobPosting table.

Reads from:
  - skillsense_job_data/data/current_ict/ict_job_postings_v2.csv

Usage:
    python manage.py seed_job_postings
"""
import csv
from datetime import datetime
from pathlib import Path
from django.core.management.base import BaseCommand
from django.conf import settings
from taxonomy.models import NormalizedRole
from uploads.models import JobPosting


DATA_FILE = (
    Path(settings.BASE_DIR)
    / 'skillsense_job_data'
    / 'data'
    / 'current_ict'
    / 'ict_job_postings_v2.csv'
)

DATE_FORMATS = ('%Y-%m-%d', '%m/%d/%Y')


def parse_date(value):
    """Dataset B mixes ISO dates, US-style dates, and free text like
    'Not specified'. Returns a date object, or None if unparseable."""
    value = (value or '').strip()
    if not value:
        return None
    for fmt in DATE_FORMATS:
        try:
            return datetime.strptime(value, fmt).date()
        except ValueError:
            continue
    return None


class Command(BaseCommand):
    help = 'Load Dataset B (92 job postings) into JobPosting table'

    def handle(self, *args, **options):
        if not DATA_FILE.exists():
            self.stderr.write(self.style.ERROR(f'File not found: {DATA_FILE}'))
            return

        roles = {r.name: r for r in NormalizedRole.objects.all()}
        created = 0

        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                role_name = row.get('normalized_role', '')
                role_obj = roles.get(role_name)

                _, was_created = JobPosting.objects.get_or_create(
                    source=row.get('source', ''),
                    source_job_id=row.get('source_job_id', ''),
                    title=row.get('title', ''),
                    defaults={
                        'upload': None,  # Seed data, no upload record
                        'source_url': row.get('source_url', ''),
                        'company': row.get('company', ''),
                        'location_raw': row.get('location_raw', ''),
                        'country': row.get('country', 'Rwanda'),
                        'industry_raw': row.get('industry_raw', ''),
                        'education_raw': row.get('education_raw', ''),
                        'experience_raw': row.get('experience_raw', ''),
                        'contract_type_raw': row.get('contract_type_raw', ''),
                        'posted_date': parse_date(row.get('posted_date')),
                        'closing_date': parse_date(row.get('closing_date')),
                        'is_ict': row.get('is_ict', '').lower() in ('true', '1', 'yes'),
                        'ict_role_confidence': float(row.get('ict_role_confidence', 0) or 0),
                        'normalized_role': role_obj,
                        'role_level': row.get('role_level', ''),
                        'role_normalization_confidence': float(row.get('role_normalization_confidence', 0) or 0),
                        'classification_reason': row.get('classification_reason', ''),
                        'needs_manual_review': row.get('needs_manual_review', '').lower() in ('true', '1', 'yes'),
                        'manual_review_reason': row.get('manual_review_reason', ''),
                    },
                )
                if was_created:
                    created += 1

        self.stdout.write(self.style.SUCCESS(f'Job postings loaded: {created} rows'))
