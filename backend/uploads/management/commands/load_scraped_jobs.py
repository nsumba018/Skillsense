"""
Load classified scraped job data into the JobPosting table.

Reads from:  data/classified/classified_all_sectors.csv

Usage:
    python manage.py load_scraped_jobs [--dry-run] [--clear]
"""

import csv
from datetime import datetime
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand
from django.utils import timezone

from taxonomy.models import Sector
from uploads.models import JobPosting


DATA_FILE = Path(settings.BASE_DIR).parent / "data" / "classified" / "classified_all_sectors.csv"

DATE_FORMATS = ('%Y-%m-%d', '%m/%d/%Y', '%d/%m/%Y', '%d-%m-%Y')


def parse_date(value):
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
    help = 'Load classified scraped job postings into the database'

    def add_arguments(self, parser):
        parser.add_argument('--dry-run', action='store_true', help='Show what would be loaded without writing')
        parser.add_argument('--clear', action='store_true', help='Delete all existing postings before loading')

    def handle(self, *args, **options):
        if not DATA_FILE.exists():
            self.stderr.write(self.style.ERROR(f'File not found: {DATA_FILE}'))
            self.stderr.write('Run the scraper first: python data/scripts/scrape_all_platforms.py')
            return

        sectors = {s.slug: s for s in Sector.objects.all()}
        if not sectors:
            self.stderr.write(self.style.ERROR('No sectors in database. Run seed_taxonomy first.'))
            return

        if options['clear'] and not options['dry_run']:
            deleted, _ = JobPosting.objects.all().delete()
            self.stdout.write(self.style.WARNING(f'Deleted {deleted} existing postings'))

        created = 0
        skipped = 0
        updated = 0
        errors = 0

        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            rows = list(reader)

        self.stdout.write(f'Processing {len(rows)} records from {DATA_FILE.name}...')

        for row in rows:
            title = (row.get('title') or '').strip()
            source = (row.get('source') or '').strip()
            source_job_id = (row.get('source_job_id') or '').strip()

            if not title:
                errors += 1
                continue

            # Skip tenders and consultancies — only import jobs
            listing_type = (row.get('listing_type') or '').strip().lower()
            if listing_type in ('tender', 'consultancy', 'other'):
                skipped += 1
                continue

            sector_slug = (row.get('sector_slug') or '').strip()
            sector = sectors.get(sector_slug)

            if options['dry_run']:
                self.stdout.write(f'  [DRY] {source}/{source_job_id}: {title[:50]} → {sector_slug}')
                created += 1
                continue

            defaults = {
                'source_url': (row.get('source_url') or '')[:500],
                'company': (row.get('company') or '')[:255],
                'location_raw': (row.get('location_raw') or '')[:255],
                'country': row.get('country') or 'Rwanda',
                'industry_raw': (row.get('industry_raw') or '')[:255],
                'education_raw': (row.get('education_raw') or '')[:255],
                'experience_raw': (row.get('experience_raw') or '')[:255],
                'contract_type_raw': (row.get('contract_type_raw') or '')[:100],
                'posted_date': parse_date(row.get('posted_date')),
                'closing_date': parse_date(row.get('closing_date')),
                'raw_text': row.get('raw_text') or '',
                'sector': sector,
            }

            scraped_at = row.get('scraped_at')
            if scraped_at:
                try:
                    defaults['scraped_at'] = datetime.fromisoformat(scraped_at.replace('Z', '+00:00'))
                except (ValueError, AttributeError):
                    defaults['scraped_at'] = timezone.now()

            try:
                _, was_created = JobPosting.objects.update_or_create(
                    source=source,
                    source_job_id=source_job_id,
                    title=title,
                    defaults=defaults,
                )
                if was_created:
                    created += 1
                else:
                    updated += 1
            except Exception as e:
                errors += 1
                if errors <= 10:
                    self.stderr.write(f'  Error: {title[:40]} — {e}')

        action = 'Would load' if options['dry_run'] else 'Loaded'
        self.stdout.write(self.style.SUCCESS(
            f'\n{action}: {created} new, {updated} updated, {skipped} skipped, {errors} errors'
        ))

        total = JobPosting.objects.count()
        self.stdout.write(f'Total postings in database: {total}')

        self.stdout.write('\nBy sector:')
        from django.db.models import Count
        for row in JobPosting.objects.values('sector__name').annotate(c=Count('id')).order_by('-c'):
            self.stdout.write(f'  {row["sector__name"] or "Unclassified"}: {row["c"]}')

        self.stdout.write(f'\nBy source:')
        for row in JobPosting.objects.values('source').annotate(c=Count('id')).order_by('-c'):
            self.stdout.write(f'  {row["source"]}: {row["c"]}')
