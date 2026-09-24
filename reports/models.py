from django.db import models
from django.conf import settings
from core.models import TimestampedModel


class GeneratedReport(TimestampedModel):
    """A generated report (PDF or CSV)."""

    class ReportType(models.TextChoices):
        DEMAND_OUTLOOK = 'demand_outlook', 'ICT Demand Outlook'
        ROLE_DEEP_DIVE = 'role_deep_dive', 'Role-Specific Deep Dive'
        EDUCATION_GAP = 'education_gap', 'Education Gap Report'
        WORKFORCE_PLANNING = 'workforce_planning', 'Workforce Planning Brief'

    class ReportFormat(models.TextChoices):
        PDF = 'pdf', 'PDF'
        CSV = 'csv', 'CSV'
        JSON = 'json', 'JSON'

    report_type = models.CharField(max_length=30, choices=ReportType.choices)
    format = models.CharField(max_length=10, choices=ReportFormat.choices)
    title = models.CharField(max_length=255)
    generated_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='generated_reports',
    )
    file = models.FileField(upload_to='reports/%Y/%m/', null=True, blank=True)
    parameters = models.JSONField(
        default=dict,
        blank=True,
        help_text="Parameters used to generate this report (filters, date range, etc.)"
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} ({self.report_type}, {self.format})"
