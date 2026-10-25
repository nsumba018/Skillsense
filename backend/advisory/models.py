from django.conf import settings
from django.db import models
from django.db.models import Q

from core.models import TimestampedModel


class StudentProfile(TimestampedModel):
    """A student/trainee being advised."""

    class Department(models.TextChoices):
        SE = 'se', 'Software Engineering'
        NET = 'net', 'Network & Info Management'
        FIN = 'fin', 'Finance'
        BA = 'ba', 'Business Administration'

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        GRADUATED = 'graduated', 'Graduated'
        PLACED = 'placed', 'Placed'
        INACTIVE = 'inactive', 'Inactive'

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True, default='')
    department = models.CharField(max_length=10, choices=Department.choices)
    graduation_year = models.IntegerField(null=True, blank=True)
    graduated_on = models.DateField(
        null=True, blank=True,
        help_text='Exact graduation / training-completion date; used to measure days to placement',
    )
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    skills = models.JSONField(
        default=list,
        help_text='Skills the student currently has, e.g. ["Python", "SQL", "React"]',
    )
    target_roles = models.JSONField(
        default=list,
        help_text='Roles the student is targeting, e.g. ["Frontend Developer", "Data Analyst"]',
    )
    notes = models.TextField(blank=True, default='')
    advisor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='advised_students',
        help_text='The advisor managing this student',
    )
    innovation_center_cohort = models.CharField(
        max_length=100, blank=True, default='',
        help_text='e.g. "Cohort 3 — 2026/2027"',
    )
    gender = models.CharField(
        max_length=1,
        choices=[('M', 'Male'), ('F', 'Female')],
        blank=True, default='',
    )

    class Meta:
        ordering = ['last_name', 'first_name']
        constraints = [
            models.UniqueConstraint(
                fields=['email'], condition=~Q(email=''), name='advisory_student_unique_email',
            ),
        ]

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.get_department_display()})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}".strip()


class Assessment(TimestampedModel):
    """A skill assessment for a student against a target role."""

    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='assessments')
    target_role = models.CharField(max_length=200)
    readiness_score = models.FloatField(help_text='0-100 percentage of required skills the student has')
    matched_skills = models.JSONField(default=list, help_text='Skills the student has that employers want')
    missing_skills = models.JSONField(default=list, help_text='Skills employers want that the student lacks')
    recommendations = models.JSONField(default=list, help_text='Recommendation strings')
    alternative_roles = models.JSONField(default=list, help_text='[{"role": "...", "score": 72.5}, ...]')
    assessed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='assessments_given',
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student.full_name} → {self.target_role} ({self.readiness_score}%)"


class SavedPathway(TimestampedModel):
    """A career pathway saved for a student."""

    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='pathways')
    target_role = models.CharField(max_length=200)
    steps = models.JSONField(
        default=list,
        help_text='[{"skill": "Docker", "source": "Innovation Center: Cloud Computing", '
                  '"duration_weeks": 4, "completed": false}, ...]',
    )
    estimated_months = models.IntegerField(help_text='Total estimated months to complete the pathway')
    progress_pct = models.FloatField(default=0, help_text='0-100 completion percentage')
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='pathways_created',
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student.full_name} → {self.target_role} ({self.progress_pct}%)"


class Placement(TimestampedModel):
    """A student's job placement."""

    class ContractType(models.TextChoices):
        FULL_TIME = 'full_time', 'Full-time'
        INTERNSHIP = 'internship', 'Internship'
        FREELANCE = 'freelance', 'Freelance'
        CONTRACT = 'contract', 'Contract'

    student = models.ForeignKey(StudentProfile, on_delete=models.CASCADE, related_name='placements')
    role_title = models.CharField(max_length=200)
    company = models.CharField(max_length=200)
    location = models.CharField(max_length=200, blank=True, default='Kigali')
    start_date = models.DateField()
    contract_type = models.CharField(max_length=15, choices=ContractType.choices, default=ContractType.FULL_TIME)
    salary_range = models.CharField(max_length=100, blank=True, default='', help_text='e.g. "400,000 - 600,000 RWF"')
    placement_method = models.CharField(
        max_length=100, blank=True, default='',
        help_text='e.g. "Referral", "Career fair", "Direct application"',
    )
    recorded_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='placements_recorded',
    )

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.student.full_name} → {self.role_title} at {self.company}"
