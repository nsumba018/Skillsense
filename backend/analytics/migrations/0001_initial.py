import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('taxonomy', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='GeographicDemand',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('province', models.CharField(db_index=True, max_length=100)),
                ('district', models.CharField(db_index=True, max_length=100)),
                ('year', models.IntegerField()),
                ('posting_count', models.IntegerField(default=0)),
                ('demand_score', models.FloatField(default=0.0, help_text='Normalized demand intensity 0-100')),
                ('role', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='geographic_demand', to='taxonomy.normalizedrole')),
            ],
            options={
                'ordering': ['province', 'district', '-year'],
                'unique_together': {('province', 'district', 'role', 'year')},
            },
        ),
        migrations.CreateModel(
            name='SectorDemand',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('industry', models.CharField(db_index=True, max_length=255)),
                ('year', models.IntegerField()),
                ('posting_count', models.IntegerField(default=0)),
                ('role', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='sector_demand', to='taxonomy.normalizedrole')),
            ],
            options={
                'ordering': ['industry', '-year'],
                'unique_together': {('industry', 'role', 'year')},
            },
        ),
    ]
