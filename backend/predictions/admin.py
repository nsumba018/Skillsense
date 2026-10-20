from django.contrib import admin
from .models import ForecastRun, RoleForecast, SectorForecastRun, SectorForecast


@admin.register(ForecastRun)
class ForecastRunAdmin(admin.ModelAdmin):
    list_display = ['id', 'model_version', 'accuracy_spearman', 'accuracy_r2', 'created_at']
    ordering = ['-created_at']


@admin.register(RoleForecast)
class RoleForecastAdmin(admin.ModelAdmin):
    list_display = ['role', 'forecast_run', 'horizon', 'demand_index', 'trend_direction']
    list_filter = ['horizon', 'trend_direction']
    search_fields = ['role__name']


@admin.register(SectorForecastRun)
class SectorForecastRunAdmin(admin.ModelAdmin):
    list_display = ['id', 'model_version', 'accuracy_mae', 'accuracy_r2', 'created_at']
    ordering = ['-created_at']


@admin.register(SectorForecast)
class SectorForecastAdmin(admin.ModelAdmin):
    list_display = ['sector', 'forecast_run', 'horizon', 'employment_share_pct', 'employment_count', 'share_trend', 'employment_trend']
    list_filter = ['horizon', 'share_trend', 'employment_trend', 'sector']
    search_fields = ['sector__name']
