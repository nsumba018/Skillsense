"""Uploaded bulletins are personal: a user sees only the bulletins they uploaded."""
from rest_framework.test import APITestCase

from accounts.models import User
from analytics.models import Curriculum
from .models import BulletinCourse, CurriculumBulletin

PLANNER = User.UserRole.EDUCATION_CURRICULUM_PLANNER


def make_user(email, role=PLANNER):
    return User.objects.create_user(username=email, email=email, password='x', role=role)


def make_bulletin(code, name, uploader):
    b = CurriculumBulletin.objects.create(
        department_code=code, department_name=name, faculty='it', original_filename='b.xlsx',
        file='bulletins/b.xlsx', uploaded_by=uploader,
    )
    BulletinCourse.objects.create(bulletin=b, semester=1, name=f'{name} 101', credits=3, skills=[name])
    return b


class BulletinPrivacyTests(APITestCase):
    def setUp(self):
        self.ann = make_user('ann@x.rw')
        self.ben = make_user('ben@x.rw')
        self.admin = make_user('adm@x.rw', User.UserRole.ADMIN)
        make_bulletin('SE', 'Ann Software', self.ann)
        make_bulletin('NET', 'Ben Networks', self.ben)

    def names(self, user):
        self.client.force_authenticate(user)
        return {b['name'] for b in self.client.get('/api/curriculum/all/').data['departments']}

    def test_each_user_sees_only_their_own_bulletins(self):
        self.assertEqual(self.names(self.ann), {'Ann Software'})
        self.assertEqual(self.names(self.ben), {'Ben Networks'})
        self.assertEqual(self.names(self.admin), set())

    def test_other_users_bulletin_detail_is_404(self):
        self.client.force_authenticate(self.ann)
        self.assertEqual(self.client.get('/api/curriculum/NET/').status_code, 404)
        self.assertEqual(self.client.get('/api/curriculum/SE/').status_code, 200)

    def test_list_skills_and_programs_are_scoped(self):
        self.client.force_authenticate(self.ben)
        self.assertEqual([b['department_name'] for b in self.client.get('/api/curriculum/').data], ['Ben Networks'])
        self.assertEqual(set(self.client.get('/api/curriculum/skills/').data), {'NET'})
        programs = self.client.get('/api/curriculum/programs/').data
        self.assertEqual([p['name'] for f in programs.values() for p in f['programs']], ['Ben Networks'])

    def test_planner_curricula_are_personal_too(self):
        Curriculum.objects.create(name='Ann curriculum', uploaded_by=self.ann)
        Curriculum.objects.create(name='Ben curriculum', uploaded_by=self.ben)
        for user, expected in ((self.ann, 'Ann curriculum'), (self.ben, 'Ben curriculum')):
            self.client.force_authenticate(user)
            data = self.client.get('/api/analytics/education/curricula/').data
            rows = data['results'] if isinstance(data, dict) else data
            self.assertEqual([r['name'] for r in rows], [expected])
        self.client.force_authenticate(self.ann)
        other = Curriculum.objects.get(name='Ben curriculum')
        self.assertEqual(self.client.get(f'/api/analytics/education/curricula/{other.id}/').status_code, 404)
