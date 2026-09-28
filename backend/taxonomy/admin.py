from django.contrib import admin
from .models import RoleGroup, RoleFamily, NormalizedRole, HistoricalDemand, MacroIndicator


@admin.register(RoleGroup)
class RoleGroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'sort_order', 'created_at']
    search_fields = ['name']


@admin.register(RoleFamily)
class RoleFamilyAdmin(admin.ModelAdmin):
    list_display = ['name', 'role_group', 'created_at']
    search_fields = ['name']
    list_filter = ['role_group']


@admin.register(NormalizedRole)
class NormalizedRoleAdmin(admin.ModelAdmin):
    list_display = ['name', 'role_family', 'emergence_year', 'is_emerging', 'created_at']
    list_filter = ['is_emerging', 'role_family__role_group']
    search_fields = ['name']


@admin.register(HistoricalDemand)
class HistoricalDemandAdmin(admin.ModelAdmin):
    list_display = ['role', 'year', 'role_demand_index', 'role_share_within_ict_pct']
    list_filter = ['year', 'synthetic_flag']
    search_fields = ['role__name']


@admin.register(MacroIndicator)
class MacroIndicatorAdmin(admin.ModelAdmin):
    list_display = ['year', 'ict_employment', 'ict_employment_share_pct']
    ordering = ['-year']
