from django.db import models
from core.models import TimestampedModel


class RoleGroup(TimestampedModel):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name


class RoleFamily(TimestampedModel):
    name = models.CharField(max_length=100, unique=True)
    group = models.ForeignKey(RoleGroup, on_delete=models.CASCADE, related_name='families')

    def __str__(self):
        return f"{self.group.name} > {self.name}"


class NormalizedRole(TimestampedModel):
    family = models.ForeignKey(RoleFamily, on_delete=models.CASCADE, related_name='roles')
    normalized_title = models.CharField(max_length=150, unique=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return self.normalized_title


class HistoricalDemand(TimestampedModel):
    role = models.ForeignKey(NormalizedRole, on_delete=models.CASCADE, related_name='historical_demands')
    year = models.PositiveSmallIntegerField()
    job_postings_count = models.PositiveIntegerField(default=0)
    source = models.CharField(max_length=100, default='rdb_rwanda')

    class Meta:
        unique_together = ('role', 'year')
        ordering = ['-year']

    def __str__(self):
        return f"{self.role.normalized_title} ({self.year}): {self.job_postings_count}"


class MacroIndicator(TimestampedModel):
    year = models.PositiveSmallIntegerField(unique=True)
    gdp_growth_rate = models.FloatField()
    ict_sector_growth = models.FloatField()

    class Meta:
        ordering = ['-year']

    def __str__(self):
        return f"MacroIndicator {self.year}"


    