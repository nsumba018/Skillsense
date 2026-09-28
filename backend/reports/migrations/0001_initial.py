import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='GeneratedReport',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('report_type', models.CharField(choices=[('demand_outlook', 'ICT Demand Outlook'), ('role_deep_dive', 'Role-Specific Deep Dive'), ('education_gap', 'Education Gap Report'), ('workforce_planning', 'Workforce Planning Brief')], max_length=30)),
                ('format', models.CharField(choices=[('pdf', 'PDF'), ('csv', 'CSV'), ('json', 'JSON')], max_length=10)),
                ('title', models.CharField(max_length=255)),
                ('file', models.FileField(blank=True, null=True, upload_to='reports/%Y/%m/')),
                ('parameters', models.JSONField(blank=True, default=dict, help_text='Parameters used to generate this report (filters, date range, etc.)')),
                ('generated_by', models.ForeignKey(null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='generated_reports', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
    ]
