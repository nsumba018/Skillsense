"""PDF rendering for the advisor reports (reuses the styling helpers of the reports app)."""
from reportlab.platypus import Paragraph, Spacer

from reports.pdf import _build, _styles, _table

from .stats import report_table


def _sub(data):
    return f"AUCA · SkillSense Career Advisory · generated {str(data['generated_at'])[:10]}"


def report_pdf(data):
    ss = _styles()
    elems = [Paragraph(data['title'], ss['RTitle']), Paragraph(_sub(data), ss['RSub'])]

    if data['type'] == 'student_readiness':
        s = data['student']
        elems.append(Paragraph(
            f"{s['department_label']} · graduation {s['graduation_year'] or '—'} · status {s['status']}"
            + (f" · {s['cohort']}" if s['cohort'] else ''), ss['RBody']))
        elems.append(Paragraph(f"Current skills: {', '.join(s['skills']) or 'none recorded'}", ss['RBody']))
        if data['targets_inferred']:
            elems.append(Paragraph('No target roles recorded; showing the three closest matches.', ss['RSmall']))
        for a in data['assessments']:
            elems.append(Paragraph(f"{a['target_role']}: {round(a['readiness_score'])}% ready", ss['RH2']))
            elems.append(Paragraph(f"Has: {', '.join(a['matched_skills']) or '—'}", ss['RBody']))
            elems.append(Paragraph(f"Gaps: {', '.join(a['missing_skills']) or '—'}", ss['RBody']))
            for r in a['recommendations']:
                elems.append(Paragraph(f'• {r}', ss['RBody']))
        for p in data['pathways']:
            elems.append(Paragraph(f"Pathway to {p['target_role']} ({p['progress_pct']}% done, ~{p['estimated_months']} months)", ss['RH2']))
            elems.append(_table(
                ['Skill', 'Source', 'Weeks', 'Done'],
                [[st['skill'], st['source'], st['duration_weeks'], 'Yes' if st['completed'] else 'No'] for st in p['steps']],
                [150, 200, 50, 50],
            ))
        return _build(elems, data['title'])

    sections = report_table(data)
    if data['type'] == 'cohort_outcomes':
        elems.append(Paragraph(f"Scope: {data['scope']}", ss['RBody']))
    for name, header, rows in sections:
        elems.append(Paragraph(name, ss['RH2']))
        if rows:
            elems.append(_table(header, [[str(c) for c in r] for r in rows]))
        else:
            elems.append(Paragraph('No data yet.', ss['RSmall']))
        elems.append(Spacer(1, 4))
    return _build(elems, data['title'])
