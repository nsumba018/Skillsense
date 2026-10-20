from rest_framework import serializers
from .models import Sector, RoleGroup, RoleFamily, NormalizedRole, HistoricalDemand, MacroIndicator, SectorEmployment


class SectorListSerializer(serializers.ModelSerializer):
    role_count = serializers.SerializerMethodField()

    class Meta:
        model = Sector
        fields = ['id', 'name', 'slug', 'description', 'sort_order', 'color', 'role_count']

    def get_role_count(self, obj):
        return NormalizedRole.objects.filter(
            role_family__role_group__sector=obj
        ).count()


class SectorDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model = Sector
        fields = ['id', 'name', 'slug', 'description', 'sort_order', 'color']


class SectorEmploymentSerializer(serializers.ModelSerializer):
    sector_name = serializers.CharField(source='sector.name', read_only=True)
    sector_slug = serializers.CharField(source='sector.slug', read_only=True)

    class Meta:
        model = SectorEmployment
        fields = [
            'id', 'sector', 'sector_slug', 'sector_name', 'year',
            'employment_count', 'employment_share_pct',
            'gdp_contribution_pct', 'posting_count',
            'data_source', 'synthetic_flag',
        ]


class NormalizedRoleListSerializer(serializers.ModelSerializer):
    """Brief role info for list views."""
    group_name = serializers.CharField(source='role_family.role_group.name', read_only=True)
    family_name = serializers.CharField(source='role_family.name', read_only=True)
    sector_name = serializers.CharField(source='role_family.role_group.sector.name', read_only=True, default=None)
    sector_slug = serializers.CharField(source='role_family.role_group.sector.slug', read_only=True, default=None)

    class Meta:
        model = NormalizedRole
        fields = [
            'id', 'name', 'emergence_year', 'is_emerging',
            'group_name', 'family_name', 'global_trend_signal',
            'sector_name', 'sector_slug',
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
    sector_name = serializers.CharField(source='sector.name', read_only=True, default=None)
    sector_slug = serializers.CharField(source='sector.slug', read_only=True, default=None)

    class Meta:
        model = RoleGroup
        fields = ['id', 'name', 'description', 'sort_order', 'families', 'sector_name', 'sector_slug']


class MacroIndicatorSerializer(serializers.ModelSerializer):
    class Meta:
        model = MacroIndicator
        fields = '__all__'
