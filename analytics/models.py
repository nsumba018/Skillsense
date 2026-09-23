from django.db import models
from core.models import TimestampedModel
from taxonomy.models import NormalizedRole


class GeographicDemand(TimestampedModel):
    """
    Demand for ICT roles by geographic region.
    Nshuti Delphin — Phase 3
    """
    role = models.ForeignKey(
        NormalizedRole,
        on_delete=models.CASCADE,
        related_name='geographic_demands'
    )
    region_name = models.CharField(max_length=100)
    region_code = models.CharField(max_length=20, blank=True)
    demand_count = models.PositiveIntegerField(default=0)
    year = models.PositiveSmallIntegerField()
    quarter = models.PositiveSmallIntegerField(null=True, blank=True)

    class Meta:
        unique_together = ('role', 'region_code', 'year', 'quarter')
        ordering = ['-year', 'region_name']

    def __str__(self):
        return f"{self.region_name} — {self.role.normalized_title} ({self.year})"


class SectorDemand(TimestampedModel):
    """
    Demand for ICT roles by economic sector.
    Nshuti Delphin — Phase 3
    """
    SECTOR_CHOICES = [
        ('finance', 'Finance & Banking'),
        ('health', 'Health'),
        ('government', 'Government & Public Sector'),
        ('telecom', 'Telecom & ICT'),
        ('education', 'Education'),
        ('retail', 'Retail & Commerce'),
        ('ngo', 'NGO & International Orgs'),
        ('other', 'Other'),
    ]

    role = models.ForeignKey(
        NormalizedRole,
        on_delete=models.CASCADE,
        related_name='sector_demands'
    )
    sector = models.CharField(max_length=50, choices=SECTOR_CHOICES)
    demand_count = models.PositiveIntegerField(default=0)
    year = models.PositiveSmallIntegerField()

    class Meta:
        unique_together = ('role', 'sector', 'year')
        ordering = ['-year', 'sector']

    def __str__(self):
        return f"{self.get_sector_display()} — {self.role.normalized_title} ({self.year})"

    