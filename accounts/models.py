from django.contrib.auth.models import AbstractUser
from django.db import models
from core.models import TimestampedModel


class Institution(TimestampedModel):
    """An organization that users belong to."""

    class InstitutionType(models.TextChoices):
        GOVERNMENT = 'government', 'Government'
        UNIVERSITY = 'university', 'University'
        NGO = 'ngo', 'NGO'
        PRIVATE = 'private', 'Private'
        OTHER = 'other', 'Other'

    name = models.CharField(max_length=255, unique=True)
    type = models.CharField(max_length=20, choices=InstitutionType.choices)
    description = models.TextField(blank=True, default='')

    class Meta:
        ordering = ['name']

    def __str__(self):
        return self.name


class User(AbstractUser):
    """Custom user model with role-based access and institution scope."""

    class UserRole(models.TextChoices):
        ADMIN = 'admin', 'Admin'
        POLICY_MAKER = 'policy_maker', 'Policy Maker'
        EDUCATION_PLANNER = 'education_planner', 'Education Planner'
        CAREER_ADVISOR = 'career_advisor', 'Career Advisor'
        RESEARCHER = 'researcher', 'Researcher'

    email = models.EmailField(unique=True)
    role = models.CharField(
        max_length=20,
        choices=UserRole.choices,
        default=UserRole.RESEARCHER,
    )
    institution = models.ForeignKey(
        Institution,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='users',
    )

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username', 'first_name', 'last_name']

    class Meta:
        ordering = ['-date_joined']

    def __str__(self):
        return f"{self.get_full_name()} ({self.role})"

    @property
    def is_admin_user(self):
        return self.role == self.UserRole.ADMIN or self.is_superuser



    