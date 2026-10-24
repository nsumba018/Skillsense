# Career & Training Advisor — Developer Specification

> **Role code:** `career_training_advisor`  
> **Handoff date:** October 2026  
> **Project:** SkillSense — Rwanda ICT Workforce Intelligence  
> **Stack:** Django REST + PostgreSQL (backend) · React 19 + Vite + TypeScript + Tailwind v4 (frontend)

---

## Table of contents

1. [Role overview](#1-role-overview)
2. [How this role differs from existing roles](#2-how-this-role-differs-from-existing-roles)
3. [Sidebar pages — summary](#3-sidebar-pages--summary)
4. [Backend: new Django app `advisory`](#4-backend-new-django-app-advisory)
5. [Backend: models](#5-backend-models)
6. [Backend: API endpoints](#6-backend-api-endpoints)
7. [Frontend: new page files](#7-frontend-new-page-files)
8. [Frontend: routing & access control](#8-frontend-routing--access-control)
9. [Page 1 — Advisor Dashboard](#9-page-1--advisor-dashboard)
10. [Page 2 — Skill Assessment](#10-page-2--skill-assessment)
11. [Page 3 — Job Market Navigator](#11-page-3--job-market-navigator)
12. [Page 4 — Career Pathways](#12-page-4--career-pathways)
13. [Page 5 — Placement Tracker](#13-page-5--placement-tracker)
14. [Page 6 — Advisor Reports](#14-page-6--advisor-reports)
15. [Reusable components & utilities](#15-reusable-components--utilities)
16. [Implementation order](#16-implementation-order)
17. [Testing checklist](#17-testing-checklist)

---

## 1. Role overview

The Career & Training Advisor works at the **individual student level**. While the education planner shapes *what* AUCA teaches (departments, curricula, cohorts), this role shapes *what happens after* — matching graduates to real jobs, tracking placement outcomes, and proving the advisory program works.

**Primary user:** Career services staff at AUCA, Innovation Center coordinators, training centre advisors.

**Core workflow:**
1. Assess a student's skills against market demand
2. Show them which jobs they qualify for
3. Build a learning pathway to close gaps
4. Track whether they get placed
5. Report outcomes to stakeholders (Mastercard Foundation, university leadership)

---

## 2. How this role differs from existing roles

| Dimension | Labor Market Analyst | Education Planner | **Career Advisor** |
|---|---|---|---|
| Unit of analysis | Sector / economy | Department / curriculum | **Individual student** |
| Primary question | "What's the market doing?" | "What should we teach?" | **"Where can this student work?"** |
| Time horizon | 1–2 years (forecasts) | Next academic year | **Next 3–6 months (placement)** |
| Key metric | Employment index | Curriculum alignment % | **Placement rate %** |
| Data created | None (read-only) | Curriculum uploads | **Student profiles, assessments, placements** |

**Critical distinction:** This role creates and manages its own data (students, assessments, placements). The other roles only consume data from the pipeline.

### Page isolation rule

> **Every role has its own standalone pages. No page is shared between roles except Settings.**

This means:
- The career advisor does **NOT** see the analyst's Forecast, Taxonomy, Reports, or Employability pages
- The career advisor does **NOT** see the education planner's Education or Curriculum pages
- The career advisor sees **only** the 6 pages listed below + Settings
- Existing `Career*.tsx` files (CareerDashboard, CareerEmployability, CareerForecast, CareerReports, CareerTaxonomy) are **clones of the analyst pages** — they must be **removed from the advisor's access** and eventually deleted
- When implementing, **remove** all old shared routes from the career advisor's `ACCESS` map (see section 8)

---

## 3. Sidebar pages — summary

| # | Page | Route | New backend needed? |
|---|------|-------|---------------------|
| 1 | Advisor Dashboard | `/dashboard/advisor` | Reads from new models |
| 2 | Skill Assessment | `/dashboard/advisor/assessment` | `StudentProfile`, `Assessment` models |
| 3 | Job Market Navigator | `/dashboard/advisor/jobs` | Uses existing scraper + sector APIs |
| 4 | Career Pathways | `/dashboard/advisor/pathways` | `SavedPathway` model |
| 5 | Placement Tracker | `/dashboard/advisor/placements` | `Placement` model |
| 6 | Advisor Reports | `/dashboard/advisor/reports` | New report endpoints |

---

## 4. Backend: new Django app `advisory`

Create a new Django app to keep career advisor models separate from existing apps.

```bash
cd backend
python manage.py startapp advisory
```

**Register in `backend/skillsense_backend/settings.py`:**
```python
INSTALLED_APPS = [
    ...
    'advisory',
]
```

**Register URLs in `backend/skillsense_backend/urls.py`:**
```python
path('api/advisory/', include('advisory.urls')),
```

**Files to create:**
```
backend/advisory/
├── __init__.py          (auto-generated)
├── admin.py             (register models)
├── apps.py              (auto-generated)
├── models.py            (see section 5)
├── serializers.py       (see section 6)
├── views.py             (see section 6)
├── urls.py              (see section 6)
├── permissions.py       (IsCareerAdvisorOrAdmin)
└── migrations/
    └── __init__.py
```

**Permission class — `backend/advisory/permissions.py`:**
```python
from rest_framework.permissions import BasePermission

class IsCareerAdvisorOrAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role in (
            'career_training_advisor', 'admin'
        )
```

---

## 5. Backend: models

**File: `backend/advisory/models.py`**

```python
from django.db import models
from core.models import TimestampedModel
from accounts.models import User


class StudentProfile(TimestampedModel):
    """A student/trainee being advised."""

    class Department(models.TextChoices):
        SE = 'se', 'Software Engineering'
        NET = 'net', 'Network & Info Management'
        FIN = 'fin', 'Finance'
        BA = 'ba', 'Business Administration'

    class Status(models.TextChoices):
        ACTIVE = 'active', 'Active'
        GRADUATED = 'graduated', 'Graduated'
        PLACED = 'placed', 'Placed'
        INACTIVE = 'inactive', 'Inactive'

    first_name = models.CharField(max_length=100)
    last_name = models.CharField(max_length=100)
    email = models.EmailField(blank=True, default='')
    department = models.CharField(max_length=10, choices=Department.choices)
    graduation_year = models.IntegerField(null=True, blank=True)
    status = models.CharField(max_length=10, choices=Status.choices, default=Status.ACTIVE)
    skills = models.JSONField(
        default=list,
        help_text='List of skill strings the student currently has, e.g. ["Python", "SQL", "React"]'
    )
    target_roles = models.JSONField(
        default=list,
        help_text='List of role names the student is targeting, e.g. ["Frontend Developer", "Data Analyst"]'
    )
    notes = models.TextField(blank=True, default='')
    advisor = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='advised_students',
        help_text='The advisor managing this student'
    )
    innovation_center_cohort = models.CharField(
        max_length=100, blank=True, default='',
        help_text='e.g. "Cohort 3 — 2026/2027"'
    )
    gender = models.CharField(
        max_length=1,
        choices=[('M', 'Male'), ('F', 'Female')],
        blank=True, default=''
    )

    class Meta:
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.first_name} {self.last_name} ({self.get_department_display()})"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


class Assessment(TimestampedModel):
    """A skill assessment for a student against a target role."""

    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name='assessments'
    )
    target_role = models.CharField(max_length=200)
    readiness_score = models.FloatField(
        help_text='0-100 percentage of required skills the student has'
    )
    matched_skills = models.JSONField(
        default=list,
        help_text='Skills the student has that employers want'
    )
    missing_skills = models.JSONField(
        default=list,
        help_text='Skills employers want that the student lacks'
    )
    recommendations = models.JSONField(
        default=list,
        help_text='AI-generated recommendation strings'
    )
    alternative_roles = models.JSONField(
        default=list,
        help_text='[{"role": "...", "score": 72.5}, ...]'
    )
    assessed_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='assessments_given'
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student.full_name} → {self.target_role} ({self.readiness_score}%)"


class SavedPathway(TimestampedModel):
    """A career pathway saved for a student."""

    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name='pathways'
    )
    target_role = models.CharField(max_length=200)
    steps = models.JSONField(
        default=list,
        help_text='''List of steps: [
            {"skill": "Docker", "source": "Innovation Center — Cloud Computing",
             "duration_weeks": 4, "completed": false},
            ...
        ]'''
    )
    estimated_months = models.IntegerField(
        help_text='Total estimated months to complete the pathway'
    )
    progress_pct = models.FloatField(
        default=0,
        help_text='0-100 completion percentage'
    )
    created_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='pathways_created'
    )

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.student.full_name} → {self.target_role} ({self.progress_pct}%)"


class Placement(TimestampedModel):
    """Records a student's job placement."""

    class ContractType(models.TextChoices):
        FULL_TIME = 'full_time', 'Full-time'
        INTERNSHIP = 'internship', 'Internship'
        FREELANCE = 'freelance', 'Freelance'
        CONTRACT = 'contract', 'Contract'

    student = models.ForeignKey(
        StudentProfile,
        on_delete=models.CASCADE,
        related_name='placements'
    )
    role_title = models.CharField(max_length=200)
    company = models.CharField(max_length=200)
    location = models.CharField(max_length=200, blank=True, default='Kigali')
    start_date = models.DateField()
    contract_type = models.CharField(
        max_length=15,
        choices=ContractType.choices,
        default=ContractType.FULL_TIME
    )
    salary_range = models.CharField(
        max_length=100, blank=True, default='',
        help_text='e.g. "400,000 - 600,000 RWF"'
    )
    placement_method = models.CharField(
        max_length=100, blank=True, default='',
        help_text='e.g. "Referral", "Career fair", "Direct application"'
    )
    recorded_by = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        related_name='placements_recorded'
    )

    class Meta:
        ordering = ['-start_date']

    def __str__(self):
        return f"{self.student.full_name} → {self.role_title} at {self.company}"
```

After writing these models:
```bash
python manage.py makemigrations advisory
python manage.py migrate
```

---

## 6. Backend: API endpoints

**File: `backend/advisory/urls.py`**

```python
from django.urls import path
from . import views

urlpatterns = [
    # Dashboard summary
    path('dashboard/', views.AdvisorDashboardView.as_view(), name='advisor-dashboard'),

    # Student profiles
    path('students/', views.StudentListCreateView.as_view(), name='student-list'),
    path('students/<int:pk>/', views.StudentDetailView.as_view(), name='student-detail'),

    # Assessments
    path('assessments/', views.AssessmentListCreateView.as_view(), name='assessment-list'),
    path('assessments/<int:pk>/', views.AssessmentDetailView.as_view(), name='assessment-detail'),

    # Pathways
    path('pathways/', views.PathwayListCreateView.as_view(), name='pathway-list'),
    path('pathways/<int:pk>/', views.PathwayDetailView.as_view(), name='pathway-detail'),

    # Placements
    path('placements/', views.PlacementListCreateView.as_view(), name='placement-list'),
    path('placements/<int:pk>/', views.PlacementDetailView.as_view(), name='placement-detail'),
    path('placements/stats/', views.PlacementStatsView.as_view(), name='placement-stats'),
    path('placements/bulk/', views.PlacementBulkCreateView.as_view(), name='placement-bulk'),
]
```

### Endpoint reference

All endpoints require authentication and `career_training_advisor` or `admin` role.

#### `GET /api/advisory/dashboard/`
Returns aggregated KPIs for the advisor dashboard.

**Response:**
```json
{
  "active_students": 42,
  "average_readiness": 64.5,
  "placement_rate": 73.2,
  "open_positions": 156,
  "students_by_department": {
    "se": 18, "net": 8, "fin": 9, "ba": 7
  },
  "students_needing_attention": [
    {"id": 1, "name": "Jean Mugabo", "department": "se",
     "readiness": 35.0, "last_assessed": "2026-09-15"}
  ],
  "hot_roles": [
    {"role": "Full-Stack Developer", "postings": 24, "trend": "rising"}
  ],
  "recent_placements": [
    {"student": "Alice Uwase", "role": "Frontend Developer",
     "company": "Kigali Tech", "date": "2026-10-01"}
  ],
  "top_demanded_skills": [
    {"skill": "Python", "count": 89},
    {"skill": "JavaScript", "count": 76}
  ]
}
```

#### `GET /api/advisory/students/`
List all student profiles. Supports `?search=`, `?department=`, `?status=`, `?page=`.

#### `POST /api/advisory/students/`
Create a student profile.

**Request:**
```json
{
  "first_name": "Jean",
  "last_name": "Mugabo",
  "email": "jean@auca.ac.rw",
  "department": "se",
  "graduation_year": 2027,
  "skills": ["Python", "Java", "SQL", "HTML/CSS", "Git"],
  "target_roles": ["Full-Stack Developer", "Backend Developer"],
  "gender": "M",
  "innovation_center_cohort": "Cohort 3 — 2026/2027"
}
```

#### `GET /api/advisory/students/<id>/`
Full student detail including latest assessment and placements.

#### `PATCH /api/advisory/students/<id>/`
Update student profile (e.g. add skills, change status).

#### `POST /api/advisory/assessments/`
Run a skill assessment. The backend scores the student against the target role.

**Request:**
```json
{
  "student_id": 1,
  "target_role": "Full-Stack Developer"
}
```

**Response:**
```json
{
  "id": 5,
  "student": { "id": 1, "name": "Jean Mugabo", "department": "se" },
  "target_role": "Full-Stack Developer",
  "readiness_score": 46.2,
  "matched_skills": ["Python", "Java", "SQL", "HTML/CSS", "Git"],
  "missing_skills": ["TypeScript", "React", "Node.js", "Docker", "MongoDB", "CI/CD", "Responsive Design", "Agile/Scrum"],
  "recommendations": [
    "Focus on TypeScript and React first — they appear in 85% of Full-Stack Developer postings",
    "Enroll in the Innovation Center's Web Development course to cover React, Node.js, and Responsive Design in one go",
    "Your Java/SpringBoot background is a strong foundation — add REST API and Docker skills to become backend-ready while learning the frontend"
  ],
  "alternative_roles": [
    { "role": "Backend Developer", "score": 54.5 },
    { "role": "Database Administrator", "score": 50.0 },
    { "role": "QA / Test Engineer", "score": 42.8 }
  ],
  "created_at": "2026-10-24T14:30:00Z"
}
```

**Scoring logic** (implement in `backend/advisory/scoring.py`):

Use the same `ICT_ROLE_SKILLS` and `BIZ_ROLE_SKILLS` data from the frontend. For each target role:
1. Get the list of employer-demanded skills for that role
2. Match student skills against them using word-boundary matching (same `isSkillTaught` logic)
3. `readiness_score = (matched / total_required) * 100`
4. For alternative roles: score the student against ALL roles, sort by score, return top 3 (excluding the target)
5. Recommendations: template-based using the missing skills and Innovation Center course mappings

#### `GET /api/advisory/placements/stats/`
Aggregated placement statistics.

**Response:**
```json
{
  "total_placed": 38,
  "total_graduated": 52,
  "placement_rate": 73.1,
  "avg_days_to_placement": 47,
  "by_department": [
    { "department": "se", "placed": 15, "total": 18, "rate": 83.3 },
    { "department": "net", "placed": 7, "total": 10, "rate": 70.0 },
    { "department": "fin", "placed": 9, "total": 13, "rate": 69.2 },
    { "department": "ba", "placed": 7, "total": 11, "rate": 63.6 }
  ],
  "by_gender": { "M": { "placed": 12, "total": 16 }, "F": { "placed": 26, "total": 36 } },
  "top_employers": [
    { "company": "Bank of Kigali", "count": 5 },
    { "company": "Irembo", "count": 4 }
  ],
  "by_role": [
    { "role": "Frontend Developer", "count": 8 },
    { "role": "Accountant", "count": 6 }
  ],
  "by_month": [
    { "month": "2026-07", "count": 5 },
    { "month": "2026-08", "count": 8 }
  ]
}
```

#### `POST /api/advisory/placements/`
Record a single placement.

#### `POST /api/advisory/placements/bulk/`
Upload CSV of placements. Expects columns: `student_email`, `role_title`, `company`, `start_date`, `contract_type`.

---

## 7. Frontend: new page files

Create these files in `frontend_pages/src/pages/dashboard/`:

```
AdvisorDashboard.tsx       → Page 1
AdvisorAssessment.tsx      → Page 2
AdvisorJobs.tsx            → Page 3
AdvisorPathways.tsx        → Page 4
AdvisorPlacements.tsx      → Page 5
AdvisorReports.tsx         → Page 6
```

**DO NOT modify the existing `Career*.tsx` files.** Those are the old shared pages. The new pages are completely independent.

### Frontend API layer

**Add to `frontend_pages/src/services/api.ts`:**

```typescript
export const advisoryApi = {
  dashboard: () =>
    request<AdvisorDashboardData>('/api/advisory/dashboard/'),

  // Students
  students: (params?: { search?: string; department?: string; status?: string; page?: number }) =>
    request<Paginated<StudentProfile>>('/api/advisory/students/', { params }),
  createStudent: (data: CreateStudentPayload) =>
    request<StudentProfile>('/api/advisory/students/', { method: 'POST', body: data }),
  student: (id: number) =>
    request<StudentProfileDetail>(`/api/advisory/students/${id}/`),
  updateStudent: (id: number, data: Partial<CreateStudentPayload>) =>
    request<StudentProfile>(`/api/advisory/students/${id}/`, { method: 'PATCH', body: data }),

  // Assessments
  assess: (studentId: number, targetRole: string) =>
    request<AssessmentResult>('/api/advisory/assessments/', {
      method: 'POST', body: { student_id: studentId, target_role: targetRole }
    }),
  assessments: (params?: { student_id?: number; page?: number }) =>
    request<Paginated<AssessmentResult>>('/api/advisory/assessments/', { params }),

  // Pathways
  pathways: (params?: { student_id?: number }) =>
    request<Paginated<SavedPathway>>('/api/advisory/pathways/', { params }),
  createPathway: (data: CreatePathwayPayload) =>
    request<SavedPathway>('/api/advisory/pathways/', { method: 'POST', body: data }),
  updatePathway: (id: number, data: Partial<CreatePathwayPayload>) =>
    request<SavedPathway>(`/api/advisory/pathways/${id}/`, { method: 'PATCH', body: data }),

  // Placements
  placements: (params?: { page?: number }) =>
    request<Paginated<PlacementRecord>>('/api/advisory/placements/', { params }),
  createPlacement: (data: CreatePlacementPayload) =>
    request<PlacementRecord>('/api/advisory/placements/', { method: 'POST', body: data }),
  placementStats: () =>
    request<PlacementStats>('/api/advisory/placements/stats/'),
  bulkPlacements: (form: FormData) =>
    request<{ created: number; errors: string[] }>('/api/advisory/placements/bulk/', {
      method: 'POST', body: form
    }),
}
```

### Frontend types

**Add to `frontend_pages/src/types/api.ts`:**

```typescript
// ── Advisory types ──

export interface StudentProfile {
  id: number
  first_name: string
  last_name: string
  email: string
  department: 'se' | 'net' | 'fin' | 'ba'
  graduation_year: number | null
  status: 'active' | 'graduated' | 'placed' | 'inactive'
  skills: string[]
  target_roles: string[]
  gender: 'M' | 'F' | ''
  innovation_center_cohort: string
  notes: string
  created_at: string
}

export interface StudentProfileDetail extends StudentProfile {
  latest_assessment: AssessmentResult | null
  placements: PlacementRecord[]
  pathways: SavedPathway[]
}

export interface CreateStudentPayload {
  first_name: string
  last_name: string
  email?: string
  department: string
  graduation_year?: number
  skills: string[]
  target_roles: string[]
  gender?: string
  innovation_center_cohort?: string
}

export interface AssessmentResult {
  id: number
  student: { id: number; name: string; department: string }
  target_role: string
  readiness_score: number
  matched_skills: string[]
  missing_skills: string[]
  recommendations: string[]
  alternative_roles: { role: string; score: number }[]
  created_at: string
}

export interface SavedPathway {
  id: number
  student: { id: number; name: string }
  target_role: string
  steps: PathwayStep[]
  estimated_months: number
  progress_pct: number
  created_at: string
}

export interface PathwayStep {
  skill: string
  source: string
  duration_weeks: number
  completed: boolean
}

export interface CreatePathwayPayload {
  student_id: number
  target_role: string
  steps: PathwayStep[]
  estimated_months: number
}

export interface PlacementRecord {
  id: number
  student: { id: number; name: string; department: string }
  role_title: string
  company: string
  location: string
  start_date: string
  contract_type: 'full_time' | 'internship' | 'freelance' | 'contract'
  salary_range: string
  placement_method: string
  created_at: string
}

export interface CreatePlacementPayload {
  student_id: number
  role_title: string
  company: string
  location?: string
  start_date: string
  contract_type: string
  salary_range?: string
  placement_method?: string
}

export interface PlacementStats {
  total_placed: number
  total_graduated: number
  placement_rate: number
  avg_days_to_placement: number
  by_department: { department: string; placed: number; total: number; rate: number }[]
  by_gender: Record<string, { placed: number; total: number }>
  top_employers: { company: string; count: number }[]
  by_role: { role: string; count: number }[]
  by_month: { month: string; count: number }[]
}

export interface AdvisorDashboardData {
  active_students: number
  average_readiness: number
  placement_rate: number
  open_positions: number
  students_by_department: Record<string, number>
  students_needing_attention: {
    id: number; name: string; department: string;
    readiness: number; last_assessed: string
  }[]
  hot_roles: { role: string; postings: number; trend: string }[]
  recent_placements: {
    student: string; role: string; company: string; date: string
  }[]
  top_demanded_skills: { skill: string; count: number }[]
}
```

### Frontend query hooks

**Add to `frontend_pages/src/services/queries.ts`:**

```typescript
export const useAdvisorDashboard = () =>
  useQuery({ queryKey: ['advisor-dashboard'], queryFn: advisoryApi.dashboard })

export const useStudents = (params?: { search?: string; department?: string; status?: string }) =>
  useQuery({ queryKey: ['students', params], queryFn: () => advisoryApi.students(params) })

export const useStudent = (id: number | null) =>
  useQuery({ queryKey: ['student', id], queryFn: () => advisoryApi.student(id!), enabled: id !== null })

export const useAssessments = (studentId?: number) =>
  useQuery({ queryKey: ['assessments', studentId], queryFn: () => advisoryApi.assessments({ student_id: studentId }) })

export const usePathways = (studentId?: number) =>
  useQuery({ queryKey: ['pathways', studentId], queryFn: () => advisoryApi.pathways({ student_id: studentId }) })

export const usePlacements = () =>
  useQuery({ queryKey: ['placements'], queryFn: () => advisoryApi.placements() })

export const usePlacementStats = () =>
  useQuery({ queryKey: ['placement-stats'], queryFn: advisoryApi.placementStats })
```

---

## 8. Frontend: routing & access control

### Routes — add to `frontend_pages/src/main.tsx`

```tsx
import AdvisorDashboard from './pages/dashboard/AdvisorDashboard'
import AdvisorAssessment from './pages/dashboard/AdvisorAssessment'
import AdvisorJobs from './pages/dashboard/AdvisorJobs'
import AdvisorPathways from './pages/dashboard/AdvisorPathways'
import AdvisorPlacements from './pages/dashboard/AdvisorPlacements'
import AdvisorReports from './pages/dashboard/AdvisorReports'

// Add inside <Routes>:
<Route path="/dashboard/advisor" element={guard('/dashboard/advisor', <AdvisorDashboard />)} />
<Route path="/dashboard/advisor/assessment" element={guard('/dashboard/advisor/assessment', <AdvisorAssessment />)} />
<Route path="/dashboard/advisor/jobs" element={guard('/dashboard/advisor/jobs', <AdvisorJobs />)} />
<Route path="/dashboard/advisor/pathways" element={guard('/dashboard/advisor/pathways', <AdvisorPathways />)} />
<Route path="/dashboard/advisor/placements" element={guard('/dashboard/advisor/placements', <AdvisorPlacements />)} />
<Route path="/dashboard/advisor/reports" element={guard('/dashboard/advisor/reports', <AdvisorReports />)} />
```

### Access control — update `frontend_pages/src/auth/access.ts`

**STEP 1 — REMOVE `career_training_advisor` from ALL old shared routes:**

The career advisor currently appears in these shared routes. Remove `'career_training_advisor'` from each:
```typescript
// REMOVE 'career_training_advisor' from these existing entries:
'/dashboard':              // keep admin, labor_market_analyst, education_curriculum_planner
'/dashboard/forecast':     // keep admin, labor_market_analyst, education_curriculum_planner
'/dashboard/taxonomy':     // keep admin, labor_market_analyst, education_curriculum_planner
'/dashboard/reports':      // keep admin, labor_market_analyst, education_curriculum_planner
'/dashboard/employability':// keep admin, labor_market_analyst, education_curriculum_planner
'/dashboard/career':       // remove entirely or keep only for admin
```

**STEP 2 — ADD the new advisor-only routes:**
```typescript
'/dashboard/advisor': ['admin', 'career_training_advisor'],
'/dashboard/advisor/assessment': ['admin', 'career_training_advisor'],
'/dashboard/advisor/jobs': ['admin', 'career_training_advisor'],
'/dashboard/advisor/pathways': ['admin', 'career_training_advisor'],
'/dashboard/advisor/placements': ['admin', 'career_training_advisor'],
'/dashboard/advisor/reports': ['admin', 'career_training_advisor'],
```

**STEP 3 — Keep only Settings as shared:**
```typescript
'/dashboard/settings': ['admin', 'labor_market_analyst', 'education_curriculum_planner', 'career_training_advisor'],
```

### Sidebar — update `frontend_pages/src/pages/dashboard/DashboardLayout.tsx`

Add new nav items (import `UserCheck`, `Target`, `BriefcaseBusiness`, `Route`, `BarChart4`, `ClipboardList` from lucide-react):

```typescript
{ label: 'Advisor Dashboard', icon: UserCheck, to: '/dashboard/advisor' },
{ label: 'Skill Assessment', icon: Target, to: '/dashboard/advisor/assessment' },
{ label: 'Job Navigator', icon: BriefcaseBusiness, to: '/dashboard/advisor/jobs' },
{ label: 'Career Pathways', icon: Route, to: '/dashboard/advisor/pathways' },
{ label: 'Placement Tracker', icon: BarChart4, to: '/dashboard/advisor/placements' },
{ label: 'Advisor Reports', icon: ClipboardList, to: '/dashboard/advisor/reports' },
```

### Update `ROLE_FOCUS` in `access.ts`

```typescript
career_training_advisor: {
  tagline: 'Assess student readiness, match them to jobs, and track placement outcomes.',
  links: [
    { to: '/dashboard/advisor', label: 'Advisor dashboard' },
    { to: '/dashboard/advisor/assessment', label: 'Assess a student' },
    { to: '/dashboard/advisor/jobs', label: 'Browse job market' },
    { to: '/dashboard/advisor/placements', label: 'Track placements' },
  ],
},
```

---

## 9. Page 1 — Advisor Dashboard

**File:** `AdvisorDashboard.tsx`  
**Route:** `/dashboard/advisor`  
**Data:** `GET /api/advisory/dashboard/`

### Layout

```
┌─────────────────────────────────────────────────────┐
│ Header: "Career Advisory Dashboard"                  │
├─────────┬──────────┬──────────┬──────────────────────┤
│ Active  │ Avg      │ Placement│ Open                 │
│ Students│ Readiness│ Rate     │ Positions            │
│ 42      │ 64.5%    │ 73.2%   │ 156                  │
├─────────┴──────────┴──────────┴──────────────────────┤
│ Students needing attention (table, sorted by lowest  │
│ readiness — name, dept, readiness %, last assessed)  │
├──────────────────────┬───────────────────────────────┤
│ Hot roles this month │ Recent placements             │
│ (role + trend arrow) │ (name → role at company)      │
├──────────────────────┴───────────────────────────────┤
│ Skill demand heatmap (top 15 skills, colour by freq) │
└─────────────────────────────────────────────────────┘
```

### Components to reuse
- `DashboardLayout`, `Card` from `./DashboardLayout`
- `QueryGate` from `../../components/ui/State`
- KPI cards: same pattern as `LaborDashboard.tsx` and `EducationDashboard.tsx`

---

## 10. Page 2 — Skill Assessment

**File:** `AdvisorAssessment.tsx`  
**Route:** `/dashboard/advisor/assessment`  
**Data:** `POST /api/advisory/assessments/` + client-side scoring as fallback

### Layout

```
┌─────────────────────────────────────────────────────┐
│ Header: "Skill Assessment"                           │
├─────────────────────────────────────────────────────┤
│ Student selector (search/dropdown) or Quick Profile  │
│ form (name, department, skills checkboxes)            │
├─────────────────────────────────────────────────────┤
│ Target role selector (1-3 roles from taxonomy)       │
├─────────────────────────────────────────────────────┤
│ [Assess] button                                      │
├─────────────────────────────────────────────────────┤
│ ── Results (after assessment) ──                     │
│ Readiness score card (big %, bar, department)        │
├──────────────────────┬───────────────────────────────┤
│ Matched skills       │ Missing skills                │
│ (green pills)        │ (red pills)                   │
├──────────────────────┴───────────────────────────────┤
│ AI Recommendations card (amber, 2-3 bullets)         │
├─────────────────────────────────────────────────────┤
│ Alternative roles table (role, match %, department)  │
└─────────────────────────────────────────────────────┘
```

### Skill data to reuse

Copy `ICT_ROLE_SKILLS`, `BIZ_ROLE_SKILLS`, `DEPT_CURRICULA`, and `isSkillTaught()` from `EducationEmployability.tsx`. These contain the role-to-skills mappings needed for scoring.

### Client-side fallback

If the backend assessment endpoint isn't built yet, the page can score entirely client-side:

```typescript
function assessStudent(studentSkills: string[], targetRole: string): AssessmentResult {
  const roleData = ICT_ROLE_SKILLS[targetRole] ?? BIZ_ROLE_SKILLS[targetRole]
  if (!roleData) return { readiness_score: 0, matched_skills: [], missing_skills: [], ... }

  const required = roleData.skills
  const matched = required.filter(s => studentSkills.some(ss => isSkillTaught(ss, new Set([s]))))
  const missing = required.filter(s => !matched.includes(s))
  const score = (matched.length / required.length) * 100

  return { readiness_score: Math.round(score), matched_skills: matched, missing_skills: missing, ... }
}
```

---

## 11. Page 3 — Job Market Navigator

**File:** `AdvisorJobs.tsx`  
**Route:** `/dashboard/advisor/jobs`  
**Data:** Existing APIs — `useSectorPositions()`, `useSectorList()`, `useForecasts()`

### Layout

```
┌─────────────────────────────────────────────────────┐
│ Header: "Job Market Navigator"                       │
├─────────────────────────────────────────────────────┤
│ Filters: [Sector ▾] [Role ▾] [Location ▾]          │
│          [Link student ▾] [Last 30/90/All ▾]        │
├─────────────────────────────────────────────────────┤
│ Job posting cards (grid)                             │
│ ┌──────────────────┐  ┌──────────────────┐          │
│ │ Frontend Dev      │  │ Financial Analyst │          │
│ │ Kigali Tech       │  │ Bank of Kigali    │          │
│ │ Kigali · 3d ago   │  │ Kigali · 1w ago   │          │
│ │ Skills: React ✓   │  │ Skills: IFRS ✓    │          │
│ │ TypeScript ✓      │  │ Excel ✗           │          │
│ │ Match: 7/10       │  │ Match: 5/8        │          │
│ └──────────────────┘  └──────────────────┘          │
├─────────────────────────────────────────────────────┤
│ Company hiring patterns (top employers bar chart)    │
├─────────────────────────────────────────────────────┤
│ Demand trend sparklines per role                     │
└─────────────────────────────────────────────────────┘
```

### Existing APIs to use

- `useSectorPositions(sectorSlug)` — returns job postings grouped by role with companies and locations
- `useSectorList()` — filtered to AUCA's two sectors
- `useForecasts()` — for demand trend data
- When a student is linked: score each posting's required skills against the student's profile

### No new backend needed

This page composes entirely from existing scraper data + client-side matching.

---

## 12. Page 4 — Career Pathways

**File:** `AdvisorPathways.tsx`  
**Route:** `/dashboard/advisor/pathways`  
**Data:** `POST /api/advisory/pathways/` + client-side pathway generation

### Layout

```
┌─────────────────────────────────────────────────────┐
│ Header: "Career Pathways"                            │
├──────────────────────┬───────────────────────────────┤
│ Student selector     │ Target role selector           │
├──────────────────────┴───────────────────────────────┤
│ [Generate Pathway] button                            │
├─────────────────────────────────────────────────────┤
│ ── Generated Pathway ──                              │
│ Timeline visualization (vertical)                    │
│                                                      │
│  ● TypeScript ─── Innovation Center: Web Dev (4 wk)  │
│  │                                                   │
│  ● React ──────── Innovation Center: Web Dev (4 wk)  │
│  │                                                   │
│  ● Docker ─────── Innovation Center: DevOps (3 wk)   │
│  │                                                   │
│  ● Testing ────── Self-study: Jest docs (2 wk)       │
│  │                                                   │
│  ◎ Target: Full-Stack Developer (est. 4 months)      │
├─────────────────────────────────────────────────────┤
│ Role progression map                                 │
│ Junior Dev → Developer → Senior Dev → Tech Lead      │
├─────────────────────────────────────────────────────┤
│ Saved pathways list (student, role, progress %)      │
└─────────────────────────────────────────────────────┘
```

### Pathway generation logic (client-side)

```typescript
const INNOVATION_COURSES: Record<string, { skills: string[]; duration_weeks: number }> = {
  'Cloud Computing': { skills: ['AWS/Azure/GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD'], duration_weeks: 8 },
  'Web Development': { skills: ['TypeScript', 'Node.js', 'React', 'Responsive Design', 'Testing (Jest)'], duration_weeks: 8 },
  'Cybersecurity': { skills: ['SIEM', 'Firewall Management', 'Incident Response', 'Ethical Hacking'], duration_weeks: 6 },
  // ... same catalog as Education.tsx
}

function generatePathway(studentSkills: string[], targetRole: string): PathwayStep[] {
  const roleData = ICT_ROLE_SKILLS[targetRole] ?? BIZ_ROLE_SKILLS[targetRole]
  const missing = roleData.skills.filter(s => !studentSkills.includes(s))

  return missing.map(skill => {
    // Find which Innovation Center course covers this skill
    const course = Object.entries(INNOVATION_COURSES).find(([_, c]) =>
      c.skills.some(cs => isSkillTaught(cs, new Set([skill])))
    )
    return {
      skill,
      source: course ? `Innovation Center — ${course[0]}` : 'Self-study / Online certification',
      duration_weeks: course ? Math.ceil(course[1].duration_weeks / course[1].skills.length) : 3,
      completed: false,
    }
  })
}
```

---

## 13. Page 5 — Placement Tracker

**File:** `AdvisorPlacements.tsx`  
**Route:** `/dashboard/advisor/placements`  
**Data:** `GET /api/advisory/placements/`, `GET /api/advisory/placements/stats/`

### Layout

```
┌─────────────────────────────────────────────────────┐
│ Header: "Placement Tracker"                          │
├─────────┬──────────┬──────────┬──────────────────────┤
│ Placed  │ Placement│ Avg days │ This month           │
│ 38      │ Rate 73% │ to place │ 5 placements         │
│         │          │ 47 days  │                      │
├─────────┴──────────┴──────────┴──────────────────────┤
│ [Record a placement] form (collapsible)              │
│ Student, role, company, date, contract type, method  │
├─────────────────────────────────────────────────────┤
│ Placement rate over time (line chart, by month)      │
├──────────────────────┬───────────────────────────────┤
│ By department        │ By gender                     │
│ (bar chart: SE 83%   │ (donut: F 72%, M 75%)        │
│  Net 70%, Fin 69%,  │                               │
│  BA 64%)             │                               │
├──────────────────────┴───────────────────────────────┤
│ Top employers list   │ Placements by role             │
├──────────────────────┴───────────────────────────────┤
│ All placements table (searchable, sortable)          │
│ Student | Role | Company | Date | Contract | Method  │
└─────────────────────────────────────────────────────┘
```

### Charts to reuse
- `Donut` component from `./charts.tsx` (already used in `CareerDashboard.tsx`)
- `Sparkline` component for monthly trends
- New: simple bar chart for department comparison (or reuse the progress bars pattern from `EducationEmployability.tsx`)

### CSV bulk upload

Add a "Bulk import" button that accepts a CSV file and calls `POST /api/advisory/placements/bulk/`. Same pattern as the data upload page (`DataUpload.tsx`).

---

## 14. Page 6 — Advisor Reports

**File:** `AdvisorReports.tsx`  
**Route:** `/dashboard/advisor/reports`  
**Data:** Combines advisory API data + existing report infrastructure

### Report templates

| Template | Data source | Export |
|---|---|---|
| Student Readiness | `GET /api/advisory/students/<id>/` + assessment | PDF |
| Cohort Outcomes | `GET /api/advisory/placements/stats/` | PDF, CSV |
| Employer Demand Brief | `useForecasts()` + `useSectorPositions()` | PDF |
| Skills Gap Summary | `GET /api/advisory/assessments/` aggregated | PDF, CSV |

### Layout — same pattern as `EducationReports.tsx`

Report template selector (4 cards) → configuration controls → Generate button → rendered report with export buttons.

---

## 15. Reusable components & utilities

### From existing codebase (import directly):

| Component | File | Used in |
|---|---|---|
| `DashboardLayout`, `Card` | `DashboardLayout.tsx` | All 6 pages |
| `QueryGate`, `EmptyState`, `ErrorState` | `components/ui/State.tsx` | All pages |
| `ProfileRadar` | `charts.tsx` | Assessment page |
| `Donut`, `Sparkline` | `charts.tsx` | Dashboard, Placements |
| `RoleForecastChart` | `charts.tsx` | Pathways |
| `fmtDate`, `fmtInt`, `fmtPct`, `fmtNum` | `lib/format.ts` | All pages |
| `TREND_LABEL`, `TREND_TONE` | `lib/derive.ts` | Dashboard, Jobs |

### Skill data to copy (from `EducationEmployability.tsx`):

- `ICT_ROLE_SKILLS` — 21 ICT roles with required skills and department mapping
- `BIZ_ROLE_SKILLS` — 19 business roles with required skills and department mapping
- `DEPT_CURRICULA` — 4 department skill sets (SE, Network, Finance, BA)
- `isSkillTaught()` — word-boundary matching function
- `INNOVATION_COURSES` — course catalog with skill mappings (from `Education.tsx`)

**Recommendation:** Extract these into a shared file `frontend_pages/src/data/auca-skills.ts` so both the education planner and career advisor pages import from the same source.

---

## 16. Implementation order

Build in this order — each phase is independently deployable:

### Phase 1: Backend foundation (1–2 days)
1. Create `advisory` Django app
2. Write models (`StudentProfile`, `Assessment`, `SavedPathway`, `Placement`)
3. Run migrations
4. Write serializers and basic CRUD views
5. Write `scoring.py` with the assessment logic
6. Register admin, write URL routes
7. Test with Django shell / API browser

### Phase 2: Page isolation + routing (half day)
8. **Remove `career_training_advisor` from ALL old shared routes** in `access.ts` (critical — do this FIRST)
9. Add the 6 new `/dashboard/advisor/*` routes to `access.ts`
10. Add the 6 new routes to `main.tsx`
11. Add the 6 new sidebar items to `DashboardLayout.tsx`
12. Update `ROLE_FOCUS` in `access.ts`
13. Verify: career advisor login shows ONLY the 6 new sidebar items + Settings

### Phase 3: Frontend — Assessment page (1–2 days)
14. Add TypeScript types to `types/api.ts`
15. Add API functions to `services/api.ts`
16. Add query hooks to `services/queries.ts`
17. Build `AdvisorAssessment.tsx` with client-side fallback scoring
18. Test: create a student, run an assessment, verify scores

### Phase 4: Frontend — Dashboard + Jobs (1–2 days)
19. Build `AdvisorDashboard.tsx`
20. Build `AdvisorJobs.tsx` (uses existing scraper APIs)
21. Wire up the dashboard API endpoint

### Phase 5: Frontend — Pathways + Placements (1–2 days)
22. Build `AdvisorPathways.tsx` with client-side pathway generation
23. Build `AdvisorPlacements.tsx` with the recording form + stats
24. Wire up placement stats endpoint

### Phase 6: Reports + cleanup (1 day)
25. Build `AdvisorReports.tsx`
26. Extract shared skill data to `data/auca-skills.ts`
27. Delete the old `Career*.tsx` files (CareerDashboard, CareerEmployability, CareerForecast, CareerReports, CareerTaxonomy) — they are unused clones
28. Remove old Career imports and routes from `main.tsx`

**Total estimate: 6–9 working days for one developer.**

---

## 17. Testing checklist

- [ ] **PAGE ISOLATION: Career advisor sees ONLY the 6 advisor pages + Settings in sidebar**
- [ ] **PAGE ISOLATION: Career advisor CANNOT access `/dashboard/forecast`, `/dashboard/taxonomy`, `/dashboard/reports`, `/dashboard/employability`**
- [ ] **PAGE ISOLATION: Analyst and planner CANNOT access `/dashboard/advisor/*` routes**
- [ ] Can create a student profile with skills
- [ ] Can run assessment — readiness score matches manual calculation
- [ ] Assessment shows correct matched/missing skills (no false matches like "C" matching "Cloud")
- [ ] Alternative roles are sorted by score and exclude the target role
- [ ] Job navigator shows only ICT & Business sector postings
- [ ] Linking a student to job navigator shows match scores per posting
- [ ] Career pathway generates correct steps from missing skills
- [ ] Innovation Center courses are mapped correctly in pathways
- [ ] Can record a placement — student status changes to "placed"
- [ ] Placement stats calculate correct rates per department and gender
- [ ] CSV bulk upload creates placements without errors
- [ ] All 4 report templates generate and export correctly
- [ ] Admin can also access all advisor pages
- [ ] Other roles (analyst, planner) cannot access advisor pages
- [ ] All pages are responsive at phone width
- [ ] Type check passes: `npx tsc --noEmit`
- [ ] Build succeeds: `npx vite build`
