from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter
from .models import Sector, SectorEmployment, RoleGroup, RoleFamily, NormalizedRole
from .serializers import (
    SectorListSerializer,
    SectorDetailSerializer,
    SectorEmploymentSerializer,
    RoleGroupSerializer,
    RoleFamilySerializer,
    NormalizedRoleListSerializer,
    NormalizedRoleDetailSerializer,
)


class SectorListView(generics.ListAPIView):
    """GET /api/taxonomy/sectors/ — List all sectors with role counts."""
    queryset = Sector.objects.all()
    serializer_class = SectorListSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None


class SectorDetailView(generics.RetrieveAPIView):
    """GET /api/taxonomy/sectors/:slug/ — Sector detail with role groups."""
    queryset = Sector.objects.all()
    serializer_class = SectorDetailSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'slug'


class SectorEmploymentListView(generics.ListAPIView):
    """GET /api/taxonomy/sectors/employment/ — Sector employment history, filterable by sector and year."""
    queryset = SectorEmployment.objects.select_related('sector').all()
    serializer_class = SectorEmploymentSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['sector__slug', 'year', 'synthetic_flag']
    pagination_class = None


class RoleGroupListView(generics.ListAPIView):
    """GET /api/taxonomy/groups/ — List role groups, optionally filtered by sector."""
    queryset = RoleGroup.objects.select_related('sector').prefetch_related('families__roles').all()
    serializer_class = RoleGroupSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['sector__slug']


class RoleFamilyListView(generics.ListAPIView):
    """GET /api/taxonomy/families/ — List all role families."""
    queryset = RoleFamily.objects.select_related('role_group').prefetch_related('roles').all()
    serializer_class = RoleFamilySerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None


class NormalizedRoleListView(generics.ListAPIView):
    """GET /api/taxonomy/roles/ — List roles, filterable by sector, group, or search."""
    queryset = NormalizedRole.objects.select_related('role_family__role_group__sector').all()
    serializer_class = NormalizedRoleListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, SearchFilter]
    filterset_fields = ['is_emerging', 'role_family__role_group__id', 'role_family__role_group__sector__slug']
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
