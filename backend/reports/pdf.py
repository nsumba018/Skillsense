"""PDF report generation using reportlab."""
import io
from datetime import datetime

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)

NAVY = colors.HexColor('#0f172a')
PRIMARY = colors.HexColor('#3b82f6')
EMERALD = colors.HexColor('#059669')
RED = colors.HexColor('#ef4444')
GRAY = colors.HexColor('#6b7280')
LIGHT_BG = colors.HexColor('#f8fafc')
BORDER = colors.HexColor('#e2e8f0')

PAGE_W, PAGE_H = A4
MARGIN = 20 * mm


def _styles():
    ss = getSampleStyleSheet()
    ss.add(ParagraphStyle('RTitle', parent=ss['Title'], fontSize=18, textColor=NAVY, spaceAfter=4))
    ss.add(ParagraphStyle('RSub', parent=ss['Normal'], fontSize=9, textColor=GRAY, spaceAfter=14))
    ss.add(ParagraphStyle('RH2', parent=ss['Heading2'], fontSize=13, textColor=NAVY, spaceBefore=18, spaceAfter=6))
    ss.add(ParagraphStyle('RBody', parent=ss['Normal'], fontSize=9, textColor=colors.black, leading=13))
    ss.add(ParagraphStyle('RSmall', parent=ss['Normal'], fontSize=8, textColor=GRAY))
    return ss


def _table(headers, rows, col_widths=None):
    data = [headers] + rows
    style = TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), NAVY),
        ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 8),
        ('FONTSIZE', (0, 1), (-1, -1), 8),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 6),
        ('TOPPADDING', (0, 1), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 1), (-1, -1), 4),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.white, LIGHT_BG]),
        ('GRID', (0, 0), (-1, -1), 0.4, BORDER),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
    ])
    avail = PAGE_W - 2 * MARGIN
    t = Table(data, colWidths=col_widths, repeatRows=1, hAlign='LEFT')
    t.setStyle(style)
    t._argW = col_widths or [avail / len(headers)] * len(headers)
    return t


def _footer(canvas, doc):
    canvas.saveState()
    canvas.setFont('Helvetica', 7)
    canvas.setFillColor(GRAY)
    canvas.drawString(MARGIN, 12 * mm, f'SkillSense — Generated {datetime.now():%Y-%m-%d %H:%M}')
    canvas.drawRightString(PAGE_W - MARGIN, 12 * mm, f'Page {doc.page}')
    canvas.restoreState()


def _build(elements, title):
    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=A4,
        leftMargin=MARGIN, rightMargin=MARGIN,
        topMargin=MARGIN, bottomMargin=20 * mm,
        title=title,
    )
    doc.build(elements, onFirstPage=_footer, onLaterPages=_footer)
    buf.seek(0)
    return buf


def _fmt_int(n):
    return f'{int(n):,}' if n is not None else '—'


def _fmt_pct(n):
    return f'{n:.1f}%' if n is not None else '—'


def _growth_str(g):
    if g is None:
        return '—'
    return f'+{g}%' if g >= 0 else f'{g}%'


HORIZON_LABEL = {'6m': '6 Months', '1y': '1 Year', '2y': '2 Years'}
TREND_LABEL = {'growing': 'Growing', 'stable': 'Stable', 'declining': 'Declining'}


# ── Cross-Sector Outlook ─────────────────────────────────────────────

def sector_outlook_pdf(report_data):
    ss = _styles()
    elems = []
    elems.append(Paragraph(report_data['title'], ss['RTitle']))
    elems.append(Paragraph(
        f"Model {report_data['model_version']} · generated {str(report_data['generated_at'])[:10]}"
        f" · R² {report_data['accuracy'].get('r2') or '—'}",
        ss['RSub'],
    ))

    for h in ['6m', '1y', '2y']:
        rows = report_data['forecasts'].get(h, [])
        if not rows:
            continue
        elems.append(Paragraph(f'Forecast — {HORIZON_LABEL[h]}', ss['RH2']))
        table_rows = []
        for r in rows:
            table_rows.append([
                r['sector'],
                _fmt_int(r['employment_count']),
                _fmt_pct(r['employment_share_pct']),
                _growth_str(r['growth_pct']),
                str(r.get('posting_count', 0)),
                TREND_LABEL.get(r['employment_trend'], r['employment_trend']),
            ])
        elems.append(_table(
            ['Sector', 'Employment', 'Share', 'Growth', 'Postings', 'Trend'],
            table_rows,
        ))
        elems.append(Spacer(1, 6 * mm))

    return _build(elems, report_data['title'])


# ── Sector Detail ────────────────────────────────────────────────────

def sector_detail_pdf(report_data):
    ss = _styles()
    elems = []
    elems.append(Paragraph(report_data['title'], ss['RTitle']))
    elems.append(Paragraph(
        f"Model {report_data['model_version']} · generated {str(report_data['generated_at'])[:10]}"
        f" · R² {report_data['accuracy'].get('r2') or '—'}",
        ss['RSub'],
    ))

    # KPIs
    elems.append(Paragraph('Key Indicators', ss['RH2']))
    kpi_rows = [[
        f"Current employment: {_fmt_int(report_data['current_employment'])}",
        f"Total postings: {report_data['total_postings']}",
    ]]
    fc_1y = report_data['forecasts'].get('1y')
    if fc_1y:
        kpi_rows[0].append(f"1-Year growth: {_growth_str(fc_1y['growth_pct'])}")
        kpi_rows[0].append(f"Trend: {TREND_LABEL.get(fc_1y['employment_trend'], '')}")
    kpi_t = Table(kpi_rows, hAlign='LEFT')
    kpi_t.setStyle(TableStyle([
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('FONTNAME', (0, 0), (-1, -1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, 0), (-1, -1), NAVY),
        ('BACKGROUND', (0, 0), (-1, -1), LIGHT_BG),
        ('BOX', (0, 0), (-1, -1), 0.4, BORDER),
        ('INNERGRID', (0, 0), (-1, -1), 0.4, BORDER),
        ('TOPPADDING', (0, 0), (-1, -1), 6),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
        ('LEFTPADDING', (0, 0), (-1, -1), 8),
    ]))
    elems.append(kpi_t)
    elems.append(Spacer(1, 4 * mm))

    # Forecasts
    elems.append(Paragraph('Employment Forecasts', ss['RH2']))
    fc_rows = []
    for h in ['6m', '1y', '2y']:
        f = report_data['forecasts'].get(h)
        if not f:
            continue
        fc_rows.append([
            HORIZON_LABEL[h],
            _fmt_int(f['employment_count']),
            _fmt_pct(f['employment_share_pct']),
            _growth_str(f['growth_pct']),
            f"{_fmt_int(f.get('confidence_lower'))} – {_fmt_int(f.get('confidence_upper'))}",
            TREND_LABEL.get(f['employment_trend'], ''),
        ])
    if fc_rows:
        elems.append(_table(
            ['Horizon', 'Employment', 'Share', 'Growth', 'Confidence Range', 'Trend'],
            fc_rows,
        ))
        elems.append(Spacer(1, 4 * mm))

    # Employment history
    hist = report_data.get('employment_history', [])
    if hist:
        elems.append(Paragraph('Employment History', ss['RH2']))
        hist_rows = [[str(h['year']), _fmt_int(h['employment_count']), _fmt_pct(h['share_pct'])] for h in hist]
        elems.append(_table(['Year', 'Employment', 'Share'], hist_rows))
        elems.append(Spacer(1, 4 * mm))

    # Top positions
    positions = report_data.get('top_positions', [])
    if positions:
        elems.append(Paragraph('Top Positions', ss['RH2']))
        pos_rows = [[p['title'], str(p['count'])] for p in positions]
        elems.append(_table(['Position', 'Postings'], pos_rows))
        elems.append(Spacer(1, 4 * mm))

    # Top companies
    companies = report_data.get('top_companies', [])
    if companies:
        elems.append(Paragraph('Top Companies Hiring', ss['RH2']))
        comp_rows = [[c['name'], str(c['count'])] for c in companies]
        elems.append(_table(['Company', 'Postings'], comp_rows))
        elems.append(Spacer(1, 4 * mm))

    # Top locations
    locations = report_data.get('top_locations', [])
    if locations:
        elems.append(Paragraph('Top Locations', ss['RH2']))
        loc_rows = [[l['location'], str(l['count'])] for l in locations]
        elems.append(_table(['Location', 'Postings'], loc_rows))

    return _build(elems, report_data['title'])


# ── ICT Demand Outlook ───────────────────────────────────────────────

def demand_outlook_pdf(report_data):
    ss = _styles()
    elems = []
    elems.append(Paragraph(report_data['title'], ss['RTitle']))
    acc = report_data['accuracy']
    elems.append(Paragraph(
        f"Model {report_data['model_version']} · generated {str(report_data['generated_at'])[:10]}"
        f" · Spearman {acc.get('spearman') or '—'} · R² {acc.get('r2') or '—'}",
        ss['RSub'],
    ))

    for h in ['6m', '1y', '2y']:
        rows = report_data['forecasts'].get(h, [])
        if not rows:
            continue
        elems.append(Paragraph(f'Forecast — {HORIZON_LABEL[h]}', ss['RH2']))
        table_rows = []
        for r in rows:
            table_rows.append([
                r['role'],
                f"{r['demand_index']:.1f}",
                _fmt_pct(r['share_pct']),
                f"{r.get('confidence_lower', '—')} – {r.get('confidence_upper', '—')}",
                TREND_LABEL.get(r['trend'], r['trend']),
            ])
        elems.append(_table(
            ['Role', 'Demand Index', 'Share', 'Confidence Range', 'Trend'],
            table_rows,
        ))
        elems.append(Spacer(1, 6 * mm))

    return _build(elems, report_data['title'])


# ── ICT Role Deep Dive ───────────────────────────────────────────────

def role_deep_dive_pdf(report_data):
    ss = _styles()
    elems = []
    elems.append(Paragraph(report_data['title'], ss['RTitle']))
    elems.append(Spacer(1, 4 * mm))

    # Forecasts
    forecasts = report_data.get('forecasts', [])
    if forecasts:
        elems.append(Paragraph('Forecast', ss['RH2']))
        fc_rows = []
        for f in forecasts:
            h = f.get('horizon', '')
            fc_rows.append([
                HORIZON_LABEL.get(h, h),
                f"{f['demand_index']:.1f}",
                _fmt_pct(f['share_pct']),
                f"{f.get('confidence_lower', '—')} – {f.get('confidence_upper', '—')}",
                TREND_LABEL.get(f.get('trend_direction', ''), ''),
            ])
        elems.append(_table(
            ['Horizon', 'Demand Index', 'Share', 'Confidence Range', 'Trend'],
            fc_rows,
        ))
        elems.append(Spacer(1, 4 * mm))

    # Historical
    history = report_data.get('historical', [])
    if history:
        elems.append(Paragraph(f'Historical Demand ({len(history)} years)', ss['RH2']))
        hist_rows = []
        for h in history:
            hist_rows.append([
                str(h['year']),
                f"{h['role_demand_index']:.1f}",
                _fmt_pct(h['role_share_within_ict_pct']),
                _fmt_int(round(h['role_employment_proxy'])),
            ])
        elems.append(_table(
            ['Year', 'Demand Index', 'ICT Share', 'Employment Proxy'],
            hist_rows,
        ))

    return _build(elems, report_data['title'])
