from django.urls import path
from .views import (
    SectorListView,
    SectorDetailView,
    SectorEmploymentListView,
    RoleGroupListView,
    RoleFamilyListView,
    NormalizedRoleListView,
    NormalizedRoleDetailView,
    EmergingRolesListView,
)

urlpatterns = [
    path('sectors/', SectorListView.as_view(), name='taxonomy-sectors'),
    path('sectors/employment/', SectorEmploymentListView.as_view(), name='taxonomy-sector-employment'),
    path('sectors/<slug:slug>/', SectorDetailView.as_view(), name='taxonomy-sector-detail'),
    path('groups/', RoleGroupListView.as_view(), name='taxonomy-groups'),
    path('families/', RoleFamilyListView.as_view(), name='taxonomy-families'),
    path('roles/', NormalizedRoleListView.as_view(), name='taxonomy-roles'),
    path('roles/<int:pk>/', NormalizedRoleDetailView.as_view(), name='taxonomy-role-detail'),
    path('emerging/', EmergingRolesListView.as_view(), name='taxonomy-emerging'),
]
