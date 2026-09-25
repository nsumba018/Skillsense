from django.urls import path
from .views import (
    SectorDemandView,
    GeographicDemandView,
    GeographicSummaryView,
    EmployabilityOverviewView,
    EmployabilityScoreView,
    EducationAlignmentView,
    CurriculumListCreateView,
    CurriculumDetailView,
    CareerGuidanceView,
)

urlpatterns = [
    path('sector/', SectorDemandView.as_view(), name='analytics-sector'),
    path('geographic/', GeographicDemandView.as_view(), name='analytics-geographic'),
    path('geographic/summary/', GeographicSummaryView.as_view(), name='analytics-geographic-summary'),
    path('employability/', EmployabilityOverviewView.as_view(), name='analytics-employability'),
    path('employability/score/', EmployabilityScoreView.as_view(), name='analytics-employability-score'),
    path('education/', EducationAlignmentView.as_view(), name='analytics-education'),
    path('education/curricula/', CurriculumListCreateView.as_view(), name='analytics-curricula'),
    path('education/curricula/<int:pk>/', CurriculumDetailView.as_view(), name='analytics-curriculum-detail'),
    path('career/', CareerGuidanceView.as_view(), name='analytics-career'),
]
