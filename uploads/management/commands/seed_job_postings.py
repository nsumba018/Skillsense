import os
import csv
from django.core.management.base import BaseCommand
from django.conf import settings
from uploads.models import DataUpload, JobPosting
from taxonomy.models import NormalizedRole


class Command(BaseCommand):
    help = "Seed job postings from ict_job_postings_v2.csv"

    def handle(self, *args, **kwargs):
        csv_path = os.path.join(settings.BASE_DIR, 'skillsense_job_data', 'ict_job_postings_v2.csv')

        if not os.path.exists(csv_path):
            self.stdout.write(self.style.ERROR(f"CSV not found: {csv_path}"))
            return

        upload = DataUpload.objects.create(
            file_name="ict_job_postings_v2.csv",
            status="processing",
        )

        roles = {r.normalized_title: r for r in NormalizedRole.objects.all()}
        created = 0
        skipped = 0

        with open(csv_path, encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                title = row.get('normalized_role', '').strip()
                role = roles.get(title)
                if not role:
                    skipped += 1
                    continue
                JobPosting.objects.get_or_create(
                    job_id=row.get('job_id', '').strip(),
                    defaults={
                        'normalized_role': role,
                        'job_title': row.get('job_title', '').strip(),
                        'company': row.get('company', '').strip(),
                        'location': row.get('location', '').strip(),
                        'date_posted': row.get('date_posted') or None,
                        'source_platform': row.get('source_platform', '').strip(),
                    }
                )
                created += 1

        upload.status = "completed"
        upload.save()

        self.stdout.write(self.style.SUCCESS(
            f"Job postings seeded: {created} created, {skipped} skipped (role not found)."
        ))


        