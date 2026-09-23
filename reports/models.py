from django.db import models
from core.models import TimestampedModel
from accounts.models import User
from predictions.models import ForecastRun


class Report(TimestampedModel):
    """
    A generated PDF/JSON report tied to a forecast run.
    Nshuti Delphin — Phase 3
    """
    REPORT_TYPE_CHOICES = [
        ('forecast_summary', 'Forecast Summary'),
        ('validation_report', 'Validation Report'),
        ('sector_analysis', 'Sector Analysis'),
        ('geographic_analysis', 'Geographic Analysis'),
        ('full_dashboard', 'Full Dashboard Export'),
    ]

    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('generating', 'Generating'),
        ('ready', 'Ready'),
        ('failed', 'Failed'),
    ]

    title = models.CharField(max_length=255)
    report_type = models.CharField(max_length=50, choices=REPORT_TYPE_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    generated_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='reports'
    )
    forecast_run = models.ForeignKey(
        ForecastRun,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reports'
    )
    file_path = models.CharField(max_length=500, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} [{self.get_status_display()}]"

    