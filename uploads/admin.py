from django.contrib import admin
from .models import DataUpload, JobPosting


@admin.register(DataUpload)
class DataUploadAdmin(admin.ModelAdmin):
    list_display = ['original_filename', 'status', 'total_records', 'ict_records', 'error_count', 'uploaded_by', 'created_at']
    list_filter = ['status']
    search_fields = ['original_filename']


@admin.register(JobPosting)
class JobPostingAdmin(admin.ModelAdmin):
    list_display = ['title', 'company', 'normalized_role', 'is_ict', 'needs_manual_review', 'posted_date']
    list_filter = ['is_ict', 'needs_manual_review', 'source', 'normalized_role']
    search_fields = ['title', 'company']
