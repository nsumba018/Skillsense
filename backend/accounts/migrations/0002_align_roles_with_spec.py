from django.db import migrations, models

FORWARD = {
    'researcher': 'labor_market_analyst',
    'policy_maker': 'labor_market_analyst',
    'education_planner': 'education_curriculum_planner',
    'career_advisor': 'career_training_advisor',
}
BACKWARD = {
    'labor_market_analyst': 'researcher',
    'education_curriculum_planner': 'education_planner',
    'career_training_advisor': 'career_advisor',
}


def remap(mapping):
    def run(apps, schema_editor):
        User = apps.get_model('accounts', 'User')
        for old, new in mapping.items():
            User.objects.filter(role=old).update(role=new)
    return run


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[
                    ('admin', 'Administrator'),
                    ('career_training_advisor', 'Career & Training Advisor'),
                    ('education_curriculum_planner', 'Education / Curriculum Planner'),
                    ('labor_market_analyst', 'Labour Market Analyst'),
                ],
                default='labor_market_analyst',
                max_length=32,
            ),
        ),
        migrations.RunPython(remap(FORWARD), remap(BACKWARD)),
    ]
