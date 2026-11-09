"""Student data is personal: every advisor sees only the students they manage, even inside the same institution."""
from datetime import date

from django.core.cache import cache
from django.core.files.uploadedfile import SimpleUploadedFile
from django.test import override_settings
from rest_framework.test import APITestCase

from accounts.models import Institution, User
from .models import Assessment, Placement, SavedPathway, StudentProfile

fast_hashing = override_settings(PASSWORD_HASHERS=['django.contrib.auth.hashers.MD5PasswordHasher'])
ADVISOR = User.UserRole.CAREER_TRAINING_ADVISOR


def make_user(email, institution=None, role=ADVISOR):
    return User.objects.create_user(username=email, email=email, password='x', role=role, institution=institution)


@fast_hashing
class AdvisoryPrivacyTests(APITestCase):
    def setUp(self):
        cache.clear()
        self.rdb = Institution.objects.create(name='RDB', type='government')
        self.ann = make_user('ann@rdb.rw', self.rdb)
        self.ben = make_user('ben@rdb.rw', self.rdb)  # same institution as Ann
        self.cy = make_user('cy@auca.rw')
        self.admin = make_user('admin@x.rw', None, User.UserRole.ADMIN)

        self.mine = self.student('Mine', self.ann)
        self.theirs = self.student('Theirs', self.ben)
        self.placement = Placement.objects.create(
            student=self.theirs, role_title='Dev', company='Acme', start_date=date(2026, 1, 1))
        self.assessment = Assessment.objects.create(
            student=self.theirs, assessed_by=self.ben, target_role='Data Analyst',
            readiness_score=50, matched_skills=[], missing_skills=[])
        self.pathway = SavedPathway.objects.create(student=self.theirs, target_role='Data Analyst', estimated_months=3)

    def student(self, name, advisor, email=''):
        return StudentProfile.objects.create(
            first_name=name, last_name='S', department='se', advisor=advisor, email=email)

    def student_names(self, user):
        self.client.force_authenticate(user)
        return {r['name'] for r in self.client.get('/api/advisory/students/').data['results']}

    def test_each_advisor_sees_only_their_own_students(self):
        self.assertEqual(self.student_names(self.ann), {'Mine S'})
        self.assertEqual(self.student_names(self.ben), {'Theirs S'})  # same institution, still private
        self.assertEqual(self.student_names(self.cy), set())

    def test_admin_does_not_see_other_users_students(self):
        self.assertEqual(self.student_names(self.admin), set())

    def test_new_students_belong_to_their_creator(self):
        self.client.force_authenticate(self.cy)
        r = self.client.post('/api/advisory/students/', {'first_name': 'N', 'last_name': 'W', 'department': 'se'}, format='json')
        self.assertEqual(r.status_code, 201, r.content)
        self.assertEqual(StudentProfile.objects.get(pk=r.data['id']).advisor, self.cy)
        self.assertEqual(self.student_names(self.cy), {'N W'})
        self.assertNotIn('N W', self.student_names(self.ann))

    def test_other_users_records_are_404(self):
        self.client.force_authenticate(self.ann)
        urls = [
            f'/api/advisory/students/{self.theirs.id}/', f'/api/advisory/placements/{self.placement.id}/',
            f'/api/advisory/assessments/{self.assessment.id}/', f'/api/advisory/pathways/{self.pathway.id}/',
        ]
        for url in urls:
            self.assertEqual(self.client.get(url).status_code, 404, url)
        self.assertEqual(self.client.delete(f'/api/advisory/students/{self.theirs.id}/').status_code, 404)
        self.assertEqual(
            self.client.patch(f'/api/advisory/students/{self.theirs.id}/', {'notes': 'x'}, format='json').status_code, 404)
        self.assertTrue(StudentProfile.objects.filter(pk=self.theirs.id).exists())

    def test_lists_of_placements_assessments_pathways_are_scoped(self):
        self.client.force_authenticate(self.ann)
        for name in ('placements', 'assessments', 'pathways'):
            self.assertEqual(self.client.get(f'/api/advisory/{name}/').data['count'], 0, name)
        self.client.force_authenticate(self.ben)
        for name in ('placements', 'assessments', 'pathways'):
            self.assertEqual(self.client.get(f'/api/advisory/{name}/').data['count'], 1, name)

    def test_cannot_attach_records_to_another_users_student(self):
        self.client.force_authenticate(self.ann)
        r = self.client.post('/api/advisory/placements/', {
            'student_id': self.theirs.id, 'role_title': 'X', 'company': 'Y', 'start_date': '2026-02-01'}, format='json')
        self.assertEqual(r.status_code, 400, r.content)
        r = self.client.post('/api/advisory/assessments/', {'student_id': self.theirs.id, 'target_role': 'Data Analyst'}, format='json')
        self.assertEqual(r.status_code, 400, r.content)
        self.assertEqual(Placement.objects.filter(student=self.theirs).count(), 1)

    def test_bulk_placement_upload_ignores_other_users_students(self):
        self.theirs.email = 'them@auca.rw'
        self.theirs.save()
        self.client.force_authenticate(self.ann)
        csv = 'student_email,role_title,company,start_date\nthem@auca.rw,Dev,Acme,2026-03-01\n'
        r = self.client.post('/api/advisory/placements/bulk/', {'file': SimpleUploadedFile('p.csv', csv.encode())}, format='multipart')
        self.assertEqual(r.data['created'], 0)
        self.assertIn('no student with email', r.data['errors'][0])

    def test_two_advisors_can_each_have_a_student_with_the_same_email(self):
        self.student('Dup', self.ann, email='same@x.rw')
        self.client.force_authenticate(self.ben)
        r = self.client.post('/api/advisory/students/', {
            'first_name': 'Dup', 'last_name': 'Two', 'department': 'se', 'email': 'same@x.rw'}, format='json')
        self.assertEqual(r.status_code, 201, r.content)
        r = self.client.post('/api/advisory/students/', {
            'first_name': 'Dup', 'last_name': 'Three', 'department': 'se', 'email': 'same@x.rw'}, format='json')
        self.assertEqual(r.status_code, 400)  # but not twice in the same advisor's list

    def test_reports_cannot_target_other_users_students(self):
        self.client.force_authenticate(self.ann)
        theirs = self.client.get(f'/api/advisory/reports/student_readiness/?student_id={self.theirs.id}')
        mine = self.client.get(f'/api/advisory/reports/student_readiness/?student_id={self.mine.id}')
        self.assertEqual(theirs.status_code, 400)
        self.assertEqual(mine.status_code, 200)
