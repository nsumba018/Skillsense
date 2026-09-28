from django.urls import path
from .dashboard_views import DashboardKPIView, DashboardOverviewView

urlpatterns = [
    path('kpis/', DashboardKPIView.as_view(), name='dashboard-kpis'),
    path('overview/', DashboardOverviewView.as_view(), name='dashboard-overview'),
]
