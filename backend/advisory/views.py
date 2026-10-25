import csv
import io
from datetime import datetime

from django.db import transaction
from django.http import HttpResponse
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import generics, status
from rest_framework.pagination import PageNumberPagination
from rest_framework.parsers import MultiPartParser
from rest_framework.response import Response
from rest_framework.views import APIView

from accounts.permissions import IsCareerTrainingAdvisor

from . import stats
from .models import Assessment, Placement, SavedPathway, StudentProfile
from .pdf import report_pdf
from .serializers import (
    AssessmentCreateSerializer,
    AssessmentSerializer,
    PathwaySerializer,
    PlacementSerializer,
    StudentDetailSerializer,
    StudentSerializer,
)


class AdvisoryPagination(PageNumberPagination):
    page_size = 50
    page_size_query_param = 'page_size'
    max_page_size = 500


class AdvisoryView:
    """Every advisory endpoint is for career advisors (and administrators)."""
    permission_classes = [IsCareerTrainingAdvisor]
    pagination_class = AdvisoryPagination


# ── dashboard ────────────────────────────────────────────────────────

@extend_schema(responses=OpenApiTypes.OBJECT)
class AdvisorDashboardView(AdvisoryView, APIView):
    """GET /api/advisory/dashboard/: KPIs, students needing attention, hot roles, recent placements."""

    def get(self, request):
        return Response(stats.dashboard())


# ── students ─────────────────────────────────────────────────────────

class StudentListCreateView(AdvisoryView, generics.ListCreateAPIView):
    """GET/POST /api/advisory/students/  (?search= ?department= ?status= ?graduation_year= ?cohort=)"""
    serializer_class = StudentSerializer
    filterset_fields = ['department', 'status', 'graduation_year', 'gender']
    search_fields = ['first_name', 'last_name', 'email']

    def get_queryset(self):
        qs = StudentProfile.objects.all()
        cohort = self.request.query_params.get('cohort')
        return qs.filter(innovation_center_cohort=cohort) if cohort else qs

    def perform_create(self, serializer):
        serializer.save(advisor=self.request.user)


class StudentDetailView(AdvisoryView, generics.RetrieveUpdateDestroyAPIView):
    """GET/PATCH/DELETE /api/advisory/students/<id>/"""
    queryset = StudentProfile.objects.prefetch_related('assessments', 'placements', 'pathways')

    def get_serializer_class(self):
        return StudentDetailSerializer if self.request.method == 'GET' else StudentSerializer


# ── assessments ──────────────────────────────────────────────────────

class AssessmentListCreateView(AdvisoryView, generics.ListCreateAPIView):
    """GET /api/advisory/assessments/ (?student_id=)  ·  POST {student_id, target_role} scores and stores one."""

    def get_queryset(self):
        qs = Assessment.objects.select_related('student')
        sid = self.request.query_params.get('student_id')
        return qs.filter(student_id=sid) if sid and sid.isdigit() else qs

    def get_serializer_class(self):
        return AssessmentCreateSerializer if self.request.method == 'POST' else AssessmentSerializer

    @extend_schema(request=AssessmentCreateSerializer, responses=AssessmentSerializer)
    def create(self, request, *args, **kwargs):
        ser = AssessmentCreateSerializer(data=request.data, context={'request': request})
        ser.is_valid(raise_exception=True)
        assessment = ser.save()
        return Response(AssessmentSerializer(assessment).data, status=status.HTTP_201_CREATED)


class AssessmentDetailView(AdvisoryView, generics.RetrieveDestroyAPIView):
    queryset = Assessment.objects.select_related('student')
    serializer_class = AssessmentSerializer


# ── pathways ─────────────────────────────────────────────────────────

class PathwayListCreateView(AdvisoryView, generics.ListCreateAPIView):
    serializer_class = PathwaySerializer

    def get_queryset(self):
        qs = SavedPathway.objects.select_related('student')
        sid = self.request.query_params.get('student_id')
        return qs.filter(student_id=sid) if sid and sid.isdigit() else qs


class PathwayDetailView(AdvisoryView, generics.RetrieveUpdateDestroyAPIView):
    queryset = SavedPathway.objects.select_related('student')
    serializer_class = PathwaySerializer


# ── placements ───────────────────────────────────────────────────────

def _release_student(student):
    """A student with no placements left goes back to 'graduated'."""
    if student.status == StudentProfile.Status.PLACED and not student.placements.exists():
        student.status = StudentProfile.Status.GRADUATED
        student.save(update_fields=['status', 'updated_at'])


class PlacementListCreateView(AdvisoryView, generics.ListCreateAPIView):
    serializer_class = PlacementSerializer
    search_fields = ['student__first_name', 'student__last_name', 'company', 'role_title']
    filterset_fields = ['contract_type']
    queryset = Placement.objects.select_related('student')


class PlacementDetailView(AdvisoryView, generics.RetrieveUpdateDestroyAPIView):
    queryset = Placement.objects.select_related('student')
    serializer_class = PlacementSerializer

    def perform_destroy(self, instance):
        student = instance.student
        instance.delete()
        _release_student(student)


def _stat_filters(request):
    p = request.query_params
    year = p.get('graduation_year')
    return {
        'graduation_year': int(year) if year and year.isdigit() else None,
        'cohort': p.get('cohort') or None,
        'department': p.get('department') if p.get('department') in stats.DEPARTMENTS else None,
    }


@extend_schema(
    parameters=[
        OpenApiParameter('graduation_year', OpenApiTypes.INT, required=False),
        OpenApiParameter('cohort', str, required=False),
        OpenApiParameter('department', str, required=False),
    ],
    responses=OpenApiTypes.OBJECT,
)
class PlacementStatsView(AdvisoryView, APIView):
    """GET /api/advisory/placements/stats/: placement rate, time to placement, breakdowns."""

    def get(self, request):
        return Response(stats.placement_stats(_stat_filters(request)))


CONTRACT_ALIASES = {
    'full-time': 'full_time', 'full time': 'full_time', 'fulltime': 'full_time', 'permanent': 'full_time',
    'intern': 'internship', 'part-time': 'contract',
}


def _parse_date(text):
    for fmt in ('%Y-%m-%d', '%d/%m/%Y', '%d-%m-%Y'):
        try:
            return datetime.strptime(text.strip(), fmt).date()
        except ValueError:
            continue
    return None


@extend_schema(request={'multipart/form-data': OpenApiTypes.OBJECT}, responses=OpenApiTypes.OBJECT)
class PlacementBulkCreateView(AdvisoryView, APIView):
    """
    POST /api/advisory/placements/bulk/  (multipart, field `file`)
    CSV columns: student_email, role_title, company, start_date, contract_type
    (optional: location, salary_range, placement_method). Valid rows are saved; bad rows are reported.
    """
    parser_classes = [MultiPartParser]
    MAX_BYTES = 2 * 1024 * 1024

    def post(self, request):
        upload = request.FILES.get('file')
        if not upload:
            return Response({'detail': 'Attach a CSV file in the "file" field.'}, status=400)
        if upload.size > self.MAX_BYTES:
            return Response({'detail': 'File is too large (2 MB maximum).'}, status=400)
        try:
            text = upload.read().decode('utf-8-sig')
        except UnicodeDecodeError:
            return Response({'detail': 'The file must be UTF-8 encoded CSV.'}, status=400)

        reader = csv.DictReader(io.StringIO(text))
        required = {'student_email', 'role_title', 'company', 'start_date'}
        headers = {(h or '').strip().lower() for h in (reader.fieldnames or [])}
        if not required <= headers:
            return Response({'detail': f'Missing column(s): {", ".join(sorted(required - headers))}.'}, status=400)

        created, errors = 0, []
        valid_contracts = set(Placement.ContractType.values)
        for line, raw in enumerate(reader, start=2):
            row = {(k or '').strip().lower(): (v or '').strip() for k, v in raw.items()}
            email = row.get('student_email', '').lower()
            student = StudentProfile.objects.filter(email__iexact=email).first() if email else None
            start = _parse_date(row.get('start_date', ''))
            contract = row.get('contract_type', '').lower() or 'full_time'
            contract = CONTRACT_ALIASES.get(contract, contract)
            problem = (
                f'no student with email "{email}"' if not student else
                'role_title and company are required' if not (row.get('role_title') and row.get('company')) else
                f'invalid start_date "{row.get("start_date", "")}" (use YYYY-MM-DD)' if not start else
                f'invalid contract_type "{contract}"' if contract not in valid_contracts else None
            )
            if problem:
                errors.append(f'Row {line}: {problem}')
                continue
            with transaction.atomic():
                Placement.objects.create(
                    student=student, role_title=row['role_title'], company=row['company'], start_date=start,
                    contract_type=contract, location=row.get('location') or 'Kigali',
                    salary_range=row.get('salary_range', ''), placement_method=row.get('placement_method', ''),
                    recorded_by=request.user,
                )
                if student.status != StudentProfile.Status.PLACED:
                    student.status = StudentProfile.Status.PLACED
                    student.save(update_fields=['status', 'updated_at'])
            created += 1
        return Response({'created': created, 'errors': errors}, status=201 if created else 200)


# ── job market ───────────────────────────────────────────────────────

JOB_PARAMS = [
    OpenApiParameter('sector', str, required=False, description='ict-technology | finance-business'),
    OpenApiParameter('role', str, required=False, description='A catalogue role name'),
    OpenApiParameter('q', str, required=False),
    OpenApiParameter('location', str, required=False),
    OpenApiParameter('days', OpenApiTypes.INT, required=False, description='Posted within the last N days'),
]


class JobPagination(AdvisoryPagination):
    page_size = 24


@extend_schema(parameters=JOB_PARAMS, responses=OpenApiTypes.OBJECT)
class JobListView(AdvisoryView, APIView):
    """GET /api/advisory/jobs/: tracked-sector job postings with the skills each one asks for."""
    pagination_class = JobPagination

    def get(self, request):
        qs = stats.filter_postings(request.query_params).select_related('sector').order_by('-posted_date', '-id')
        paginator = JobPagination()
        page = paginator.paginate_queryset(qs, request, view=self)
        return paginator.get_paginated_response([stats.posting_card(p) for p in page])


@extend_schema(parameters=JOB_PARAMS, responses=OpenApiTypes.OBJECT)
class JobInsightsView(AdvisoryView, APIView):
    """GET /api/advisory/jobs/insights/: company hiring patterns and per-role demand trends for the same filters."""

    def get(self, request):
        return Response(stats.job_insights(stats.filter_postings(request.query_params)))


# ── reports ──────────────────────────────────────────────────────────

@extend_schema(
    parameters=[
        OpenApiParameter('student_id', OpenApiTypes.INT, required=False),
        OpenApiParameter('graduation_year', OpenApiTypes.INT, required=False),
        OpenApiParameter('cohort', str, required=False),
        OpenApiParameter('department', str, required=False),
        OpenApiParameter('sector', str, required=False),
    ],
    responses=OpenApiTypes.OBJECT,
)
class AdvisorReportView(AdvisoryView, APIView):
    """GET /api/advisory/reports/<type>/[csv|pdf]/ for student_readiness, cohort_outcomes, employer_demand, skills_gap."""

    def build(self, request, report_type):
        if report_type == 'student_readiness':
            sid = request.query_params.get('student_id', '')
            student = StudentProfile.objects.filter(pk=sid).first() if sid.isdigit() else None
            if not student:
                return None, Response({'detail': 'student_id is required and must exist.'}, status=400)
            return stats.student_readiness_report(student), None
        if report_type == 'cohort_outcomes':
            return stats.cohort_outcomes_report(_stat_filters(request)), None
        if report_type == 'employer_demand':
            return stats.employer_demand_report(request.query_params.get('sector')), None
        if report_type == 'skills_gap':
            return stats.skills_gap_report(), None
        return None, Response({'detail': f'Unknown report "{report_type}".'}, status=404)

    def get(self, request, report_type, fmt=None):
        if fmt not in (None, 'csv', 'pdf'):
            return Response({'detail': f'Unknown format "{fmt}".'}, status=404)
        data, error = self.build(request, report_type)
        if error:
            return error
        if fmt is None:
            return Response(data)
        if fmt == 'csv':
            resp = HttpResponse(content_type='text/csv; charset=utf-8')
            resp['Content-Disposition'] = f'attachment; filename="{report_type}.csv"'
            writer = csv.writer(resp)
            writer.writerow([data['title']])
            for name, header, rows in stats.report_table(data):
                writer.writerow([])
                writer.writerow([name])
                writer.writerow(header)
                writer.writerows(rows)
            return resp
        resp = HttpResponse(report_pdf(data).getvalue(), content_type='application/pdf')
        resp['Content-Disposition'] = f'attachment; filename="{report_type}.pdf"'
        return resp
