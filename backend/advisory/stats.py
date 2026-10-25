"""Read-side aggregation for the advisory app: dashboard, placements, job market and report data."""
from collections import Counter, defaultdict
from datetime import date, timedelta

from django.core.cache import cache
from django.db.models import Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone

from uploads.models import JobPosting

from . import scoring
from .models import Assessment, Placement, SavedPathway, StudentProfile

TRACKED_SECTORS = ('ict-technology', 'finance-business')
DEPARTMENTS = [code for code, _ in StudentProfile.Department.choices]
DEPT_LABELS = dict(StudentProfile.Department.choices)
ATTENTION_BELOW = 50  # readiness % under which a student needs a conversation
ATTENTION_LIMIT = 50  # the dashboard shows the first few and lets the advisor expand the rest
STALLED_DAYS = 30  # a saved pathway untouched this long, and not finished, counts as stalled
SKILL_SCAN_LIMIT = 1000  # postings read when counting skill demand
MATCH_SCAN_LIMIT = 1500  # postings scored when matching a student to the market


# ── helpers ──────────────────────────────────────────────────────────

def _month_keys(n, today=None):
    """The last `n` months as 'YYYY-MM', oldest first, ending with the current month."""
    today = today or timezone.localdate()
    y, m = today.year, today.month
    keys = []
    for _ in range(n):
        keys.append(f'{y:04d}-{m:02d}')
        m -= 1
        if m == 0:
            y, m = y - 1, 12
    return keys[::-1]


def _rate(part, whole):
    return round(part / whole * 100, 1) if whole else 0.0


def latest_assessments(student_ids=None):
    """{student_id: most recent Assessment}."""
    qs = Assessment.objects.order_by('student_id', '-created_at').distinct('student_id')
    if student_ids is not None:
        qs = qs.filter(student_id__in=student_ids)
    return {a.student_id: a for a in qs}


# ── job postings ─────────────────────────────────────────────────────

def tracked_postings():
    """Postings in the two sectors AUCA tracks (ICT & Technology, Finance & Business)."""
    return JobPosting.objects.filter(
        Q(sector__slug__in=TRACKED_SECTORS) | Q(sector__isnull=True, is_ict=True)
    )


def filter_postings(params):
    """Apply the Job Navigator filters (sector, role, q, location, days) to the tracked postings."""
    qs = tracked_postings()
    sector = params.get('sector')
    if sector == 'ict-technology':
        qs = qs.filter(Q(sector__slug=sector) | Q(sector__isnull=True, is_ict=True))
    elif sector == 'finance-business':
        qs = qs.filter(sector__slug=sector)
    role = params.get('role')
    if role:
        r = scoring.ROLE_BY_NAME.get(role)
        if r:
            names = {r['name'], r['name'].replace('-', ' ').replace(' / ', ' ')}
            cond = Q()
            for n in names:
                cond |= Q(title__icontains=n)
            qs = qs.filter(cond | Q(normalized_role__name__icontains=r['name']))
    q = (params.get('q') or '').strip()
    if q:
        qs = qs.filter(Q(title__icontains=q) | Q(company__icontains=q))
    location = (params.get('location') or '').strip()
    if location.lower() == 'other':
        # anywhere in Rwanda outside Kigali City, using the same place lookup as the Geography page
        from analytics.geo import locate
        places = qs.exclude(location_raw='').values_list('location_raw', flat=True).distinct()
        keep = {loc for loc in places if locate(loc) and locate(loc)[0] != 'Kigali City' and 'kigali' not in loc.lower()}
        qs = qs.filter(location_raw__in=keep)
    elif location:
        qs = qs.filter(location_raw__icontains=location)
    days = params.get('days')
    if days and str(days).isdigit():
        qs = qs.filter(posted_date__gte=timezone.localdate() - timedelta(days=int(days)))
    return qs


def _role_key(title, normalized):
    if normalized:
        return normalized
    r = scoring.role_for_title(title)
    return r['name'] if r else (title or '').strip()


def hot_roles(qs, limit=8, today=None):
    """Roles with the most postings in the last 90 days, each with a trend against the 90 days before."""
    today = today or timezone.localdate()
    recent_start, prior_start = today - timedelta(days=90), today - timedelta(days=180)
    total, recent, prior = Counter(), Counter(), Counter()
    for title, normalized, posted in qs.values_list('title', 'normalized_role__name', 'posted_date'):
        key = _role_key(title, normalized)
        if not key:
            continue
        total[key] += 1
        if posted and posted >= recent_start:
            recent[key] += 1
        elif posted and posted >= prior_start:
            prior[key] += 1
    if not recent:
        # No dated postings in the window (e.g. a historical upload): rank by all-time count.
        return [{'role': k, 'postings': n, 'trend': 'stable'} for k, n in total.most_common(limit)]
    out = []
    for key, n in recent.most_common(limit):
        before = prior.get(key, 0)
        trend = 'rising' if n > before * 1.2 and n > before else 'falling' if n < before * 0.8 else 'stable'
        out.append({'role': key, 'postings': n, 'trend': trend})
    return out


def top_demanded_skills(qs, limit=15, cache_key=None):
    """How many of the most recent postings mention each catalogue skill."""
    if cache_key:
        hit = cache.get(cache_key)
        if hit is not None:
            return hit[:limit]
    counts = Counter()
    rows = qs.order_by('-posted_date', '-id').values_list('title', 'description', 'raw_text')[:SKILL_SCAN_LIMIT]
    for title, desc, raw in rows:
        # scraped postings keep their text in raw_text; uploaded ones in description
        for s in scoring.extract_skills(f'{title} {(desc or raw or "")[:2500]}'):
            counts[s] += 1
    out = [{'skill': s, 'count': n} for s, n in counts.most_common()]
    if cache_key:
        cache.set(cache_key, out, 600)
    return out[:limit]


def skill_demand_map():
    """{catalogue skill: number of tracked postings that mention it} (cached for ten minutes)."""
    rows = top_demanded_skills(tracked_postings(), limit=10**6, cache_key='advisory:top-skills')
    return {r['skill']: r['count'] for r in rows}


def priority_skills(missing, limit=5):
    """
    The few gaps worth closing first: ranked by how many postings ask for the skill and how quickly it can be
    learned (postings per week of study), so a widely demanded, short course comes before a rare, long one.
    """
    demand = skill_demand_map()
    ranked = []
    for skill in missing:
        source, weeks = scoring.skill_learning(skill)
        postings = demand.get(skill, 0)
        ranked.append({'skill': skill, 'postings': postings, 'weeks': weeks, 'source': source, '_score': postings / weeks})
    ranked.sort(key=lambda r: (-r['_score'], r['weeks'], r['skill']))
    for r in ranked:
        del r['_score']
    return ranked[:limit]


def _monthly_counts(qs, months=6):
    keys = _month_keys(months)
    start = date(int(keys[0][:4]), int(keys[0][5:]), 1)
    rows = (
        qs.filter(posted_date__gte=start)
        .annotate(m=TruncMonth('posted_date')).values('m').annotate(n=Count('id'))
    )
    by = {r['m'].strftime('%Y-%m'): r['n'] for r in rows}
    return [{'month': k, 'count': by.get(k, 0)} for k in keys]


def job_insights(qs):
    """Company hiring patterns, locations and per-role demand sparklines for a filtered posting set."""
    top_companies = [
        {'company': r['company'], 'count': r['n']}
        for r in qs.exclude(company='').values('company').annotate(n=Count('id')).order_by('-n', 'company')[:10]
    ]
    top_locations = [
        {'location': r['location_raw'], 'count': r['n']}
        for r in qs.exclude(location_raw='').values('location_raw').annotate(n=Count('id')).order_by('-n')[:8]
    ]
    keys = _month_keys(6)
    start = date(int(keys[0][:4]), int(keys[0][5:]), 1)
    per_role_month = defaultdict(Counter)
    totals = Counter()
    for title, normalized, posted in qs.values_list('title', 'normalized_role__name', 'posted_date'):
        key = _role_key(title, normalized)
        if not key:
            continue
        totals[key] += 1
        if posted and posted >= start:
            per_role_month[key][posted.strftime('%Y-%m')] += 1
    roles = []
    for key, n in totals.most_common(8):
        series = [per_role_month[key].get(k, 0) for k in keys]
        first, last = sum(series[:3]), sum(series[3:])
        trend = 'rising' if last > first else 'declining' if last < first else 'stable'
        roles.append({'role': key, 'postings': n, 'series': series, 'trend': trend})
    return {
        'total': qs.count(),
        'top_companies': top_companies,
        'top_locations': top_locations,
        'monthly': _monthly_counts(qs),
        'roles': roles,
        'months': keys,
    }


def posting_card(p, student_skills=None):
    """One posting as the Job Navigator shows it, with the skills it asks for (and, for a student, how many they have)."""
    text = f'{p.title} {(p.description or p.raw_text or "")[:2500]}'
    skills = scoring.extract_skills(text)
    role = scoring.role_for_title(p.title)
    source = 'posting'
    if len(skills) < 3 and role:
        skills, source = list(role['skills']), 'role'
    matched = [s for s in skills if scoring.has_skill(student_skills, s)] if student_skills is not None else None
    return {
        'id': p.id,
        'title': p.title,
        'company': p.company,
        'location': p.location_raw,
        'posted_date': p.posted_date,
        'source': p.source,
        'source_url': p.source_url,
        'sector': p.sector.slug if p.sector_id else ('ict-technology' if p.is_ict else None),
        'role': role['name'] if role else None,
        'skills': skills,
        'skills_source': source,
        'matched': len(matched) if matched is not None else None,
        'required': len(skills),
    }


# ── dashboard ────────────────────────────────────────────────────────

def dashboard():
    today = timezone.localdate()
    open_qs = tracked_postings().filter(Q(closing_date__isnull=True) | Q(closing_date__gte=today))

    students = StudentProfile.objects.all()
    active = students.filter(status__in=[StudentProfile.Status.ACTIVE, StudentProfile.Status.GRADUATED])
    latest = latest_assessments()

    by_dept = {d: 0 for d in DEPARTMENTS}
    for row in active.values('department').annotate(n=Count('id')):
        by_dept[row['department']] = row['n']

    scores = [latest[s.id].readiness_score for s in active if s.id in latest]
    now = timezone.now()
    stalled = {}
    for pw in SavedPathway.objects.filter(progress_pct__lt=100, updated_at__lt=now - timedelta(days=STALLED_DAYS)):
        stalled[pw.student_id] = max(stalled.get(pw.student_id, 0), (now - pw.updated_at).days)
    attention = []
    for s in active:
        a = latest.get(s.id)
        reasons = []
        if a is None:
            reasons.append('Not assessed yet')
        elif a.readiness_score < ATTENTION_BELOW:
            reasons.append(f'Readiness {round(a.readiness_score)}%')
        if s.id in stalled:
            reasons.append(f'Pathway stalled for {stalled[s.id]} days')
        if reasons:
            attention.append({
                'id': s.id, 'name': s.full_name, 'department': s.department,
                'readiness': a.readiness_score if a else None,
                'last_assessed': a.created_at.date().isoformat() if a else None,
                'reasons': reasons,
            })
    # never assessed first, then the lowest readiness, then students whose only problem is a stalled pathway
    attention.sort(key=lambda r: (r['readiness'] is not None, r['readiness'] if r['readiness'] is not None else 0, r['name']))

    placed_recent = [
        {
            'student': p.student.full_name, 'role': p.role_title, 'company': p.company,
            'date': p.start_date.isoformat(),
        }
        for p in Placement.objects.select_related('student')[:10]
    ]

    tracked = tracked_postings()
    return {
        'active_students': active.count(),
        'average_readiness': round(sum(scores) / len(scores), 1) if scores else None,
        'assessed_students': len(scores),
        'placement_rate': placement_stats()['placement_rate'],
        'open_positions': open_qs.count(),
        'students_by_department': by_dept,
        'students_needing_attention': attention[:ATTENTION_LIMIT],
        'attention_total': len(attention),
        'hot_roles': hot_roles(tracked),
        'recent_placements': placed_recent,
        'top_demanded_skills': top_demanded_skills(tracked, 15, cache_key='advisory:top-skills'),
    }


# ── placements ───────────────────────────────────────────────────────

def _eligible_students(filters):
    qs = StudentProfile.objects.filter(
        status__in=[StudentProfile.Status.GRADUATED, StudentProfile.Status.PLACED]
    )
    if filters.get('graduation_year'):
        qs = qs.filter(graduation_year=filters['graduation_year'])
    if filters.get('cohort'):
        qs = qs.filter(innovation_center_cohort=filters['cohort'])
    if filters.get('department'):
        qs = qs.filter(department=filters['department'])
    return qs


def placement_stats(filters=None):
    filters = filters or {}
    eligible = list(_eligible_students(filters))
    ids = [s.id for s in eligible]
    placed_ids = {s.id for s in eligible if s.status == StudentProfile.Status.PLACED}
    placements = list(Placement.objects.filter(student_id__in=ids).select_related('student').order_by('start_date'))

    first_start = {}
    for p in placements:  # ordered by start_date, so the first seen is the earliest
        first_start.setdefault(p.student_id, p.start_date)
    days = [
        max(0, (first_start[s.id] - s.graduated_on).days)
        for s in eligible if s.graduated_on and s.id in first_start
    ]

    by_department = []
    for d in DEPARTMENTS:
        group = [s for s in eligible if s.department == d]
        placed = sum(1 for s in group if s.id in placed_ids)
        dept_days = [
            max(0, (first_start[s.id] - s.graduated_on).days)
            for s in group if s.graduated_on and s.id in first_start
        ]
        by_department.append({
            'department': d, 'placed': placed, 'total': len(group), 'rate': _rate(placed, len(group)),
            'avg_days': round(sum(dept_days) / len(dept_days)) if dept_days else None,
        })

    by_gender = {}
    for g, label in (('M', 'M'), ('F', 'F'), ('', 'unspecified')):
        group = [s for s in eligible if s.gender == g]
        if group or g in ('M', 'F'):
            by_gender[label] = {'placed': sum(1 for s in group if s.id in placed_ids), 'total': len(group)}
    female_placed = by_gender.get('F', {}).get('placed', 0)

    keys = _month_keys(12)
    per_month = Counter(p.start_date.strftime('%Y-%m') for p in placements)

    # Placement rate over time: by the end of each month, what share of the graduates so far had started a job?
    def graduated_by(s):
        d = s.graduated_on or (date(s.graduation_year, 6, 30) if s.graduation_year else s.created_at.date())
        return min(d, first_start[s.id]) if s.id in first_start else d  # a placement implies they had finished

    grad_dates = {s.id: graduated_by(s) for s in eligible}
    rate_series = []
    for k in keys:
        y, m = int(k[:4]), int(k[5:])
        end = (date(y + (m == 12), m % 12 + 1, 1)) - timedelta(days=1)
        grads = sum(1 for d in grad_dates.values() if d <= end)
        placed_by = sum(1 for sid, d in first_start.items() if d <= end and sid in grad_dates)
        rate_series.append({'month': k, 'graduates': grads, 'placed': placed_by, 'rate': _rate(placed_by, grads)})

    return {
        'total_placed': len(placed_ids),
        'total_graduated': len(eligible),
        'placement_rate': _rate(len(placed_ids), len(eligible)),
        'avg_days_to_placement': round(sum(days) / len(days)) if days else None,
        'by_department': by_department,
        'by_gender': by_gender,
        'female_share_of_placed': _rate(female_placed, len(placed_ids)),
        'top_employers': [{'company': c, 'count': n} for c, n in Counter(p.company for p in placements).most_common(10)],
        'by_role': [{'role': r, 'count': n} for r, n in Counter(p.role_title for p in placements).most_common(10)],
        'by_month': [{'month': k, 'count': per_month.get(k, 0)} for k in keys],
        'rate_series': rate_series,
        'this_month': per_month.get(keys[-1], 0),
        'by_contract': [{'contract': c, 'count': n} for c, n in Counter(p.contract_type for p in placements).most_common()],
        'by_method': [{'method': m or 'Not recorded', 'count': n} for m, n in Counter(p.placement_method for p in placements).most_common()],
    }


# ── reports ──────────────────────────────────────────────────────────

REPORT_TYPES = ('student_readiness', 'cohort_outcomes', 'employer_demand', 'skills_gap')


def _stamp():
    return timezone.now().isoformat(timespec='seconds')


def student_readiness_report(student):
    roles = student.target_roles or [
        a['role'] for a in sorted(
            ({'role': r['name'], 'score': scoring.score_role(student.skills, r['name'])[0]} for r in scoring.ROLES),
            key=lambda a: -a['score'],
        )[:3]
    ]
    assessments = [scoring.assess(student.skills, r) for r in roles]
    for a in assessments:
        a['priority_skills'] = priority_skills(a['missing_skills'])
    return {
        'type': 'student_readiness',
        'title': f'Student Readiness Report: {student.full_name}',
        'generated_at': _stamp(),
        'student': {
            'id': student.id, 'name': student.full_name, 'email': student.email,
            'department': student.department, 'department_label': DEPT_LABELS[student.department],
            'graduation_year': student.graduation_year, 'status': student.status,
            'cohort': student.innovation_center_cohort, 'skills': student.skills, 'target_roles': student.target_roles,
        },
        'targets_inferred': not student.target_roles,
        'assessments': assessments,
        'pathways': [
            {
                'target_role': p.target_role, 'progress_pct': p.progress_pct,
                'estimated_months': p.estimated_months, 'steps': p.steps,
            }
            for p in student.pathways.all()
        ],
        'placements': [
            {'role_title': p.role_title, 'company': p.company, 'start_date': p.start_date.isoformat(),
             'contract_type': p.contract_type}
            for p in student.placements.all()
        ],
    }


def cohort_outcomes_report(filters):
    stats = placement_stats(filters)
    students = _eligible_students(filters)
    latest = latest_assessments([s.id for s in students])
    scores = [a.readiness_score for a in latest.values()]
    label = ', '.join(
        f'{k.replace("_", " ")}: {v}' for k, v in filters.items() if v
    ) or 'All graduates'
    return {
        'type': 'cohort_outcomes',
        'title': 'Cohort Outcomes Report',
        'generated_at': _stamp(),
        'scope': label,
        'filters': {k: v for k, v in filters.items() if v},
        'average_readiness': round(sum(scores) / len(scores), 1) if scores else None,
        'assessed_students': len(scores),
        **stats,
    }


def employer_demand_report(sector=None):
    qs = tracked_postings()
    if sector in TRACKED_SECTORS:
        qs = filter_postings({'sector': sector})
    insights = job_insights(qs)
    return {
        'type': 'employer_demand',
        'title': 'Employer Demand Brief',
        'generated_at': _stamp(),
        'sector': sector or 'all',
        'total_postings': insights['total'],
        'top_roles': hot_roles(qs, 10),
        'top_skills': top_demanded_skills(qs, 15, cache_key=f'advisory:top-skills:{sector or "all"}'),
        'top_companies': insights['top_companies'],
        'top_locations': insights['top_locations'],
        'monthly': insights['monthly'],
    }


def skills_gap_report():
    latest = latest_assessments()
    students = {s.id: s for s in StudentProfile.objects.filter(id__in=latest.keys())}
    missing = Counter()
    by_role = defaultdict(list)
    by_dept = defaultdict(list)
    for sid, a in latest.items():
        missing.update(a.missing_skills)
        by_role[a.target_role].append(a.readiness_score)
        by_dept[students[sid].department].append(a.readiness_score)
    n = len(latest)
    return {
        'type': 'skills_gap',
        'title': 'Skills Gap Summary',
        'generated_at': _stamp(),
        'assessed_students': n,
        'most_missing_skills': [{'skill': s, 'count': c, 'pct': _rate(c, n)} for s, c in missing.most_common(15)],
        'lowest_readiness_roles': sorted(
            ({'role': r, 'students': len(v), 'avg_readiness': round(sum(v) / len(v), 1)} for r, v in by_role.items()),
            key=lambda x: x['avg_readiness'],
        )[:8],
        'by_department': [
            {'department': d, 'students': len(by_dept[d]),
             'avg_readiness': round(sum(by_dept[d]) / len(by_dept[d]), 1) if by_dept[d] else None}
            for d in DEPARTMENTS
        ],
    }


def report_table(data):
    """Flatten a report to CSV rows: [(section, [header...], [[row...], ...]), ...]."""
    t = data['type']
    if t == 'student_readiness':
        s = data['student']
        return [
            ('Student', ['Name', 'Department', 'Graduation year', 'Status', 'Cohort', 'Skills'],
             [[s['name'], s['department_label'], s['graduation_year'] or '', s['status'], s['cohort'], '; '.join(s['skills'])]]),
            ('Readiness by role', ['Target role', 'Readiness %', 'Matched skills', 'Missing skills'],
             [[a['target_role'], a['readiness_score'], '; '.join(a['matched_skills']), '; '.join(a['missing_skills'])]
              for a in data['assessments']]),
        ]
    if t == 'cohort_outcomes':
        return [
            ('Summary', ['Scope', 'Graduates', 'Placed', 'Placement rate %', 'Avg days to placement', 'Avg readiness %'],
             [[data['scope'], data['total_graduated'], data['total_placed'], data['placement_rate'],
               data['avg_days_to_placement'] if data['avg_days_to_placement'] is not None else '',
               data['average_readiness'] if data['average_readiness'] is not None else '']]),
            ('By department', ['Department', 'Placed', 'Graduates', 'Rate %'],
             [[DEPT_LABELS[d['department']], d['placed'], d['total'], d['rate']] for d in data['by_department']]),
            ('Top employers', ['Company', 'Placements'], [[e['company'], e['count']] for e in data['top_employers']]),
            ('By role', ['Role', 'Placements'], [[r['role'], r['count']] for r in data['by_role']]),
        ]
    if t == 'employer_demand':
        return [
            ('Top roles', ['Role', 'Postings (last 90 days)', 'Trend'],
             [[r['role'], r['postings'], r['trend']] for r in data['top_roles']]),
            ('Most demanded skills', ['Skill', 'Postings mentioning'], [[s['skill'], s['count']] for s in data['top_skills']]),
            ('Top hiring companies', ['Company', 'Postings'], [[c['company'], c['count']] for c in data['top_companies']]),
        ]
    return [
        ('Most common missing skills', ['Skill', 'Students missing it', '% of assessed'],
         [[s['skill'], s['count'], s['pct']] for s in data['most_missing_skills']]),
        ('Lowest readiness roles', ['Role', 'Students', 'Avg readiness %'],
         [[r['role'], r['students'], r['avg_readiness']] for r in data['lowest_readiness_roles']]),
        ('By department', ['Department', 'Students assessed', 'Avg readiness %'],
         [[DEPT_LABELS[d['department']], d['students'], d['avg_readiness'] if d['avg_readiness'] is not None else '']
          for d in data['by_department']]),
    ]
