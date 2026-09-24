"""
Celery task for processing uploaded CSV files.

When an admin uploads a CSV of job postings, this task:
1. Parses the CSV
2. Classifies each posting (ICT or not, which role)
3. Creates JobPosting records
4. Updates the DataUpload status and processing log
"""
import csv
import io
import traceback
from celery import shared_task
from django.db import transaction
from taxonomy.models import NormalizedRole
from uploads.models import DataUpload, JobPosting


# Simple keyword-based ICT classification
# (In production, replace with the full classify_and_group_v2.py logic)
ICT_KEYWORDS = [
    'software', 'developer', 'engineer', 'programmer', 'devops', 'cloud',
    'data', 'analyst', 'scientist', 'database', 'network', 'cyber',
    'security', 'web', 'frontend', 'backend', 'fullstack', 'full-stack',
    'mobile', 'app', 'ict', 'it ', 'qa', 'quality assurance', 'test',
    'systems admin', 'help desk', 'support', 'infrastructure',
]

# Maps a keyword found in the title/description to a canonical role name
# (must match the NormalizedRole taxonomy seeded by seed_taxonomy.py)
ROLE_KEYWORD_MAP = {
    'backend': 'Backend Developer',
    'frontend': 'Frontend / Web Developer',
    'web developer': 'Frontend / Web Developer',
    'full-stack': 'Full-Stack Developer',
    'fullstack': 'Full-Stack Developer',
    'mobile': 'Mobile App Developer',
    'software developer': 'Software Developer / Software Engineer',
    'software engineer': 'Software Developer / Software Engineer',
    'devops': 'DevOps / Cloud Engineer',
    'cloud': 'DevOps / Cloud Engineer',
    'data analyst': 'Data Analyst',
    'data engineer': 'Data Engineer',
    'data scientist': 'Data Scientist',
    'database': 'Database Administrator',
    'network': 'Network Engineer / Network Administrator',
    'cyber': 'Cybersecurity Analyst / Security Engineer',
    'security engineer': 'Cybersecurity Analyst / Security Engineer',
    'qa': 'QA / Software Test Engineer',
    'test engineer': 'QA / Software Test Engineer',
    'systems admin': 'Systems Administrator',
    'it support': 'IT Support / Help Desk Technician',
    'help desk': 'IT Support / Help Desk Technician',
    'ict manager': 'ICT Manager / IT Manager',
    'it manager': 'ICT Manager / IT Manager',
    'ict officer': 'IT Officer / ICT Administrator',
    'it officer': 'IT Officer / ICT Administrator',
    'it auditor': 'IT Auditor / IT Governance & Risk',
    'business analyst': 'Systems Analyst / IT Business Analyst',
    'systems analyst': 'Systems Analyst / IT Business Analyst',
}


def classify_posting(title, description=''):
    """Basic ICT classification. Returns (is_ict, confidence, matched_role_name)."""
    text = f"{title} {description}".lower()

    matches = sum(1 for kw in ICT_KEYWORDS if kw in text)
    if matches == 0:
        return False, 0.0, None

    confidence = min(matches / 3.0, 1.0)

    matched_role = None
    for keyword, role_name in ROLE_KEYWORD_MAP.items():
        if keyword in text:
            matched_role = role_name
            break

    return True, confidence, matched_role


@shared_task
def process_upload_task(upload_id):
    """Process an uploaded CSV file asynchronously."""
    try:
        upload = DataUpload.objects.get(id=upload_id)
    except DataUpload.DoesNotExist:
        return

    upload.status = 'processing'
    upload.save()

    log_lines = []
    total = 0
    ict_count = 0
    errors = 0

    try:
        roles = {r.name: r for r in NormalizedRole.objects.all()}

        file_content = upload.file.read().decode('utf-8')
        reader = csv.DictReader(io.StringIO(file_content))

        postings_to_create = []

        for row_num, row in enumerate(reader, start=2):  # Row 2 = first data row
            total += 1
            try:
                title = row.get('title', '').strip()
                if not title:
                    log_lines.append(f"Row {row_num}: skipped (empty title)")
                    errors += 1
                    continue

                description = row.get('description', '')
                is_ict, confidence, role_name = classify_posting(title, description)

                role_obj = roles.get(role_name) if role_name else None
                if is_ict:
                    ict_count += 1

                posting = JobPosting(
                    upload=upload,
                    source=row.get('source', 'csv_upload'),
                    source_job_id=row.get('source_job_id', ''),
                    source_url=row.get('source_url', ''),
                    title=title,
                    company=row.get('company', ''),
                    location_raw=row.get('location_raw', ''),
                    country=row.get('country', 'Rwanda'),
                    industry_raw=row.get('industry_raw', ''),
                    education_raw=row.get('education_raw', ''),
                    experience_raw=row.get('experience_raw', ''),
                    contract_type_raw=row.get('contract_type_raw', ''),
                    description=description,
                    is_ict=is_ict,
                    ict_role_confidence=confidence,
                    normalized_role=role_obj,
                    role_normalization_confidence=confidence if role_obj else 0,
                    needs_manual_review=is_ict and confidence < 0.5,
                    manual_review_reason='Low confidence classification' if (is_ict and confidence < 0.5) else '',
                )
                postings_to_create.append(posting)

            except Exception as e:
                errors += 1
                log_lines.append(f"Row {row_num}: error — {str(e)}")

        with transaction.atomic():
            JobPosting.objects.bulk_create(postings_to_create)

        log_lines.insert(0, f"Processed {total} rows: {ict_count} ICT, {errors} errors")
        upload.status = 'completed'
        upload.total_records = total
        upload.ict_records = ict_count
        upload.error_count = errors
        upload.processing_log = '\n'.join(log_lines)
        upload.save()

    except Exception as e:
        upload.status = 'failed'
        upload.processing_log = f"Fatal error: {str(e)}\n{traceback.format_exc()}"
        upload.save()
