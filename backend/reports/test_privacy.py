from rest_framework.test import APITestCase

from accounts.models import User
from .models import GeneratedReport


class ReportHistoryPrivacyTests(APITestCase):
    def test_report_history_is_personal_even_for_admins(self):
        u1 = User.objects.create_user(username='1@x.rw', email='1@x.rw', password='x')
        u2 = User.objects.create_user(username='2@x.rw', email='2@x.rw', password='x')
        admin = User.objects.create_user(username='a@x.rw', email='a@x.rw', password='x', role=User.UserRole.ADMIN)
        GeneratedReport.objects.create(report_type='demand_outlook', format='pdf', title='Mine', generated_by=u1)
        GeneratedReport.objects.create(report_type='demand_outlook', format='pdf', title='Theirs', generated_by=u2)

        def titles(user):
            self.client.force_authenticate(user)
            data = self.client.get('/api/reports/').data
            return {r['title'] for r in (data['results'] if isinstance(data, dict) else data)}

        self.assertEqual(titles(u1), {'Mine'})
        self.assertEqual(titles(u2), {'Theirs'})
        self.assertEqual(titles(admin), set())
