from django.contrib import admin
from .models import Curriculum, CurriculumCourse, GeographicDemand, SectorDemand


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


class CurriculumCourseInline(admin.TabularInline):
    model = CurriculumCourse
    extra = 0


@admin.register(Curriculum)
class CurriculumAdmin(admin.ModelAdmin):
    list_display = ['name', 'level', 'institution', 'uploaded_by', 'created_at']
    list_filter = ['level', 'institution']
    search_fields = ['name']
    inlines = [CurriculumCourseInline]
