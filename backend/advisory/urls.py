from django.urls import path

from . import views

urlpatterns = [
    path('dashboard/', views.AdvisorDashboardView.as_view(), name='advisor-dashboard'),

    path('students/', views.StudentListCreateView.as_view(), name='student-list'),
    path('students/<int:pk>/', views.StudentDetailView.as_view(), name='student-detail'),

    path('assessments/', views.AssessmentListCreateView.as_view(), name='assessment-list'),
    path('assessments/<int:pk>/', views.AssessmentDetailView.as_view(), name='assessment-detail'),

    path('pathways/', views.PathwayListCreateView.as_view(), name='pathway-list'),
    path('pathways/<int:pk>/', views.PathwayDetailView.as_view(), name='pathway-detail'),

    path('placements/', views.PlacementListCreateView.as_view(), name='placement-list'),
    path('placements/stats/', views.PlacementStatsView.as_view(), name='placement-stats'),
    path('placements/bulk/', views.PlacementBulkCreateView.as_view(), name='placement-bulk'),
    path('placements/<int:pk>/', views.PlacementDetailView.as_view(), name='placement-detail'),

    path('jobs/', views.JobListView.as_view(), name='advisor-jobs'),
    path('jobs/insights/', views.JobInsightsView.as_view(), name='advisor-job-insights'),

    path('reports/<str:report_type>/', views.AdvisorReportView.as_view(), name='advisor-report'),
    path('reports/<str:report_type>/<str:fmt>/', views.AdvisorReportView.as_view(), name='advisor-report-export'),
]
