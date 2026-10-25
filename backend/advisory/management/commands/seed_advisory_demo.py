"""
Fill the advisory app with realistic DEMO data so the advisor pages are not empty in development.

Every demo student has an email ending in @demo.auca.ac.rw, so they are easy to find and `--reset` removes
exactly those (and their assessments, pathways and placements) without touching real records.

    python manage.py seed_advisory_demo            # add demo data (does nothing if it is already there)
    python manage.py seed_advisory_demo --reset    # delete the demo data and create it afresh
    python manage.py seed_advisory_demo --clear    # delete the demo data only
"""
import math
import random
from datetime import date, timedelta

from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from django.utils import timezone

from accounts.models import User
from advisory import scoring
from advisory.models import Assessment, Placement, SavedPathway, StudentProfile
from advisory.skills_data import DEPT_CURRICULA, INNOVATION_COURSES, ROLES

DEMO_DOMAIN = '@demo.auca.ac.rw'

FIRST_F = ['Alice', 'Aline', 'Grace', 'Diane', 'Sandrine', 'Josiane', 'Christine', 'Beatrice', 'Clarisse', 'Yvonne',
           'Chantal', 'Mireille', 'Esther', 'Solange', 'Vestine', 'Anitha', 'Nadine', 'Ange', 'Joyce', 'Laetitia',
           'Divine', 'Raissa', 'Belise', 'Claudine']
FIRST_M = ['Jean', 'Eric', 'Patrick', 'Claude', 'Olivier', 'Emmanuel', 'Fabrice', 'Innocent', 'Didier', 'Samuel',
           'Thierry', 'Kevin', 'David', 'Bertrand', 'Cedric', 'Moses', 'Aime', 'Prince', 'Elie', 'Pacifique']
LAST = ['Mugabo', 'Uwase', 'Niyonzima', 'Mukamana', 'Habimana', 'Uwimana', 'Nsengiyumva', 'Ingabire', 'Hakizimana',
        'Mutesi', 'Ndayisaba', 'Umutoni', 'Bizimana', 'Kayitesi', 'Munyaneza', 'Uwineza', 'Nkurunziza', 'Mukeshimana',
        'Tuyishime', 'Iradukunda', 'Ishimwe', 'Niyonsenga', 'Murekatete', 'Rurangwa', 'Gasana', 'Karangwa', 'Mbabazi',
        'Nyirahabimana', 'Twagirayezu', 'Dusabimana']

COHORTS = ['Cohort 1 — 2025/2026', 'Cohort 2 — 2025/2026', 'Cohort 3 — 2026/2027']

# (department weights) and the employers that hire from each side
DEPT_WEIGHTS = [('se', 40), ('net', 20), ('fin', 22), ('ba', 18)]
EMPLOYERS_ICT = ['Irembo', 'MTN Rwanda', 'Airtel Rwanda', 'Andela', 'BK TecHouse', 'RISA', 'Zipline Rwanda',
                 'Awesomity Lab', 'Ampersand', 'Rwanda Revenue Authority', 'Bank of Kigali', 'KCB Bank Rwanda']
EMPLOYERS_BIZ = ['Bank of Kigali', 'I&M Bank Rwanda', 'Equity Bank Rwanda', 'KCB Bank Rwanda', 'Sanlam Rwanda',
                 'Rwanda Revenue Authority', 'PwC Rwanda', 'Deloitte Rwanda', 'Bralirwa', 'Inyange Industries',
                 'Hanga Group', 'World Vision Rwanda']
METHODS = ['Direct application', 'Referral', 'Career fair', 'Innovation Center', 'Internship conversion']
LOCATIONS = ['Kigali'] * 8 + ['Musanze', 'Huye', 'Rubavu']


def _pick_weighted(rng, pairs):
    total = sum(w for _, w in pairs)
    r = rng.uniform(0, total)
    for value, w in pairs:
        r -= w
        if r <= 0:
            return value
    return pairs[-1][0]


def _course_for(skill):
    for name, c in INNOVATION_COURSES.items():
        if any(scoring.is_skill_taught(skill, [s]) for s in c['skills']):
            return name, c
    return None, None


def _pathway_steps(skills, role, rng, done_ratio):
    _, _, missing = scoring.score_role(skills, role)
    steps = []
    for s in missing:
        course, c = _course_for(s)
        weeks = math.ceil(c['duration_weeks'] / len(c['skills'])) if c else 3
        steps.append({
            'skill': s,
            'source': f'Innovation Center: {course}' if course else 'Self-study / online certification',
            'duration_weeks': max(1, weeks),
            'completed': False,
        })
    for step in steps[: int(len(steps) * done_ratio)]:
        step['completed'] = True
    return steps


class Command(BaseCommand):
    help = 'Create (or remove) realistic demo students, assessments, pathways and placements for the advisor role.'

    def add_arguments(self, parser):
        parser.add_argument('--reset', action='store_true', help='Delete existing demo data, then create it again.')
        parser.add_argument('--clear', action='store_true', help='Delete existing demo data and stop.')
        parser.add_argument('--students', type=int, default=72, help='How many demo students to create (default 72).')
        parser.add_argument('--advisor-email', default='advisor@skillsense.rw', help='Advisor the students are assigned to.')
        parser.add_argument('--seed', type=int, default=2026, help='Random seed, so the data is repeatable.')

    def handle(self, *args, **opts):
        demo = StudentProfile.objects.filter(email__endswith=DEMO_DOMAIN)
        if opts['reset'] or opts['clear']:
            n = demo.count()
            demo.delete()  # assessments, pathways and placements cascade
            self.stdout.write(f'Removed {n} demo students and everything attached to them.')
            if opts['clear']:
                return
        elif demo.exists():
            self.stdout.write(self.style.WARNING(
                f'{demo.count()} demo students already exist. Use --reset to rebuild them.'))
            return

        advisor = User.objects.filter(email=opts['advisor_email']).first()
        if not advisor:
            raise CommandError(f'No user with email {opts["advisor_email"]}. Run seed_admin first, or pass --advisor-email.')

        rng = random.Random(opts['seed'])
        with transaction.atomic():
            counts = self._create(rng, advisor, opts['students'])
        self.stdout.write(self.style.SUCCESS(
            'Demo data created: {students} students, {assessments} assessments, {pathways} pathways, '
            '{placements} placements.'.format(**counts)))
        self.stdout.write(f'Sign in as {advisor.email} to see it. Remove it any time with --clear.')

    # ------------------------------------------------------------------

    def _create(self, rng, advisor, n):
        today = timezone.localdate()
        roles_by_dept = {d: [r for r in ROLES if r['dept'] == d] for d in ('se', 'net', 'fin', 'ba')}
        used_emails, counts = set(), {'students': 0, 'assessments': 0, 'pathways': 0, 'placements': 0}

        for i in range(n):
            dept = _pick_weighted(rng, DEPT_WEIGHTS)
            female = rng.random() < 0.62
            first = rng.choice(FIRST_F if female else FIRST_M)
            last = rng.choice(LAST)
            email = f'{first}.{last}{rng.randint(1, 99)}{DEMO_DOMAIN}'.lower()
            while email in used_emails:
                email = f'{first}.{last}{rng.randint(100, 999)}{DEMO_DOMAIN}'.lower()
            used_emails.add(email)

            # life stage: ~56% already graduated (2025 or 2026), the rest still studying
            graduated = rng.random() < 0.56
            grad_year = rng.choice([2025, 2026]) if graduated else rng.choice([2027, 2028])
            graduated_on = None
            if graduated:
                graduated_on = date(grad_year, rng.choice([6, 7, 8]), rng.randint(5, 25))
                if graduated_on > today:
                    graduated_on = today - timedelta(days=rng.randint(20, 90))

            # two realistic target roles for the department, and a skill set that is a partial match for the first
            pool = roles_by_dept[dept]
            targets = rng.sample(pool, k=min(2, len(pool)))
            target_names = [t['name'] for t in targets]
            readiness = rng.choice([0.25, 0.35, 0.45, 0.55, 0.65, 0.75, 0.85])  # spread, with a visible low tail
            required = targets[0]['skills']
            have = rng.sample(required, k=max(1, round(len(required) * readiness)))
            curriculum = sorted(DEPT_CURRICULA[dept])
            extras = rng.sample(curriculum, k=min(3, len(curriculum)))
            skills = list(dict.fromkeys(have + extras))

            student = StudentProfile.objects.create(
                first_name=first, last_name=last, email=email, department=dept,
                graduation_year=grad_year, graduated_on=graduated_on,
                status=StudentProfile.Status.GRADUATED if graduated else StudentProfile.Status.ACTIVE,
                skills=skills, target_roles=target_names, gender='F' if female else 'M',
                innovation_center_cohort=rng.choice(COHORTS), advisor=advisor,
                notes='Demo data: created by seed_advisory_demo.',
            )
            counts['students'] += 1

            # most students have been assessed, some twice; leave ~12% never assessed so the dashboard shows them
            if rng.random() > 0.12:
                for role in target_names[: rng.choice([1, 1, 2])]:
                    result = scoring.assess(skills, role)
                    a = Assessment.objects.create(student=student, assessed_by=advisor, **result)
                    when = timezone.now() - timedelta(days=rng.randint(2, 75), hours=rng.randint(0, 20))
                    Assessment.objects.filter(pk=a.pk).update(created_at=when, updated_at=when)
                    counts['assessments'] += 1

            # a saved pathway for roughly a third of the students
            if rng.random() < 0.34:
                role = target_names[0]
                steps = _pathway_steps(skills, role, rng, done_ratio=rng.choice([0, 0.25, 0.5, 0.75]))
                if steps:
                    done = sum(1 for s in steps if s['completed'])
                    SavedPathway.objects.create(
                        student=student, target_role=role, steps=steps, created_by=advisor,
                        estimated_months=max(1, math.ceil(sum(s['duration_weeks'] for s in steps) / 4.345)),
                        progress_pct=round(done / len(steps) * 100, 1),
                    )
                    counts['pathways'] += 1
                    # some unfinished pathways have gone quiet, so "stalled" shows up on the dashboard
                    if done < len(steps) and rng.random() < 0.3:
                        quiet = timezone.now() - timedelta(days=rng.randint(35, 90))
                        SavedPathway.objects.filter(student=student).update(updated_at=quiet)

            # ~75% of graduates are placed, starting 3 to 14 weeks after graduating
            if graduated and rng.random() < 0.75:
                start = graduated_on + timedelta(days=rng.randint(21, 100))
                if start > today:
                    start = today - timedelta(days=rng.randint(1, 20))
                is_ict = targets[0]['sector'] == 'ict'
                Placement.objects.create(
                    student=student, recorded_by=advisor,
                    role_title=target_names[0],
                    company=rng.choice(EMPLOYERS_ICT if is_ict else EMPLOYERS_BIZ),
                    location=rng.choice(LOCATIONS), start_date=start,
                    contract_type=rng.choices(
                        ['full_time', 'internship', 'contract', 'freelance'], weights=[68, 18, 10, 4])[0],
                    placement_method=rng.choice(METHODS),
                )
                student.status = StudentProfile.Status.PLACED
                student.save(update_fields=['status', 'updated_at'])
                counts['placements'] += 1

        return counts
