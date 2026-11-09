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


from django.contrib.auth import get_user_model


class Command(BaseCommand):
    help = 'Parse an Excel bulletin and seed the curriculum tables.'

    def add_arguments(self, parser):
        parser.add_argument('file', type=str, help='Path to the .xlsx bulletin file')
        parser.add_argument('--owner-email', default='planner@skillsense.rw',
                            help='Account the bulletins belong to (bulletins are personal). Default: the demo planner.')

    def handle(self, *args, **options):
        path = Path(options['file']).resolve()
        if not path.exists():
            self.stderr.write(self.style.ERROR(f'File not found: {path}'))
            return

        owner = get_user_model().objects.filter(email=options['owner_email']).first()
        if not owner:
            self.stderr.write(self.style.ERROR(
                f'No user with email {options["owner_email"]}. Run seed_admin first, or pass --owner-email.'))
            return

        parsed = parse_excel(path)
        if not parsed:
            self.stderr.write(self.style.ERROR('No departments found in the file.'))
            return

        for dept in parsed:
            CurriculumBulletin.objects.filter(
                uploaded_by=owner, department_code=dept['department_code'], is_active=True
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
                uploaded_by=owner,
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
