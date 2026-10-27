from django.urls import path
from .dashboard_views import DashboardKPIView, DashboardOverviewView, AdminStatsView

urlpatterns = [
    path('kpis/', DashboardKPIView.as_view(), name='dashboard-kpis'),
    path('overview/', DashboardOverviewView.as_view(), name='dashboard-overview'),
    path('admin-stats/', AdminStatsView.as_view(), name='admin-stats'),
]
