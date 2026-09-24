from django.db import models
from core.models import TimestampedModel


class RoleGroup(TimestampedModel):
    """Top-level grouping of ICT roles (e.g., 'Software Development', 'Data & Analytics')."""
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField(blank=True, default='')
    sort_order = models.IntegerField(default=0)

    class Meta:
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name


class RoleFamily(TimestampedModel):
    """Mid-level grouping (e.g., 'Backend Development' under 'Software Development')."""
    name = models.CharField(max_length=100)
    role_group = models.ForeignKey(
        RoleGroup,
        on_delete=models.CASCADE,
        related_name='families',
    )

    class Meta:
        ordering = ['role_group__sort_order', 'name']
        verbose_name_plural = 'Role families'
        unique_together = ['name', 'role_group']

    def __str__(self):
        return f"{self.role_group.name} → {self.name}"


class NormalizedRole(TimestampedModel):
    """A specific ICT role (e.g., 'Backend Developer', 'DevOps / Cloud Engineer').

    These are the 20 roles tracked in our historical dataset.
    """
    name = models.CharField(max_length=100, unique=True)
    role_family = models.ForeignKey(
        RoleFamily,
        on_delete=models.CASCADE,
        related_name='roles',
    )
    emergence_year = models.IntegerField(
        help_text="Year this role first appeared in Rwanda's ICT market"
    )
    is_emerging = models.BooleanField(
        default=False,
        help_text="True for Layer 2 emerging roles (AI/ML, etc.) not yet in Rwanda"
    )
    global_trend_signal = models.FloatField(
        null=True,
        blank=True,
        help_text="Global trend strength 0-100, nullable — for Layer 2 future use"
    )
    description = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class HistoricalDemand(models.Model):
    """One row per role per year — the historical demand dataset (Dataset A).

    440 rows total: 20 roles x 22 years (2005-2026).
    """
    year = models.IntegerField(db_index=True)
    role = models.ForeignKey(
        NormalizedRole,
        on_delete=models.CASCADE,
        related_name='historical_demand',
    )
    role_demand_index = models.FloatField(
        help_text="Demand index 0-100, max within each year = 100"
    )
    role_share_within_ict_pct = models.FloatField(
        help_text="Role's share of ICT employment in percent"
    )
    role_employment_proxy = models.FloatField(
        help_text="Estimated number of people employed in this role"
    )
    data_basis = models.CharField(
        max_length=100,
        blank=True,
        default='',
        help_text="Source of this data point (e.g., 'LFS_microdata', 'back_extrapolation')"
    )
    synthetic_flag = models.BooleanField(
        default=False,
        help_text="True if this row is back-extrapolated (2005-2016)"
    )

    class Meta:
        ordering = ['year', 'role__name']
        unique_together = ['year', 'role']

    def __str__(self):
        return f"{self.role.name} ({self.year})"


class MacroIndicator(models.Model):
    """National-level labour market indicators per year.

    One row per year (2005-2026). Used as features in the ML model.
    """
    year = models.IntegerField(unique=True)
    total_employment = models.BigIntegerField()
    ict_employment = models.IntegerField()
    ict_employment_share_pct = models.FloatField()
    labour_force_participation_rate_pct = models.FloatField()
    unemployment_rate_pct = models.FloatField()
    employment_to_population_ratio_pct = models.FloatField()
    tertiary_employment_count = models.BigIntegerField()
    data_source = models.CharField(
        max_length=100,
        blank=True,
        default='',
        help_text="e.g., 'NISR_LFS_2023', 'extrapolated'"
    )

    class Meta:
        ordering = ['year']

    def __str__(self):
        return f"Macro {self.year} (ICT: {self.ict_employment_share_pct:.1f}%)"
