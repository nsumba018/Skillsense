from rest_framework import serializers
from .models import CurriculumBulletin, BulletinCourse


class BulletinCourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = BulletinCourse
        fields = ['id', 'semester', 'name', 'credits', 'skills']


class CurriculumBulletinSerializer(serializers.ModelSerializer):
    courses = BulletinCourseSerializer(many=True, read_only=True)
    uploaded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = CurriculumBulletin
        fields = [
            'id', 'department_code', 'department_name', 'faculty',
            'original_filename', 'total_credits', 'total_semesters',
            'total_courses', 'is_active', 'created_at',
            'uploaded_by_name', 'courses',
        ]

    def get_uploaded_by_name(self, obj):
        if obj.uploaded_by:
            return f"{obj.uploaded_by.first_name} {obj.uploaded_by.last_name}".strip() or obj.uploaded_by.email
        return None


class BulletinListSerializer(serializers.ModelSerializer):
    """Lightweight serializer without courses — for list views."""
    uploaded_by_name = serializers.SerializerMethodField()

    class Meta:
        model = CurriculumBulletin
        fields = [
            'id', 'department_code', 'department_name', 'faculty',
            'original_filename', 'total_credits', 'total_semesters',
            'total_courses', 'is_active', 'created_at', 'uploaded_by_name',
        ]

    def get_uploaded_by_name(self, obj):
        if obj.uploaded_by:
            return f"{obj.uploaded_by.first_name} {obj.uploaded_by.last_name}".strip() or obj.uploaded_by.email
        return None
