"""PDF rendering for the advisor reports (reuses the styling helpers of the reports app)."""
from pathlib import Path

from reportlab.lib.units import mm
from reportlab.platypus import Image, Paragraph, Spacer, Table, TableStyle

from reports.pdf import _build, _styles, _table

from .stats import report_table

ASSETS = Path(__file__).resolve().parent / 'assets'


def _sub(data):
    return f"AUCA · SkillSense Career Advisory · generated {str(data['generated_at'])[:10]}"


def _logo(name, height):
    """A logo scaled to `height`, keeping its proportions; None if the file is missing."""
    path = ASSETS / name
    if not path.exists():
        return None
    img = Image(str(path))
    img.drawWidth, img.drawHeight = img.imageWidth * height / img.imageHeight, height
    return img


def _header(data, ss):
    """AUCA and SkillSense logos either side of the report title."""
    auca, skillsense = _logo('auca.png', 16 * mm), _logo('skillsense.png', 13 * mm)
    title = [Paragraph(data['title'], ss['RTitle']), Paragraph(_sub(data), ss['RSub'])]
    if not (auca and skillsense):
        return title
    table = Table([[auca, title, skillsense]], colWidths=[22 * mm, None, 20 * mm])
    table.setStyle(TableStyle([('VALIGN', (0, 0), (-1, -1), 'MIDDLE'), ('LEFTPADDING', (0, 0), (-1, -1), 0),
                               ('RIGHTPADDING', (0, 0), (-1, -1), 0), ('ALIGN', (2, 0), (2, 0), 'RIGHT')]))
    return [table, Spacer(1, 4 * mm)]


def report_pdf(data):
    ss = _styles()
    elems = _header(data, ss)

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
            if a.get('priority_skills'):
                elems.append(Paragraph('Learn first: ' + ', '.join(
                    f"{p['skill']} ({p['postings']} postings, ~{p['weeks']} wk)" for p in a['priority_skills']), ss['RBody']))
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
