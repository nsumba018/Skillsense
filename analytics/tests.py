from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import SimpleTestCase, override_settings
from rest_framework.test import APITestCase

from accounts.models import Institution, User
from predictions.models import ForecastRun, RoleForecast
from taxonomy.models import NormalizedRole, RoleFamily, RoleGroup
from uploads.models import JobPosting
from . import skills
from .geo import locate
from .models import Curriculum, GeographicDemand
from .services import analyze_curriculum, rebuild_geographic_demand

PW = 'Str0ng-pass!23'
fast_hashing = override_settings(PASSWORD_HASHERS=['django.contrib.auth.hashers.MD5PasswordHasher'])


class LocateTests(SimpleTestCase):
    def test_districts_and_provinces(self):
        self.assertEqual(locate('Rusizi'), ('Western', 'Rusizi'))
        self.assertEqual(locate('nyagatare'), ('Eastern', 'Nyagatare'))
        self.assertEqual(locate('Gisagara'), ('Southern', 'Gisagara'))

    def test_kigali_has_no_district(self):
        self.assertEqual(locate('Kigali'), ('Kigali City', None))
        self.assertEqual(locate('KIGALI'), ('Kigali City', None))

    def test_comma_separated_and_aliases(self):
        self.assertEqual(locate('Butaro'), ('Northern', 'Burera'))
        self.assertEqual(locate('Kimironko, Kigali'), ('Kigali City', 'Gasabo'))
        self.assertEqual(locate('Kigali, Rwanda'), ('Kigali City', None))

    def test_non_places_return_none(self):
        for text in ('Rwanda', 'Full Remote', '', None, 'Nairobi'):
            self.assertIsNone(locate(text), text)


class SkillExtractionTests(SimpleTestCase):
    def test_finds_skills_case_insensitively(self):
        found = skills.extract_skills('Introduction to PYTHON programming and SQL databases')
        self.assertTrue({'Python', 'Programming fundamentals', 'Databases & SQL'} <= found)

    def test_word_boundaries(self):
        self.assertNotIn('Machine learning', skills.extract_skills('Ethics in Public Administration'))
        self.assertNotIn('Cloud computing', skills.extract_skills('Cloudy weather studies'))

    def test_empty_and_unrelated(self):
        self.assertEqual(skills.extract_skills(''), set())
        self.assertEqual(skills.extract_skills('Business Communication'), set())

    def test_every_role_in_the_lexicon_is_a_taxonomy_role(self):
        from taxonomy.management.commands.seed_taxonomy import TAXONOMY
        taxonomy_roles = {r['name'] for g in TAXONOMY.values() for fam in g['families'].values() for r in fam}
        self.assertEqual(set(skills.ROLE_SKILLS) - taxonomy_roles, set())


class DataMixin:
    def setUp(self):
        group = RoleGroup.objects.create(name='G')
        family = RoleFamily.objects.create(name='F', role_group=group)
        self.roles = {}
        for name, demand, trend in [
            (skills.BD, 100.0, 'growing'), (skills.DEVOPS, 60.0, 'growing'),
            (skills.DA, 30.0, 'declining'), (skills.SUP, 10.0, 'declining'),
        ]:
            self.roles[name] = NormalizedRole.objects.create(name=name, role_family=family, emergence_year=2015)
        self.run = ForecastRun.objects.create(model_version='t')
        for name, demand, trend in [
            (skills.BD, 100.0, 'growing'), (skills.DEVOPS, 60.0, 'growing'),
            (skills.DA, 30.0, 'declining'), (skills.SUP, 10.0, 'declining'),
        ]:
            RoleForecast.objects.create(
                forecast_run=self.run, role=self.roles[name], horizon='1y', demand_index=demand,
                share_pct=1, employment_proxy=1, trend_direction=trend,
            )

    def make(self, email, role, institution=None):
        return User.objects.create_user(username=email, email=email, password=PW, role=role, institution=institution)

    def auth(self, email):
        tokens = self.client.post('/api/auth/login/', {'email': email, 'password': PW}, format='json').data
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + tokens['access'])


@fast_hashing
class GeographicTests(DataMixin, APITestCase):
    def posting(self, title, location, role=None, ict=True, year=2026):
        return JobPosting.objects.create(
            source='t', title=title, location_raw=location, is_ict=ict, posted_date=f'{year}-03-01',
            normalized_role=self.roles.get(role) if role else None,
        )

    def test_summary_counts_provinces_and_districts(self):
        self.posting('a', 'Kigali', skills.BD)
        self.posting('b', 'Kigali', skills.BD)
        self.posting('c', 'Rusizi', skills.DEVOPS)
        self.posting('d', 'Rwanda', skills.BD)
        self.posting('e', 'Full Remote', skills.BD)
        self.posting('f', 'Nyagatare', skills.DA, ict=False)
        self.make('u@x.rw', User.UserRole.LABOR_MARKET_ANALYST)
        self.auth('u@x.rw')
        d = self.client.get('/api/analytics/geographic/summary/').data
        self.assertEqual((d['total_ict_postings'], d['located_postings'], d['unlocated_postings']), (5, 3, 2))
        prov = {p['province']: p for p in d['by_province']}
        self.assertEqual(len(d['by_province']), 5)
        self.assertEqual(prov['Kigali City']['postings'], 2)
        self.assertEqual(prov['Western']['postings'], 1)
        self.assertEqual(prov['Eastern']['postings'], 0)
        self.assertAlmostEqual(prov['Kigali City']['share_pct'], 66.7)
        top = d['by_district'][0]
        self.assertEqual((top['province'], top['postings'], top['top_role']), ('Kigali City', 2, skills.BD))

    def test_summary_requires_authentication(self):
        self.assertEqual(self.client.get('/api/analytics/geographic/summary/').status_code, 401)

    def test_rebuild_populates_geographic_demand(self):
        self.posting('a', 'Kigali', skills.BD)
        self.posting('b', 'Kigali', skills.BD)
        self.posting('c', 'Rusizi', skills.DEVOPS)
        self.assertEqual(rebuild_geographic_demand(), 2)
        row = GeographicDemand.objects.get(province='Kigali City')
        self.assertEqual((row.posting_count, row.demand_score), (2, 100.0))
        self.assertEqual(GeographicDemand.objects.get(district='Rusizi').demand_score, 50.0)
        rebuild_geographic_demand()
        self.assertEqual(GeographicDemand.objects.count(), 2)  # idempotent


@fast_hashing
class CurriculumTests(DataMixin, APITestCase):
    CSV = (b'course,description\n'
           b'Intro to Python programming,Variables and functions\n'
           b'Web APIs,Building REST API services with Django\n'
           b'Business Communication,Writing and presenting\n')

    def submit(self, **extra):
        data = {'name': 'BSc Computer Science', 'level': 'bachelor', **extra}
        return self.client.post('/api/analytics/education/curricula/', data, format='multipart')

    def csv_file(self, content=None, name='c.csv'):
        return SimpleUploadedFile(name, content or self.CSV, content_type='text/csv')

    def test_only_planners_and_admins_can_use_it(self):
        for role, expected in [(User.UserRole.CAREER_TRAINING_ADVISOR, 403), (User.UserRole.LABOR_MARKET_ANALYST, 403),
                               (User.UserRole.EDUCATION_CURRICULUM_PLANNER, 200), (User.UserRole.ADMIN, 200)]:
            email = f'{role}@x.rw'
            self.make(email, role)
            self.auth(email)
            self.assertEqual(self.client.get('/api/analytics/education/curricula/').status_code, expected, role)
        self.client.credentials()
        self.assertEqual(self.client.get('/api/analytics/education/curricula/').status_code, 401)

    def test_overview_is_readable_by_everyone_signed_in(self):
        self.make('adv@x.rw', User.UserRole.CAREER_TRAINING_ADVISOR)
        self.auth('adv@x.rw')
        r = self.client.get('/api/analytics/education/')
        self.assertEqual((r.status_code, r.data['status']), (200, 'available'))
        self.assertGreater(r.data['skills_in_lexicon'], 20)

    def test_upload_csv_returns_analysis(self):
        self.make('p@x.rw', User.UserRole.EDUCATION_CURRICULUM_PLANNER)
        self.auth('p@x.rw')
        r = self.submit(file=self.csv_file())
        self.assertEqual(r.status_code, 201, r.content)
        a = r.data['analysis']
        self.assertEqual(r.data['course_count'], 3)
        self.assertEqual(r.data['source_filename'], 'c.csv')
        self.assertEqual(a['unmatched_courses'], ['Business Communication'])
        self.assertTrue({'Python', 'APIs & web services', 'Server-side frameworks'} <= set(a['skills_taught']))
        backend = next(x for x in a['roles'] if x['role_name'] == skills.BD)
        self.assertGreater(backend['coverage_pct'], 0)
        self.assertIn('Databases & SQL', backend['missing_skills'])
        support = next(x for x in a['roles'] if x['role_name'] == skills.SUP)
        self.assertEqual(support['coverage_pct'], 0.0)
        self.assertEqual(a['top_gaps'][0]['role_name'], skills.DEVOPS)  # big demand, nothing taught

    def test_upload_pasted_text(self):
        self.make('p@x.rw', User.UserRole.EDUCATION_CURRICULUM_PLANNER)
        self.auth('p@x.rw')
        r = self.submit(text='Docker and Kubernetes: containers\nCloud computing basics\n\nLinux administration')
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(r.data['course_count'], 3)
        self.assertIn('DevOps & automation', r.data['analysis']['skills_taught'])

    def test_alignment_score_rewards_covering_high_demand_roles(self):
        self.make('p@x.rw', User.UserRole.EDUCATION_CURRICULUM_PLANNER)
        self.auth('p@x.rw')
        backend_heavy = self.submit(text='Python\nDjango REST API\nSQL databases\nSoftware engineering with git\nJava\nProgramming algorithms')
        support_only = self.submit(text='Help desk troubleshooting\nComputer hardware\nIT operations')
        empty = self.submit(text='Business Communication')
        self.assertGreater(backend_heavy.data['alignment_score'], support_only.data['alignment_score'])
        self.assertGreater(support_only.data['alignment_score'], 0)
        self.assertEqual(empty.data['alignment_score'], 0.0)
        self.assertLessEqual(backend_heavy.data['alignment_score'], 100)

    def test_validation_errors(self):
        self.make('p@x.rw', User.UserRole.EDUCATION_CURRICULUM_PLANNER)
        self.auth('p@x.rw')
        self.assertEqual(self.submit().status_code, 400)  # nothing supplied
        self.assertEqual(self.submit(text='   \n  ').status_code, 400)
        self.assertEqual(self.submit(file=self.csv_file(b'foo,bar\n1,2\n')).status_code, 400)  # no course column
        self.assertEqual(self.submit(file=self.csv_file(b'\xff\xfe\x00bad')).status_code, 400)  # not UTF-8
        r = self.client.post('/api/analytics/education/curricula/', {'level': 'bachelor', 'text': 'x'}, format='multipart')
        self.assertEqual(r.status_code, 400)  # name missing
        self.assertEqual(self.submit(text='x', level='wizard').status_code, 400)
        self.assertEqual(Curriculum.objects.count(), 0)

    def test_too_many_courses_rejected(self):
        self.make('p@x.rw', User.UserRole.EDUCATION_CURRICULUM_PLANNER)
        self.auth('p@x.rw')
        self.assertEqual(self.submit(text='\n'.join(f'Course {i}' for i in range(501))).status_code, 400)

    def test_visibility_scoping_and_delete(self):
        inst_a = Institution.objects.create(name='A', type='university')
        inst_b = Institution.objects.create(name='B', type='university')
        self.make('a1@x.rw', User.UserRole.EDUCATION_CURRICULUM_PLANNER, inst_a)
        self.make('a2@x.rw', User.UserRole.EDUCATION_CURRICULUM_PLANNER, inst_a)
        self.make('b1@x.rw', User.UserRole.EDUCATION_CURRICULUM_PLANNER, inst_b)
        self.make('root@x.rw', User.UserRole.ADMIN)
        self.auth('a1@x.rw')
        cid = self.submit(text='Python').data['id']
        for email, sees in [('a1@x.rw', True), ('a2@x.rw', True), ('b1@x.rw', False), ('root@x.rw', True)]:
            self.auth(email)
            listed = [c['id'] for c in self.client.get('/api/analytics/education/curricula/').data['results']]
            self.assertEqual(cid in listed, sees, email)
            self.assertEqual(self.client.get(f'/api/analytics/education/curricula/{cid}/').status_code, 200 if sees else 404, email)
        self.auth('b1@x.rw')
        self.assertEqual(self.client.delete(f'/api/analytics/education/curricula/{cid}/').status_code, 404)
        self.auth('a2@x.rw')
        self.assertEqual(self.client.delete(f'/api/analytics/education/curricula/{cid}/').status_code, 204)
        self.assertFalse(Curriculum.objects.filter(pk=cid).exists())

    def test_analysis_uses_latest_forecast(self):
        self.make('p@x.rw', User.UserRole.EDUCATION_CURRICULUM_PLANNER)
        self.auth('p@x.rw')
        cid = self.submit(text='Python\nDjango REST API').data['id']
        before = self.client.get(f'/api/analytics/education/curricula/{cid}/').data['analysis']['alignment_score']
        newer = ForecastRun.objects.create(model_version='t2')
        RoleForecast.objects.create(forecast_run=newer, role=self.roles[skills.SUP], horizon='1y', demand_index=100,
                                    share_pct=1, employment_proxy=1, trend_direction='growing')
        after = self.client.get(f'/api/analytics/education/curricula/{cid}/').data['analysis']
        self.assertEqual([r['role_name'] for r in after['roles']], [skills.SUP])
        self.assertNotEqual(before, after['alignment_score'])

    def test_no_forecast_means_zero_score_not_a_crash(self):
        RoleForecast.objects.all().delete()
        ForecastRun.objects.all().delete()
        self.make('p@x.rw', User.UserRole.EDUCATION_CURRICULUM_PLANNER)
        self.auth('p@x.rw')
        r = self.submit(text='Python')
        self.assertEqual((r.status_code, r.data['alignment_score']), (201, 0.0))
