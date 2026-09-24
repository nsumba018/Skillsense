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
