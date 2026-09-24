import socket
from urllib.parse import urlparse

from django.conf import settings
from rest_framework import generics
from rest_framework.parsers import MultiPartParser, FormParser
from accounts.permissions import IsAdminUser
from .models import DataUpload, JobPosting
from .serializers import DataUploadSerializer, DataUploadCreateSerializer, JobPostingSerializer


def _broker_reachable():
    url = urlparse(settings.CELERY_BROKER_URL)
    try:
        socket.create_connection((url.hostname, url.port or 6379), timeout=1).close()
        return True
    except OSError:
        return False


class UploadCreateView(generics.CreateAPIView):
    """POST /api/uploads/ — Upload a CSV file (admin only)."""
    serializer_class = DataUploadCreateSerializer
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        upload = serializer.save(
            uploaded_by=self.request.user,
            original_filename=self.request.FILES['file'].name,
            status='pending',
        )
        from uploads.tasks import process_upload_task
        if _broker_reachable():
            process_upload_task.delay(upload.id)
        else:
            process_upload_task(upload.id)


class UploadListView(generics.ListAPIView):
    """GET /api/uploads/list/ — List past uploads."""
    queryset = DataUpload.objects.all()
    serializer_class = DataUploadSerializer
    permission_classes = [IsAdminUser]


class UploadDetailView(generics.RetrieveAPIView):
    """GET /api/uploads/:id/ — Upload detail + processing log."""
    queryset = DataUpload.objects.all()
    serializer_class = DataUploadSerializer
    permission_classes = [IsAdminUser]


class UploadPostingsView(generics.ListAPIView):
    """GET /api/uploads/:id/postings/ — Job postings from this upload."""
    serializer_class = JobPostingSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        if getattr(self, 'swagger_fake_view', False):
            return JobPosting.objects.none()
        return JobPosting.objects.filter(
            upload_id=self.kwargs['pk']
        ).select_related('normalized_role')
