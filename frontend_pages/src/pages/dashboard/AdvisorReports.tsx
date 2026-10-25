import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Building2, ClipboardList, GraduationCap, MapPin, TrendingUp, UserCheck, Users } from 'lucide-react'
import DashboardLayout from './DashboardLayout'
import { TrendMark } from './AdvisorDashboard'
import {
  Block,
  DataTable,
  ExportBar,
  Kpi,
  KpiRow,
  RankList,
  ReportBanner,
  ReportDocument,
  ReportPageHeader,
  ReportWorkspace,
  type ReportTemplate,
} from '../../components/ui/reportKit'
import { AMBER, BLUE, GREEN, HBarChart, RED, VBarChart } from '../../components/ui/reportCharts'
import { Field, Notice, Pill, ReadinessBar, SECTOR_OPTIONS, StudentPicker, errorText, inputClass } from './advisorUi'
import { EmptyState, ErrorState, Loading } from '../../components/ui/State'
import { advisoryApi } from '../../services/api'
import { useAdvisorReport } from '../../services/queries'
import { DEPT_LABEL } from '../../data/auca-skills'
import { fmtDate, fmtInt, fmtPct } from '../../lib/format'
import { monthLabel } from './advisorUi'
import type {
  AdvisorReportType,
  CohortOutcomesReport,
  DeptCode,
  EmployerDemandReport,
  ReportFilters,
  SkillsGapReport,
  StudentReadinessReport,
} from '../../types/advisory'

const TEMPLATES: ReportTemplate<AdvisorReportType>[] = [
  { id: 'cohort_outcomes', title: 'Cohort Outcomes', desc: 'Placement rate, time to placement and top employers. For donor reporting.', icon: GraduationCap, tone: 'bg-emerald-50 text-emerald-600', formats: ['CSV', 'PDF'] },
  { id: 'skills_gap', title: 'Skills Gap Summary', desc: 'Which skills are most often missing across assessed students.', icon: Users, tone: 'bg-violet-50 text-violet-600', formats: ['CSV', 'PDF'] },
  { id: 'employer_demand', title: 'Employer Demand Brief', desc: 'What employers are hiring for right now. One page for students.', icon: TrendingUp, tone: 'bg-amber-50 text-amber-600', formats: ['CSV', 'PDF'] },
  { id: 'student_readiness', title: 'Student Readiness', desc: 'One student: readiness per target role, gaps and pathway.', icon: UserCheck, tone: 'bg-primary-light text-primary', formats: ['CSV', 'PDF'] },
]

const rateColor = (pct: number) => (pct >= 70 ? GREEN : pct >= 40 ? AMBER : RED)
const deptName = (d: string) => DEPT_LABEL[d as DeptCode] ?? d

function Cohort({ r }: { r: CohortOutcomesReport }) {
  const gender = r.by_gender
  return (
    <>
      <p className="text-sm text-gray-600">Scope: <strong>{r.scope}</strong></p>
      <KpiRow>
        <Kpi label="Graduates" value={fmtInt(r.total_graduated)} />
        <Kpi label="Placed" value={fmtInt(r.total_placed)} tone="text-emerald-600" />
        <Kpi label="Placement rate" value={fmtPct(r.placement_rate, 0)} />
        <Kpi label="Days to placement" value={r.avg_days_to_placement == null ? '–' : fmtInt(r.avg_days_to_placement)} note="average" />
      </KpiRow>
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <Block title="Placements over time" hint="By start date, last 12 months.">
          <VBarChart data={r.by_month.map((m) => ({ name: monthLabel(m.month), value: m.count }))} color={BLUE} />
        </Block>
        <Block title="Placement rate by department" hint="Placed graduates as a share of each department's graduates.">
          <HBarChart
            nameWidth={180}
            format={(v) => `${v}%`}
            data={r.by_department.map((d) => ({ name: deptName(d.department), value: d.rate, color: rateColor(d.rate) }))}
          />
        </Block>
      </div>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        <Block title="Top employers" icon={Building2}><RankList items={r.top_employers.map((e) => ({ name: e.company, count: e.count }))} badge="bg-primary-light text-primary" empty="No placements yet" /></Block>
        <Block title="Roles placed in" icon={Users}><RankList items={r.by_role.map((e) => ({ name: e.role, count: e.count }))} badge="bg-emerald-50 text-emerald-600" empty="No placements yet" /></Block>
        <Block title="Gender">
          <ul className="space-y-2 text-sm">
            {(['F', 'M'] as const).map((g) => (
              <li key={g} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2">
                <span className="font-medium text-gray-800">{g === 'F' ? 'Female' : 'Male'}</span>
                <span className="text-gray-600">{gender[g]?.placed ?? 0} of {gender[g]?.total ?? 0} placed</span>
              </li>
            ))}
            <li className="text-xs text-gray-500">Female share of placements: <strong>{fmtPct(r.female_share_of_placed, 0)}</strong> (Mastercard Foundation target: 70%)</li>
          </ul>
        </Block>
      </div>
      {r.average_readiness != null && <p className="text-sm text-gray-600">Average readiness of this group: <strong>{fmtPct(r.average_readiness, 0)}</strong> across {r.assessed_students} assessed.</p>}
    </>
  )
}

function SkillsGap({ r }: { r: SkillsGapReport }) {
  if (r.assessed_students === 0) return <Notice>No students have been assessed yet. Run assessments first, then this report fills in.</Notice>
  const top = r.most_missing_skills[0]
  const low = r.lowest_readiness_roles[0]
  const dept = r.by_department.filter((d) => d.avg_readiness != null)
  return (
    <>
      <KpiRow>
        <Kpi label="Students assessed" value={r.assessed_students} note="latest assessment each" />
        <Kpi label="Most missing skill" value={top?.skill ?? '–'} note={top ? `${top.count} students` : undefined} tone="text-red-500" />
        <Kpi label="Hardest target role" value={low ? fmtPct(low.avg_readiness, 0) : '–'} note={low?.role} />
        <Kpi label="Roles assessed" value={r.lowest_readiness_roles.length} />
      </KpiRow>
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <Block title="Skills students are missing" hint="Share of assessed students lacking each skill.">
          <HBarChart nameWidth={170} color={RED} format={(v) => `${v}%`} data={r.most_missing_skills.slice(0, 10).map((s) => ({ name: s.skill, value: s.pct }))} />
        </Block>
        <Block title="Readiness by target role" hint="Average readiness; lowest first.">
          <HBarChart nameWidth={200} format={(v) => `${v}%`} data={r.lowest_readiness_roles.map((x) => ({ name: x.role, value: x.avg_readiness, color: rateColor(x.avg_readiness) }))} />
        </Block>
      </div>
      <Block title="Readiness by department">
        <HBarChart nameWidth={190} format={(v) => `${v}%`} data={dept.map((d) => ({ name: deptName(d.department), value: d.avg_readiness as number, color: rateColor(d.avg_readiness as number) }))} />
      </Block>
    </>
  )
}

function EmployerDemand({ r }: { r: EmployerDemandReport }) {
  const sectorLabel = r.sector === 'all' ? 'both tracked sectors' : SECTOR_OPTIONS.find((s) => s.slug === r.sector)?.label ?? r.sector
  return (
    <>
      <KpiRow>
        <Kpi label="Job postings" value={fmtInt(r.total_postings)} note={sectorLabel} />
        <Kpi label="Top role" value={r.top_roles[0] ? r.top_roles[0].postings : '–'} note={r.top_roles[0]?.role} />
        <Kpi label="Top skill" value={r.top_skills[0]?.skill ?? '–'} note={r.top_skills[0] ? `${r.top_skills[0].count} postings` : undefined} />
        <Kpi label="Top employer" value={r.top_companies[0]?.count ?? '–'} note={r.top_companies[0]?.company} />
      </KpiRow>
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-2">
        <Block title="Most demanded skills" hint="Postings that mention each skill.">
          <HBarChart nameWidth={170} format={(v) => String(v)} data={r.top_skills.slice(0, 10).map((s) => ({ name: s.skill, value: s.count }))} />
        </Block>
        <Block title="Postings per month">
          <VBarChart data={r.monthly.map((m) => ({ name: monthLabel(m.month), value: m.count }))} />
        </Block>
      </div>
      <Block title="Roles in demand" hint="Postings in the last 90 days against the 90 days before.">
        <DataTable head={['Role', 'Postings', 'Trend']} minWidth={420}>
          {r.top_roles.map((x) => (
            <tr key={x.role}><td className="font-bold text-gray-900">{x.role}</td><td className="text-gray-700">{x.postings}</td><td><TrendMark trend={x.trend} /></td></tr>
          ))}
        </DataTable>
      </Block>
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Block title="Companies hiring" icon={Building2}><RankList items={r.top_companies.map((c) => ({ name: c.company, count: c.count }))} badge="bg-primary-light text-primary" empty="No data" /></Block>
        <Block title="Locations" icon={MapPin}><RankList items={r.top_locations.map((c) => ({ name: c.location, count: c.count }))} badge="bg-emerald-50 text-emerald-600" empty="No data" /></Block>
      </div>
    </>
  )
}

function StudentReadiness({ r }: { r: StudentReadinessReport }) {
  const s = r.student
  return (
    <>
      <div>
        <p className="text-sm text-gray-600">{s.department_label}{s.graduation_year ? ` · class of ${s.graduation_year}` : ''} · {s.status}{s.cohort ? ` · ${s.cohort}` : ''}</p>
        <div className="mt-3 flex flex-wrap gap-2">{s.skills.length ? s.skills.map((k) => <Pill key={k} tone="info">{k}</Pill>) : <span className="text-sm text-gray-400">No skills recorded</span>}</div>
      </div>
      {r.targets_inferred && <Notice>No target roles are recorded for this student, so the three closest matches are shown.</Notice>}
      <Block title="Readiness by role">
        <HBarChart nameWidth={200} format={(v) => `${v}%`} data={r.assessments.map((a) => ({ name: a.target_role, value: Math.round(a.readiness_score), color: rateColor(a.readiness_score) }))} />
      </Block>
      {r.assessments.map((a) => (
        <div key={a.target_role} className="rounded-xl border border-gray-200 p-4">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-base font-bold text-gray-900">{a.target_role}</h3>
            <span className="text-2xl font-extrabold text-gray-900">{Math.round(a.readiness_score)}%</span>
          </div>
          <ReadinessBar score={a.readiness_score} className="mt-2" />
          <div className="mt-3 flex flex-wrap gap-1.5">
            {a.matched_skills.map((k) => <Pill key={k} tone="match">{k}</Pill>)}
            {a.missing_skills.map((k) => <Pill key={k} tone="gap">{k}</Pill>)}
          </div>
          {a.priority_skills?.length > 0 && (
            <p className="mt-3 text-sm text-gray-700">
              <strong>Learn first:</strong> {a.priority_skills.map((p) => `${p.skill} (${p.postings ?? 0} postings, about ${p.weeks} wk)`).join(', ')}
            </p>
          )}
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-gray-700">{a.recommendations.map((t, i) => <li key={i}>{t}</li>)}</ul>
        </div>
      ))}
      {r.pathways.map((p) => (
        <Block key={p.target_role} title={`Pathway to ${p.target_role}`} hint={`${Math.round(p.progress_pct)}% done, about ${p.estimated_months} month${p.estimated_months === 1 ? '' : 's'}`}>
          <DataTable head={['Skill', 'Source', 'Weeks', 'Done']} minWidth={480}>
            {p.steps.map((st) => (<tr key={st.skill}><td className="font-bold text-gray-900">{st.skill}</td><td className="text-gray-600">{st.source}</td><td>{st.duration_weeks}</td><td>{st.completed ? 'Yes' : 'No'}</td></tr>))}
          </DataTable>
        </Block>
      ))}
      {r.placements.length > 0 && (
        <Block title="Placement">
          <DataTable head={['Role', 'Company', 'Start']} minWidth={420}>
            {r.placements.map((p, i) => (<tr key={i}><td className="font-bold text-gray-900">{p.role_title}</td><td>{p.company}</td><td>{fmtDate(p.start_date)}</td></tr>))}
          </DataTable>
        </Block>
      )}
    </>
  )
}

export default function AdvisorReports() {
  const [type, setType] = useState<AdvisorReportType>('cohort_outcomes')
  const [studentId, setStudentId] = useState<number | null>(null)
  const [year, setYear] = useState('')
  const [cohort, setCohort] = useState('')
  const [dept, setDept] = useState('')
  const [sector, setSector] = useState('')

  const filters = useMemo<ReportFilters>(() => {
    if (type === 'student_readiness') return { student_id: studentId ?? undefined }
    if (type === 'cohort_outcomes') return { graduation_year: /^\d{4}$/.test(year) ? Number(year) : undefined, cohort: cohort.trim() || undefined, department: dept || undefined }
    if (type === 'employer_demand') return { sector: sector || undefined }
    return {}
  }, [type, studentId, year, cohort, dept, sector])

  const needsStudent = type === 'student_readiness' && studentId === null
  const report = useAdvisorReport(type, filters, !needsStudent)
  const exportMut = useMutation({ mutationFn: (fmt: 'pdf' | 'csv') => advisoryApi.downloadReport(type, fmt, filters) })

  const options =
    type === 'student_readiness' ? (
      <div className="max-w-xl"><span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Student</span><StudentPicker value={studentId} onChange={(s) => setStudentId(s?.id ?? null)} /></div>
    ) : type === 'cohort_outcomes' ? (
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <Field label="Graduation year"><input inputMode="numeric" maxLength={4} className={inputClass} value={year} onChange={(e) => setYear(e.target.value)} placeholder="All years" /></Field>
        <Field label="Innovation Center cohort"><input className={inputClass} value={cohort} onChange={(e) => setCohort(e.target.value)} placeholder="All cohorts" /></Field>
        <Field label="Department">
          <select className={inputClass} value={dept} onChange={(e) => setDept(e.target.value)}>
            <option value="">All departments</option>
            {(Object.keys(DEPT_LABEL) as DeptCode[]).map((c) => <option key={c} value={c}>{DEPT_LABEL[c]}</option>)}
          </select>
        </Field>
      </div>
    ) : type === 'employer_demand' ? (
      <div className="max-w-xs">
        <Field label="Sector">
          <select className={inputClass} value={sector} onChange={(e) => setSector(e.target.value)}>
            <option value="">Both sectors</option>
            {SECTOR_OPTIONS.map((s) => <option key={s.slug} value={s.slug}>{s.label}</option>)}
          </select>
        </Field>
      </div>
    ) : undefined

  const meta = (generated: string) => `AUCA · SkillSense Career Advisory · generated ${fmtDate(generated)}`
  const exportBar = (
    <ExportBar
      onCsv={() => exportMut.mutate('csv')}
      onPdf={() => exportMut.mutate('pdf')}
      csvPending={exportMut.isPending && exportMut.variables === 'csv'}
      pdfPending={exportMut.isPending && exportMut.variables === 'pdf'}
      error={exportMut.isError ? errorText(exportMut.error) : null}
    />
  )
  const tpl = TEMPLATES.find((t) => t.id === type)!

  return (
    <DashboardLayout>
      <ReportPageHeader
        icon={ClipboardList}
        title="Advisor Reports"
        subtitle="Outcomes, skills gaps and employer demand for leadership, the Mastercard Foundation and partner employers."
        chip="Live from your students"
      />
      <ReportWorkspace templates={TEMPLATES} value={type} onChange={setType}>
        {needsStudent ? (
          <ReportDocument banner={<ReportBanner kind="Student report" title={tpl.title} meta="Choose a student to build the report." />} options={options}>
            <EmptyState title="Pick a student" hint="Their readiness, gaps, pathway and placement appear here." />
          </ReportDocument>
        ) : report.isLoading ? (
          <Loading label="Building report…" />
        ) : report.isError || !report.data ? (
          <ErrorState error={report.error} onRetry={() => report.refetch()} />
        ) : (
          <div data-testid="report-preview">
            <ReportDocument banner={<ReportBanner kind={tpl.title} title={report.data.title} meta={meta(report.data.generated_at)} exports={exportBar} />} options={options}>
              {report.data.type === 'cohort_outcomes' && <Cohort r={report.data} />}
              {report.data.type === 'skills_gap' && <SkillsGap r={report.data} />}
              {report.data.type === 'employer_demand' && <EmployerDemand r={report.data} />}
              {report.data.type === 'student_readiness' && <StudentReadiness r={report.data} />}
            </ReportDocument>
          </div>
        )}
      </ReportWorkspace>
    </DashboardLayout>
  )
}
