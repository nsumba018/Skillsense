from django.urls import path
from .views import (
    SectorDemandView,
    GeographicDemandView,
    EmployabilityOverviewView,
    EmployabilityScoreView,
    EducationAlignmentView,
    CareerGuidanceView,
)

urlpatterns = [
    path('sector/', SectorDemandView.as_view(), name='analytics-sector'),
    path('geographic/', GeographicDemandView.as_view(), name='analytics-geographic'),
    path('employability/', EmployabilityOverviewView.as_view(), name='analytics-employability'),
    path('employability/score/', EmployabilityScoreView.as_view(), name='analytics-employability-score'),
    path('education/', EducationAlignmentView.as_view(), name='analytics-education'),
    path('career/', CareerGuidanceView.as_view(), name='analytics-career'),
]
