from django.contrib import admin
from .models import GeographicDemand, SectorDemand


@admin.register(GeographicDemand)
class GeographicDemandAdmin(admin.ModelAdmin):
    list_display = ['province', 'district', 'role', 'year', 'posting_count', 'demand_score']
    list_filter = ['province', 'year']
    search_fields = ['province', 'district', 'role__name']


@admin.register(SectorDemand)
class SectorDemandAdmin(admin.ModelAdmin):
    list_display = ['industry', 'role', 'year', 'posting_count']
    list_filter = ['year']
    search_fields = ['industry', 'role__name']
