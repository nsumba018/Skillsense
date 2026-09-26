from rest_framework import serializers
from .models import GeneratedReport


class GeneratedReportSerializer(serializers.ModelSerializer):
    generated_by_email = serializers.CharField(
        source='generated_by.email', read_only=True, default=None
    )

    class Meta:
        model = GeneratedReport
        fields = [
            'id', 'report_type', 'format', 'title',
            'generated_by_email', 'file', 'parameters', 'created_at',
        ]
