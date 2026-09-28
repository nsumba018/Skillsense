from django.db import models
from django.conf import settings
from core.models import TimestampedModel
from taxonomy.models import NormalizedRole


class DataUpload(TimestampedModel):
    """A CSV file uploaded by an admin for processing."""

    class UploadStatus(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PROCESSING = 'processing', 'Processing'
        COMPLETED = 'completed', 'Completed'
        FAILED = 'failed', 'Failed'

    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='uploads',
    )
    file = models.FileField(upload_to='uploads/%Y/%m/')
    original_filename = models.CharField(max_length=255)
    status = models.CharField(
        max_length=20,
        choices=UploadStatus.choices,
        default=UploadStatus.PENDING,
    )
    total_records = models.IntegerField(default=0)
    ict_records = models.IntegerField(default=0)
    error_count = models.IntegerField(default=0)
    processing_log = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.original_filename} ({self.status})"


class JobPosting(TimestampedModel):
    """A single job posting from seed data or CSV upload."""
    upload = models.ForeignKey(
        DataUpload,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='postings',
    )
    source = models.CharField(max_length=100)
    source_job_id = models.CharField(max_length=100, blank=True, default='')
    source_url = models.URLField(max_length=500, blank=True, default='')
    title = models.CharField(max_length=500)
    company = models.CharField(max_length=255, blank=True, default='')
    location_raw = models.CharField(max_length=255, blank=True, default='')
    country = models.CharField(max_length=100, default='Rwanda')
    industry_raw = models.CharField(max_length=255, blank=True, default='')
    education_raw = models.CharField(max_length=255, blank=True, default='')
    experience_raw = models.CharField(max_length=255, blank=True, default='')
    contract_type_raw = models.CharField(max_length=100, blank=True, default='')
    closing_date = models.DateField(null=True, blank=True)
    posted_date = models.DateField(null=True, blank=True)
    description = models.TextField(blank=True, default='')
    raw_text = models.TextField(blank=True, default='')
    is_ict = models.BooleanField(default=False)
    ict_role_confidence = models.FloatField(default=0.0)
    normalized_role = models.ForeignKey(
        NormalizedRole,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='postings',
    )
    role_level = models.CharField(max_length=50, blank=True, default='')
    role_normalization_confidence = models.FloatField(default=0.0)
    classification_reason = models.TextField(blank=True, default='')
    needs_manual_review = models.BooleanField(default=False)
    manual_review_reason = models.CharField(max_length=255, blank=True, default='')
    scraped_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.company})"   


    