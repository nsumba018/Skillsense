from django.core.management.base import BaseCommand
from accounts.models import User, Institution


INSTITUTIONS = [
    ('MIFOTRA', 'government'),
    ('Rwanda Development Board', 'government'),
    ('MINICT', 'government'),
    ('University of Rwanda', 'university'),
    ('Carnegie Mellon University Africa', 'university'),
    ('African Leadership University', 'university'),
]

SEED_USERS = [
    {
        'username': 'admin',
        'email': 'admin@skillsense.rw',
        'first_name': 'SkillSense',
        'last_name': 'Admin',
        'role': 'admin',
        'password': 'Admin@1234',
        'is_staff': True,
        'is_superuser': True,
        'institution': 'MINICT',
    },
    {
        'username': 'advisor',
        'email': 'advisor@skillsense.rw',
        'first_name': 'Jean',
        'last_name': 'Mugabo',
        'role': 'career_training_advisor',
        'password': 'Advisor@1234',
        'institution': 'Rwanda Development Board',
    },
    {
        'username': 'planner',
        'email': 'planner@skillsense.rw',
        'first_name': 'Alice',
        'last_name': 'Uwimana',
        'role': 'education_curriculum_planner',
        'password': 'Planner@1234',
        'institution': 'University of Rwanda',
    },
    {
        'username': 'analyst',
        'email': 'analyst@skillsense.rw',
        'first_name': 'Patrick',
        'last_name': 'Habimana',
        'role': 'labor_market_analyst',
        'password': 'Analyst@1234',
        'institution': 'MIFOTRA',
    },
]


class Command(BaseCommand):
    help = "Create default institutions and seed users for all four roles"

    def handle(self, *args, **kwargs):
        for name, inst_type in INSTITUTIONS:
            Institution.objects.get_or_create(name=name, defaults={'type': inst_type})
        self.stdout.write(f"Created/verified {len(INSTITUTIONS)} institutions")

        for data in SEED_USERS:
            if User.objects.filter(email=data['email']).exists():
                self.stdout.write(self.style.WARNING(f"  {data['email']} already exists: skipping."))
                continue

            institution = None
            if data.get('institution'):
                institution = Institution.objects.filter(name=data['institution']).first()

            user = User(
                username=data['username'],
                email=data['email'],
                first_name=data['first_name'],
                last_name=data['last_name'],
                role=data['role'],
                is_staff=data.get('is_staff', False),
                is_superuser=data.get('is_superuser', False),
                institution=institution,
            )
            user.set_password(data['password'])
            user.save()
            self.stdout.write(self.style.SUCCESS(
                f"  Created {data['role']}: {data['email']} / {data['password']}"
            ))
