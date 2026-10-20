from django.db import models
from core.models import TimestampedModel
from taxonomy.models import NormalizedRole, Sector


class ForecastRun(TimestampedModel):
    """A single execution of the forecasting pipeline.

    Each run produces forecasts for all roles at all horizons.
    The latest run is what the API serves.
    """
    model_version = models.CharField(
        max_length=50,
        help_text="e.g., 'two_stage_v1', 'lightgbm_v2'"
    )
    training_data_hash = models.CharField(
        max_length=64,
        blank=True,
        default='',
        help_text="SHA256 of training data for reproducibility"
    )
    accuracy_spearman = models.FloatField(
        null=True, blank=True,
        help_text="Spearman rank correlation against validation data"
    )
    accuracy_pearson = models.FloatField(
        null=True, blank=True,
        help_text="Pearson share correlation against validation data"
    )
    accuracy_mae = models.FloatField(null=True, blank=True)
    accuracy_rmse = models.FloatField(null=True, blank=True)
    accuracy_r2 = models.FloatField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Forecast Run {self.id} ({self.model_version}, {self.created_at:%Y-%m-%d})"


class RoleForecast(models.Model):
    """A single forecast: one role at one horizon from one forecast run.

    60 rows per run: 20 roles x 3 horizons (6m, 1y, 2y).
    """

    class Horizon(models.TextChoices):
        SIX_MONTHS = '6m', '6 Months'
        ONE_YEAR = '1y', '1 Year'
        TWO_YEARS = '2y', '2 Years'

    class TrendDirection(models.TextChoices):
        GROWING = 'growing', 'Growing'
        STABLE = 'stable', 'Stable'
        DECLINING = 'declining', 'Declining'

    forecast_run = models.ForeignKey(
        ForecastRun,
        on_delete=models.CASCADE,
        related_name='forecasts',
    )
    role = models.ForeignKey(
        NormalizedRole,
        on_delete=models.CASCADE,
        related_name='forecasts',
    )
    horizon = models.CharField(max_length=5, choices=Horizon.choices)
    demand_index = models.FloatField(
        help_text="Forecasted demand index 0-100"
    )
    share_pct = models.FloatField(
        help_text="Forecasted share of ICT employment in percent"
    )
    employment_proxy = models.FloatField(
        help_text="Forecasted number of people in this role"
    )
    confidence_lower = models.FloatField(
        null=True, blank=True,
        help_text="Lower bound of 90% confidence interval"
    )
    confidence_upper = models.FloatField(
        null=True, blank=True,
        help_text="Upper bound of 90% confidence interval"
    )
    trend_direction = models.CharField(
        max_length=10,
        choices=TrendDirection.choices,
    )

    class Meta:
        ordering = ['forecast_run', 'horizon', '-demand_index']
        unique_together = ['forecast_run', 'role', 'horizon']

    def __str__(self):
        return f"{self.role.name} ({self.horizon}): {self.demand_index:.1f}"


class SectorForecastRun(TimestampedModel):
    """A single execution of the sector-level forecasting pipeline.

    Produces employment forecasts for all 9 sectors at multiple horizons.
    """
    model_version = models.CharField(max_length=50)
    accuracy_mae = models.FloatField(null=True, blank=True)
    accuracy_r2 = models.FloatField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"Sector Forecast {self.id} ({self.model_version}, {self.created_at:%Y-%m-%d})"


class SectorForecast(models.Model):
    """One forecast row: one sector at one horizon from one run."""

    class Horizon(models.TextChoices):
        SIX_MONTHS = '6m', '6 Months'
        ONE_YEAR = '1y', '1 Year'
        TWO_YEARS = '2y', '2 Years'

    class TrendDirection(models.TextChoices):
        GROWING = 'growing', 'Growing'
        STABLE = 'stable', 'Stable'
        DECLINING = 'declining', 'Declining'

    forecast_run = models.ForeignKey(
        SectorForecastRun,
        on_delete=models.CASCADE,
        related_name='forecasts',
    )
    sector = models.ForeignKey(
        Sector,
        on_delete=models.CASCADE,
        related_name='sector_forecasts',
    )
    horizon = models.CharField(max_length=5, choices=Horizon.choices)
    employment_share_pct = models.FloatField(
        help_text="Forecasted share of total national employment"
    )
    employment_count = models.BigIntegerField(
        help_text="Forecasted employment count for this sector"
    )
    gdp_contribution_pct = models.FloatField(
        null=True, blank=True,
        help_text="GDP contribution used as feature"
    )
    confidence_lower = models.FloatField(
        null=True, blank=True,
        help_text="Lower bound of employment share forecast"
    )
    confidence_upper = models.FloatField(
        null=True, blank=True,
        help_text="Upper bound of employment share forecast"
    )
    share_trend = models.CharField(
        max_length=10,
        choices=TrendDirection.choices,
        default='stable',
        help_text="Trend in employment share (is this sector's slice growing or shrinking?)"
    )
    employment_trend = models.CharField(
        max_length=10,
        choices=TrendDirection.choices,
        default='stable',
        help_text="Trend in absolute employment (is this sector adding or losing jobs?)"
    )
    posting_count = models.IntegerField(
        default=0,
        help_text="Current job postings observed for this sector"
    )

    class Meta:
        ordering = ['forecast_run', 'horizon', '-employment_share_pct']
        unique_together = ['forecast_run', 'sector', 'horizon']

    def __str__(self):
        return f"{self.sector.name} ({self.horizon}): {self.employment_share_pct:.1f}%"
