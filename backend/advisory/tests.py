from datetime import date, timedelta

from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from accounts.models import User
from taxonomy.models import Sector
from uploads.models import JobPosting

from . import scoring
from .models import Assessment, Placement, StudentProfile
from .skills_data import ROLE_BY_NAME

PW = 'Str0ng-pass!23'
fast_hashing = override_settings(PASSWORD_HASHERS=['django.contrib.auth.hashers.MD5PasswordHasher'])


class ScoringTests(SimpleTestCase):
    def test_exact_and_word_boundary_matching(self):
        self.assertTrue(scoring.is_skill_taught('Docker', ['docker']))
        self.assertTrue(scoring.is_skill_taught('Cloud (AWS/Azure)', ['AWS']))

    def test_short_names_never_match_inside_longer_words(self):
        # "R" and "C" are real skill names; they must not match "React" / "Cloud"
        self.assertFalse(scoring.is_skill_taught('Cloud (AWS/Azure)', ['C']))
        self.assertFalse(scoring.is_skill_taught('R', ['React']))
        self.assertFalse(scoring.is_skill_taught('React', ['R']))

    def test_readiness_matches_manual_calculation(self):
        role = ROLE_BY_NAME['Frontend Developer']
        have = ['JavaScript', 'HTML/CSS', 'Git']
        score, matched, missing = scoring.score_role(have, 'Frontend Developer')
        self.assertEqual(set(matched), {'JavaScript', 'HTML/CSS', 'Git'})
        self.assertEqual(len(matched) + len(missing), len(role['skills']))
        self.assertEqual(score, round(3 / len(role['skills']) * 100, 1))

    def test_alternatives_exclude_target_and_are_sorted(self):
        result = scoring.assess(['Python', 'SQL', 'Excel', 'Statistics'], 'Data Analyst')
        roles = [a['role'] for a in result['alternative_roles']]
        scores = [a['score'] for a in result['alternative_roles']]
        self.assertNotIn('Data Analyst', roles)
        self.assertEqual(scores, sorted(scores, reverse=True))
        self.assertLessEqual(len(roles), 3)

    def test_unknown_role_scores_zero(self):
        self.assertEqual(scoring.score_role(['Python'], 'Astronaut'), (0.0, [], []))

    def test_recommendation_points_at_innovation_center_course(self):
        result = scoring.assess(['Python', 'Git'], 'Full-Stack Developer')
        self.assertTrue(any('Innovation Center' in r for r in result['recommendations']))

    def test_skill_extraction_from_posting_text(self):
        found = scoring.extract_skills('We need a React and TypeScript engineer with Docker and PostgreSQL experience')
        self.assertTrue({'React', 'TypeScript', 'Docker'} <= set(found))
        self.assertNotIn('R', found)

    def test_role_for_title_prefers_longest_name(self):
        self.assertEqual(scoring.role_for_title('Senior Full-Stack Developer (Kigali)')['name'], 'Full-Stack Developer')
        self.assertEqual(scoring.role_for_title('Data Engineer')['name'], 'Data Engineer')
        self.assertIsNone(scoring.role_for_title('Chef'))


class AdvisoryBase(APITestCase):
    def setUp(self):
        cache.clear()
        self.advisor = self.make('adv@auca.ac.rw', User.UserRole.CAREER_TRAINING_ADVISOR)
        self.client.force_authenticate(self.advisor)

    def make(self, email, role):
        return User.objects.create_user(username=email, email=email, password=PW, role=role)

    def student(self, first='Jean', last='Mugabo', dept='se', skills=None, **kw):
        return StudentProfile.objects.create(
            first_name=first, last_name=last, department=dept, skills=skills or [], **kw,
        )


@fast_hashing
class AccessTests(AdvisoryBase):
    URLS = [
        '/api/advisory/dashboard/', '/api/advisory/students/', '/api/advisory/assessments/',
        '/api/advisory/pathways/', '/api/advisory/placements/', '/api/advisory/placements/stats/',
        '/api/advisory/jobs/', '/api/advisory/jobs/insights/', '/api/advisory/reports/skills_gap/',
    ]

    def test_other_roles_are_refused(self):
        for role in (User.UserRole.LABOR_MARKET_ANALYST, User.UserRole.EDUCATION_CURRICULUM_PLANNER):
            self.client.force_authenticate(self.make(f'{role}@x.rw', role))
            for url in self.URLS:
                self.assertEqual(self.client.get(url).status_code, 403, (role, url))

    def test_anonymous_is_refused(self):
        self.client.force_authenticate(None)
        for url in self.URLS:
            self.assertEqual(self.client.get(url).status_code, 401, url)

    def test_advisor_and_admin_are_allowed(self):
        for user in (self.advisor, self.make('adm@x.rw', User.UserRole.ADMIN)):
            self.client.force_authenticate(user)
            for url in self.URLS:
                self.assertEqual(self.client.get(url).status_code, 200, (user.role, url))


@fast_hashing
class StudentTests(AdvisoryBase):
    def test_create_cleans_skills_and_sets_advisor(self):
        res = self.client.post('/api/advisory/students/', {
            'first_name': 'Alice', 'last_name': 'Uwase', 'department': 'fin', 'email': 'Alice@AUCA.ac.rw',
            'skills': ['Excel ', 'excel', 'IFRS'], 'target_roles': ['Accountant'], 'gender': 'F',
        }, format='json')
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data['skills'], ['Excel', 'IFRS'])
        self.assertEqual(res.data['email'], 'alice@auca.ac.rw')
        self.assertEqual(StudentProfile.objects.get().advisor, self.advisor)

    def test_duplicate_email_and_unknown_role_rejected(self):
        self.student(email='a@auca.ac.rw')
        base = {'first_name': 'B', 'last_name': 'B', 'department': 'se'}
        dup = self.client.post('/api/advisory/students/', {**base, 'email': 'A@auca.ac.rw'}, format='json')
        self.assertEqual(dup.status_code, 400)
        bad = self.client.post('/api/advisory/students/', {**base, 'target_roles': ['Astronaut']}, format='json')
        self.assertEqual(bad.status_code, 400)

    def test_blank_emails_do_not_clash(self):
        base = {'first_name': 'B', 'last_name': 'B', 'department': 'se'}
        for _ in range(2):
            self.assertEqual(self.client.post('/api/advisory/students/', base, format='json').status_code, 201)

    def test_search_and_filter(self):
        self.student('Jean', 'Mugabo', 'se')
        self.student('Alice', 'Uwase', 'fin')
        self.assertEqual(self.client.get('/api/advisory/students/?search=uwase').data['count'], 1)
        self.assertEqual(self.client.get('/api/advisory/students/?department=se').data['count'], 1)

    def test_detail_includes_latest_assessment(self):
        s = self.student(skills=['Python', 'SQL'])
        self.client.post('/api/advisory/assessments/', {'student_id': s.id, 'target_role': 'Data Analyst'}, format='json')
        detail = self.client.get(f'/api/advisory/students/{s.id}/').data
        self.assertEqual(detail['latest_assessment']['target_role'], 'Data Analyst')
        self.assertEqual(detail['placements'], [])


@fast_hashing
class AssessmentTests(AdvisoryBase):
    def test_assessment_is_scored_by_the_backend_and_stored(self):
        s = self.student(skills=['Python', 'SQL', 'Excel', 'Statistics'])
        res = self.client.post('/api/advisory/assessments/', {'student_id': s.id, 'target_role': 'Data Analyst'}, format='json')
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data['readiness_score'], 50.0)  # 4 of 8 Data Analyst skills
        self.assertEqual(res.data['student'], {'id': s.id, 'name': 'Jean Mugabo', 'department': 'se'})
        self.assertEqual(Assessment.objects.get().assessed_by, self.advisor)

    def test_unknown_role_and_student_rejected(self):
        s = self.student()
        self.assertEqual(
            self.client.post('/api/advisory/assessments/', {'student_id': s.id, 'target_role': 'Astronaut'}, format='json').status_code, 400)
        self.assertEqual(
            self.client.post('/api/advisory/assessments/', {'student_id': 9999, 'target_role': 'Data Analyst'}, format='json').status_code, 400)

    def test_list_filters_by_student(self):
        a, b = self.student('A', 'A'), self.student('B', 'B')
        for s in (a, b):
            self.client.post('/api/advisory/assessments/', {'student_id': s.id, 'target_role': 'Data Analyst'}, format='json')
        self.assertEqual(self.client.get(f'/api/advisory/assessments/?student_id={a.id}').data['count'], 1)


@fast_hashing
class PathwayTests(AdvisoryBase):
    def payload(self, s, **kw):
        return {
            'student_id': s.id, 'target_role': 'Full-Stack Developer',
            'steps': [
                {'skill': 'TypeScript', 'source': 'Innovation Center: Web Development', 'duration_weeks': 2, 'completed': True},
                {'skill': 'Docker', 'source': 'Innovation Center: Cloud Computing', 'duration_weeks': 6, 'completed': False},
            ], **kw,
        }

    def test_progress_and_months_are_derived(self):
        s = self.student()
        res = self.client.post('/api/advisory/pathways/', self.payload(s), format='json')
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data['progress_pct'], 50.0)
        self.assertEqual(res.data['estimated_months'], 2)  # 8 weeks / 4.345 -> 2

    def test_ticking_a_step_updates_progress(self):
        s = self.student()
        pid = self.client.post('/api/advisory/pathways/', self.payload(s), format='json').data['id']
        steps = self.client.get(f'/api/advisory/pathways/{pid}/').data['steps']
        steps[1]['completed'] = True
        res = self.client.patch(f'/api/advisory/pathways/{pid}/', {'steps': steps}, format='json')
        self.assertEqual(res.data['progress_pct'], 100.0)

    def test_bad_steps_rejected(self):
        s = self.student()
        res = self.client.post('/api/advisory/pathways/', {**self.payload(s), 'steps': [{'source': 'x'}]}, format='json')
        self.assertEqual(res.status_code, 400)


@fast_hashing
class PlacementTests(AdvisoryBase):
    def place(self, s, company='Irembo', start='2026-09-01', **kw):
        return self.client.post('/api/advisory/placements/', {
            'student_id': s.id, 'role_title': 'Frontend Developer', 'company': company,
            'start_date': start, 'contract_type': 'full_time', **kw,
        }, format='json')

    def test_recording_a_placement_marks_student_placed(self):
        s = self.student(status='graduated')
        self.assertEqual(self.place(s).status_code, 201)
        s.refresh_from_db()
        self.assertEqual(s.status, 'placed')

    def test_deleting_the_last_placement_reverts_status(self):
        s = self.student(status='graduated')
        pid = self.place(s).data['id']
        self.client.delete(f'/api/advisory/placements/{pid}/')
        s.refresh_from_db()
        self.assertEqual(s.status, 'graduated')

    def test_stats_rates_by_department_and_gender(self):
        se1 = self.student('A', 'A', 'se', status='graduated', gender='F', graduated_on=date(2026, 6, 1))
        self.student('B', 'B', 'se', status='graduated', gender='M')
        fin = self.student('C', 'C', 'fin', status='graduated', gender='F')
        self.student('D', 'D', 'fin', status='active')  # not a graduate: excluded
        self.place(se1, start='2026-06-11')
        self.place(fin, company='Bank of Kigali', start='2026-09-01')
        stats = self.client.get('/api/advisory/placements/stats/').data
        self.assertEqual((stats['total_placed'], stats['total_graduated'], stats['placement_rate']), (2, 3, 66.7))
        dept = {d['department']: d for d in stats['by_department']}
        self.assertEqual((dept['se']['placed'], dept['se']['total'], dept['se']['rate']), (1, 2, 50.0))
        self.assertEqual((dept['fin']['placed'], dept['fin']['total']), (1, 1))
        self.assertEqual(stats['by_gender']['F'], {'placed': 2, 'total': 2})
        self.assertEqual(stats['by_gender']['M'], {'placed': 0, 'total': 1})
        self.assertEqual(stats['female_share_of_placed'], 100.0)
        self.assertEqual(stats['avg_days_to_placement'], 10)  # only the student with a graduation date counts
        self.assertEqual({e['company'] for e in stats['top_employers']}, {'Irembo', 'Bank of Kigali'})
        self.assertEqual(len(stats['by_month']), 12)

    def test_stats_filter_by_graduation_year(self):
        a = self.student('A', 'A', status='graduated', graduation_year=2025)
        self.student('B', 'B', status='graduated', graduation_year=2026)
        self.place(a)
        stats = self.client.get('/api/advisory/placements/stats/?graduation_year=2025').data
        self.assertEqual((stats['total_placed'], stats['total_graduated']), (1, 1))

    def test_stats_with_no_data_is_zero_not_error(self):
        stats = self.client.get('/api/advisory/placements/stats/').data
        self.assertEqual((stats['placement_rate'], stats['avg_days_to_placement']), (0.0, None))

    def csv(self, text):
        return self.client.post(
            '/api/advisory/placements/bulk/', {'file': SimpleUploadedFile('p.csv', text.encode(), 'text/csv')}, format='multipart',
        )

    def test_bulk_upload_creates_good_rows_and_reports_bad_ones(self):
        self.student('A', 'A', status='graduated', email='a@auca.ac.rw')
        res = self.csv(
            'student_email,role_title,company,start_date,contract_type\n'
            'a@auca.ac.rw,Developer,Irembo,2026-09-01,full-time\n'
            'nobody@auca.ac.rw,Developer,Irembo,2026-09-01,full_time\n'
            'a@auca.ac.rw,Developer,Irembo,not-a-date,full_time\n'
            'a@auca.ac.rw,Developer,Irembo,2026-09-01,wizard\n'
        )
        self.assertEqual(res.status_code, 201, res.data)
        self.assertEqual(res.data['created'], 1)
        self.assertEqual(len(res.data['errors']), 3)
        self.assertTrue(res.data['errors'][0].startswith('Row 3'))
        self.assertEqual(Placement.objects.get().contract_type, 'full_time')
        self.assertEqual(StudentProfile.objects.get().status, 'placed')

    def test_bulk_upload_needs_the_required_columns(self):
        self.assertEqual(self.csv('student_email,company\nx,y\n').status_code, 400)
        self.assertEqual(self.client.post('/api/advisory/placements/bulk/', {}, format='multipart').status_code, 400)


@fast_hashing
class DashboardAndJobsTests(AdvisoryBase):
    def setUp(self):
        super().setUp()
        # the sectors are seeded by a taxonomy migration
        self.ict = Sector.objects.get_or_create(slug='ict-technology', defaults={'name': 'ICT & Technology'})[0]
        self.biz = Sector.objects.get_or_create(slug='finance-business', defaults={'name': 'Finance & Business'})[0]
        self.health = Sector.objects.get_or_create(slug='healthcare', defaults={'name': 'Healthcare'})[0]
        today = timezone.localdate()
        self.post('Senior Full-Stack Developer', 'Kigali Tech', self.ict, today - timedelta(days=5),
                  'Requires React, TypeScript, Docker and PostgreSQL. Agile team.')
        self.post('Full-Stack Developer', 'Irembo', self.ict, today - timedelta(days=10), 'React and Node.js')
        self.post('Accountant', 'Bank of Kigali', self.biz, today - timedelta(days=20), 'IFRS and tax compliance')
        self.post('Nurse', 'CHUK', self.health, today - timedelta(days=3), 'Clinical care')
        self.post('Closed Role', 'Old Co', self.ict, today - timedelta(days=100), 'x', closing=today - timedelta(days=30))

    def post(self, title, company, sector, posted, desc, closing=None):
        return JobPosting.objects.create(
            source='t', title=title, company=company, sector=sector, posted_date=posted,
            location_raw='Kigali', description=desc, is_ict=sector.slug == 'ict-technology', closing_date=closing,
        )

    def test_jobs_only_show_tracked_sectors(self):
        res = self.client.get('/api/advisory/jobs/')
        titles = {j['title'] for j in res.data['results']}
        self.assertNotIn('Nurse', titles)
        self.assertEqual(res.data['count'], 4)

    def test_job_filters(self):
        get = lambda q: self.client.get(f'/api/advisory/jobs/?{q}').data['count']
        self.assertEqual(get('sector=finance-business'), 1)
        self.assertEqual(get('sector=ict-technology'), 3)
        self.assertEqual(get('role=Full-Stack Developer'), 2)
        self.assertEqual(get('q=irembo'), 1)
        self.assertEqual(get('days=30'), 3)
        self.assertEqual(get('location=Huye'), 0)

    def test_job_cards_carry_extracted_skills(self):
        card = next(j for j in self.client.get('/api/advisory/jobs/?q=Senior').data['results'])
        self.assertEqual(card['role'], 'Full-Stack Developer')
        self.assertEqual(card['skills_source'], 'posting')
        self.assertTrue({'React', 'TypeScript', 'Docker'} <= set(card['skills']))
        # a posting that names too few skills falls back to the role's catalogue skills
        thin = next(j for j in self.client.get('/api/advisory/jobs/?q=Irembo').data['results'])
        self.assertEqual(thin['skills_source'], 'role')

    def test_job_insights(self):
        data = self.client.get('/api/advisory/jobs/insights/?sector=ict-technology').data
        self.assertEqual(data['total'], 3)
        self.assertEqual(len(data['monthly']), 6)
        self.assertEqual(data['top_companies'][0]['count'], 1)
        fs = next(r for r in data['roles'] if r['role'] == 'Full-Stack Developer')
        self.assertEqual(len(fs['series']), 6)

    def test_dashboard(self):
        low = self.student('Low', 'Score', skills=['Git'])
        self.student('Fresh', 'Face')
        self.client.post('/api/advisory/assessments/', {'student_id': low.id, 'target_role': 'Full-Stack Developer'}, format='json')
        d = self.client.get('/api/advisory/dashboard/').data
        self.assertEqual(d['active_students'], 2)
        self.assertEqual(d['assessed_students'], 1)
        self.assertEqual(d['open_positions'], 3)  # the closed role is excluded, the nurse is out of scope
        self.assertEqual(d['students_by_department']['se'], 2)
        names = [s['name'] for s in d['students_needing_attention']]
        self.assertEqual(names[0], 'Fresh Face')  # never assessed comes first
        self.assertIn('Low Score', names)
        self.assertEqual(d['hot_roles'][0]['role'], 'Full-Stack Developer')
        self.assertIn('React', {s['skill'] for s in d['top_demanded_skills']})

    def test_empty_database_dashboard(self):
        JobPosting.objects.all().delete()
        d = self.client.get('/api/advisory/dashboard/').data
        self.assertEqual((d['active_students'], d['open_positions'], d['average_readiness']), (0, 0, None))
        self.assertEqual(d['hot_roles'], [])


@fast_hashing
class ReportTests(AdvisoryBase):
    def setUp(self):
        super().setUp()
        self.s = self.student(skills=['Python', 'SQL', 'Excel'], target_roles=['Data Analyst'], status='graduated')
        self.client.post('/api/advisory/assessments/', {'student_id': self.s.id, 'target_role': 'Data Analyst'}, format='json')

    def test_student_readiness_report(self):
        res = self.client.get(f'/api/advisory/reports/student_readiness/?student_id={self.s.id}')
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.data['assessments'][0]['target_role'], 'Data Analyst')
        self.assertFalse(res.data['targets_inferred'])

    def test_student_readiness_needs_a_student(self):
        self.assertEqual(self.client.get('/api/advisory/reports/student_readiness/').status_code, 400)

    def test_skills_gap_report_counts_missing_skills(self):
        data = self.client.get('/api/advisory/reports/skills_gap/').data
        self.assertEqual(data['assessed_students'], 1)
        self.assertIn('Statistics', {s['skill'] for s in data['most_missing_skills']})
        self.assertEqual(data['lowest_readiness_roles'][0]['role'], 'Data Analyst')

    def test_every_report_exports_csv_and_pdf(self):
        for rtype in ('student_readiness', 'cohort_outcomes', 'employer_demand', 'skills_gap'):
            q = f'?student_id={self.s.id}'
            csv_res = self.client.get(f'/api/advisory/reports/{rtype}/csv/{q}')
            self.assertEqual(csv_res.status_code, 200, rtype)
            self.assertIn('text/csv', csv_res['Content-Type'])
            pdf_res = self.client.get(f'/api/advisory/reports/{rtype}/pdf/{q}')
            self.assertEqual(pdf_res.status_code, 200, rtype)
            self.assertTrue(pdf_res.content.startswith(b'%PDF'), rtype)

    def test_unknown_report_and_format(self):
        self.assertEqual(self.client.get('/api/advisory/reports/nope/').status_code, 404)
        self.assertEqual(self.client.get('/api/advisory/reports/skills_gap/xml/').status_code, 404)


@fast_hashing
class DemoSeedTests(AdvisoryBase):
    def run_cmd(self, *args):
        from io import StringIO
        from django.core.management import call_command
        out = StringIO()
        call_command('seed_advisory_demo', *args, '--advisor-email', self.advisor.email, stdout=out)
        return out.getvalue()

    def test_seed_creates_data_and_is_repeatable(self):
        self.run_cmd('--students', '30')
        self.assertEqual(StudentProfile.objects.filter(email__endswith='@demo.auca.ac.rw').count(), 30)
        self.assertTrue(Assessment.objects.exists())
        self.assertEqual(set(StudentProfile.objects.values_list('advisor', flat=True)), {self.advisor.pk})
        # a second run without --reset leaves the data alone
        self.assertIn('already exist', self.run_cmd('--students', '30'))
        self.assertEqual(StudentProfile.objects.count(), 30)

    def test_clear_removes_only_demo_students(self):
        real = self.student('Real', 'Person', email='real@auca.ac.rw')
        self.run_cmd('--students', '10')
        self.run_cmd('--clear')
        self.assertEqual(list(StudentProfile.objects.values_list('pk', flat=True)), [real.pk])

    def test_placed_demo_students_are_consistent(self):
        self.run_cmd('--students', '40')
        for p in Placement.objects.select_related('student'):
            self.assertEqual(p.student.status, 'placed')
            self.assertGreaterEqual(p.start_date, p.student.graduated_on)
