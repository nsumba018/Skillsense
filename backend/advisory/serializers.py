import math

from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema_field
from rest_framework import serializers

from . import scoring, stats
from .models import Assessment, Placement, SavedPathway, StudentProfile
from .skills_data import ROLE_BY_NAME


def _brief(student, with_department=True):
    out = {'id': student.id, 'name': student.full_name}
    if with_department:
        out['department'] = student.department
    return out


def _validate_str_list(value, label):
    if not isinstance(value, list) or not all(isinstance(v, str) and v.strip() for v in value):
        raise serializers.ValidationError(f'{label} must be a list of non-empty strings.')
    seen, cleaned = set(), []
    for v in value:
        v = v.strip()
        if v.lower() not in seen:
            seen.add(v.lower())
            cleaned.append(v)
    return cleaned


class StudentSerializer(serializers.ModelSerializer):
    name = serializers.CharField(source='full_name', read_only=True)

    class Meta:
        model = StudentProfile
        fields = [
            'id', 'first_name', 'last_name', 'name', 'email', 'department', 'graduation_year', 'graduated_on',
            'status', 'skills', 'target_roles', 'gender', 'innovation_center_cohort', 'notes', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    def validate_skills(self, value):
        return _validate_str_list(value, 'skills')

    def validate_target_roles(self, value):
        value = _validate_str_list(value, 'target_roles')
        unknown = [r for r in value if r not in ROLE_BY_NAME]
        if unknown:
            raise serializers.ValidationError(f'Unknown role(s): {", ".join(unknown)}.')
        return value

    def validate_email(self, value):
        value = (value or '').strip().lower()
        if value:
            clash = StudentProfile.objects.filter(email__iexact=value)
            if self.instance:
                clash = clash.exclude(pk=self.instance.pk)
            if clash.exists():
                raise serializers.ValidationError('A student with this email already exists.')
        return value


class AssessmentSerializer(serializers.ModelSerializer):
    student = serializers.SerializerMethodField()
    priority_skills = serializers.SerializerMethodField()

    class Meta:
        model = Assessment
        fields = [
            'id', 'student', 'target_role', 'readiness_score', 'matched_skills', 'missing_skills',
            'recommendations', 'alternative_roles', 'priority_skills', 'created_at',
        ]

    @extend_schema_field(OpenApiTypes.OBJECT)
    def get_student(self, obj):
        return _brief(obj.student)

    @extend_schema_field(OpenApiTypes.OBJECT)
    def get_priority_skills(self, obj):
        return stats.priority_skills(obj.missing_skills)


class AssessmentCreateSerializer(serializers.Serializer):
    student_id = serializers.PrimaryKeyRelatedField(queryset=StudentProfile.objects.all(), source='student')
    target_role = serializers.CharField()

    def validate_target_role(self, value):
        if value not in ROLE_BY_NAME:
            raise serializers.ValidationError(f'Unknown role "{value}".')
        return value

    def create(self, validated):
        student = validated['student']
        role = validated['target_role']
        result = scoring.assess(student.skills, role)
        # name the gaps that matter most to employers first, the same order the priority list uses
        focus = [p['skill'] for p in stats.priority_skills(result['missing_skills'], limit=2)]
        result = scoring.assess(student.skills, role, focus=focus)
        return Assessment.objects.create(student=student, assessed_by=self.context['request'].user, **result)


def _clean_steps(steps):
    if not isinstance(steps, list):
        raise serializers.ValidationError('steps must be a list.')
    cleaned = []
    for i, s in enumerate(steps, 1):
        if not isinstance(s, dict) or not str(s.get('skill', '')).strip():
            raise serializers.ValidationError(f'Step {i} needs a skill.')
        try:
            weeks = int(s.get('duration_weeks', 1))
        except (TypeError, ValueError):
            raise serializers.ValidationError(f'Step {i} has an invalid duration.')
        cleaned.append({
            'skill': str(s['skill']).strip(),
            'source': str(s.get('source', '')).strip(),
            'duration_weeks': max(1, weeks),
            'completed': bool(s.get('completed', False)),
        })
    return cleaned


class PathwaySerializer(serializers.ModelSerializer):
    student = serializers.SerializerMethodField()
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=StudentProfile.objects.all(), source='student', write_only=True,
    )
    estimated_months = serializers.IntegerField(required=False, min_value=1)
    progress_pct = serializers.FloatField(read_only=True)

    class Meta:
        model = SavedPathway
        fields = ['id', 'student', 'student_id', 'target_role', 'steps', 'estimated_months', 'progress_pct', 'created_at']
        read_only_fields = ['id', 'created_at']

    @extend_schema_field(OpenApiTypes.OBJECT)
    def get_student(self, obj):
        return _brief(obj.student, with_department=False)

    def validate_target_role(self, value):
        if value not in ROLE_BY_NAME:
            raise serializers.ValidationError(f'Unknown role "{value}".')
        return value

    def validate_steps(self, value):
        return _clean_steps(value)

    def _derive(self, validated, instance=None):
        steps = validated.get('steps', instance.steps if instance else [])
        if 'steps' in validated or instance is None:
            done = sum(1 for s in steps if s['completed'])
            validated['progress_pct'] = round(done / len(steps) * 100, 1) if steps else 0.0
            if 'estimated_months' not in validated:
                total_weeks = sum(s['duration_weeks'] for s in steps)
                validated['estimated_months'] = max(1, math.ceil(total_weeks / 4.345))
        return validated

    def create(self, validated):
        validated = self._derive(validated)
        return SavedPathway.objects.create(created_by=self.context['request'].user, **validated)

    def update(self, instance, validated):
        validated.pop('student', None)  # a pathway stays with its student
        validated = self._derive(validated, instance)
        for k, v in validated.items():
            setattr(instance, k, v)
        instance.save()
        return instance


class PlacementSerializer(serializers.ModelSerializer):
    student = serializers.SerializerMethodField()
    student_id = serializers.PrimaryKeyRelatedField(
        queryset=StudentProfile.objects.all(), source='student', write_only=True,
    )

    class Meta:
        model = Placement
        fields = [
            'id', 'student', 'student_id', 'role_title', 'company', 'location', 'start_date', 'contract_type',
            'salary_range', 'placement_method', 'created_at',
        ]
        read_only_fields = ['id', 'created_at']

    @extend_schema_field(OpenApiTypes.OBJECT)
    def get_student(self, obj):
        return _brief(obj.student)

    def create(self, validated):
        placement = Placement.objects.create(recorded_by=self.context['request'].user, **validated)
        student = placement.student
        if student.status != StudentProfile.Status.PLACED:
            student.status = StudentProfile.Status.PLACED
            student.save(update_fields=['status', 'updated_at'])
        return placement

    def update(self, instance, validated):
        validated.pop('student', None)
        return super().update(instance, validated)


class StudentDetailSerializer(StudentSerializer):
    latest_assessment = serializers.SerializerMethodField()
    placements = PlacementSerializer(many=True, read_only=True)
    pathways = PathwaySerializer(many=True, read_only=True)

    class Meta(StudentSerializer.Meta):
        fields = StudentSerializer.Meta.fields + ['latest_assessment', 'placements', 'pathways']

    @extend_schema_field(OpenApiTypes.OBJECT)
    def get_latest_assessment(self, obj):
        latest = obj.assessments.first()
        return AssessmentSerializer(latest).data if latest else None
