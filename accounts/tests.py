import re
from unittest import mock

from django.core import mail
from django.test import override_settings
from rest_framework.test import APITestCase
from rest_framework.throttling import ScopedRateThrottle

from .models import Institution, User

PW = 'Str0ng-pass!23'
fast_hashing = override_settings(PASSWORD_HASHERS=['django.contrib.auth.hashers.MD5PasswordHasher'])


def make_user(email, role=User.UserRole.LABOR_MARKET_ANALYST, password=PW, **extra):
    return User.objects.create_user(username=email, email=email, password=password, role=role, **extra)


class AuthMixin:
    def login(self, email, password=PW):
        r = self.client.post('/api/auth/login/', {'email': email, 'password': password}, format='json')
        self.assertEqual(r.status_code, 200, r.content)
        return r.data

    def auth(self, email, password=PW):
        tokens = self.login(email, password)
        self.client.credentials(HTTP_AUTHORIZATION='Bearer ' + tokens['access'])
        return tokens


@fast_hashing
class RolesAndRegistrationTests(AuthMixin, APITestCase):
    def payload(self, **kw):
        base = {
            'email': 'new@example.rw', 'username': 'new@example.rw', 'first_name': 'New', 'last_name': 'User',
            'password': PW, 'password_confirm': PW, 'role': 'career_training_advisor',
        }
        return {**base, **kw}

    def test_spec_roles_are_the_only_choices(self):
        self.assertEqual(
            {v for v, _ in User.UserRole.choices},
            {'admin', 'career_training_advisor', 'education_curriculum_planner', 'labor_market_analyst'},
        )

    def test_register_each_non_admin_role(self):
        for i, role in enumerate(['career_training_advisor', 'education_curriculum_planner', 'labor_market_analyst']):
            r = self.client.post('/api/auth/register/', self.payload(email=f'u{i}@x.rw', username=f'u{i}', role=role), format='json')
            self.assertEqual(r.status_code, 201, r.content)
            self.assertEqual(r.data['role'], role)
            self.assertNotIn('password', r.data)

    def test_cannot_self_register_as_admin_or_legacy_role(self):
        for role in ('admin', 'researcher', 'policy_maker'):
            r = self.client.post('/api/auth/register/', self.payload(role=role), format='json')
            self.assertEqual(r.status_code, 400, role)
        self.assertFalse(User.objects.filter(email='new@example.rw').exists())

    def test_register_with_institution(self):
        inst = Institution.objects.create(name='Uni', type='university')
        r = self.client.post('/api/auth/register/', self.payload(institution_id=inst.id), format='json')
        self.assertEqual(r.status_code, 201)
        self.assertEqual(User.objects.get(email='new@example.rw').institution_id, inst.id)

    def test_profile_update_cannot_change_role(self):
        make_user('a@x.rw', role=User.UserRole.CAREER_TRAINING_ADVISOR)
        self.auth('a@x.rw')
        r = self.client.put('/api/auth/me/', {'email': 'a@x.rw', 'username': 'a@x.rw', 'first_name': 'Z', 'last_name': 'Y', 'role': 'admin'}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(User.objects.get(email='a@x.rw').role, 'career_training_advisor')

    def test_institutions_list_is_public(self):
        Institution.objects.create(name='B Org', type='ngo')
        Institution.objects.create(name='A Org', type='government')
        r = self.client.get('/api/auth/institutions/')
        self.assertEqual(r.status_code, 200)
        self.assertEqual([i['name'] for i in r.data], ['A Org', 'B Org'])


@fast_hashing
class ChangePasswordTests(AuthMixin, APITestCase):
    def setUp(self):
        make_user('p@x.rw')

    def test_wrong_old_password(self):
        self.auth('p@x.rw')
        r = self.client.post('/api/auth/change-password/', {'old_password': 'nope', 'new_password': 'An0ther-pass!9'}, format='json')
        self.assertEqual(r.status_code, 400)
        self.assertIn('old_password', r.data)

    def test_weak_new_password(self):
        self.auth('p@x.rw')
        r = self.client.post('/api/auth/change-password/', {'old_password': PW, 'new_password': '12345678'}, format='json')
        self.assertEqual(r.status_code, 400)
        self.assertIn('new_password', r.data)

    def test_requires_authentication(self):
        r = self.client.post('/api/auth/change-password/', {'old_password': PW, 'new_password': 'An0ther-pass!9'}, format='json')
        self.assertEqual(r.status_code, 401)

    def test_success_signs_out_other_sessions_but_keeps_this_one(self):
        other = self.login('p@x.rw')
        mine = self.auth('p@x.rw')
        r = self.client.post('/api/auth/change-password/', {'old_password': PW, 'new_password': 'An0ther-pass!9', 'refresh': mine['refresh']}, format='json')
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(r.data['other_sessions_signed_out'], 1)
        self.client.credentials()
        self.assertEqual(self.client.post('/api/auth/refresh/', {'refresh': other['refresh']}, format='json').status_code, 401)
        self.assertEqual(self.client.post('/api/auth/refresh/', {'refresh': mine['refresh']}, format='json').status_code, 200)
        self.assertEqual(self.client.post('/api/auth/login/', {'email': 'p@x.rw', 'password': PW}, format='json').status_code, 401)
        self.assertEqual(self.client.post('/api/auth/login/', {'email': 'p@x.rw', 'password': 'An0ther-pass!9'}, format='json').status_code, 200)


@fast_hashing
class PasswordResetTests(AuthMixin, APITestCase):
    def setUp(self):
        self.user = make_user('r@x.rw', first_name='Rita')

    def request_link(self):
        self.client.post('/api/auth/password-reset/', {'email': 'r@x.rw'}, format='json')
        self.assertEqual(len(mail.outbox), 1)
        m = re.search(r'reset-password\?uid=([^&\s]+)&token=([^\s]+)', mail.outbox[0].body)
        self.assertIsNotNone(m, mail.outbox[0].body)
        return m.group(1), m.group(2)

    def test_unknown_email_gets_same_answer_and_no_email(self):
        r = self.client.post('/api/auth/password-reset/', {'email': 'ghost@x.rw'}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(mail.outbox), 0)
        known = self.client.post('/api/auth/password-reset/', {'email': 'r@x.rw'}, format='json')
        self.assertEqual(r.data, known.data)

    def test_inactive_user_gets_no_email(self):
        User.objects.filter(pk=self.user.pk).update(is_active=False)
        self.client.post('/api/auth/password-reset/', {'email': 'r@x.rw'}, format='json')
        self.assertEqual(len(mail.outbox), 0)

    def test_full_flow_and_link_is_single_use(self):
        uid, token = self.request_link()
        r = self.client.post('/api/auth/password-reset/confirm/', {'uid': uid, 'token': token, 'new_password': 'Fresh-pass!456'}, format='json')
        self.assertEqual(r.status_code, 200, r.content)
        self.assertEqual(self.client.post('/api/auth/login/', {'email': 'r@x.rw', 'password': 'Fresh-pass!456'}, format='json').status_code, 200)
        again = self.client.post('/api/auth/password-reset/confirm/', {'uid': uid, 'token': token, 'new_password': 'Other-pass!789'}, format='json')
        self.assertEqual(again.status_code, 400)

    def test_bad_token_and_bad_uid_rejected(self):
        uid, _ = self.request_link()
        for payload in ({'uid': uid, 'token': 'bad-token'}, {'uid': 'zzz', 'token': 'x-y'}):
            r = self.client.post('/api/auth/password-reset/confirm/', {**payload, 'new_password': 'Fresh-pass!456'}, format='json')
            self.assertEqual(r.status_code, 400)

    def test_weak_password_rejected(self):
        uid, token = self.request_link()
        r = self.client.post('/api/auth/password-reset/confirm/', {'uid': uid, 'token': token, 'new_password': '12345678'}, format='json')
        self.assertEqual(r.status_code, 400)
        self.assertIn('new_password', r.data)

    def test_reset_signs_out_existing_sessions(self):
        old = self.login('r@x.rw')
        uid, token = self.request_link()
        self.client.post('/api/auth/password-reset/confirm/', {'uid': uid, 'token': token, 'new_password': 'Fresh-pass!456'}, format='json')
        self.assertEqual(self.client.post('/api/auth/refresh/', {'refresh': old['refresh']}, format='json').status_code, 401)

    def test_reset_requests_are_rate_limited(self):
        from django.core.cache import cache
        cache.clear()
        with mock.patch.dict(ScopedRateThrottle.THROTTLE_RATES, {'password_reset': '2/hour'}):
            codes = [self.client.post('/api/auth/password-reset/', {'email': 'r@x.rw'}, format='json').status_code for _ in range(4)]
        self.assertEqual(codes[:2], [200, 200])
        self.assertIn(429, codes[2:])
        cache.clear()


@fast_hashing
class SessionTests(AuthMixin, APITestCase):
    def setUp(self):
        make_user('s@x.rw')

    def test_list_flags_current_and_revoke_signs_out(self):
        a = self.login('s@x.rw')
        b = self.auth('s@x.rw')
        r = self.client.get('/api/auth/sessions/', HTTP_X_REFRESH_TOKEN=b['refresh'])
        self.assertEqual(r.status_code, 200)
        self.assertEqual(len(r.data), 2)
        self.assertEqual([s['current'] for s in r.data].count(True), 1)
        other = next(s for s in r.data if not s['current'])
        self.assertEqual(self.client.delete(f"/api/auth/sessions/{other['id']}/").status_code, 204)
        self.assertEqual(len(self.client.get('/api/auth/sessions/').data), 1)
        self.client.credentials()
        self.assertEqual(self.client.post('/api/auth/refresh/', {'refresh': a['refresh']}, format='json').status_code, 401)

    def test_cannot_revoke_someone_elses_session(self):
        make_user('t@x.rw')
        self.login('t@x.rw')
        from rest_framework_simplejwt.token_blacklist.models import OutstandingToken
        theirs = OutstandingToken.objects.get(user__email='t@x.rw')
        self.auth('s@x.rw')
        self.assertEqual(self.client.delete(f'/api/auth/sessions/{theirs.id}/').status_code, 404)

    def test_requires_authentication(self):
        self.assertEqual(self.client.get('/api/auth/sessions/').status_code, 401)


@fast_hashing
class UserManagementTests(AuthMixin, APITestCase):
    def setUp(self):
        self.admin = make_user('admin@x.rw', role=User.UserRole.ADMIN)
        make_user('adv@x.rw', role=User.UserRole.CAREER_TRAINING_ADVISOR, first_name='Ada')
        make_user('ana@x.rw', first_name='Ana')

    def test_non_admins_are_forbidden(self):
        self.auth('adv@x.rw')
        self.assertEqual(self.client.get('/api/auth/users/').status_code, 403)
        self.assertEqual(self.client.post('/api/auth/users/', {}, format='json').status_code, 403)
        self.assertEqual(self.client.patch(f'/api/auth/users/{self.admin.id}/', {'role': 'labor_market_analyst'}, format='json').status_code, 403)

    def test_admin_lists_searches_and_filters(self):
        self.auth('admin@x.rw')
        self.assertEqual(self.client.get('/api/auth/users/').data['count'], 3)
        self.assertEqual(self.client.get('/api/auth/users/?search=ada').data['count'], 1)
        r = self.client.get('/api/auth/users/?role=career_training_advisor')
        self.assertEqual([u['email'] for u in r.data['results']], ['adv@x.rw'])

    def test_admin_creates_admin_and_user_can_sign_in(self):
        self.auth('admin@x.rw')
        r = self.client.post('/api/auth/users/', {'email': 'boss@x.rw', 'first_name': 'B', 'last_name': 'Oss', 'role': 'admin', 'password': PW}, format='json')
        self.assertEqual(r.status_code, 201, r.content)
        self.assertNotIn('password', r.data)
        self.client.credentials()
        self.assertEqual(self.client.post('/api/auth/login/', {'email': 'boss@x.rw', 'password': PW}, format='json').status_code, 200)
        self.assertTrue(User.objects.get(email='boss@x.rw').is_admin_user)

    def test_create_requires_password(self):
        self.auth('admin@x.rw')
        r = self.client.post('/api/auth/users/', {'email': 'np@x.rw', 'role': 'admin'}, format='json')
        self.assertEqual(r.status_code, 400)

    def test_admin_changes_role_and_deactivates(self):
        self.auth('admin@x.rw')
        uid = User.objects.get(email='ana@x.rw').id
        r = self.client.patch(f'/api/auth/users/{uid}/', {'role': 'education_curriculum_planner'}, format='json')
        self.assertEqual(r.status_code, 200)
        self.assertEqual(User.objects.get(id=uid).role, 'education_curriculum_planner')
        self.assertEqual(self.client.patch(f'/api/auth/users/{uid}/', {'is_active': False}, format='json').status_code, 200)
        self.client.credentials()
        self.assertEqual(self.client.post('/api/auth/login/', {'email': 'ana@x.rw', 'password': PW}, format='json').status_code, 401)

    def test_admin_cannot_lock_themselves_out(self):
        self.auth('admin@x.rw')
        url = f'/api/auth/users/{self.admin.id}/'
        self.assertEqual(self.client.patch(url, {'role': 'labor_market_analyst'}, format='json').status_code, 400)
        self.assertEqual(self.client.patch(url, {'is_active': False}, format='json').status_code, 400)
        self.assertEqual(User.objects.get(id=self.admin.id).role, 'admin')

    def test_invalid_role_rejected(self):
        self.auth('admin@x.rw')
        uid = User.objects.get(email='ana@x.rw').id
        self.assertEqual(self.client.patch(f'/api/auth/users/{uid}/', {'role': 'superhero'}, format='json').status_code, 400)
