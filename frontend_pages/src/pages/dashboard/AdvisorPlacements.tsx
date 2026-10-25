import { useRef, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { BarChart4, CalendarClock, ChevronDown, ChevronUp, GraduationCap, Loader2, Plus, Search, Trash2, Upload, Users } from 'lucide-react'
import DashboardLayout, { Card } from './DashboardLayout'
import { Donut, DONUT_COLORS } from './charts'
import {
  DEPT_SHORT,
  Field,
  Kpi,
  Notice,
  PageHeader,
  ReadinessBar,
  SectionTitle,
  StudentPicker,
  buttonGhost,
  buttonPrimary,
  errorText,
  inputClass,
  monthLabel,
  todayIso,
} from './advisorUi'
import { EmptyState, Loading, QueryGate } from '../../components/ui/State'
import { advisoryApi } from '../../services/api'
import { usePlacementStats, usePlacements } from '../../services/queries'
import { DEPT_LABEL } from '../../data/auca-skills'
import { fmtDate, fmtInt, fmtPct } from '../../lib/format'
import type { ContractType, DeptCode, PlacementStats } from '../../types/advisory'

const CONTRACTS: { value: ContractType; label: string }[] = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'internship', label: 'Internship' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'contract', label: 'Contract' },
]
const CONTRACT_LABEL = Object.fromEntries(CONTRACTS.map((c) => [c.value, c.label])) as Record<ContractType, string>
const METHODS = ['Direct application', 'Referral', 'Career fair', 'Innovation Center', 'Internship conversion', 'Other']

const BLANK = { student: null as number | null, role_title: '', company: '', location: 'Kigali', start_date: todayIso(), contract_type: 'full_time' as ContractType, salary_range: '', placement_method: '' }

function RecordForm({ onDone }: { onDone: () => void }) {
  const qc = useQueryClient()
  const [f, setF] = useState(BLANK)
  const [error, setError] = useState<string | null>(null)
  const mut = useMutation({
    mutationFn: () =>
      advisoryApi.createPlacement({
        student_id: f.student!,
        role_title: f.role_title.trim(),
        company: f.company.trim(),
        location: f.location.trim() || undefined,
        start_date: f.start_date,
        contract_type: f.contract_type,
        salary_range: f.salary_range.trim() || undefined,
        placement_method: f.placement_method || undefined,
      }),
    onSuccess: () => {
      for (const k of ['placements', 'placement-stats', 'students', 'student', 'advisor-dashboard']) qc.invalidateQueries({ queryKey: [k] })
      setF(BLANK)
      setError(null)
      onDone()
    },
    onError: (e) => setError(errorText(e)),
  })
  const ready = f.student !== null && f.role_title.trim() && f.company.trim() && f.start_date

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
      <div className="md:col-span-2 xl:col-span-3">
        <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Student</span>
        <StudentPicker value={f.student} onChange={(s) => setF({ ...f, student: s?.id ?? null })} />
      </div>
      <Field label="Role title"><input className={inputClass} value={f.role_title} onChange={(e) => setF({ ...f, role_title: e.target.value })} /></Field>
      <Field label="Company"><input className={inputClass} value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} /></Field>
      <Field label="Location"><input className={inputClass} value={f.location} onChange={(e) => setF({ ...f, location: e.target.value })} /></Field>
      <Field label="Start date"><input type="date" className={inputClass} value={f.start_date} onChange={(e) => setF({ ...f, start_date: e.target.value })} /></Field>
      <Field label="Contract type">
        <select className={inputClass} value={f.contract_type} onChange={(e) => setF({ ...f, contract_type: e.target.value as ContractType })}>
          {CONTRACTS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
      </Field>
      <Field label="How was it found?">
        <select className={inputClass} value={f.placement_method} onChange={(e) => setF({ ...f, placement_method: e.target.value })}>
          <option value="">Not recorded</option>
          {METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
        </select>
      </Field>
      <Field label="Salary range" hint="Optional, e.g. 400,000 - 600,000 RWF">
        <input className={inputClass} value={f.salary_range} onChange={(e) => setF({ ...f, salary_range: e.target.value })} />
      </Field>
      <div className="flex items-end md:col-span-2 xl:col-span-3">
        <button type="button" className={buttonPrimary} disabled={!ready || mut.isPending} onClick={() => mut.mutate()}>
          {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          Record placement
        </button>
      </div>
      {error && <div className="md:col-span-2 xl:col-span-3"><Notice tone="error">{error}</Notice></div>}
    </div>
  )
}

function BulkImport() {
  const qc = useQueryClient()
  const ref = useRef<HTMLInputElement>(null)
  const mut = useMutation({
    mutationFn: (file: File) => {
      const form = new FormData()
      form.append('file', file)
      return advisoryApi.bulkPlacements(form)
    },
    onSuccess: () => {
      for (const k of ['placements', 'placement-stats', 'students', 'advisor-dashboard']) qc.invalidateQueries({ queryKey: [k] })
    },
  })
  return (
    <div>
      <p className="text-sm text-gray-600">
        Columns: <code className="rounded bg-gray-100 px-1">student_email, role_title, company, start_date, contract_type</code>
        {' '}(optional: location, salary_range, placement_method). Students are matched by email.
      </p>
      <input
        ref={ref}
        type="file"
        accept=".csv,text/csv"
        aria-label="CSV file"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) mut.mutate(file)
          e.target.value = ''
        }}
      />
      <button type="button" className={`${buttonGhost} mt-3`} disabled={mut.isPending} onClick={() => ref.current?.click()}>
        {mut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />} Choose CSV file
      </button>
      {mut.isError && <div className="mt-3"><Notice tone="error">{errorText(mut.error)}</Notice></div>}
      {mut.data && (
        <div className="mt-3 space-y-2">
          <Notice tone={mut.data.created ? 'ok' : 'warn'}>
            {mut.data.created} placement{mut.data.created === 1 ? '' : 's'} imported
            {mut.data.errors.length ? `, ${mut.data.errors.length} row${mut.data.errors.length === 1 ? '' : 's'} skipped.` : '.'}
          </Notice>
          {mut.data.errors.length > 0 && (
            <ul className="max-h-40 list-disc overflow-y-auto pl-5 text-sm text-red-700">
              {mut.data.errors.map((e) => <li key={e}>{e}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}

function Analytics({ s }: { s: PlacementStats }) {
  const gender = ['F', 'M', 'unspecified']
    .map((k, i) => ({ name: k === 'F' ? 'Female' : k === 'M' ? 'Male' : 'Not stated', value: s.by_gender[k]?.placed ?? 0, color: DONUT_COLORS[i] }))
    .filter((g) => g.value > 0)
  const chart = s.by_month.map((m) => ({ ...m, label: monthLabel(m.month) }))
  const maxEmp = Math.max(1, ...s.top_employers.map((e) => e.count))
  const maxRole = Math.max(1, ...s.by_role.map((e) => e.count))

  return (
    <>
      <div className="mt-6 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
        <Kpi label="Placed" icon={Users} value={fmtInt(s.total_placed)} hint={`of ${fmtInt(s.total_graduated)} graduates`} />
        <Kpi label="Placement rate" icon={GraduationCap} value={fmtPct(s.placement_rate, 0)} />
        <Kpi
          label="Days to placement"
          icon={CalendarClock}
          value={s.avg_days_to_placement == null ? '–' : fmtInt(s.avg_days_to_placement)}
          hint={s.avg_days_to_placement == null ? 'Needs a graduation date on the student profile' : 'Average from graduation to first job'}
        />
        <Kpi label="This month" icon={BarChart4} value={fmtInt(s.this_month)} hint="placements starting this month" />
      </div>

      <Card className="mt-6 p-6">
        <SectionTitle hint="By start date, last 12 months.">Placements over time</SectionTitle>
        <div className="h-64" role="img" aria-label="Placements per month">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chart} margin={{ left: -20, right: 8, top: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip />
              <Line type="monotone" dataKey="count" name="Placements" stroke="#1D4ED8" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <SectionTitle hint="Placed graduates as a share of each department's graduates.">By department</SectionTitle>
          <ul className="space-y-4">
            {s.by_department.map((d) => (
              <li key={d.department}>
                <div className="flex justify-between text-sm">
                  <span className="font-semibold text-gray-800">{DEPT_LABEL[d.department]}</span>
                  <span className="text-gray-500">{d.total ? `${fmtPct(d.rate, 0)} · ${d.placed}/${d.total}` : 'No graduates'}</span>
                </div>
                <ReadinessBar score={d.total ? d.rate : null} className="mt-1.5" />
              </li>
            ))}
          </ul>
        </Card>
        <Card className="p-6">
          <SectionTitle hint="Placed graduates by gender.">By gender</SectionTitle>
          {gender.length === 0 ? (
            <p className="text-sm text-gray-400">No placements yet.</p>
          ) : (
            <div className="flex flex-wrap items-center gap-6">
              <Donut data={gender} centerValue={fmtPct(s.female_share_of_placed, 0)} centerLabel="female" />
              <ul className="space-y-2 text-sm">
                {gender.map((g) => (
                  <li key={g.name} className="flex items-center gap-2">
                    <span className="h-3 w-3 rounded-full" style={{ backgroundColor: g.color }} />
                    <span className="text-gray-700">{g.name}: <strong>{g.value}</strong></span>
                  </li>
                ))}
                <li className="pt-2 text-xs text-gray-500">Mastercard Foundation target: 70% female</li>
              </ul>
            </div>
          )}
        </Card>
      </div>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <SectionTitle hint="Where to focus employer relationships.">Top employers</SectionTitle>
          {s.top_employers.length === 0 ? <p className="text-sm text-gray-400">No placements yet.</p> : (
            <ul className="space-y-3">
              {s.top_employers.map((e) => (
                <li key={e.company}>
                  <div className="flex justify-between text-sm"><span className="font-semibold text-gray-800">{e.company}</span><span className="text-gray-500">{e.count}</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-gray-100"><div className="h-full rounded-full bg-primary" style={{ width: `${(e.count / maxEmp) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card className="p-6">
          <SectionTitle hint="The jobs graduates actually end up in.">Placements by role</SectionTitle>
          {s.by_role.length === 0 ? <p className="text-sm text-gray-400">No placements yet.</p> : (
            <ul className="space-y-3">
              {s.by_role.map((e) => (
                <li key={e.role}>
                  <div className="flex justify-between text-sm"><span className="font-semibold text-gray-800">{e.role}</span><span className="text-gray-500">{e.count}</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-gray-100"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${(e.count / maxRole) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </>
  )
}

function PlacementTable() {
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const list = usePlacements(search)
  const del = useMutation({
    mutationFn: (id: number) => advisoryApi.deletePlacement(id),
    onSuccess: () => {
      for (const k of ['placements', 'placement-stats', 'students', 'student', 'advisor-dashboard']) qc.invalidateQueries({ queryKey: [k] })
    },
  })
  return (
    <Card className="mt-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <SectionTitle>All placements</SectionTitle>
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student, company, role…" aria-label="Search placements" className={`${inputClass} pl-9`} />
        </div>
      </div>
      {list.isLoading ? <Loading /> : !list.data || list.data.results.length === 0 ? (
        <EmptyState title={search ? 'No placements match your search' : 'No placements recorded yet'} hint={search ? undefined : 'Use "Record a placement" above.'} />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                {['Student', 'Role', 'Company', 'Start', 'Contract', 'Method', ''].map((h) => <th key={h} className="py-2 pr-4 font-bold">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {list.data.results.map((p) => (
                <tr key={p.id} className="border-b border-gray-100 last:border-0">
                  <td className="py-3 pr-4 font-semibold text-gray-900">{p.student.name}<span className="ml-2 text-xs font-normal text-gray-400">{DEPT_SHORT[p.student.department as DeptCode]}</span></td>
                  <td className="py-3 pr-4 text-gray-700">{p.role_title}</td>
                  <td className="py-3 pr-4 text-gray-700">{p.company}</td>
                  <td className="py-3 pr-4 text-gray-500">{fmtDate(p.start_date)}</td>
                  <td className="py-3 pr-4 text-gray-500">{CONTRACT_LABEL[p.contract_type]}</td>
                  <td className="py-3 pr-4 text-gray-500">{p.placement_method || '–'}</td>
                  <td className="py-3 text-right">
                    <button
                      type="button"
                      aria-label={`Delete placement of ${p.student.name}`}
                      disabled={del.isPending}
                      onClick={() => window.confirm(`Delete ${p.student.name}'s placement at ${p.company}?`) && del.mutate(p.id)}
                      className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

export default function AdvisorPlacements() {
  const [year, setYear] = useState('')
  const [cohort, setCohort] = useState('')
  const [dept, setDept] = useState('')
  const [open, setOpen] = useState(false)
  const [bulk, setBulk] = useState(false)
  const stats = usePlacementStats({
    graduation_year: year && /^\d{4}$/.test(year) ? Number(year) : undefined,
    cohort: cohort.trim() || undefined,
    department: dept || undefined,
  })

  return (
    <DashboardLayout>
      <PageHeader
        icon={BarChart4}
        title="Placement Tracker"
        subtitle="Who got placed, where, and how long it took. This is the evidence that the advisory programme works."
      />

      <Card className="mt-8 p-6">
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} className="flex w-full items-center justify-between text-left">
          <span className="text-lg font-bold text-gray-900">Record a placement</span>
          {open ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
        </button>
        {open && <div className="mt-5"><RecordForm onDone={() => setOpen(false)} /></div>}
        <div className="mt-5 border-t border-gray-100 pt-5">
          <button type="button" onClick={() => setBulk(!bulk)} aria-expanded={bulk} className="flex w-full items-center justify-between text-left">
            <span className="text-sm font-bold text-gray-700">Bulk import from CSV</span>
            {bulk ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
          </button>
          {bulk && <div className="mt-3"><BulkImport /></div>}
        </div>
      </Card>

      <Card className="mt-6 p-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <Field label="Graduation year"><input inputMode="numeric" maxLength={4} className={inputClass} value={year} onChange={(e) => setYear(e.target.value)} placeholder="All years" /></Field>
          <Field label="Innovation Center cohort"><input className={inputClass} value={cohort} onChange={(e) => setCohort(e.target.value)} placeholder="All cohorts" /></Field>
          <Field label="Department">
            <select className={inputClass} value={dept} onChange={(e) => setDept(e.target.value)}>
              <option value="">All departments</option>
              {(Object.keys(DEPT_LABEL) as DeptCode[]).map((c) => <option key={c} value={c}>{DEPT_LABEL[c]}</option>)}
            </select>
          </Field>
        </div>
      </Card>

      <QueryGate query={stats}>{(s) => <Analytics s={s} />}</QueryGate>
      <PlacementTable />
    </DashboardLayout>
  )
}
