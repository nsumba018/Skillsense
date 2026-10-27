"""
Seed the curriculum DB from an Excel bulletin file.

Usage:
  python manage.py seed_bulletins "../Networks -Software and InfoMgt.xlsx"
"""
from pathlib import Path
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand

from curriculum.models import CurriculumBulletin, BulletinCourse
from curriculum.parser import parse_excel


class Command(BaseCommand):
    help = 'Parse an Excel bulletin and seed the curriculum tables.'

    def add_arguments(self, parser):
        parser.add_argument('file', type=str, help='Path to the .xlsx bulletin file')

    def handle(self, *args, **options):
        path = Path(options['file']).resolve()
        if not path.exists():
            self.stderr.write(self.style.ERROR(f'File not found: {path}'))
            return

        parsed = parse_excel(path)
        if not parsed:
            self.stderr.write(self.style.ERROR('No departments found in the file.'))
            return

        for dept in parsed:
            CurriculumBulletin.objects.filter(
                department_code=dept['department_code'], is_active=True
            ).update(is_active=False)

            with open(path, 'rb') as f:
                file_content = ContentFile(f.read(), name=path.name)

            bulletin = CurriculumBulletin.objects.create(
                department_code=dept['department_code'],
                department_name=dept['department_name'],
                faculty=dept['faculty'],
                file=file_content,
                original_filename=path.name,
                total_credits=dept['total_credits'],
                total_semesters=dept['total_semesters'],
                total_courses=len(dept['courses']),
                is_active=True,
            )
            BulletinCourse.objects.bulk_create([
                BulletinCourse(
                    bulletin=bulletin,
                    semester=c['semester'],
                    name=c['name'],
                    credits=c['credits'],
                    skills=c['skills'],
                )
                for c in dept['courses']
            ])
            self.stdout.write(self.style.SUCCESS(
                f'  {dept["department_name"]}: {len(dept["courses"])} courses, {dept["total_credits"]} credits'
            ))

        self.stdout.write(self.style.SUCCESS(f'\nSeeded {len(parsed)} department(s) from {path.name}'))
