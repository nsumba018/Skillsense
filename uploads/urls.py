from django.urls import path
from .views import UploadCreateView, UploadListView, UploadDetailView, UploadPostingsView

urlpatterns = [
    path('', UploadCreateView.as_view(), name='upload-create'),
    path('list/', UploadListView.as_view(), name='upload-list'),
    path('<int:pk>/', UploadDetailView.as_view(), name='upload-detail'),
    path('<int:pk>/postings/', UploadPostingsView.as_view(), name='upload-postings'),
]
