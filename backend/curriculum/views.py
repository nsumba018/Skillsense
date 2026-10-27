from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework.parsers import MultiPartParser
from rest_framework import status

from .models import CurriculumBulletin, BulletinCourse
from .serializers import CurriculumBulletinSerializer, BulletinListSerializer
from .parser import parse_uploaded_file


class CurriculumListView(APIView):
    """
    GET  /api/curriculum/          → list active bulletins (no courses, lightweight)
    POST /api/curriculum/upload/   → upload a new bulletin file
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = CurriculumBulletin.objects.filter(is_active=True)
        return Response(BulletinListSerializer(qs, many=True).data)


class CurriculumUploadView(APIView):
    """POST /api/curriculum/upload/ — upload an Excel bulletin."""
    permission_classes = [IsAuthenticated]
    parser_classes = [MultiPartParser]

    def post(self, request):
        file = request.FILES.get('file')
        if not file:
            return Response({'detail': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)

        suffix = file.name.rsplit('.', 1)[-1].lower() if '.' in file.name else ''
        if suffix not in ('xlsx', 'xls'):
            return Response({'detail': 'Only .xlsx or .xls files are supported.'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            parsed = parse_uploaded_file(file)
        except Exception as e:
            return Response({'detail': f'Failed to parse file: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        if not parsed:
            return Response({'detail': 'No departments found in the file.'}, status=status.HTTP_400_BAD_REQUEST)

        created = []
        for dept in parsed:
            # Deactivate previous bulletins for this department
            CurriculumBulletin.objects.filter(
                department_code=dept['department_code'],
                is_active=True,
            ).update(is_active=False)

            bulletin = CurriculumBulletin.objects.create(
                department_code=dept['department_code'],
                department_name=dept['department_name'],
                faculty=dept['faculty'],
                file=file,
                original_filename=file.name,
                total_credits=dept['total_credits'],
                total_semesters=dept['total_semesters'],
                total_courses=len(dept['courses']),
                is_active=True,
                uploaded_by=request.user,
            )
            BulletinCourse.objects.bulk_create([
                BulletinCourse(
                    bulletin=bulletin,
                    semester=c['semester'],
                    name=c['name'],
                    credits=c['credits'],
                    skills=c['skills'],
                )
                for c in dept['courses']
            ])
            created.append(bulletin)

        return Response({
            'detail': f'Parsed {len(created)} department(s) from {file.name}.',
            'bulletins': BulletinListSerializer(created, many=True).data,
        }, status=status.HTTP_201_CREATED)


class CurriculumDetailView(APIView):
    """GET /api/curriculum/<dept_code>/ — full bulletin with courses."""
    permission_classes = [IsAuthenticated]

    def get(self, request, dept_code):
        bulletin = CurriculumBulletin.objects.filter(
            department_code=dept_code, is_active=True
        ).prefetch_related('courses').first()
        if not bulletin:
            return Response({'detail': 'No active bulletin for this department.'}, status=status.HTTP_404_NOT_FOUND)
        return Response(CurriculumBulletinSerializer(bulletin).data)


class CurriculumSkillsView(APIView):
    """
    GET /api/curriculum/skills/
    Returns aggregated skills per department — replaces the hard-coded DEPT_CURRICULA.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        bulletins = CurriculumBulletin.objects.filter(is_active=True).prefetch_related('courses')
        result = {}
        for b in bulletins:
            skills = set()
            for course in b.courses.all():
                skills.update(course.skills)
            result[b.department_code] = {
                'department_name': b.department_name,
                'faculty': b.faculty,
                'skills': sorted(skills),
            }
        return Response(result)


class CurriculumProgramsView(APIView):
    """
    GET /api/curriculum/programs/
    Returns programs grouped by faculty — replaces FACULTY_PROGRAMS.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        bulletins = CurriculumBulletin.objects.filter(is_active=True).order_by('department_name')
        faculties: dict[str, list] = {}
        for b in bulletins:
            faculty_label = dict(CurriculumBulletin.FACULTY_CHOICES).get(b.faculty, b.faculty)
            faculties.setdefault(b.faculty, {
                'faculty_name': faculty_label,
                'programs': [],
            })
            faculties[b.faculty]['programs'].append({
                'code': b.department_code,
                'name': b.department_name,
                'credits': b.total_credits,
                'semesters': b.total_semesters,
                'courses': b.total_courses,
            })
        return Response(faculties)


class CurriculumAllView(APIView):
    """
    GET /api/curriculum/all/
    Returns everything the frontend needs in one call — programs, skills, and course details.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        bulletins = CurriculumBulletin.objects.filter(is_active=True).prefetch_related('courses').order_by('department_name')

        departments = []
        programs_by_faculty: dict[str, list[str]] = {}
        skills_by_dept: dict[str, list[str]] = {}

        for b in bulletins:
            skills = set()
            semesters: dict[int, list] = {}
            for c in b.courses.all():
                skills.update(c.skills)
                semesters.setdefault(c.semester, []).append({
                    'name': c.name,
                    'credits': c.credits,
                    'skills': c.skills,
                })

            departments.append({
                'code': b.department_code,
                'name': b.department_name,
                'faculty': b.faculty,
                'total_credits': b.total_credits,
                'total_semesters': b.total_semesters,
                'total_courses': b.total_courses,
                'skills': sorted(skills),
                'semesters': {str(k): v for k, v in sorted(semesters.items())},
                'uploaded_at': b.created_at.isoformat(),
                'filename': b.original_filename,
            })

            faculty_key = b.faculty
            programs_by_faculty.setdefault(faculty_key, [])
            programs_by_faculty[faculty_key].append(b.department_name)

            skills_by_dept[b.department_code] = sorted(skills)

        return Response({
            'departments': departments,
            'programs_by_faculty': programs_by_faculty,
            'skills_by_dept': skills_by_dept,
            'total_programs': len(departments),
        })
