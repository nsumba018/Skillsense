from django.conf import settings
from django.db import models
from core.models import TimestampedModel


class CurriculumBulletin(TimestampedModel):
    """An uploaded department bulletin — one active per department at a time."""

    FACULTY_CHOICES = [
        ('it', 'Faculty of Information Technology'),
        ('business', 'Faculty of Business Administration'),
    ]

    department_code = models.CharField(max_length=20, db_index=True)
    department_name = models.CharField(max_length=150)
    faculty = models.CharField(max_length=20, choices=FACULTY_CHOICES)
    file = models.FileField(upload_to='bulletins/')
    original_filename = models.CharField(max_length=255)
    total_credits = models.IntegerField(default=0)
    total_semesters = models.IntegerField(default=0)
    total_courses = models.IntegerField(default=0)
    is_active = models.BooleanField(default=True)
    uploaded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True, blank=True,
        related_name='uploaded_bulletins',
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.department_name} ({'active' if self.is_active else 'archived'})"


class BulletinCourse(TimestampedModel):
    """A single course parsed from a bulletin."""

    bulletin = models.ForeignKey(
        CurriculumBulletin,
        on_delete=models.CASCADE,
        related_name='courses',
    )
    semester = models.IntegerField()
    name = models.CharField(max_length=255)
    credits = models.IntegerField(default=0)
    skills = models.JSONField(default=list, blank=True)

    class Meta:
        ordering = ['semester', 'name']

    def __str__(self):
        return f"S{self.semester}: {self.name} ({self.credits} cr)"
