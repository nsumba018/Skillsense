from django.db import migrations

DEMO_PLANNER = 'planner@skillsense.rw'


def assign_to_demo_planner(apps, schema_editor):
    """Bulletins are personal to their uploader. Ones loaded with no owner (seed_bulletins) go to the demo planner."""
    User = apps.get_model('accounts', 'User')
    Bulletin = apps.get_model('curriculum', 'CurriculumBulletin')
    planner = User.objects.filter(email=DEMO_PLANNER).first()
    if planner:
        Bulletin.objects.filter(uploaded_by__isnull=True).update(uploaded_by=planner)


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
        ('curriculum', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(assign_to_demo_planner, migrations.RunPython.noop),
    ]
