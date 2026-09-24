from rest_framework.permissions import BasePermission


class IsAdminUser(BasePermission):
    """Full access — admin users only."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.is_admin_user


class IsPolicyMaker(BasePermission):
    """Access to dashboard, forecasts, policy planning, reports."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ('admin', 'policy_maker') or request.user.is_superuser


class IsEducationPlanner(BasePermission):
    """Access to skills gaps, training alignment, curriculum."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ('admin', 'education_planner') or request.user.is_superuser


class IsCareerAdvisor(BasePermission):
    """Access to career guidance, employability, role outlooks."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ('admin', 'career_advisor') or request.user.is_superuser


class IsResearcher(BasePermission):
    """Access to full analytics, data exports, historical trends."""
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        return request.user.role in ('admin', 'researcher') or request.user.is_superuser


class IsAnyAuthenticated(BasePermission):
    """Any authenticated user with any role — used for shared read-only endpoints."""
    def has_permission(self, request, view):
        return request.user.is_authenticated
