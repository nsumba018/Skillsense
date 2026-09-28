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
        return f"{self.district}, {self.province}: {self.role.name} ({self.year})"


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
        return f"{self.industry}: {self.role.name} ({self.year})"


class Curriculum(TimestampedModel):
    """A training programme submitted by an education planner, to be compared against forecast ICT demand."""

    class Level(models.TextChoices):
        CERTIFICATE = 'certificate', 'Certificate'
        DIPLOMA = 'diploma', 'Diploma'
        BACHELOR = 'bachelor', "Bachelor's degree"
        MASTER = 'master', "Master's degree"
        SHORT_COURSE = 'short_course', 'Short course / bootcamp'
        OTHER = 'other', 'Other'

    name = models.CharField(max_length=255)
    level = models.CharField(max_length=20, choices=Level.choices, default=Level.BACHELOR)
    institution = models.ForeignKey(
        'accounts.Institution', on_delete=models.SET_NULL, null=True, blank=True, related_name='curricula',
    )
    uploaded_by = models.ForeignKey(
        'accounts.User', on_delete=models.SET_NULL, null=True, related_name='curricula',
    )
    source_filename = models.CharField(max_length=255, blank=True, default='')

    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Curricula'

    def __str__(self):
        return self.name


class CurriculumCourse(models.Model):
    curriculum = models.ForeignKey(Curriculum, on_delete=models.CASCADE, related_name='courses')
    title = models.CharField(max_length=255)
    description = models.TextField(blank=True, default='')
    position = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['position', 'id']

    def __str__(self):
        return self.title
