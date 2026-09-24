from django.db import models
from core.models import TimestampedModel
from taxonomy.models import NormalizedRole


class GeographicDemand(TimestampedModel):
    """ICT demand by geographic location (province/district)."""
    province = models.CharField(max_length=100, db_index=True)
    district = models.CharField(max_length=100, db_index=True)
    role = models.ForeignKey(
        NormalizedRole,
        on_delete=models.CASCADE,
        related_name='geographic_demand',
    )
    year = models.IntegerField()
    posting_count = models.IntegerField(default=0)
    demand_score = models.FloatField(
        default=0.0,
        help_text="Normalized demand intensity 0-100"
    )

    class Meta:
        ordering = ['province', 'district', '-year']
        unique_together = ['province', 'district', 'role', 'year']

    def __str__(self):
        return f"{self.district}, {self.province} — {self.role.name} ({self.year})"


class SectorDemand(TimestampedModel):
    """ICT demand by industry sector."""
    industry = models.CharField(max_length=255, db_index=True)
    role = models.ForeignKey(
        NormalizedRole,
        on_delete=models.CASCADE,
        related_name='sector_demand',
    )
    year = models.IntegerField()
    posting_count = models.IntegerField(default=0)

    class Meta:
        ordering = ['industry', '-year']
        unique_together = ['industry', 'role', 'year']

    def __str__(self):
        return f"{self.industry} — {self.role.name} ({self.year})"
