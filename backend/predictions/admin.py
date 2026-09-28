from django.contrib import admin
from .models import ForecastRun, RoleForecast


@admin.register(ForecastRun)
class ForecastRunAdmin(admin.ModelAdmin):
    list_display = ['id', 'model_version', 'accuracy_spearman', 'accuracy_r2', 'created_at']
    ordering = ['-created_at']


@admin.register(RoleForecast)
class RoleForecastAdmin(admin.ModelAdmin):
    list_display = ['role', 'forecast_run', 'horizon', 'demand_index', 'trend_direction']
    list_filter = ['horizon', 'trend_direction']
    search_fields = ['role__name']
