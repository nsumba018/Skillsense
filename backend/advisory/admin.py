from django.contrib import admin

from .models import Assessment, Placement, SavedPathway, StudentProfile


@admin.register(StudentProfile)
class StudentProfileAdmin(admin.ModelAdmin):
    list_display = ('last_name', 'first_name', 'department', 'graduation_year', 'status', 'advisor')
    list_filter = ('department', 'status', 'gender')
    search_fields = ('first_name', 'last_name', 'email')


@admin.register(Assessment)
class AssessmentAdmin(admin.ModelAdmin):
    list_display = ('student', 'target_role', 'readiness_score', 'created_at')
    search_fields = ('student__first_name', 'student__last_name', 'target_role')


@admin.register(SavedPathway)
class SavedPathwayAdmin(admin.ModelAdmin):
    list_display = ('student', 'target_role', 'progress_pct', 'estimated_months')


@admin.register(Placement)
class PlacementAdmin(admin.ModelAdmin):
    list_display = ('student', 'role_title', 'company', 'start_date', 'contract_type')
    list_filter = ('contract_type',)
    search_fields = ('company', 'role_title', 'student__last_name')
