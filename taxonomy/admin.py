from django.contrib import admin
from .models import RoleGroup, RoleFamily, NormalizedRole, HistoricalDemand, MacroIndicator


@admin.register(RoleGroup)
class RoleGroupAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']


@admin.register(RoleFamily)
class RoleFamilyAdmin(admin.ModelAdmin):
    list_display = ['name', 'created_at']
    search_fields = ['name']


@admin.register(NormalizedRole)
class NormalizedRoleAdmin(admin.ModelAdmin):
    list_display = ['normalized_title', 'created_at']
    search_fields = ['normalized_title']


@admin.register(HistoricalDemand)
class HistoricalDemandAdmin(admin.ModelAdmin):
    list_display = ['role', 'year', 'created_at']
    list_filter = ['year']
    search_fields = ['role__normalized_title']


@admin.register(MacroIndicator)
class MacroIndicatorAdmin(admin.ModelAdmin):
    list_display = ['year', 'created_at']
    ordering = ['-year']
    