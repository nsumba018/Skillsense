"""Behaviour added to follow the developer spec and the role artifact more closely."""
from datetime import timedelta

from django.core.cache import cache
from django.utils import timezone
from rest_framework.test import APITestCase

from accounts.models import User
from taxonomy.models import Sector
from uploads.models import JobPosting

from . import stats
from .models import SavedPathway, StudentProfile
from .tests import PW, fast_hashing


@fast_hashing
class SpecGapTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.advisor = User.objects.create_user(
            username='adv@auca.ac.rw', email='adv@auca.ac.rw', password=PW, role=User.UserRole.CAREER_TRAINING_ADVISOR)
        self.client.force_authenticate(self.advisor)
        self.ict = Sector.objects.get_or_create(slug='ict-technology', defaults={'name': 'ICT & Technology'})[0]

    def student(self, first='Jean', last='Mugabo', dept='se', skills=None, **kw):
        return StudentProfile.objects.create(first_name=first, last_name=last, department=dept, skills=skills or [], **kw)

    def posting(self, title, text, location='Kigali'):
        return JobPosting.objects.create(
            source='t', title=title, company='Co', sector=self.ict, posted_date=timezone.localdate(),
            location_raw=location, raw_text=text, is_ict=True,
        )

    def assess(self, student, role):
        return self.client.post('/api/advisory/assessments/', {'student_id': student.id, 'target_role': role}, format='json')

    # -- priority skills: ranked by demand and how quickly they can be learned
    def test_priority_skills_rank_by_demand_per_week_of_study(self):
        for _ in range(5):
            self.posting('Software Developer', 'We need Docker')
        self.posting('Software Developer', 'Knowledge of Excel helps')
        ranked = stats.priority_skills(['Excel', 'Docker', 'Git'])
        self.assertEqual(ranked[0]['skill'], 'Docker')
        self.assertEqual(ranked[0]['postings'], 5)
        self.assertTrue(all({'skill', 'postings', 'weeks', 'source'} <= set(r) for r in ranked))
        self.assertEqual(len(stats.priority_skills(['Excel', 'Docker', 'Git'], limit=2)), 2)

    def test_assessment_response_carries_priority_skills(self):
        res = self.assess(self.student(skills=['Python']), 'Full-Stack Developer')
        self.assertIn('priority_skills', res.data)
        self.assertLessEqual(len(res.data['priority_skills']), 5)
        self.assertEqual({p['skill'] for p in res.data['priority_skills']} - set(res.data['missing_skills']), set())

    def test_recommendation_names_the_same_gaps_the_priority_list_puts_first(self):
        for _ in range(4):
            self.posting('Backend Developer', 'We use Docker every day')   # Docker is in demand, Node.js is not
        res = self.assess(self.student(skills=['Python']), 'Full-Stack Developer')
        first = res.data['recommendations'][0]
        top_two = [p['skill'] for p in res.data['priority_skills'][:2]]
        for skill in top_two:
            self.assertIn(skill, first)
        self.assertIn('Docker', top_two)

    # -- job navigator: fit to a student, and location choices
    def test_jobs_can_be_limited_to_postings_the_student_can_partly_do(self):
        self.posting('Backend Developer', 'Python Docker PostgreSQL REST APIs Git')
        self.posting('Accountant', 'IFRS reporting and tax compliance')
        s = self.student(skills=['Python', 'Git'])
        self.assertEqual(self.client.get(f'/api/advisory/jobs/?student_id={s.id}').data['count'], 2)
        fits = self.client.get(f'/api/advisory/jobs/?student_id={s.id}&only_matches=1').data
        self.assertEqual([j['title'] for j in fits['results']], ['Backend Developer'])
        self.assertGreaterEqual(fits['results'][0]['matched'], 2)

    def test_jobs_can_be_sorted_best_match_first(self):
        self.posting('Data Analyst', 'Excel and Statistics')
        self.posting('Backend Developer', 'Python Docker Git SQL REST APIs')
        s = self.student(skills=['Python', 'Docker', 'Git', 'SQL'])
        titles = [j['title'] for j in self.client.get(f'/api/advisory/jobs/?student_id={s.id}&sort=match').data['results']]
        self.assertEqual(titles[0], 'Backend Developer')

    def test_location_filter_understands_kigali_remote_and_other_provinces(self):
        for title, where in (('A', 'Kigali (capital) Full Time'), ('B', 'Full Remote'), ('C', 'Musanze'), ('D', 'Rusizi')):
            self.posting(title, 'x', where)
        get = lambda q: sorted(j['title'] for j in self.client.get(f'/api/advisory/jobs/?location={q}').data['results'])
        self.assertEqual(get('kigali'), ['A'])
        self.assertEqual(get('remote'), ['B'])
        self.assertEqual(get('other'), ['C', 'D'])

    # -- dashboard: say why a student needs attention
    def test_dashboard_names_the_reason_and_flags_stalled_pathways(self):
        self.student('Never', 'Assessed')
        low = self.student('Low', 'Ready', skills=['Git'])
        self.assess(low, 'Full-Stack Developer')
        quiet = self.student('Quiet', 'Pathway', skills=['Python', 'SQL', 'Excel', 'Statistics', 'R', 'Power BI/Tableau', 'Data Visualization'])
        self.assess(quiet, 'Data Analyst')
        pw = SavedPathway.objects.create(
            student=quiet, target_role='Data Analyst', estimated_months=1, progress_pct=50,
            steps=[{'skill': 'ETL Processes', 'source': 'x', 'duration_weeks': 2, 'completed': False}])
        SavedPathway.objects.filter(pk=pw.pk).update(updated_at=timezone.now() - timedelta(days=45))
        rows = {r['name']: r['reasons'] for r in self.client.get('/api/advisory/dashboard/').data['students_needing_attention']}
        self.assertEqual(rows['Never Assessed'], ['Not assessed yet'])
        self.assertTrue(rows['Low Ready'][0].startswith('Readiness '))
        self.assertTrue(any('stalled' in r for r in rows['Quiet Pathway']))

    def test_a_recent_pathway_is_not_stalled(self):
        s = self.student(skills=['Python'])
        self.assess(s, 'Data Analyst')
        SavedPathway.objects.create(
            student=s, target_role='Data Analyst', estimated_months=1, progress_pct=20,
            steps=[{'skill': 'SQL', 'source': 'x', 'duration_weeks': 2, 'completed': False}])
        rows = {r['name']: r['reasons'] for r in self.client.get('/api/advisory/dashboard/').data['students_needing_attention']}
        self.assertFalse(any('stalled' in r for r in rows.get(s.full_name, [])))

    # -- placements: rate over time, and days to placement per department
    def test_placement_rate_series_rises_as_graduates_are_placed(self):
        today = timezone.localdate()
        a = self.student('A', 'A', 'se', status='graduated', graduated_on=today - timedelta(days=200))
        self.student('B', 'B', 'se', status='graduated', graduated_on=today - timedelta(days=200))
        self.client.post('/api/advisory/placements/', {
            'student_id': a.id, 'role_title': 'Dev', 'company': 'X',
            'start_date': (today - timedelta(days=100)).isoformat(), 'contract_type': 'full_time'}, format='json')
        series = self.client.get('/api/advisory/placements/stats/').data['rate_series']
        self.assertEqual(len(series), 12)
        self.assertEqual((series[-1]['graduates'], series[-1]['placed'], series[-1]['rate']), (2, 1, 50.0))
        self.assertEqual(series[0]['placed'], 0)
        rates = [x['rate'] for x in series]
        self.assertEqual(rates, sorted(rates))

    def test_days_to_placement_is_broken_down_by_department(self):
        today = timezone.localdate()
        se = self.student('S', 'E', 'se', status='graduated', graduated_on=today - timedelta(days=60))
        fin = self.student('F', 'N', 'fin', status='graduated', graduated_on=today - timedelta(days=60))
        for st, days in ((se, 20), (fin, 40)):
            self.client.post('/api/advisory/placements/', {
                'student_id': st.id, 'role_title': 'R', 'company': 'C',
                'start_date': (today - timedelta(days=60 - days)).isoformat(), 'contract_type': 'full_time'}, format='json')
        dept = {d['department']: d['avg_days'] for d in self.client.get('/api/advisory/placements/stats/').data['by_department']}
        self.assertEqual((dept['se'], dept['fin'], dept['ba']), (20, 40, None))

    # -- spec names and PDF branding
    def test_spec_named_permission_class_is_used_by_the_views(self):
        from .permissions import IsCareerAdvisorOrAdmin
        from .views import AdvisorDashboardView
        self.assertIn(IsCareerAdvisorOrAdmin, AdvisorDashboardView.permission_classes)

    def test_logos_are_packaged_for_the_pdf_header(self):
        from .pdf import ASSETS
        self.assertTrue((ASSETS / 'auca.png').exists() and (ASSETS / 'skillsense.png').exists())
