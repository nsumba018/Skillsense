from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from .models import RoleGroup, RoleFamily, NormalizedRole
from .serializers import (
    RoleGroupSerializer,
    RoleFamilySerializer,
    NormalizedRoleListSerializer,
    NormalizedRoleDetailSerializer,
)


class RoleGroupListView(generics.ListAPIView):
    """GET /api/taxonomy/groups/ — List all role groups with families and roles."""
    queryset = RoleGroup.objects.prefetch_related('families__roles').all()
    serializer_class = RoleGroupSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None  # Small dataset, no pagination needed


class RoleFamilyListView(generics.ListAPIView):
    """GET /api/taxonomy/families/ — List all role families."""
    queryset = RoleFamily.objects.select_related('role_group').prefetch_related('roles').all()
    serializer_class = RoleFamilySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None


class NormalizedRoleListView(generics.ListAPIView):
    """GET /api/taxonomy/roles/ — List all normalized roles."""
    queryset = NormalizedRole.objects.select_related('role_family__role_group').all()
    serializer_class = NormalizedRoleListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['is_emerging', 'role_family__role_group__id']
    search_fields = ['name']
    pagination_class = None


class NormalizedRoleDetailView(generics.RetrieveAPIView):
    """GET /api/taxonomy/roles/:id/ — Role detail with full history."""
    queryset = NormalizedRole.objects.select_related(
        'role_family__role_group'
    ).prefetch_related(
        'historical_demand', 'forecasts'
    ).all()
    serializer_class = NormalizedRoleDetailSerializer
    permission_classes = [IsAuthenticated]


class EmergingRolesListView(generics.ListAPIView):
    """GET /api/taxonomy/emerging/ — List emerging roles (Layer 2)."""
    queryset = NormalizedRole.objects.filter(
        is_emerging=True
    ).select_related('role_family__role_group')
    serializer_class = NormalizedRoleListSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None
