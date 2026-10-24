import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { BarChart3, BookOpen, Briefcase, Building2, Download, FileSpreadsheet, FileText, FileUp, GraduationCap, Layers, Loader2, MapPin, PieChart, Sparkles, Table2, TrendingUp } from 'lucide-react'
import DashboardLayout, { Card } from './DashboardLayout'
import { ErrorState, QueryGate } from '../../components/ui/State'
import { useDemandOutlook, useForecasts, useSectorDetail, useSectorList, useSectorOutlook } from '../../services/queries'
import { reportsApi } from '../../services/api'
import { ApiError } from '../../services/http'
import { fmtDate, fmtInt, fmtNum, fmtPct, HORIZON_LABEL } from '../../lib/format'
import { TREND_LABEL, TREND_TONE } from '../../lib/derive'
import type { Horizon } from '../../types/api'

const AUCA_SECTORS = new Set(['ict-technology', 'finance-business'])

type ReportType = 'sector_outlook' | 'sector_detail' | 'demand_outlook' | 'role_deep_dive' | 'curriculum_alignment'

const TEMPLATES: { id: ReportType; title: string; desc: string; icon: typeof FileText; tone: string }[] = [
  { id: 'sector_outlook', title: 'Cross-Sector Outlook', desc: 'AUCA-tracked sectors — employment, growth & hiring signals.', icon: Layers, tone: 'bg-primary-light text-primary' },
  { id: 'sector_detail', title: 'Sector Detail', desc: 'Deep dive into one sector with forecasts & positions.', icon: PieChart, tone: 'bg-violet-50 text-violet-600' },
  { id: 'demand_outlook', title: 'ICT Role Demand', desc: 'Forecast demand for every ICT role with confidence.', icon: FileText, tone: 'bg-red-50 text-red-500' },
  { id: 'role_deep_dive', title: 'ICT Role Deep Dive', desc: 'Full history & forecast for a single ICT role.', icon: Table2, tone: 'bg-emerald-50 text-emerald-600' },
  { id: 'curriculum_alignment', title: 'Curriculum Alignment', desc: 'AUCA curriculum vs employer-demanded skills per department.', icon: BookOpen, tone: 'bg-amber-50 text-amber-600' },
]

/* ── AUCA curriculum data for alignment report ── */

type Dept = 'Software Engineering' | 'Network & Info Management' | 'Finance' | 'Business Administration'

const DEPT_CURRICULA: Record<Dept, Set<string>> = {
  'Software Engineering': new Set([
    'Java', 'Python', '.NET', 'C#', 'PL/SQL', 'SQL', 'HTML/CSS', 'JavaScript', 'React',
    'Data Structures', 'Algorithms', 'Operating Systems', 'DBMS', 'Database Design',
    'Software Engineering', 'Design Patterns', 'Software Testing', 'Project Management',
    'Statistics', 'Probability', 'Computer Networks', 'Mathematics', 'Discrete Mathematics',
    'Git', 'Agile/Scrum', 'Java/SpringBoot', 'REST APIs',
  ]),
  'Network & Info Management': new Set([
    'TCP/IP', 'Networking', 'LAN/WAN', 'Network Administration', 'Windows Server', 'Linux',
    'SQL', 'DBMS', 'Database Design', 'IT Support', 'Help Desk', 'Hardware Troubleshooting',
    'Operating Systems', 'System Administration', 'HTML/CSS', 'Visual Basic',
    'Information Systems', 'Computer Networks', 'Project Management', 'Statistics', 'Mathematics',
    'Network Security', 'Penetration Testing',
  ]),
  'Finance': new Set([
    'Financial Accounting', 'Principles of Accounting', 'Auditing', 'Tax', 'IFRS',
    'Corporate Finance', 'Investment', 'Banking', 'Financial Analysis', 'Budgeting',
    'Economics', 'Business Law', 'Business Ethics', 'Statistics', 'Mathematics',
    'Communication', 'English', 'French', 'Entrepreneurship', 'Project Management',
  ]),
  'Business Administration': new Set([
    'Principles of Management', 'Strategic Management', 'Operations', 'HR Management',
    'Organizational Behavior', 'Leadership', 'Marketing Principles', 'Market Research',
    'Principles of Accounting', 'Economics', 'Business Law', 'Business Ethics',
    'Business Communication', 'Statistics', 'Mathematics', 'Entrepreneurship',
    'Project Management', 'Communication', 'English', 'French', 'Negotiation',
  ]),
}

const MARKET_SKILLS: Record<Dept, string[]> = {
  'Software Engineering': [
    'Java', 'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Git', 'REST APIs',
    'Docker', 'CI/CD', 'Agile/Scrum', 'SQL', 'Cloud (AWS/Azure)', 'Microservices',
    'Machine Learning', 'TensorFlow/PyTorch', 'Data Visualization', 'Power BI/Tableau',
    'Figma', 'UI/UX', 'Testing (Jest)', 'Responsive Design', 'MongoDB',
  ],
  'Network & Info Management': [
    'TCP/IP', 'Linux', 'Windows Server', 'Network Security', 'Penetration Testing',
    'Cloud (AWS/Azure)', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform',
    'SIEM', 'Firewall Management', 'Incident Response', 'Compliance (ISO 27001)',
    'Monitoring', 'Scripting (Bash/PowerShell)', 'VPN', 'Cloud Networking',
  ],
  'Finance': [
    'IFRS', 'Financial Reporting', 'Tax', 'Auditing', 'ERP Systems',
    'Financial Modeling', 'Excel (Advanced/VBA)', 'Power BI/Tableau',
    'CAAT Tools', 'Fraud Detection', 'Risk Management', 'Budgeting',
    'Corporate Finance', 'Investment', 'Financial Analysis',
  ],
  'Business Administration': [
    'Strategic Management', 'HR Management', 'Project Management', 'Leadership',
    'Digital Marketing', 'SEO/SEM', 'Google Analytics', 'Social Media Marketing',
    'CRM (Salesforce)', 'Negotiation', 'Market Research',
    'Agile/Scrum', 'Jira', 'Team Leadership', 'Stakeholder Communication',
  ],
}

const ALL_DEPTS: Dept[] = ['Software Engineering', 'Network & Info Management', 'Finance', 'Business Administration']

function isSkillTaught(skill: string, taughtSet: Set<string>): boolean {
  const lower = skill.toLowerCase()
  for (const t of taughtSet) {
    const tl = t.toLowerCase()
    if (tl === lower) return true
    if (tl.length <= 2 || lower.length <= 2) continue
    const wb = (hay: string, needle: string) =>
      new RegExp(`\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(hay)
    if (wb(lower, tl) || wb(tl, lower)) return true
  }
  return false
}

export default function EducationReports() {
  const forecasts = useForecasts('1y')
  const sectorListQ = useSectorList()
  const [type, setType] = useState<ReportType>('sector_outlook')
  const [roleId, setRoleId] = useState<number | null>(null)
  const [sectorSlug, setSectorSlug] = useState<string | null>('ict-technology')
  const [horizon, setHorizon] = useState<Horizon>('1y')
  const [exportError, setExportError] = useState<string | null>(null)
  const [generated, setGenerated] = useState(false)

  const allSectors = sectorListQ.data ?? []
  const sectorList = allSectors.filter(s => AUCA_SECTORS.has(s.slug))
  const roles = [...(forecasts.data?.forecasts ?? [])].sort((a, b) => a.role_name.localeCompare(b.role_name))
  const activeRole = roleId ?? roles[0]?.role_id ?? null
  const activeSector = sectorSlug ?? sectorList[0]?.slug ?? null

  const sectorOutlook = useSectorOutlook(generated && type === 'sector_outlook')
  const sectorDetail = useSectorDetail(activeSector, generated && type === 'sector_detail')
  const outlook = useDemandOutlook(generated && type === 'demand_outlook')
  const deepDive = useMutation({ mutationFn: (id: number) => reportsApi.roleDeepDive(id) })
  const csvMut = useMutation({
    mutationFn: () => {
      if (type === 'sector_detail' && activeSector) return reportsApi.downloadSectorDetailCsv(activeSector)
      if (type === 'sector_outlook') return reportsApi.downloadSectorOutlookCsv()
      return reportsApi.downloadDemandOutlookCsv()
    },
  })
  const pdfMut = useMutation({
    mutationFn: () => {
      if (type === 'sector_detail' && activeSector) return reportsApi.downloadSectorDetailPdf(activeSector)
      if (type === 'sector_outlook') return reportsApi.downloadSectorOutlookPdf()
      if (type === 'role_deep_dive' && activeRole !== null) return reportsApi.downloadRoleDeepDivePdf(activeRole)
      return reportsApi.downloadDemandOutlookPdf()
    },
  })

  const generate = () => {
    setGenerated(true)
    if (type === 'role_deep_dive' && activeRole !== null) deepDive.mutate(activeRole)
  }

  const sectorRows = (sectorOutlook.data?.forecasts[horizon] ?? []).filter(x => AUCA_SECTORS.has(x.sector_slug))
  const demandRows = outlook.data?.forecasts[horizon] ?? []

  return (
    <DashboardLayout>
      <Card className="p-8">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
            <GraduationCap className="h-5 w-5 text-indigo-700" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-navy">AUCA Report Builder</h1>
            <p className="text-sm text-gray-500">Generate reports for AUCA-relevant sectors — ICT &amp; Business focus.</p>
          </div>
        </div>

        {/* Report type cards — 2×2 compact grid */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {TEMPLATES.map((t) => (
            <button key={t.id} onClick={() => { setType(t.id); setGenerated(false) }} className={`flex items-start gap-3 rounded-xl border p-4 text-left transition-colors hover:border-primary/40 ${type === t.id ? 'border-primary bg-primary/5' : 'border-gray-200 bg-white'}`}>
              <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${t.tone}`}><t.icon className="h-4 w-4" /></span>
              <div className="min-w-0">
                <div className="text-sm font-bold text-navy">{t.title}</div>
                <div className="mt-0.5 text-[11px] leading-snug text-gray-500">{t.desc}</div>
              </div>
            </button>
          ))}
        </div>

        {/* Controls row */}
        <div className="mt-6 grid grid-cols-1 items-end gap-4 sm:grid-cols-3">
          {type === 'sector_detail' && (
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-navy">Sector</span>
              <select value={activeSector ?? ''} onChange={(e) => { setSectorSlug(e.target.value); setGenerated(false) }} aria-label="Sector" className="mt-1.5 w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-primary">
                {sectorList.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
              </select>
            </label>
          )}
          {type === 'role_deep_dive' && (
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-navy">ICT role</span>
              <select value={activeRole ?? ''} onChange={(e) => { setRoleId(Number(e.target.value)); setGenerated(false) }} aria-label="ICT role" className="mt-1.5 w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 outline-none focus:border-primary">
                {roles.map((r) => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
              </select>
            </label>
          )}

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Exports:</span>
            <span className="flex items-center gap-1.5 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-bold text-navy"><FileSpreadsheet className="h-3.5 w-3.5" /> {type === 'role_deep_dive' ? 'On-screen' : 'CSV'}</span>
            <span className="flex items-center gap-1.5 rounded-md border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600"><FileUp className="h-3.5 w-3.5" /> PDF</span>
          </div>

          <button onClick={generate} disabled={(type === 'role_deep_dive' && activeRole === null) || (type === 'sector_detail' && !activeSector)} className="rounded-lg bg-navy px-8 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-dark-navy disabled:opacity-50 sm:justify-self-end">
            Generate report
          </button>
        </div>
      </Card>

      {/* Sector Detail report */}
      {generated && type === 'sector_detail' && activeSector && (
        <Card className="mt-6 overflow-hidden" data-testid="report-sector-detail">
          <QueryGate query={sectorDetail} className="m-8">
            {(r) => {
              const fc = r.forecasts[horizon]
              return (
                <>
                  <div className="bg-navy p-8 text-white">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-extrabold tracking-tight">{r.title}</h2>
                        <p className="mt-2 text-sm text-blue-200/80">Model {r.model_version} · run {fmtDate(r.generated_at)} · R² {fmtNum(r.accuracy.r2, 4)}</p>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => { setExportError(null); csvMut.mutate(undefined, { onError: () => setExportError('CSV export failed') }) }} className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-navy hover:bg-gray-100">
                          {csvMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} CSV
                        </button>
                        <button onClick={() => { setExportError(null); pdfMut.mutate(undefined, { onError: () => setExportError('PDF export failed') }) }} className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100">
                          {pdfMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />} PDF
                        </button>
                      </div>
                    </div>
                    {exportError && <p className="mt-3 text-sm text-red-300">{exportError}</p>}
                  </div>

                  {/* KPI cards */}
                  <div className="grid grid-cols-2 gap-4 p-6 sm:grid-cols-4">
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Current Employment</div>
                      <div className="mt-1 text-2xl font-extrabold text-navy">{fmtInt(r.current_employment)}</div>
                    </div>
                    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Total Postings</div>
                      <div className="mt-1 text-2xl font-extrabold text-navy">{r.total_postings}</div>
                    </div>
                    {fc && (
                      <>
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Growth ({HORIZON_LABEL[horizon]})</div>
                          <div className={`mt-1 text-2xl font-extrabold ${fc.growth_pct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{fc.growth_pct >= 0 ? '+' : ''}{fc.growth_pct}%</div>
                        </div>
                        <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
                          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Trend</div>
                          <div className="mt-2"><span className={`rounded-full px-2.5 py-1 text-xs font-bold uppercase ${TREND_TONE[fc.employment_trend]}`}>{TREND_LABEL[fc.employment_trend]}</span></div>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Forecast table */}
                  <div className="px-6 pb-2">
                    <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-navy"><TrendingUp className="h-4 w-4" /> Employment Forecasts</h3>
                    <table className="mt-3 w-full text-left">
                      <thead>
                        <tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                          <th className="pb-3 font-bold">Horizon</th>
                          <th className="pb-3 font-bold">Employment</th>
                          <th className="pb-3 font-bold">Share</th>
                          <th className="pb-3 font-bold">Growth</th>
                          <th className="pb-3 font-bold">Range</th>
                          <th className="pb-3 font-bold">Trend</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {(['6m', '1y', '2y'] as Horizon[]).map((h) => {
                          const f = r.forecasts[h]
                          if (!f) return null
                          return (
                            <tr key={h} className="text-sm">
                              <td className="py-3 pr-4 font-bold text-gray-900">{HORIZON_LABEL[h]}</td>
                              <td className="py-3 pr-4 font-bold text-navy">{fmtInt(f.employment_count)}</td>
                              <td className="py-3 pr-4 text-gray-700">{fmtPct(f.employment_share_pct)}</td>
                              <td className={`py-3 pr-4 font-bold ${f.growth_pct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{f.growth_pct >= 0 ? '+' : ''}{f.growth_pct}%</td>
                              <td className="py-3 pr-4 text-xs text-gray-500">{fmtNum(f.confidence_lower)} – {fmtNum(f.confidence_upper)}</td>
                              <td className="py-3"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${TREND_TONE[f.employment_trend]}`}>{TREND_LABEL[f.employment_trend]}</span></td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  {/* Employment history */}
                  {r.employment_history.length > 0 && (
                    <div className="px-6 pb-2 pt-4">
                      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-navy"><BarChart3 className="h-4 w-4" /> Employment History</h3>
                      <div className="mt-3 max-h-52 overflow-y-auto">
                        <table className="w-full text-left">
                          <thead><tr className="sticky top-0 border-b border-gray-200 bg-white text-[11px] font-bold uppercase tracking-wider text-gray-400"><th className="pb-3 font-bold">Year</th><th className="pb-3 font-bold">Employment</th><th className="pb-3 font-bold">Share</th></tr></thead>
                          <tbody className="divide-y divide-gray-100">
                            {r.employment_history.map((h) => (
                              <tr key={h.year} className="text-sm"><td className="py-2 font-bold text-gray-900">{h.year}</td><td className="py-2 text-gray-700">{fmtInt(h.employment_count)}</td><td className="py-2 text-gray-700">{fmtPct(h.share_pct)}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Three columns: positions, companies, locations */}
                  <div className="grid grid-cols-1 gap-6 p-6 md:grid-cols-3">
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-navy"><Briefcase className="h-4 w-4" /> Top Positions</h3>
                      <ul className="mt-3 space-y-2">
                        {r.top_positions.map((p) => (
                          <li key={p.title} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                            <span className="font-medium text-gray-800 truncate pr-2">{p.title}</span>
                            <span className="shrink-0 rounded-full bg-primary-light px-2 py-0.5 text-xs font-bold text-primary">{p.count}</span>
                          </li>
                        ))}
                        {r.top_positions.length === 0 && <li className="text-sm text-gray-400">No postings</li>}
                      </ul>
                    </div>
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-navy"><Building2 className="h-4 w-4" /> Top Companies</h3>
                      <ul className="mt-3 space-y-2">
                        {r.top_companies.map((c) => (
                          <li key={c.name} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                            <span className="font-medium text-gray-800 truncate pr-2">{c.name}</span>
                            <span className="shrink-0 rounded-full bg-violet-50 px-2 py-0.5 text-xs font-bold text-violet-600">{c.count}</span>
                          </li>
                        ))}
                        {r.top_companies.length === 0 && <li className="text-sm text-gray-400">No data</li>}
                      </ul>
                    </div>
                    <div>
                      <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-navy"><MapPin className="h-4 w-4" /> Top Locations</h3>
                      <ul className="mt-3 space-y-2">
                        {r.top_locations.map((l) => (
                          <li key={l.location} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm">
                            <span className="font-medium text-gray-800 truncate pr-2">{l.location}</span>
                            <span className="shrink-0 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-600">{l.count}</span>
                          </li>
                        ))}
                        {r.top_locations.length === 0 && <li className="text-sm text-gray-400">No data</li>}
                      </ul>
                    </div>
                  </div>
                </>
              )
            }}
          </QueryGate>
        </Card>
      )}

      {/* Sector Outlook report */}
      {generated && type === 'sector_outlook' && (
        <Card className="mt-6 overflow-hidden" data-testid="report-sector-outlook">
          <QueryGate query={sectorOutlook} className="m-8">
            {(r) => (
              <>
                <div className="bg-navy p-8 text-white">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-extrabold tracking-tight">{r.title}</h2>
                      <p className="mt-2 text-sm text-blue-200/80">Model {r.model_version} · run {fmtDate(r.generated_at)} · R² {fmtNum(r.accuracy.r2, 4)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setExportError(null); csvMut.mutate(undefined, { onError: () => setExportError('CSV export failed') }) }} className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-navy hover:bg-gray-100">
                        {csvMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} CSV
                      </button>
                      <button onClick={() => { setExportError(null); pdfMut.mutate(undefined, { onError: () => setExportError('PDF export failed') }) }} className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100">
                        {pdfMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />} PDF
                      </button>
                    </div>
                  </div>
                  {exportError && <p className="mt-3 text-sm text-red-300">{exportError}</p>}
                  <div className="mt-6 flex gap-2" role="tablist">
                    {(['6m', '1y', '2y'] as Horizon[]).map((h) => (
                      <button key={h} role="tab" aria-selected={horizon === h} onClick={() => setHorizon(h)} className={`rounded-md px-4 py-2 text-[11px] font-bold uppercase tracking-wider ${horizon === h ? 'bg-white text-navy' : 'bg-white/10 text-white hover:bg-white/20'}`}>{HORIZON_LABEL[h]}</button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto p-6">
                  <table className="w-full min-w-[720px] text-left" data-testid="sector-outlook-table">
                    <thead>
                      <tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        <th className="pb-4 font-bold">Sector</th>
                        <th className="pb-4 font-bold">Employment</th>
                        <th className="pb-4 font-bold">Share</th>
                        <th className="pb-4 font-bold">Growth</th>
                        <th className="pb-4 font-bold">Postings</th>
                        <th className="pb-4 font-bold">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sectorRows.map((x) => (
                        <tr key={x.sector_slug} className="text-sm">
                          <td className="py-3 pr-4 font-bold text-gray-900">{x.sector}</td>
                          <td className="py-3 pr-4 font-bold text-navy">{fmtInt(x.employment_count)}</td>
                          <td className="py-3 pr-4 text-gray-700">{fmtPct(x.employment_share_pct)}</td>
                          <td className={`py-3 pr-4 font-bold ${x.growth_pct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{x.growth_pct >= 0 ? '+' : ''}{x.growth_pct}%</td>
                          <td className="py-3 pr-4 text-gray-700">{x.posting_count}</td>
                          <td className="py-3"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${TREND_TONE[x.employment_trend]}`}>{TREND_LABEL[x.employment_trend]}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </QueryGate>
        </Card>
      )}

      {/* ICT Demand Outlook report */}
      {generated && type === 'demand_outlook' && (
        <Card className="mt-6 overflow-hidden" data-testid="report-outlook">
          <QueryGate query={outlook} className="m-8">
            {(r) => (
              <>
                <div className="bg-navy p-8 text-white">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-extrabold tracking-tight">{r.title}</h2>
                      <p className="mt-2 text-sm text-blue-200/80">Model {r.model_version} · run {fmtDate(r.generated_at)} · rank correlation {fmtNum(r.accuracy.spearman, 4)} · R² {fmtNum(r.accuracy.r2, 4)}</p>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { setExportError(null); csvMut.mutate(undefined, { onError: () => setExportError('CSV export failed') }) }} className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-navy hover:bg-gray-100">
                        {csvMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} CSV
                      </button>
                      <button onClick={() => { setExportError(null); pdfMut.mutate(undefined, { onError: () => setExportError('PDF export failed') }) }} className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100">
                        {pdfMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />} PDF
                      </button>
                    </div>
                  </div>
                  {exportError && <p className="mt-3 text-sm text-red-300">{exportError}</p>}
                  <div className="mt-6 flex gap-2" role="tablist">
                    {(['6m', '1y', '2y'] as Horizon[]).map((h) => (
                      <button key={h} role="tab" aria-selected={horizon === h} onClick={() => setHorizon(h)} className={`rounded-md px-4 py-2 text-[11px] font-bold uppercase tracking-wider ${horizon === h ? 'bg-white text-navy' : 'bg-white/10 text-white hover:bg-white/20'}`}>{HORIZON_LABEL[h]}</button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto p-6">
                  <table className="w-full min-w-[720px] text-left" data-testid="outlook-table">
                    <thead>
                      <tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                        <th className="pb-4 font-bold">Role</th>
                        <th className="pb-4 font-bold">Demand index</th>
                        <th className="pb-4 font-bold">Share</th>
                        <th className="pb-4 font-bold">Range</th>
                        <th className="pb-4 font-bold">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {demandRows.map((x) => (
                        <tr key={x.role} className="text-sm">
                          <td className="py-3 pr-4 font-bold text-gray-900">{x.role}</td>
                          <td className="py-3 pr-4 font-bold text-navy">{fmtNum(x.demand_index)}</td>
                          <td className="py-3 pr-4 text-gray-700">{fmtPct(x.share_pct, 2)}</td>
                          <td className="py-3 pr-4 text-xs text-gray-500">{fmtNum(x.confidence_lower)} – {fmtNum(x.confidence_upper)}</td>
                          <td className="py-3"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${TREND_TONE[x.trend]}`}>{TREND_LABEL[x.trend]}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </QueryGate>
        </Card>
      )}

      {/* ICT Role Deep Dive report */}
      {generated && type === 'role_deep_dive' && (
        <Card className="mt-6 p-6" data-testid="report-deepdive">
          {deepDive.isPending && <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Generating…</div>}
          {deepDive.isError && <ErrorState error={deepDive.error instanceof ApiError ? deepDive.error : new Error('failed')} />}
          {deepDive.data && (
            <>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-navy"><BarChart3 className="h-5 w-5" /> {roles.find((r) => r.role_id === activeRole)?.role_name}: deep dive</h2>
                <button onClick={() => { setExportError(null); pdfMut.mutate(undefined, { onError: () => setExportError('PDF export failed') }) }} className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-100">
                  {pdfMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />} Download PDF
                </button>
              </div>
              {exportError && <p className="mt-2 text-sm text-red-500">{exportError}</p>}
              <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-gray-400">Forecast</h3>
              <table className="mt-3 w-full text-left" data-testid="deepdive-forecast">
                <thead><tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-400"><th className="pb-3 font-bold">Horizon</th><th className="pb-3 font-bold">Demand index</th><th className="pb-3 font-bold">Share</th><th className="pb-3 font-bold">Range</th><th className="pb-3 font-bold">Trend</th></tr></thead>
                <tbody className="divide-y divide-gray-100">
                  {deepDive.data.forecasts.map((f) => (
                    <tr key={f.horizon} className="text-sm"><td className="py-3 font-bold text-gray-900">{HORIZON_LABEL[f.horizon]}</td><td className="py-3 font-bold text-navy">{fmtNum(f.demand_index)}</td><td className="py-3 text-gray-700">{fmtPct(f.share_pct, 2)}</td><td className="py-3 text-xs text-gray-500">{fmtNum(f.confidence_lower)} – {fmtNum(f.confidence_upper)}</td><td className="py-3"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${TREND_TONE[f.trend_direction]}`}>{TREND_LABEL[f.trend_direction]}</span></td></tr>
                  ))}
                </tbody>
              </table>
              <h3 className="mt-8 text-sm font-bold uppercase tracking-wider text-gray-400">History ({deepDive.data.historical.length} years)</h3>
              <div className="mt-3 max-h-72 overflow-y-auto">
                <table className="w-full text-left" data-testid="deepdive-history">
                  <thead><tr className="sticky top-0 border-b border-gray-200 bg-white text-[11px] font-bold uppercase tracking-wider text-gray-400"><th className="pb-3 font-bold">Year</th><th className="pb-3 font-bold">Demand index</th><th className="pb-3 font-bold">Share</th><th className="pb-3 font-bold">People employed</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {deepDive.data.historical.map((h) => (
                      <tr key={h.year} className="text-sm"><td className="py-2 font-bold text-gray-900">{h.year}</td><td className="py-2 text-gray-700">{fmtNum(h.role_demand_index)}</td><td className="py-2 text-gray-700">{fmtPct(h.role_share_within_ict_pct, 2)}</td><td className="py-2 text-gray-700">{Math.round(h.role_employment_proxy).toLocaleString('en-US')}</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </Card>
      )}
      {/* Curriculum Alignment report */}
      {generated && type === 'curriculum_alignment' && (
        <Card className="mt-6 overflow-hidden" data-testid="report-curriculum">
          <div className="bg-navy p-8 text-white">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-extrabold tracking-tight">AUCA Curriculum Alignment Report</h2>
                <p className="mt-2 text-sm text-blue-200/80">4 departments · {ALL_DEPTS.reduce((n, d) => n + MARKET_SKILLS[d].length, 0)} market-demanded skills analysed</p>
              </div>
            </div>
          </div>

          {/* Summary table */}
          <div className="overflow-x-auto p-6">
            <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-navy"><TrendingUp className="h-4 w-4" /> Department Overview</h3>
            <table className="mt-3 w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  <th className="pb-4 font-bold">Department</th>
                  <th className="pb-4 font-bold">Faculty</th>
                  <th className="pb-4 font-bold">Market skills</th>
                  <th className="pb-4 font-bold">Covered</th>
                  <th className="pb-4 font-bold">Gaps</th>
                  <th className="pb-4 font-bold">Alignment</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {ALL_DEPTS.map(dept => {
                  const curriculum = DEPT_CURRICULA[dept]
                  const market = MARKET_SKILLS[dept]
                  const covered = market.filter(s => isSkillTaught(s, curriculum))
                  const gaps = market.filter(s => !isSkillTaught(s, curriculum))
                  const pct = market.length > 0 ? Math.round((covered.length / market.length) * 100) : 0
                  const faculty = dept === 'Software Engineering' || dept === 'Network & Info Management' ? 'IT' : 'Business'
                  return (
                    <tr key={dept} className="text-sm">
                      <td className="py-3 pr-4 font-bold text-gray-900">{dept}</td>
                      <td className="py-3 pr-4 text-gray-600">{faculty}</td>
                      <td className="py-3 pr-4 text-gray-700">{market.length}</td>
                      <td className="py-3 pr-4 font-bold text-emerald-600">{covered.length}</td>
                      <td className="py-3 pr-4 font-bold text-red-500">{gaps.length}</td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-20 rounded-full bg-gray-100">
                            <div className={`h-2 rounded-full ${pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-400'}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-sm font-bold text-navy">{pct}%</span>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* Per-department breakdown */}
          {ALL_DEPTS.map(dept => {
            const curriculum = DEPT_CURRICULA[dept]
            const market = MARKET_SKILLS[dept]
            const covered = market.filter(s => isSkillTaught(s, curriculum))
            const gaps = market.filter(s => !isSkillTaught(s, curriculum))
            const pct = market.length > 0 ? Math.round((covered.length / market.length) * 100) : 0

            return (
              <div key={dept} className="border-t border-gray-100 p-6">
                <div className="flex items-center justify-between">
                  <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-navy">
                    <GraduationCap className="h-4 w-4" /> {dept}
                  </h3>
                  <span className={`rounded-full px-3 py-1 text-xs font-bold ${pct >= 70 ? 'bg-emerald-50 text-emerald-700' : pct >= 40 ? 'bg-amber-50 text-amber-700' : 'bg-red-50 text-red-600'}`}>
                    {pct}% aligned
                  </span>
                </div>

                <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Covered ({covered.length})</span>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {covered.map(s => (
                        <span key={s} className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">{s}</span>
                      ))}
                      {covered.length === 0 && <span className="text-xs text-gray-400">None</span>}
                    </div>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">Gaps — not in curriculum ({gaps.length})</span>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {gaps.map(s => (
                        <span key={s} className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-600">{s}</span>
                      ))}
                      {gaps.length === 0 && <span className="text-xs text-gray-400">Fully covered</span>}
                    </div>
                  </div>
                </div>

                {gaps.length > 0 && (
                  <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                    <div className="flex items-center gap-2">
                      <Sparkles className="h-4 w-4 text-amber-600" />
                      <span className="text-xs font-bold text-amber-800">AI Recommendation</span>
                    </div>
                    <p className="mt-1 text-sm text-amber-900">
                      {gaps.length <= 3
                        ? `Add ${gaps.join(', ')} to the ${dept} curriculum to reach full market alignment.`
                        : `Prioritize adding ${gaps.slice(0, 3).join(', ')} to the ${dept} curriculum. ${gaps.length - 3} more skills still missing — consider covering through Innovation Center training or elective courses.`
                      }
                    </p>
                  </div>
                )}
              </div>
            )
          })}
        </Card>
      )}
    </DashboardLayout>
  )
}
