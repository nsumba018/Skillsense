from django.db import migrations


SECTORS = [
    {
        'name': 'ICT & Technology',
        'slug': 'ict-technology',
        'description': 'Information and communication technology, software development, IT services',
        'sort_order': 1,
        'color': '#2563EB',
    },
    {
        'name': 'Finance & Business',
        'slug': 'finance-business',
        'description': 'Banking, accounting, insurance, auditing, financial services',
        'sort_order': 2,
        'color': '#059669',
    },
    {
        'name': 'Engineering',
        'slug': 'engineering',
        'description': 'Civil, electrical, mechanical, and general engineering',
        'sort_order': 3,
        'color': '#D97706',
    },
    {
        'name': 'Healthcare',
        'slug': 'healthcare',
        'description': 'Medicine, public health, pharmacy, nursing',
        'sort_order': 4,
        'color': '#DC2626',
    },
    {
        'name': 'Education & Research',
        'slug': 'education-research',
        'description': 'Teaching, academic research, psychology, statistics',
        'sort_order': 5,
        'color': '#7C3AED',
    },
    {
        'name': 'Agriculture & Environment',
        'slug': 'agriculture-environment',
        'description': 'Farming, agronomy, food sciences, environmental management, mining',
        'sort_order': 6,
        'color': '#65A30D',
    },
    {
        'name': 'Government & Public Admin',
        'slug': 'government-public-admin',
        'description': 'Public administration, law, governance, procurement',
        'sort_order': 7,
        'color': '#0891B2',
    },
    {
        'name': 'Services & Commerce',
        'slug': 'services-commerce',
        'description': 'Hospitality, marketing, communications, logistics, human resources',
        'sort_order': 8,
        'color': '#DB2777',
    },
    {
        'name': 'Development & NGO',
        'slug': 'development-ngo',
        'description': 'International development, NGOs, social sciences, project management',
        'sort_order': 9,
        'color': '#EA580C',
    },
]


def seed_sectors(apps, schema_editor):
    Sector = apps.get_model('taxonomy', 'Sector')
    RoleGroup = apps.get_model('taxonomy', 'RoleGroup')

    for data in SECTORS:
        Sector.objects.get_or_create(slug=data['slug'], defaults=data)

    ict_sector = Sector.objects.get(slug='ict-technology')
    RoleGroup.objects.filter(sector__isnull=True).update(sector=ict_sector)


def reverse_seed(apps, schema_editor):
    Sector = apps.get_model('taxonomy', 'Sector')
    RoleGroup = apps.get_model('taxonomy', 'RoleGroup')
    RoleGroup.objects.all().update(sector=None)
    Sector.objects.filter(slug__in=[s['slug'] for s in SECTORS]).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('taxonomy', '0003_sector_and_more'),
    ]

    operations = [
        migrations.RunPython(seed_sectors, reverse_seed),
    ]
