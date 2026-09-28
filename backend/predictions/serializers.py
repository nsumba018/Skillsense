from rest_framework import serializers
from .models import ForecastRun, RoleForecast


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
