from django.db import models
from core.models import TimestampedModel


class Sector(TimestampedModel):
    """A labour-market sector (e.g. 'ICT & Technology', 'Finance & Business').

    Sits above RoleGroup. Every role group belongs to exactly one sector.
    """
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=100, unique=True)
    description = models.TextField(blank=True, default='')
    sort_order = models.IntegerField(default=0)
    color = models.CharField(
        max_length=7, blank=True, default='',
        help_text="Hex color for charts, e.g. '#2563EB'"
    )

    class Meta:
        ordering = ['sort_order', 'name']

    def __str__(self):
        return self.name


class RoleGroup(TimestampedModel):
    """Grouping of roles within a sector (e.g. 'Software Development' under ICT)."""
    name = models.CharField(max_length=100, unique=True)
    sector = models.ForeignKey(
        Sector,
        on_delete=models.CASCADE,
        related_name='role_groups',
        null=True,
        blank=True,
    )
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
    """A specific role within a sector (e.g. 'Backend Developer', 'Financial Analyst')."""
    name = models.CharField(max_length=100, unique=True)
    role_family = models.ForeignKey(
        RoleFamily,
        on_delete=models.CASCADE,
        related_name='roles',
    )
    emergence_year = models.IntegerField(
        help_text="Year this role first appeared in Rwanda's labour market"
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
    """One row per role per year — the historical demand dataset."""
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
        help_text="Role's share of sector employment in percent"
    )
    role_employment_proxy = models.FloatField(
        help_text="Estimated number of people employed in this role"
    )
    data_basis = models.CharField(
        max_length=255,
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
        max_length=255,
        blank=True,
        default='',
        help_text="e.g., 'NISR_LFS_2023', 'extrapolated'"
    )

    class Meta:
        ordering = ['year']

    def __str__(self):
        return f"Macro {self.year} (ICT: {self.ict_employment_share_pct:.1f}%)"


class SectorEmployment(models.Model):
    """Per-sector employment indicators per year.

    Tracks how each sector's employment has grown over time.
    Used for sector-level forecasting and cross-sector comparison.
    """
    sector = models.ForeignKey(
        Sector,
        on_delete=models.CASCADE,
        related_name='employment_data',
    )
    year = models.IntegerField(db_index=True)
    employment_count = models.BigIntegerField(
        help_text="Estimated employment in this sector"
    )
    employment_share_pct = models.FloatField(
        help_text="Sector's share of total national employment"
    )
    gdp_contribution_pct = models.FloatField(
        null=True, blank=True,
        help_text="Sector's contribution to GDP in percent"
    )
    posting_count = models.IntegerField(
        default=0,
        help_text="Job postings observed for this sector in this year"
    )
    data_source = models.CharField(
        max_length=255, blank=True, default='',
        help_text="e.g., 'NISR_GDP_2023', 'simulated_from_gdp'"
    )
    synthetic_flag = models.BooleanField(
        default=False,
        help_text="True if this data point is simulated"
    )

    class Meta:
        ordering = ['sector', 'year']
        unique_together = ['sector', 'year']

    def __str__(self):
        return f"{self.sector.name} {self.year}: {self.employment_share_pct:.1f}%"
