from rest_framework import serializers
from .models import DataUpload, JobPosting


class JobPostingSerializer(serializers.ModelSerializer):
    normalized_role_name = serializers.CharField(
        source='normalized_role.name', read_only=True, default=None
    )

    class Meta:
        model = JobPosting
        fields = [
            'id', 'source', 'title', 'company', 'location_raw', 'country',
            'industry_raw', 'education_raw', 'experience_raw',
            'contract_type_raw', 'posted_date', 'closing_date',
            'is_ict', 'ict_role_confidence',
            'normalized_role', 'normalized_role_name',
            'role_level', 'role_normalization_confidence',
            'needs_manual_review', 'manual_review_reason',
            'created_at',
        ]


class DataUploadSerializer(serializers.ModelSerializer):
    uploaded_by_email = serializers.CharField(
        source='uploaded_by.email', read_only=True, default=None
    )

    class Meta:
        model = DataUpload
        fields = [
            'id', 'uploaded_by_email', 'original_filename',
            'status', 'total_records', 'ict_records', 'error_count',
            'processing_log', 'created_at',
        ]
        read_only_fields = [
            'id', 'uploaded_by_email', 'status',
            'total_records', 'ict_records', 'error_count',
            'processing_log', 'created_at',
        ]


class DataUploadCreateSerializer(serializers.ModelSerializer):
    file = serializers.FileField()

    class Meta:
        model = DataUpload
        fields = ['file']
