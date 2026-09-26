from rest_framework.permissions import BasePermission

from .models import User

ROLES = User.UserRole


def _has_role(request, *roles):
    user = request.user
    return bool(user and user.is_authenticated and (user.role in roles or user.is_superuser))


class IsAdminUser(BasePermission):
    """Full access: platform administrators only."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin_user


class IsCareerTrainingAdvisor(BasePermission):
    """Career & Training Advisor (administrators also allowed)."""
    def has_permission(self, request, view):
        return _has_role(request, ROLES.ADMIN, ROLES.CAREER_TRAINING_ADVISOR)


class IsEducationPlanner(BasePermission):
    """Education / Curriculum Planner: curriculum upload and skills-gap analysis (administrators also allowed)."""
    def has_permission(self, request, view):
        return _has_role(request, ROLES.ADMIN, ROLES.EDUCATION_CURRICULUM_PLANNER)


class IsLabourMarketAnalyst(BasePermission):
    """Labour Market Analyst: deep analytics and reporting (administrators also allowed)."""
    def has_permission(self, request, view):
        return _has_role(request, ROLES.ADMIN, ROLES.LABOR_MARKET_ANALYST)


class IsAnyAuthenticated(BasePermission):
    """Any authenticated user with any role: shared read-only endpoints."""
    def has_permission(self, request, view):
        return request.user.is_authenticated
