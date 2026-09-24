from django.urls import path
from .views import ReportListView, ReportGenerateView, ReportCSVView

urlpatterns = [
    path('', ReportListView.as_view(), name='report-list'),
    path('<str:report_type>/', ReportGenerateView.as_view(), name='report-generate'),
    path('<str:report_type>/csv/', ReportCSVView.as_view(), name='report-csv'),
]
