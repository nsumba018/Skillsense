from django.urls import path
from .views import (
    SectorDemandView,
    SectorRoleDetailView,
    SectorRoleTaxonomyView,
    SectorTopPositionsView,
    GeographicDemandView,
    GeographicSummaryView,
    PolicyInsightsView,
    EmployabilityOverviewView,
    EmployabilityScoreView,
    EducationAlignmentView,
    CurriculumListCreateView,
    CurriculumDetailView,
    CareerGuidanceView,
)

urlpatterns = [
    path('sector/', SectorDemandView.as_view(), name='analytics-sector'),
    path('sector/positions/', SectorTopPositionsView.as_view(), name='analytics-sector-positions'),
    path('sector/taxonomy/', SectorRoleTaxonomyView.as_view(), name='analytics-sector-taxonomy'),
    path('sector/role-detail/', SectorRoleDetailView.as_view(), name='analytics-sector-role-detail'),
    path('geographic/', GeographicDemandView.as_view(), name='analytics-geographic'),
    path('geographic/summary/', GeographicSummaryView.as_view(), name='analytics-geographic-summary'),
    path('policy-insights/', PolicyInsightsView.as_view(), name='analytics-policy-insights'),
    path('employability/', EmployabilityOverviewView.as_view(), name='analytics-employability'),
    path('employability/score/', EmployabilityScoreView.as_view(), name='analytics-employability-score'),
    path('education/', EducationAlignmentView.as_view(), name='analytics-education'),
    path('education/curricula/', CurriculumListCreateView.as_view(), name='analytics-curricula'),
    path('education/curricula/<int:pk>/', CurriculumDetailView.as_view(), name='analytics-curriculum-detail'),
    path('career/', CareerGuidanceView.as_view(), name='analytics-career'),
]
