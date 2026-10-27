from django.urls import path
from . import views

urlpatterns = [
    path('', views.CurriculumListView.as_view(), name='curriculum-list'),
    path('upload/', views.CurriculumUploadView.as_view(), name='curriculum-upload'),
    path('skills/', views.CurriculumSkillsView.as_view(), name='curriculum-skills'),
    path('programs/', views.CurriculumProgramsView.as_view(), name='curriculum-programs'),
    path('all/', views.CurriculumAllView.as_view(), name='curriculum-all'),
    path('<str:dept_code>/', views.CurriculumDetailView.as_view(), name='curriculum-detail'),
]
