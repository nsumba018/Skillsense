from django.core.management.base import BaseCommand
from taxonomy.models import RoleGroup, RoleFamily, NormalizedRole


TAXONOMY = {
    "Infrastructure & Cloud": {
        "families": {
            "Cloud & Networking": [
                "Cloud Engineer",
                "Network Engineer",
                "DevOps Engineer",
                "Systems Administrator",
            ],
            "Security": [
                "Cybersecurity Analyst",
                "Information Security Officer",
            ],
        }
    },
    "Software & Data": {
        "families": {
            "Software Development": [
                "Software Developer",
                "Mobile App Developer",
                "UI/UX Designer",
            ],
            "Data & AI": [
                "Data Scientist",
                "Data Analyst",
                "Database Administrator",
                "AI/ML Engineer",
                "Business Intelligence Analyst",
            ],
        }
    },
    "Management & Support": {
        "families": {
            "Project & IT Management": [
                "IT Project Manager",
                "IT Support Specialist",
                "ERP Consultant",
            ],
            "Digital & Telecom": [
                "Digital Marketing Specialist",
                "Telecommunications Engineer",
                "Technical Writer",
            ],
        }
    },
}


class Command(BaseCommand):
    help = "Seed the 3-level ICT role taxonomy (20 roles)"

    def handle(self, *args, **kwargs):
        created_roles = 0
        for group_name, group_data in TAXONOMY.items():
            group, _ = RoleGroup.objects.get_or_create(name=group_name)
            for family_name, roles in group_data["families"].items():
                family, _ = RoleFamily.objects.get_or_create(name=family_name, group=group)
                for title in roles:
                    _, created = NormalizedRole.objects.get_or_create(
                        normalized_title=title,
                        defaults={"family": family, "is_active": True}
                    )
                    if created:
                        created_roles += 1

        self.stdout.write(self.style.SUCCESS(
            f"Taxonomy seeded: {created_roles} new roles created."
        )) 
        