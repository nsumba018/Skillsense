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


class Command(BaseCommand):
    help = "Create default institutions and a default superuser admin account"

    def handle(self, *args, **kwargs):
        for name, inst_type in INSTITUTIONS:
            Institution.objects.get_or_create(name=name, defaults={'type': inst_type})
        self.stdout.write(f"Created/verified {len(INSTITUTIONS)} institutions")

        email = "admin@skillsense.rw"
        if User.objects.filter(email=email).exists():
            self.stdout.write(self.style.WARNING("Admin already exists — skipping."))
            return

        user = User(
            username="admin",
            email=email,
            first_name="SkillSense",
            last_name="Admin",
            role="admin",
            is_staff=True,
            is_superuser=True,
        )
        user.set_password("Admin@1234")
        user.save()
        self.stdout.write(self.style.SUCCESS(
            f"Superuser created: {email} / Admin@1234"
        ))  
        