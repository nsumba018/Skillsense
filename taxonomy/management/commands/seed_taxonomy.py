"""
Load the ICT role taxonomy into the database.

The 22 roles (20 current roles plus 2 that only appear in 2005-2009:
ICT Applications / E-Government Developer and Telecommunications / Network
Technician) are organized into groups and families based on the
classification used in our dataset.

Usage:
    python manage.py seed_taxonomy
"""
from django.core.management.base import BaseCommand
from taxonomy.models import RoleGroup, RoleFamily, NormalizedRole


# Our complete taxonomy: group → family → roles
TAXONOMY = {
    "Software Development": {
        "sort_order": 1,
        "families": {
            "Backend Development": [
                {"name": "Backend Developer", "emergence_year": 2012},
            ],
            "Frontend Development": [
                {"name": "Frontend / Web Developer", "emergence_year": 2010},
            ],
            "Full-Stack Development": [
                {"name": "Full-Stack Developer", "emergence_year": 2014},
            ],
            "Mobile Development": [
                {"name": "Mobile App Developer", "emergence_year": 2013},
            ],
            "General Software": [
                {"name": "Software Developer / Software Engineer", "emergence_year": 2010},
                {"name": "ICT Applications / E-Government Developer", "emergence_year": 2007},
            ],
            "Quality Assurance": [
                {"name": "QA / Software Test Engineer", "emergence_year": 2015},
            ],
        },
    },
    "Data & Analytics": {
        "sort_order": 2,
        "families": {
            "Data Analysis": [
                {"name": "Data Analyst", "emergence_year": 2015},
            ],
            "Data Engineering": [
                {"name": "Data Engineer", "emergence_year": 2017},
            ],
            "Data Science": [
                {"name": "Data Scientist", "emergence_year": 2020},
            ],
            "Database Management": [
                {"name": "Database Administrator", "emergence_year": 2010},
            ],
        },
    },
    "Infrastructure & Operations": {
        "sort_order": 3,
        "families": {
            "System Administration": [
                {"name": "Systems Administrator", "emergence_year": 2010},
            ],
            "Network Engineering": [
                {"name": "Network Engineer / Network Administrator", "emergence_year": 2010},
                {"name": "Telecommunications / Network Technician", "emergence_year": 2005},
            ],
            "IT Support": [
                {"name": "IT Support / Help Desk Technician", "emergence_year": 2010},
            ],
            "IT Administration": [
                {"name": "IT Officer / ICT Administrator", "emergence_year": 2010},
            ],
        },
    },
    "Cloud & DevOps": {
        "sort_order": 4,
        "families": {
            "DevOps": [
                {"name": "DevOps / Cloud Engineer", "emergence_year": 2018},
            ],
        },
    },
    "Security & Governance": {
        "sort_order": 5,
        "families": {
            "Cybersecurity": [
                {"name": "Cybersecurity Analyst / Security Engineer", "emergence_year": 2016},
            ],
            "IT Governance": [
                {"name": "IT Auditor / IT Governance & Risk", "emergence_year": 2015},
            ],
        },
    },
    "Management & Analysis": {
        "sort_order": 6,
        "families": {
            "IT Management": [
                {"name": "ICT Manager / IT Manager", "emergence_year": 2010},
            ],
            "Business Analysis": [
                {"name": "Systems Analyst / IT Business Analyst", "emergence_year": 2012},
            ],
        },
    },
    "Other": {
        "sort_order": 99,
        "families": {
            "Other Technical": [
                {"name": "Other ICT Technical Roles", "emergence_year": 2010},
            ],
        },
    },
}


class Command(BaseCommand):
    help = 'Load the ICT role taxonomy (groups, families, roles) into the database'

    def handle(self, *args, **options):
        created_groups = 0
        created_families = 0
        created_roles = 0

        for group_name, group_data in TAXONOMY.items():
            group, g_created = RoleGroup.objects.get_or_create(
                name=group_name,
                defaults={'sort_order': group_data['sort_order']},
            )
            if g_created:
                created_groups += 1

            for family_name, roles in group_data['families'].items():
                family, f_created = RoleFamily.objects.get_or_create(
                    name=family_name,
                    role_group=group,
                )
                if f_created:
                    created_families += 1

                for role_data in roles:
                    role, r_created = NormalizedRole.objects.get_or_create(
                        name=role_data['name'],
                        defaults={
                            'role_family': family,
                            'emergence_year': role_data['emergence_year'],
                            'is_emerging': False,
                        },
                    )
                    if r_created:
                        created_roles += 1

        self.stdout.write(self.style.SUCCESS(
            f'Taxonomy loaded: {created_groups} groups, '
            f'{created_families} families, {created_roles} roles'
        ))
