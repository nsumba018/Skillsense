from django.db import models
from core.models import TimestampedModel
from taxonomy.models import NormalizedRole


class ForecastRun(TimestampedModel):
    run_date = models.DateField(auto_now_add=True)
    model_version = models.CharField(max_length=50, blank=True)
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['-run_date']

    def __str__(self):
        return f"ForecastRun {self.id} ({self.run_date})"


class RoleForecast(TimestampedModel):
    HORIZON_CHOICES = [
        ('6m', '6 Months'),
        ('1y', '1 Year'),
        ('2y', '2 Years'),
    ]
    TREND_CHOICES = [
        ('up', 'Upward'),
        ('down', 'Downward'),
        ('stable', 'Stable'),
    ]

    forecast_run = models.ForeignKey(
        ForecastRun,
        on_delete=models.CASCADE,
        related_name='role_forecasts'
    )
    role = models.ForeignKey(
        NormalizedRole,
        on_delete=models.CASCADE,
        related_name='forecasts'
    )
    horizon = models.CharField(max_length=10, choices=HORIZON_CHOICES)
    predicted_demand = models.FloatField()
    lower_bound = models.FloatField()
    upper_bound = models.FloatField()
    trend_direction = models.CharField(
        max_length=10,
        choices=TREND_CHOICES,
        default='stable'
    )

    class Meta:
        unique_together = ('forecast_run', 'role', 'horizon')
        ordering = ['role', 'horizon']

    def __str__(self):
        return f"{self.role} - {self.horizon}: {self.predicted_demand}"
    