from django.core.management.base import BaseCommand
from accounts.models import User


class Command(BaseCommand):
    help = "Create a default superuser admin account"

    def handle(self, *args, **kwargs):
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
        