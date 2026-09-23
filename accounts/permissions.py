from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Full access — platform administrators only."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsAnalyst(BasePermission):
    """Can view forecasts and reports."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('admin', 'analyst')


class IsPolicyMaker(BasePermission):
    """Can view reports and dashboards."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in ('admin', 'policy_maker')


class IsInstitutionUser(BasePermission):
    """Institutional staff — read access to relevant data."""
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in (
            'admin', 'analyst', 'policy_maker', 'institution_user'
        )


class IsOwnerOrAdmin(BasePermission):
    """Object-level: owner of the record or admin."""
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        return getattr(obj, 'generated_by', None) == request.user or obj == request.user

    