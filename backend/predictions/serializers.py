from rest_framework import serializers
from .models import ForecastRun, RoleForecast, SectorForecastRun, SectorForecast


class RoleForecastSerializer(serializers.ModelSerializer):
    role_name = serializers.CharField(source='role.name', read_only=True)
    role_id = serializers.IntegerField(source='role.id', read_only=True)

    class Meta:
        model = RoleForecast
        fields = [
            'id', 'role_id', 'role_name', 'horizon',
            'demand_index', 'share_pct', 'employment_proxy',
            'confidence_lower', 'confidence_upper', 'trend_direction',
        ]


class ForecastRunSerializer(serializers.ModelSerializer):
    forecasts = RoleForecastSerializer(many=True, read_only=True)

    class Meta:
        model = ForecastRun
        fields = [
            'id', 'created_at', 'model_version',
            'accuracy_spearman', 'accuracy_pearson',
            'accuracy_mae', 'accuracy_rmse', 'accuracy_r2',
            'notes', 'forecasts',
        ]


class ForecastRunSummarySerializer(serializers.ModelSerializer):
    """Without nested forecasts, for list views."""
    class Meta:
        model = ForecastRun
        fields = [
            'id', 'created_at', 'model_version',
            'accuracy_spearman', 'accuracy_pearson', 'accuracy_r2',
        ]


class SectorForecastSerializer(serializers.ModelSerializer):
    sector_name = serializers.CharField(source='sector.name', read_only=True)
    sector_slug = serializers.CharField(source='sector.slug', read_only=True)
    sector_color = serializers.CharField(source='sector.color', read_only=True)
    posting_count = serializers.SerializerMethodField()

    class Meta:
        model = SectorForecast
        fields = [
            'id', 'sector_slug', 'sector_name', 'sector_color', 'horizon',
            'employment_share_pct', 'employment_count', 'gdp_contribution_pct',
            'confidence_lower', 'confidence_upper',
            'share_trend', 'employment_trend',
            'posting_count',
        ]

    def get_posting_count(self, obj):
        from uploads.models import JobPosting
        return JobPosting.objects.filter(sector=obj.sector).count()


class SectorForecastRunSerializer(serializers.ModelSerializer):
    forecasts = SectorForecastSerializer(many=True, read_only=True)

    class Meta:
        model = SectorForecastRun
        fields = [
            'id', 'created_at', 'model_version',
            'accuracy_mae', 'accuracy_r2', 'notes', 'forecasts',
        ]


class SectorForecastRunSummarySerializer(serializers.ModelSerializer):
    class Meta:
        model = SectorForecastRun
        fields = ['id', 'created_at', 'model_version', 'accuracy_mae', 'accuracy_r2']
