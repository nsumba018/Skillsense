from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers
from .models import GeographicDemand


class GeographicDemandSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.name', read_only=True)

    class Meta:
        model = GeographicDemand
        fields = [
            'id', 'province', 'district', 'role_name',
            'year', 'posting_count', 'demand_score',
        ]


class EmployabilityInputSerializer(serializers.Serializer):
    """Input for the employability scoring endpoint."""
    skills = serializers.ListField(
        child=serializers.IntegerField(),
        help_text="List of NormalizedRole IDs the user has skills in",
    )


import csv
import io

from django.db import transaction
from accounts.models import Institution
from .models import Curriculum, CurriculumCourse
from .services import analyze_curriculum

MAX_COURSES = 500
MAX_FILE_BYTES = 1_000_000
_TITLE_COLUMNS = ('course', 'title', 'name', 'module', 'subject', 'unit', 'course_title', 'course_name')
_DESC_COLUMNS = ('description', 'content', 'topics', 'outline', 'summary', 'syllabus')


class CurriculumSerializer(serializers.ModelSerializer):
    institution_name = serializers.CharField(source='institution.name', read_only=True, default=None)
    uploaded_by_email = serializers.CharField(source='uploaded_by.email', read_only=True, default=None)
    course_count = serializers.SerializerMethodField()
    alignment_score = serializers.SerializerMethodField()
    level_label = serializers.CharField(source='get_level_display', read_only=True)

    class Meta:
        model = Curriculum
        fields = [
            'id', 'name', 'level', 'level_label', 'institution', 'institution_name',
            'uploaded_by_email', 'source_filename', 'course_count', 'alignment_score', 'created_at',
        ]

    @extend_schema_field(serializers.IntegerField())
    def get_course_count(self, obj):
        return obj.courses.count()

    @extend_schema_field(serializers.FloatField())
    def get_alignment_score(self, obj):
        fm = self.context.get('forecast_map')
        return analyze_curriculum(obj, fm)['alignment_score']


class CurriculumDetailSerializer(CurriculumSerializer):
    analysis = serializers.SerializerMethodField()

    class Meta(CurriculumSerializer.Meta):
        fields = CurriculumSerializer.Meta.fields + ['analysis']

    @extend_schema_field(serializers.DictField())
    def get_analysis(self, obj):
        return analyze_curriculum(obj, self.context.get('forecast_map'))


class CurriculumCreateSerializer(serializers.Serializer):
    name = serializers.CharField(max_length=255)
    level = serializers.ChoiceField(choices=Curriculum.Level.choices, default=Curriculum.Level.BACHELOR)
    institution_id = serializers.PrimaryKeyRelatedField(
        queryset=Institution.objects.all(), source='institution', required=False, allow_null=True,
    )
    file = serializers.FileField(required=False, help_text='CSV with a course/title column and optional description')
    text = serializers.CharField(required=False, allow_blank=True, help_text='One course per line ("Title: description")')

    def validate(self, attrs):
        courses = []
        upload = attrs.get('file')
        if upload:
            if upload.size > MAX_FILE_BYTES:
                raise serializers.ValidationError({'file': 'File is too large (max 1 MB).'})
            try:
                content = upload.read().decode('utf-8-sig')
            except UnicodeDecodeError:
                raise serializers.ValidationError({'file': 'File must be UTF-8 text.'})
            reader = csv.DictReader(io.StringIO(content))
            fields = {(f or '').strip().lower(): f for f in (reader.fieldnames or [])}
            title_col = next((fields[c] for c in _TITLE_COLUMNS if c in fields), None)
            if not title_col:
                raise serializers.ValidationError({
                    'file': f"CSV needs a course column named one of: {', '.join(_TITLE_COLUMNS[:5])}.",
                })
            desc_col = next((fields[c] for c in _DESC_COLUMNS if c in fields), None)
            for row in reader:
                title = (row.get(title_col) or '').strip()
                if title:
                    courses.append({'title': title[:255], 'description': ((row.get(desc_col) or '').strip() if desc_col else '')})
        for line in (attrs.get('text') or '').splitlines():
            line = line.strip()
            if line:
                title, _, desc = line.partition(':')
                courses.append({'title': title.strip()[:255], 'description': desc.strip()})
        if not courses:
            raise serializers.ValidationError('Provide a CSV file or paste at least one course.')
        if len(courses) > MAX_COURSES:
            raise serializers.ValidationError(f'Too many courses (max {MAX_COURSES}).')
        attrs['courses'] = courses
        return attrs

    @transaction.atomic
    def create(self, validated_data):
        upload = validated_data.get('file')
        curriculum = Curriculum.objects.create(
            name=validated_data['name'],
            level=validated_data['level'],
            institution=validated_data.get('institution') or getattr(self.context['request'].user, 'institution', None),
            uploaded_by=self.context['request'].user,
            source_filename=upload.name if upload else '',
        )
        CurriculumCourse.objects.bulk_create([
            CurriculumCourse(curriculum=curriculum, position=i, **c) for i, c in enumerate(validated_data['courses'])
        ])
        return curriculum
