from django.urls import path
from .views import (
    RoleGroupListView,
    RoleFamilyListView,
    NormalizedRoleListView,
    NormalizedRoleDetailView,
    EmergingRolesListView,
)

urlpatterns = [
    path('groups/', RoleGroupListView.as_view(), name='taxonomy-groups'),
    path('families/', RoleFamilyListView.as_view(), name='taxonomy-families'),
    path('roles/', NormalizedRoleListView.as_view(), name='taxonomy-roles'),
    path('roles/<int:pk>/', NormalizedRoleDetailView.as_view(), name='taxonomy-role-detail'),
    path('emerging/', EmergingRolesListView.as_view(), name='taxonomy-emerging'),
]
