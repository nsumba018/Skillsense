import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  TrendingUp,
  TrendingDown,
  Users,
  Briefcase,
  GraduationCap,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  BookOpen,
  Lightbulb,
  Building2,
  ChevronDown,
} from 'lucide-react'
import DashboardLayout, { Card, PageHeader } from './DashboardLayout'
import { Donut, SectorEmploymentChart } from './charts'
import { QueryGate } from '../../components/ui/State'
import { useAuth } from '../../auth/AuthContext'
import {
  useSectorForecasts,
  useSectorPositions,
  useSectorEmployment,
  useSectorList,
  useTrends,
  useBulletinAll,
} from '../../services/queries'
import { TREND_LABEL, TREND_TONE } from '../../lib/derive'
import { fmtInt, fmtPct } from '../../lib/format'
import type { SectorForecastEntry, Trend } from '../../types/api'

const AUCA_SECTORS = ['ict-technology', 'finance-business'] as const
const AUCA_SECTOR_LABELS: Record<string, string> = {
  'ict-technology': 'Information Technology',
  'finance-business': 'Business Administration',
}
const FACULTY_PROGRAMS: Record<string, string[]> = {
  'ict-technology': ['Software Engineering', 'Information Management', 'Networks & Communication', 'Big Data Analytics (MSc)'],
  'finance-business': ['Accounting', 'Management', 'Finance', 'Marketing', 'MBA'],
}

const SKILL_CATEGORIES: { label: string; color: string; keywords: string[] }[] = [
  { label: 'Programming Languages', color: 'bg-blue-50 text-blue-700', keywords: ['C', 'C#', 'Java', 'JavaScript', '.NET', 'PL/SQL', 'Python', 'React', 'SQL', 'HTML/CSS', 'Programming', 'Shell Scripting', 'Java/SpringBoot'] },
  { label: 'Web & Mobile', color: 'bg-purple-50 text-purple-700', keywords: ['Web Design', 'Web Development', 'Mobile Development', 'Android', 'iOS', 'REST APIs', 'UI/UX', 'Content Creation', 'Multimedia'] },
  { label: 'Software Engineering', color: 'bg-indigo-50 text-indigo-700', keywords: ['Software Engineering', 'Requirements Engineering', 'Software Modeling', 'Software Testing', 'Software Quality Assurance', 'QA', 'Test Automation', 'Testing', 'Project Management', 'Design Patterns', 'Clean Code', 'Agile/Scrum', 'SDLC', 'UML', 'Jira', 'Architecture', 'OWASP', 'Process Management'] },
  { label: 'Networking & Infrastructure', color: 'bg-teal-50 text-teal-700', keywords: ['Computer Networks', 'Networking', 'Network Administration', 'Network Architecture', 'Network Programming', 'Network Security', 'Advanced Networking', 'CCNA', 'Cisco', 'Routing', 'Switching', 'TCP/IP', 'Socket Programming', 'Firewall', 'Wi-Fi', 'Wireless Networking', 'RF', 'Active Directory', 'Windows Server', 'IoT'] },
  { label: 'Data & Databases', color: 'bg-emerald-50 text-emerald-700', keywords: ['DBMS', 'Database Design', 'Big Data', 'Data Analysis', 'Data Structures', 'Statistics', 'Probability', 'MIS', 'Machine Learning', 'AI/ML', 'Algorithms', 'Information Systems'] },
  { label: 'Security & Systems', color: 'bg-red-50 text-red-700', keywords: ['Cybersecurity', 'Software Security', 'Information Security', 'Penetration Testing', 'Linux', 'Operating Systems', 'System Administration', 'System Design', 'System Analysis', 'Computer Architecture', 'Digital Logic', 'Hardware Troubleshooting', 'IT Support', 'Emerging Technologies'] },
  { label: 'Business & Communication', color: 'bg-amber-50 text-amber-700', keywords: ['Financial Accounting', 'Principles of Accounting', 'Advanced Accounting', 'Cost Accounting', 'Auditing', 'IFRS', 'Corporate Finance', 'Financial Analysis', 'Budgeting', 'Risk Management', 'Management', 'Organizational Behavior', 'Business Analysis', 'Leadership', 'Communication', 'Academic Writing', 'Technical Writing', 'English', 'Research Methods'] },
]

function categorizeSkills(skills: string[]): { label: string; skills: string[]; color: string }[] {
  const placed = new Set<string>()
  const groups: { label: string; skills: string[]; color: string }[] = []
  for (const cat of SKILL_CATEGORIES) {
    const matched = skills.filter(s => !placed.has(s) && cat.keywords.includes(s))
    if (matched.length > 0) {
      matched.forEach(s => placed.add(s))
      groups.push({ label: cat.label, skills: matched, color: cat.color })
    }
  }
  const remaining = skills.filter(s => !placed.has(s))
  if (remaining.length > 0) {
    groups.push({ label: 'Other', skills: remaining, color: 'bg-gray-50 text-gray-700' })
  }
  return groups
}

function TrendBadge({ trend, label }: { trend: Trend; label: string }) {
  const Icon = trend === 'growing' ? TrendingUp : trend === 'declining' ? TrendingDown : Minus
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TREND_TONE[trend]}`}>
      <Icon className="h-3 w-3" />
      {label} {TREND_LABEL[trend]}
    </span>
  )
}

function SectorKpiCard({ fc, empCurrent }: { fc: SectorForecastEntry; empCurrent: number | null }) {
  const growthPct = empCurrent && empCurrent > 0 ? ((fc.employment_count - empCurrent) / empCurrent) * 100 : null
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2.5">
        <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: fc.sector_color }} />
        <span className="text-sm font-bold text-gray-900">{AUCA_SECTOR_LABELS[fc.sector_slug] ?? fc.sector_name}</span>
      </div>
      <div className="mt-1 text-[10px] font-medium text-gray-400">Faculty of {AUCA_SECTOR_LABELS[fc.sector_slug] ?? fc.sector_name}</div>
      <div className="mt-3 grid grid-cols-2 gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Market Share</div>
          <div className="mt-0.5 text-xl font-extrabold tracking-tight text-navy">{fmtPct(fc.employment_share_pct)}</div>
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Employment</div>
          <div className="mt-0.5 text-xl font-extrabold tracking-tight text-navy">{fmtInt(fc.employment_count)}</div>
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <TrendBadge trend={fc.employment_trend} label="Jobs" />
        {growthPct !== null && (
          <span className={`text-xs font-bold ${growthPct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
            {growthPct >= 0 ? '+' : ''}{growthPct.toFixed(1)}%
          </span>
        )}
      </div>
      {fc.posting_count > 0 && (
        <div className="mt-2 text-[11px] text-gray-500">{fmtInt(fc.posting_count)} job postings tracked</div>
      )}
    </Card>
  )
}

export default function EducationDashboard() {
  useAuth()

  const ictForecasts = useSectorForecasts('1y', 'ict-technology')
  const bizForecasts = useSectorForecasts('1y', 'finance-business')
  const ictPositions = useSectorPositions('ict-technology')
  const bizPositions = useSectorPositions('finance-business')
  const sectorEmployment = useSectorEmployment()
  const sectorList = useSectorList()
  const trends = useTrends()
  const bulletin = useBulletinAll()

  const FACULTY_TO_SECTOR: Record<string, string> = { it: 'ict-technology', business: 'finance-business' }
  const apiFacultyPrograms: Record<string, string[]> = bulletin.data
    ? Object.fromEntries(Object.entries(bulletin.data.programs_by_faculty).map(([k, v]) => [FACULTY_TO_SECTOR[k] ?? k, v]))
    : {}
  const facultyPrograms: Record<string, string[]> = { ...FACULTY_PROGRAMS, ...apiFacultyPrograms }
  const programCount = Object.values(facultyPrograms).flat().length

  const aucaForecasts: SectorForecastEntry[] = []
  if (ictForecasts.data?.forecasts) aucaForecasts.push(...ictForecasts.data.forecasts)
  if (bizForecasts.data?.forecasts) aucaForecasts.push(...bizForecasts.data.forecasts)
  const filteredForecasts = aucaForecasts.filter(f => AUCA_SECTORS.includes(f.sector_slug as typeof AUCA_SECTORS[number]))

  const empBySlug = new Map<string, number>()
  if (sectorEmployment.data) {
    const latestYear = new Map<string, number>()
    for (const row of sectorEmployment.data) {
      if (AUCA_SECTORS.includes(row.sector_slug as typeof AUCA_SECTORS[number])) {
        if (!latestYear.has(row.sector_slug) || row.year > latestYear.get(row.sector_slug)!) {
          latestYear.set(row.sector_slug, row.year)
          empBySlug.set(row.sector_slug, row.employment_count)
        }
      }
    }
  }

  const totalAucaEmployment = filteredForecasts.reduce((s, f) => s + f.employment_count, 0)
  const totalAucaPostings = filteredForecasts.reduce((s, f) => s + f.posting_count, 0)
  const growingCount = filteredForecasts.filter(f => f.employment_trend === 'growing').length

  const ictRoles = ictPositions.data?.positions ?? []
  const bizRoles = bizPositions.data?.positions ?? []

  const donutData = filteredForecasts.map(f => ({
    name: AUCA_SECTOR_LABELS[f.sector_slug] ?? f.sector_name,
    value: f.employment_count,
    color: f.sector_color,
  }))

  const chartData = filteredForecasts
    .sort((a, b) => a.employment_count - b.employment_count)
    .map(f => ({
      name: AUCA_SECTOR_LABELS[f.sector_slug] ?? f.sector_name,
      current: empBySlug.get(f.sector_slug) ?? 0,
      forecast: f.employment_count,
      color: f.sector_color,
    }))

  const [expandedDepts, setExpandedDepts] = useState<Set<string>>(new Set())

  const ictGrowing = trends.data?.growing.slice(0, 5) ?? []
  const ictDeclining = trends.data?.declining.slice(0, 3) ?? []

  return (
    <DashboardLayout>
      <PageHeader
        icon={GraduationCap}
        title="AUCA Education Planner"
        subtitle="Align AUCA programmes with Rwanda's labour market demand. See which roles employers need and where your graduates fit."
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/dashboard/forecast" className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
              <TrendingUp className="h-4 w-4" />
              Role Forecast
            </Link>
            <Link to="/dashboard/education" className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
              <BookOpen className="h-4 w-4" />
              Curriculum Analysis
            </Link>
            <Link to="/dashboard/career" className="flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-dark-navy">
              <Lightbulb className="h-4 w-4" />
              Training Insights
            </Link>
          </div>
        }
      />

      {/* KPI row */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">AUCA Faculties Tracked</span>
            <Building2 className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="mt-3">
            <span className="text-4xl font-extrabold tracking-tight text-gray-900">{AUCA_SECTORS.length}</span>
          </div>
          <p className="mt-3 text-xs text-gray-500">Information Technology &amp; Business Administration</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Market Employment</span>
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-3">
            <span className="text-4xl font-extrabold tracking-tight text-gray-900">{fmtInt(totalAucaEmployment)}</span>
          </div>
          <p className="mt-3 text-xs text-gray-500">1-year forecast across AUCA sectors · {growingCount} growing</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Job Postings</span>
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-3">
            <span className="text-4xl font-extrabold tracking-tight text-gray-900">{fmtInt(totalAucaPostings)}+</span>
          </div>
          <p className="mt-3 text-xs text-gray-500">Active postings in IT &amp; Business sectors</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">AUCA Programs</span>
            <GraduationCap className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="mt-3">
            <span className="text-4xl font-extrabold tracking-tight text-gray-900">
              {programCount}
            </span>
          </div>
          <p className="mt-3 text-xs text-gray-500">Degree programs across both faculties</p>
        </Card>
      </div>

      {/* Faculty sector cards */}
      {filteredForecasts.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-bold text-gray-900">Faculty Market Overview</h2>
          <p className="mt-1 text-sm text-gray-500">How AUCA's two tracked faculties align with labour market sectors</p>
          <div className="mt-4 grid grid-cols-1 gap-5 sm:grid-cols-2">
            {filteredForecasts.map(fc => (
              <SectorKpiCard key={fc.sector_slug} fc={fc} empCurrent={empBySlug.get(fc.sector_slug) ?? null} />
            ))}
          </div>
        </div>
      )}

      {/* Department Curriculum Snapshots — from bulletin API */}
      {(bulletin.data?.departments ?? []).length > 0 && (
        <div className="mt-6 space-y-5">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Department Curricula</h2>
            <p className="mt-1 text-sm text-gray-500">Skills extracted from uploaded bulletins — parsed automatically per department</p>
          </div>
          {bulletin.data!.departments.map(dept => {
            const open = expandedDepts.has(dept.code)
            const groups = categorizeSkills(dept.skills)
            const toggle = () => setExpandedDepts(prev => {
              const next = new Set(prev)
              next.has(dept.code) ? next.delete(dept.code) : next.add(dept.code)
              return next
            })
            return (
              <Card key={dept.code} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h2 className="text-lg font-bold text-gray-900">{dept.name} Curriculum</h2>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-bold text-gray-500">{dept.skills.length} skills</span>
                    </div>
                    <p className="mt-1 text-sm text-gray-500">4-year programme · {dept.total_credits} credits · {dept.total_semesters} semesters · {dept.total_courses} courses</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Link to="/dashboard/career" className="text-sm font-semibold text-primary hover:underline">See skill gaps &rarr;</Link>
                    <button onClick={toggle} className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
                      <ChevronDown className={`h-5 w-5 transition-transform ${open ? 'rotate-180' : ''}`} />
                    </button>
                  </div>
                </div>
                {open && (
                  <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {groups.map(g => (
                      <div key={g.label}>
                        <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{g.label}</h3>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {g.skills.map(s => (
                            <span key={s} className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${g.color}`}>{s}</span>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )
          })}
        </div>
      )}

      {/* Employment forecast chart + donut */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        {chartData.length > 0 && (
          <Card className="p-6 lg:col-span-2">
            <h2 className="text-lg font-bold text-gray-900">Employment Forecast</h2>
            <p className="mt-1 text-sm text-gray-500">Current employment vs. 1-year forecast for AUCA-relevant sectors</p>
            <div className="mt-4">
              <SectorEmploymentChart data={chartData} height={260} />
            </div>
            <p className="mt-2 text-xs text-gray-400">
              Based on SkillSense sector forecast model · NISR Labour Force Survey data
            </p>
          </Card>
        )}
        {donutData.length > 0 && (
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900">Employment Split</h2>
            <p className="mt-1 text-xs text-gray-500">Forecast employment by faculty sector</p>
            <div className="mt-6 flex flex-col items-center gap-6">
              <Donut data={donutData} centerValue={fmtInt(totalAucaEmployment)} centerLabel="Total" />
              <ul className="space-y-2.5">
                {donutData.map(s => (
                  <li key={s.name} className="flex items-center gap-3 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="text-gray-600">{s.name}</span>
                    <span className="font-bold text-gray-900">{fmtInt(s.value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Card>
        )}
      </div>

      {/* Top roles per sector */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: sectorList.data?.find(s => s.slug === 'ict-technology')?.color ?? '#1E3A8A' }} />
            <h2 className="text-lg font-bold text-gray-900">Top IT Roles in Demand</h2>
          </div>
          <p className="mt-1 text-xs text-gray-500">Job titles employers are hiring for in ICT</p>
          <QueryGate query={ictPositions} className="mt-4">
            {() => (
              <div className="mt-4 space-y-3">
                {ictRoles.slice(0, 8).map((r, i) => {
                  const maxCount = ictRoles[0]?.count ?? 1
                  return (
                    <div key={r.title}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-50 text-[10px] font-bold text-blue-700">{i + 1}</span>
                          <span className="font-medium text-gray-800">{r.title}</span>
                        </span>
                        <span className="shrink-0 font-bold text-navy">{r.count} posts</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100">
                        <div className="h-1.5 rounded-full bg-blue-600" style={{ width: `${(r.count / maxCount) * 100}%` }} />
                      </div>
                    </div>
                  )
                })}
                {ictRoles.length === 0 && <p className="text-sm text-gray-400">No data yet</p>}
              </div>
            )}
          </QueryGate>
          <div className="mt-5 rounded-lg bg-blue-50 p-3">
            <p className="text-xs font-semibold text-blue-800">AUCA Programs Preparing for These Roles</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {(facultyPrograms['ict-technology'] ?? []).map(p => (
                <span key={p} className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-blue-700 shadow-sm">{p}</span>
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: sectorList.data?.find(s => s.slug === 'finance-business')?.color ?? '#10b981' }} />
            <h2 className="text-lg font-bold text-gray-900">Top Business Roles in Demand</h2>
          </div>
          <p className="mt-1 text-xs text-gray-500">Job titles employers are hiring for in Finance &amp; Business</p>
          <QueryGate query={bizPositions} className="mt-4">
            {() => (
              <div className="mt-4 space-y-3">
                {bizRoles.slice(0, 8).map((r, i) => {
                  const maxCount = bizRoles[0]?.count ?? 1
                  return (
                    <div key={r.title}>
                      <div className="flex items-center justify-between gap-3 text-sm">
                        <span className="flex items-center gap-2">
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-700">{i + 1}</span>
                          <span className="font-medium text-gray-800">{r.title}</span>
                        </span>
                        <span className="shrink-0 font-bold text-navy">{r.count} posts</span>
                      </div>
                      <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100">
                        <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${(r.count / maxCount) * 100}%` }} />
                      </div>
                    </div>
                  )
                })}
                {bizRoles.length === 0 && <p className="text-sm text-gray-400">No data yet</p>}
              </div>
            )}
          </QueryGate>
          <div className="mt-5 rounded-lg bg-emerald-50 p-3">
            <p className="text-xs font-semibold text-emerald-800">AUCA Programs Preparing for These Roles</p>
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {(facultyPrograms['finance-business'] ?? []).map(p => (
                <span key={p} className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 shadow-sm">{p}</span>
              ))}
            </div>
          </div>
        </Card>
      </div>

      {/* ICT role trends (growing vs declining) */}
      <QueryGate query={trends} className="mt-6">
        {(t) => (
          <Card className="p-6">
            <h2 className="text-lg font-bold text-gray-900">ICT Role Trends</h2>
            <p className="mt-1 text-xs text-gray-500">Roles relevant to AUCA IT faculty — monitor these for curriculum alignment</p>
            <div className="mt-6 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <div className="flex items-center gap-2">
                  <ArrowUpRight className="h-4 w-4 text-emerald-600" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Growing Roles ({t.growing.length})</span>
                </div>
                <ul className="mt-3 space-y-2.5">
                  {ictGrowing.map(r => (
                    <li key={r.role_id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium text-gray-800">{r.role_name}</span>
                      <span className="shrink-0 font-bold text-emerald-600">{r.demand_index.toFixed(0)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <Minus className="h-4 w-4 text-gray-400" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Stable ({t.stable.length})</span>
                </div>
                <ul className="mt-3 space-y-2.5">
                  {t.stable.slice(0, 5).map(r => (
                    <li key={r.role_id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium text-gray-800">{r.role_name}</span>
                      <span className="shrink-0 font-bold text-gray-500">{r.demand_index.toFixed(0)}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                  <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">Declining ({t.declining.length})</span>
                </div>
                <ul className="mt-3 space-y-2.5">
                  {ictDeclining.map(r => (
                    <li key={r.role_id} className="flex items-center justify-between gap-2 text-sm">
                      <span className="truncate font-medium text-gray-800">{r.role_name}</span>
                      <span className="shrink-0 font-bold text-red-500">{r.demand_index.toFixed(0)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Card>
        )}
      </QueryGate>

    </DashboardLayout>
  )
}
