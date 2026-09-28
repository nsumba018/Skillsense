from collections import Counter, defaultdict

from django.db import transaction

from predictions.models import ForecastRun, RoleForecast
from uploads.models import JobPosting
from .geo import DISTRICTS_BY_PROVINCE, PROVINCES, UNSPECIFIED_DISTRICT, locate
from .models import GeographicDemand
from .skills import ROLE_SKILLS, extract_skills


def _posting_year(p):
    return (p.posted_date or p.created_at.date()).year


def _located_ict_postings():
    """Yield (posting, province, district_label) for ICT postings whose location is a place in Rwanda."""
    for p in JobPosting.objects.filter(is_ict=True).select_related('normalized_role'):
        place = locate(p.location_raw)
        if place:
            province, district = place
            yield p, province, district or UNSPECIFIED_DISTRICT


@transaction.atomic
def rebuild_geographic_demand():
    """Recompute GeographicDemand (province/district/role/year counts) from the job postings."""
    counts = Counter()
    for p, province, district in _located_ict_postings():
        if p.normalized_role_id:
            counts[(province, district, p.normalized_role_id, _posting_year(p))] += 1
    peak = defaultdict(int)
    for (_, _, _, year), n in counts.items():
        peak[year] = max(peak[year], n)
    GeographicDemand.objects.all().delete()
    GeographicDemand.objects.bulk_create([
        GeographicDemand(
            province=province, district=district, role_id=role_id, year=year,
            posting_count=n, demand_score=round(n / peak[year] * 100, 1),
        )
        for (province, district, role_id, year), n in counts.items()
    ])
    return len(counts)


def geographic_summary():
    """Where ICT postings are, by province and district, straight from the job postings."""
    total = JobPosting.objects.filter(is_ict=True).count()
    by_district = defaultdict(lambda: {'postings': 0, 'roles': Counter()})
    by_province = Counter()
    located = 0
    for p, province, district in _located_ict_postings():
        located += 1
        by_province[province] += 1
        row = by_district[(province, district)]
        row['postings'] += 1
        row['roles'][p.normalized_role.name if p.normalized_role else 'Unclassified'] += 1

    districts = sorted(
        (
            {
                'district': d, 'province': prov, 'postings': row['postings'],
                'top_role': row['roles'].most_common(1)[0][0],
                'roles': [{'name': n, 'count': c} for n, c in row['roles'].most_common(3)],
            }
            for (prov, d), row in by_district.items()
        ),
        key=lambda r: (-r['postings'], r['district']),
    )
    return {
        'total_ict_postings': total,
        'located_postings': located,
        'unlocated_postings': total - located,
        'by_province': [
            {'province': p, 'postings': by_province.get(p, 0),
             'share_pct': round(by_province.get(p, 0) / located * 100, 1) if located else 0.0,
             'districts_in_province': len(DISTRICTS_BY_PROVINCE[p])}
            for p in PROVINCES
        ],
        'by_district': districts,
    }


def latest_forecast_map():
    """{role_id: 1-year RoleForecast} from the latest forecast run (empty if none)."""
    run = ForecastRun.objects.first()
    if not run:
        return {}
    return {
        f.role_id: f
        for f in RoleForecast.objects.filter(forecast_run=run, horizon='1y').select_related('role')
    }


def analyze_curriculum(curriculum, forecast_map=None):
    """Compare what a curriculum teaches against forecast ICT demand.

    coverage(role) = share of that role's core skills the curriculum teaches.
    alignment score = coverage of each role weighted by its forecast demand index.
    """
    if forecast_map is None:
        forecast_map = latest_forecast_map()

    courses = []
    taught = set()
    for c in curriculum.courses.all():
        skills = sorted(extract_skills(f'{c.title}. {c.description}'))
        taught.update(skills)
        courses.append({'id': c.id, 'title': c.title, 'description': c.description, 'skills': skills})

    roles = []
    for f in forecast_map.values():
        needed = ROLE_SKILLS.get(f.role.name, set())
        covered = sorted(needed & taught)
        missing = sorted(needed - taught)
        roles.append({
            'role_id': f.role_id,
            'role_name': f.role.name,
            'demand_index': f.demand_index,
            'trend': f.trend_direction,
            'coverage_pct': round(len(covered) / len(needed) * 100, 1) if needed else 0.0,
            'covered_skills': covered,
            'missing_skills': missing,
        })
    roles.sort(key=lambda r: -r['demand_index'])

    total_demand = sum(r['demand_index'] for r in roles)
    score = (
        sum(r['demand_index'] * r['coverage_pct'] for r in roles) / total_demand if total_demand else 0.0
    )
    gaps = sorted(
        (r for r in roles if r['coverage_pct'] < 100),
        key=lambda r: -(r['demand_index'] * (100 - r['coverage_pct'])),
    )[:5]
    return {
        'alignment_score': round(score, 1),
        'skills_taught': sorted(taught),
        'courses': courses,
        'unmatched_courses': [c['title'] for c in courses if not c['skills']],
        'roles': roles,
        'top_gaps': gaps,
        'strengths': [r for r in roles if r['coverage_pct'] >= 50][:5],
    }
