from collections import Counter, defaultdict

from django.db import transaction
from django.db.models import Count

from predictions.models import ForecastRun, RoleForecast
from uploads.models import JobPosting
from .geo import DISTRICTS_BY_PROVINCE, PROVINCES, UNSPECIFIED_DISTRICT, locate
from .models import GeographicDemand
from .skills import ROLE_SKILLS, extract_skills


def _posting_year(p):
    return (p.posted_date or p.created_at.date()).year


def _located_postings(sector_slug=None):
    """Yield (posting, province, district_label) for postings whose location is a place in Rwanda."""
    qs = JobPosting.objects.select_related('normalized_role', 'sector')
    if sector_slug:
        qs = qs.filter(sector__slug=sector_slug)
    for p in qs:
        place = locate(p.location_raw)
        if place:
            province, district = place
            yield p, province, district or UNSPECIFIED_DISTRICT


@transaction.atomic
def rebuild_geographic_demand():
    """Recompute GeographicDemand (province/district/role/year counts) from ICT job postings."""
    counts = Counter()
    for p, province, district in _located_postings('ict-technology'):
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


def geographic_summary(sector_slug=None):
    """Where postings are, by province and district. Optionally filtered by sector."""
    qs = JobPosting.objects.all()
    if sector_slug:
        qs = qs.filter(sector__slug=sector_slug)
    total = qs.count()

    by_district = defaultdict(lambda: {'postings': 0, 'titles': Counter()})
    by_province = Counter()
    located = 0
    for p, province, district in _located_postings(sector_slug):
        located += 1
        by_province[province] += 1
        row = by_district[(province, district)]
        row['postings'] += 1
        label = p.normalized_role.name if p.normalized_role else p.title
        row['titles'][label] += 1

    districts = sorted(
        (
            {
                'district': d, 'province': prov, 'postings': row['postings'],
                'top_role': row['titles'].most_common(1)[0][0],
                'roles': [{'name': n, 'count': c} for n, c in row['titles'].most_common(3)],
            }
            for (prov, d), row in by_district.items()
        ),
        key=lambda r: (-r['postings'], r['district']),
    )
    return {
        'total_postings': total,
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


def sector_top_positions(sector_slug=None, limit=10):
    """Top job titles by posting count, optionally filtered by sector."""
    qs = JobPosting.objects.filter(sector__isnull=False)
    if sector_slug:
        qs = qs.filter(sector__slug=sector_slug)
    rows = (
        qs.values('title')
        .annotate(count=Count('id'))
        .order_by('-count')[:limit]
    )
    return [{'title': r['title'], 'count': r['count']} for r in rows]


def sector_role_taxonomy(sector_slug):
    """Return job titles for a non-ICT sector, grouped alphabetically by first letter."""
    qs = JobPosting.objects.filter(sector__slug=sector_slug).select_related('sector')
    if not qs.exists():
        return {'sector_name': '', 'total': 0, 'groups': []}

    sector_name = qs.first().sector.name
    title_counts = (
        qs.values('title')
        .annotate(count=Count('id'))
        .order_by('title')
    )

    groups = defaultdict(list)
    for row in title_counts:
        letter = row['title'][0].upper() if row['title'] else '#'
        groups[letter].append({'title': row['title'], 'count': row['count']})

    return {
        'sector_name': sector_name,
        'total': sum(r['count'] for r in title_counts),
        'groups': [
            {'letter': k, 'roles': v}
            for k, v in sorted(groups.items())
        ],
    }


def sector_role_detail(sector_slug, title):
    """Detail for a specific job title within a sector: companies, locations, timeline."""
    qs = JobPosting.objects.filter(sector__slug=sector_slug, title=title).select_related('sector')
    postings = list(qs)
    if not postings:
        return None

    companies = Counter()
    locations = Counter()
    years = Counter()
    for p in postings:
        if p.company:
            companies[p.company] += 1
        loc = p.location_raw or 'Not specified'
        locations[loc] += 1
        year = (p.posted_date or p.created_at.date()).year if hasattr(p, 'posted_date') and p.posted_date else None
        if year:
            years[year] += 1

    total_sector = JobPosting.objects.filter(sector__slug=sector_slug).count()
    share = round(len(postings) / total_sector * 100, 1) if total_sector else 0

    return {
        'title': title,
        'sector_name': postings[0].sector.name,
        'posting_count': len(postings),
        'sector_share_pct': share,
        'total_sector_postings': total_sector,
        'companies': [{'name': n, 'count': c} for n, c in companies.most_common(5)],
        'locations': [{'location': l, 'count': c} for l, c in locations.most_common(5)],
        'by_year': [{'year': y, 'count': c} for y, c in sorted(years.items())],
    }


def _compute_policy_insights(sector_slug=None):
    """Generate data-driven policy insights from forecasts, employment and postings."""
    from predictions.models import SectorForecastRun, SectorForecast
    from taxonomy.models import SectorEmployment

    run = SectorForecastRun.objects.first()
    if not run:
        return []

    forecasts_1y = list(
        SectorForecast.objects.filter(forecast_run=run, horizon='1y')
        .select_related('sector')
    )
    if not forecasts_1y:
        return []

    emp_latest = {}
    for se in SectorEmployment.objects.select_related('sector').order_by('sector__slug', '-year'):
        if se.sector.slug not in emp_latest:
            emp_latest[se.sector.slug] = se.employment_count

    sectors = []
    for f in forecasts_1y:
        current = emp_latest.get(f.sector.slug, 0)
        growth = (f.employment_count - current) / current * 100 if current > 0 else 0
        sectors.append({
            'slug': f.sector.slug,
            'name': f.sector.name,
            'current': current,
            'forecast': f.employment_count,
            'growth': round(growth, 1),
            'share': f.employment_share_pct,
            'trend': f.employment_trend,
            'postings': f.posting_count,
        })

    sectors.sort(key=lambda s: -s['growth'])
    avg_growth = sum(s['growth'] for s in sectors) / len(sectors) if sectors else 0
    total_postings = sum(s['postings'] for s in sectors)
    total_forecast = sum(s['forecast'] for s in sectors)

    insights = []

    if sector_slug:
        target = next((s for s in sectors if s['slug'] == sector_slug), None)
        if not target:
            return []
        rank = next(i + 1 for i, s in enumerate(sectors) if s['slug'] == sector_slug)

        if target['growth'] > avg_growth + 2:
            insights.append({
                'type': 'opportunity',
                'priority': 'high',
                'title': 'Above-average growth sector',
                'description': (
                    f"{target['name']} is forecast to grow at {target['growth']:+.1f}%, "
                    f"above the cross-sector average of {avg_growth:+.1f}%. "
                    f"This signals strong demand — consider expanding training capacity and intake targets."
                ),
            })
        elif target['growth'] < avg_growth - 2:
            insights.append({
                'type': 'risk',
                'priority': 'high',
                'title': 'Below-average growth',
                'description': (
                    f"{target['name']} growth of {target['growth']:+.1f}% trails the average ({avg_growth:+.1f}%). "
                    f"Focus on protecting existing jobs and reskilling rather than expanding new training."
                ),
            })
        else:
            insights.append({
                'type': 'stability',
                'priority': 'medium',
                'title': 'Growing in line with the economy',
                'description': (
                    f"{target['name']} is forecast at {target['growth']:+.1f}%, near the average of {avg_growth:+.1f}%. "
                    f"Maintain current training investment levels."
                ),
            })

        posting_share = (target['postings'] / total_postings * 100) if total_postings else 0
        emp_share = target['share']
        if posting_share > emp_share * 1.5 and target['postings'] >= 10:
            insights.append({
                'type': 'training',
                'priority': 'high',
                'title': 'Hiring outpaces workforce share',
                'description': (
                    f"{target['name']} accounts for {emp_share:.1f}% of employment but "
                    f"{posting_share:.1f}% of active job postings. Employers are hiring faster "
                    f"than the sector's size suggests — a signal that training supply is lagging demand."
                ),
            })
        elif target['postings'] < 5:
            insights.append({
                'type': 'data',
                'priority': 'medium',
                'title': 'Limited posting data',
                'description': (
                    f"Only {target['postings']} job posting{'s' if target['postings'] != 1 else ''} "
                    f"found for {target['name']}. Policy decisions for this sector should be "
                    f"supplemented with additional labor market surveys."
                ),
            })

        insights.append({
            'type': 'ranking',
            'priority': 'low',
            'title': 'Growth ranking',
            'description': (
                f"{target['name']} ranks #{rank} of {len(sectors)} sectors by forecast growth rate. "
                f"Projected workforce: {target['forecast']:,} (from {target['current']:,} today)."
            ),
        })

    else:
        fastest = sectors[0]
        slowest = sectors[-1]
        largest = max(sectors, key=lambda s: s['share'])
        most_postings = max(sectors, key=lambda s: s['postings'])

        insights.append({
            'type': 'opportunity',
            'priority': 'high',
            'title': f'{fastest["name"]} leads growth',
            'description': (
                f"At {fastest['growth']:+.1f}%, {fastest['name']} has the highest forecast growth rate. "
                f"Prioritise skills programs and training infrastructure for this sector "
                f"to capitalise on the expansion."
            ),
        })

        if largest['slug'] != fastest['slug'] and largest['growth'] < avg_growth:
            insights.append({
                'type': 'protection',
                'priority': 'high',
                'title': f"Protect {largest['name']} workforce",
                'description': (
                    f"{largest['name']} is the largest employer ({largest['share']:.1f}% of the workforce) "
                    f"but is growing at only {largest['growth']:+.1f}%. Policy should focus on job retention "
                    f"and gradual upskilling rather than rapid expansion."
                ),
            })

        if most_postings['slug'] != fastest['slug']:
            insights.append({
                'type': 'demand',
                'priority': 'medium',
                'title': f'{most_postings["name"]} leads active hiring',
                'description': (
                    f"With {most_postings['postings']} active postings, {most_postings['name']} has the "
                    f"most hiring activity. Cross-reference with growth rate ({most_postings['growth']:+.1f}%) "
                    f"to gauge whether this is expansion or turnover-driven."
                ),
            })

        growing = [s for s in sectors if s['trend'] == 'growing']
        stable = [s for s in sectors if s['trend'] == 'stable']
        declining = [s for s in sectors if s['trend'] == 'declining']
        parts = []
        if growing:
            parts.append(f"{len(growing)} growing")
        if stable:
            parts.append(f"{len(stable)} stable")
        if declining:
            parts.append(f"{len(declining)} declining")
        insights.append({
            'type': 'overview',
            'priority': 'medium',
            'title': 'Workforce outlook summary',
            'description': (
                f"Across {len(sectors)} sectors, {', '.join(parts)}. "
                f"Total projected workforce: {total_forecast:,}. "
                f"Average sector growth: {avg_growth:+.1f}%."
            ),
        })

        if slowest['growth'] < 0:
            insights.append({
                'type': 'risk',
                'priority': 'high',
                'title': f'{slowest["name"]} projected to contract',
                'description': (
                    f"{slowest['name']} is forecast at {slowest['growth']:+.1f}%, losing jobs. "
                    f"Invest in transition programs for displaced workers and identify adjacent "
                    f"sectors for reskilling pathways."
                ),
            })

        geo = geographic_summary()
        if geo['located_postings'] > 0:
            top_prov = geo['by_province'][0] if geo['by_province'] else None
            if top_prov and top_prov['share_pct'] > 65:
                insights.append({
                    'type': 'geographic',
                    'priority': 'medium',
                    'title': f'{top_prov["province"]} dominates hiring',
                    'description': (
                        f"{top_prov['share_pct']:.0f}% of located job postings are in {top_prov['province']}. "
                        f"Consider incentive programs to distribute employment opportunities to other provinces."
                    ),
                })

    return insights


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
