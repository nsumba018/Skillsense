import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
    ]

    operations = [
        migrations.CreateModel(
            name='RoleGroup',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=100, unique=True)),
                ('description', models.TextField(blank=True, default='')),
                ('sort_order', models.IntegerField(default=0)),
            ],
            options={
                'ordering': ['sort_order', 'name'],
            },
        ),
        migrations.CreateModel(
            name='RoleFamily',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=100)),
                ('role_group', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='families', to='taxonomy.rolegroup')),
            ],
            options={
                'ordering': ['role_group__sort_order', 'name'],
                'verbose_name_plural': 'Role families',
                'unique_together': {('name', 'role_group')},
            },
        ),
        migrations.CreateModel(
            name='NormalizedRole',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('name', models.CharField(max_length=100, unique=True)),
                ('emergence_year', models.IntegerField(help_text="Year this role first appeared in Rwanda's ICT market")),
                ('is_emerging', models.BooleanField(default=False, help_text='True for Layer 2 emerging roles (AI/ML, etc.) not yet in Rwanda')),
                ('global_trend_signal', models.FloatField(blank=True, help_text='Global trend strength 0-100, nullable — for Layer 2 future use', null=True)),
                ('description', models.TextField(blank=True, default='')),
                ('role_family', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='roles', to='taxonomy.rolefamily')),
            ],
            options={
                'ordering': ['name'],
            },
        ),
        migrations.CreateModel(
            name='HistoricalDemand',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year', models.IntegerField(db_index=True)),
                ('role_demand_index', models.FloatField(help_text='Demand index 0-100, max within each year = 100')),
                ('role_share_within_ict_pct', models.FloatField(help_text="Role's share of ICT employment in percent")),
                ('role_employment_proxy', models.FloatField(help_text='Estimated number of people employed in this role')),
                ('data_basis', models.CharField(blank=True, default='', help_text="Source of this data point (e.g., 'LFS_microdata', 'back_extrapolation')", max_length=100)),
                ('synthetic_flag', models.BooleanField(default=False, help_text='True if this row is back-extrapolated (2005-2016)')),
                ('role', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='historical_demand', to='taxonomy.normalizedrole')),
            ],
            options={
                'ordering': ['year', 'role__name'],
                'unique_together': {('year', 'role')},
            },
        ),
        migrations.CreateModel(
            name='MacroIndicator',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('year', models.IntegerField(unique=True)),
                ('total_employment', models.BigIntegerField()),
                ('ict_employment', models.IntegerField()),
                ('ict_employment_share_pct', models.FloatField()),
                ('labour_force_participation_rate_pct', models.FloatField()),
                ('unemployment_rate_pct', models.FloatField()),
                ('employment_to_population_ratio_pct', models.FloatField()),
                ('tertiary_employment_count', models.BigIntegerField()),
                ('data_source', models.CharField(blank=True, default='', help_text="e.g., 'NISR_LFS_2023', 'extrapolated'", max_length=100)),
            ],
            options={
                'ordering': ['year'],
            },
        ),
    ]
