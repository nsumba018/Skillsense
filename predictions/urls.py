from django.urls import path
from .views import (
    ForecastListView,
    ForecastByRoleView,
    TrendAnalysisView,
    HistoricalDemandView,
    MacroIndicatorView,
    TriggerForecastRunView,
)

urlpatterns = [
    path('forecasts/', ForecastListView.as_view(), name='predictions-forecasts'),
    path('forecasts/<int:role_id>/', ForecastByRoleView.as_view(), name='predictions-forecast-role'),
    path('trends/', TrendAnalysisView.as_view(), name='predictions-trends'),
    path('historical/', HistoricalDemandView.as_view(), name='predictions-historical'),
    path('macro/', MacroIndicatorView.as_view(), name='predictions-macro'),
    path('run/', TriggerForecastRunView.as_view(), name='predictions-run'),
]
