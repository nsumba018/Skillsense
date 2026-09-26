from rest_framework import serializers
from .models import RoleGroup, RoleFamily, NormalizedRole, HistoricalDemand, MacroIndicator


class NormalizedRoleListSerializer(serializers.ModelSerializer):
    """Brief role info for list views."""
    group_name = serializers.CharField(source='role_family.role_group.name', read_only=True)
    family_name = serializers.CharField(source='role_family.name', read_only=True)

    class Meta:
        model = NormalizedRole
        fields = [
            'id', 'name', 'emergence_year', 'is_emerging',
            'group_name', 'family_name', 'global_trend_signal',
        ]


class HistoricalDemandSerializer(serializers.ModelSerializer):
    class Meta:
        model = HistoricalDemand
        fields = [
            'year', 'role_demand_index', 'role_share_within_ict_pct',
            'role_employment_proxy', 'data_basis', 'synthetic_flag',
        ]


class NormalizedRoleDetailSerializer(serializers.ModelSerializer):
    """Full role info with historical data, for detail views."""
    group_name = serializers.CharField(source='role_family.role_group.name', read_only=True)
    family_name = serializers.CharField(source='role_family.name', read_only=True)
    historical_demand = HistoricalDemandSerializer(many=True, read_only=True)

    class Meta:
        model = NormalizedRole
        fields = [
            'id', 'name', 'description', 'emergence_year', 'is_emerging',
            'group_name', 'family_name', 'global_trend_signal',
            'historical_demand',
        ]


class RoleFamilySerializer(serializers.ModelSerializer):
    roles = NormalizedRoleListSerializer(many=True, read_only=True)
    group_name = serializers.CharField(source='role_group.name', read_only=True)

    class Meta:
        model = RoleFamily
        fields = ['id', 'name', 'group_name', 'roles']


class RoleGroupSerializer(serializers.ModelSerializer):
    families = RoleFamilySerializer(many=True, read_only=True)

    class Meta:
        model = RoleGroup
        fields = ['id', 'name', 'description', 'sort_order', 'families']


class MacroIndicatorSerializer(serializers.ModelSerializer):
    class Meta:
        model = MacroIndicator
        fields = '__all__'
