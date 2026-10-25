import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { Building2, BriefcaseBusiness, Check, ExternalLink, MapPin, X } from 'lucide-react'
import DashboardLayout, { Card } from './DashboardLayout'
import { Sparkline } from './charts'
import { TrendMark } from './AdvisorDashboard'
import {
  Field,
  Notice,
  PageHeader,
  SECTOR_OPTIONS,
  SectionTitle,
  StudentPicker,
  buttonGhost,
  inputClass,
  monthLabel,
} from './advisorUi'
import { EmptyState, ErrorState, Loading } from '../../components/ui/State'
import { useAdvisorJobs, useJobInsights, useStudent } from '../../services/queries'
import { ROLES, hasSkill } from '../../data/auca-skills'
import { fmtDate, fmtInt } from '../../lib/format'
import type { AdvisorJob, JobFilters } from '../../types/advisory'

const LOCATIONS = [
  { value: '', label: 'Anywhere' },
  { value: 'kigali', label: 'Kigali' },
  { value: 'remote', label: 'Remote' },
  { value: 'other', label: 'Other provinces' },
]

const RECENCY = [
  { label: 'Any time', days: 0 },
  { label: 'Last 30 days', days: 30 },
  { label: 'Last 90 days', days: 90 },
]

function useDebounced<T>(value: T, ms = 350): T {
  const [v, setV] = useState(value)
  useEffect(() => {
    const t = setTimeout(() => setV(value), ms)
    return () => clearTimeout(t)
  }, [value, ms])
  return v
}

function JobCard({ job, studentSkills }: { job: AdvisorJob; studentSkills: string[] | null }) {
  const matched = studentSkills ? job.skills.filter((s) => hasSkill(studentSkills, s)) : []
  const linked = studentSkills !== null && job.skills.length > 0
  return (
    <Card className="flex flex-col p-5" data-testid="job-card">
      <h3 className="text-base font-bold leading-snug text-gray-900">{job.title}</h3>
      <div className="mt-1 flex items-center gap-1.5 text-sm text-gray-600">
        <Building2 className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        <span className="truncate">{job.company || 'Company not listed'}</span>
      </div>
      <div className="mt-0.5 flex items-center gap-1.5 text-xs text-gray-500">
        <MapPin className="h-3.5 w-3.5 shrink-0 text-gray-400" />
        <span className="truncate">{job.location || 'Location not listed'}</span>
        <span aria-hidden>·</span>
        <span>{job.posted_date ? fmtDate(job.posted_date) : 'Date not listed'}</span>
      </div>

      <div className="mt-4 flex-1">
        <div className="mb-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-400">
          {job.skills_source === 'posting' ? 'Skills in the posting' : `Typical ${job.role ?? 'role'} skills`}
        </div>
        {job.skills.length === 0 ? (
          <p className="text-xs text-gray-400">No known skills could be read from this posting.</p>
        ) : (
          <ul className="flex flex-wrap gap-1.5">
            {job.skills.slice(0, 12).map((s) => {
              const has = studentSkills ? matched.includes(s) : null
              return (
                <li
                  key={s}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                    has === null ? 'bg-gray-100 text-gray-600' : has ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}
                >
                  {has === true && <Check className="h-3 w-3" aria-label="student has this" />}
                  {has === false && <X className="h-3 w-3" aria-label="student lacks this" />}
                  {s}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-2 border-t border-gray-100 pt-3">
        {linked ? (
          <span className="text-sm font-bold text-gray-800" data-testid="match-score">
            Matches {job.matched ?? matched.length} of {job.required || job.skills.length} skills
          </span>
        ) : (
          <span className="text-xs text-gray-400">{job.source}</span>
        )}
        {job.source_url && (
          <a href={job.source_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
            Original <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </Card>
  )
}

export default function AdvisorJobs() {
  const [params, setParams] = useSearchParams()
  const studentId = params.get('student') ? Number(params.get('student')) : null
  const student = useStudent(studentId)

  const [sector, setSector] = useState('')
  const [role, setRole] = useState('')
  const [days, setDays] = useState(0)
  const [q, setQ] = useState('')
  const [location, setLocation] = useState('')
  const [onlyMatches, setOnlyMatches] = useState(false)
  const [bestFirst, setBestFirst] = useState(false)
  const [page, setPage] = useState(1)
  const dq = useDebounced(q)

  // what the market looks like (also drives the company and trend panels)
  const filters = useMemo(
    () => ({
      sector: sector || undefined,
      role: role || undefined,
      q: dq || undefined,
      location: location || undefined,
      days: days || undefined,
    }),
    [sector, role, dq, location, days],
  )
  // how well each posting fits the linked student; only applies while a student is linked
  const fit = useMemo(
    () => (studentId === null ? {} : { student_id: studentId, only_matches: onlyMatches || undefined, sort: bestFirst ? ('match' as const) : undefined }),
    [studentId, onlyMatches, bestFirst],
  )
  useEffect(() => setPage(1), [filters, fit])

  const jobs = useAdvisorJobs({ ...filters, ...fit, page } as JobFilters)
  const insights = useJobInsights(filters)

  const studentSkills = student.data ? student.data.skills : null
  const roleOptions = ROLES.filter((r) => !sector || (sector === 'ict-technology' ? r.sector === 'ict' : r.sector === 'business'))
  const pages = jobs.data ? Math.max(1, Math.ceil(jobs.data.count / 24)) : 1
  const maxCompany = Math.max(1, ...(insights.data?.top_companies.map((c) => c.count) ?? [1]))

  return (
    <DashboardLayout>
      <PageHeader
        icon={BriefcaseBusiness}
        title="Job Market Navigator"
        subtitle="Live postings in the ICT and Business sectors. Link a student to see how well each posting fits their skills."
      />

      <Card className="mt-8 p-5">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Field label="Sector">
            <select className={inputClass} value={sector} onChange={(e) => { setSector(e.target.value); setRole('') }}>
              <option value="">Both sectors</option>
              {SECTOR_OPTIONS.map((s) => <option key={s.slug} value={s.slug}>{s.label}</option>)}
            </select>
          </Field>
          <Field label="Role">
            <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value)}>
              <option value="">All roles</option>
              {roleOptions.map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
            </select>
          </Field>
          <Field label="Location">
            <select className={inputClass} value={location} onChange={(e) => setLocation(e.target.value)}>
              {LOCATIONS.map((l) => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </Field>
          <Field label="Posted">
            <select className={inputClass} value={days} onChange={(e) => setDays(Number(e.target.value))}>
              {RECENCY.map((r) => <option key={r.days} value={r.days}>{r.label}</option>)}
            </select>
          </Field>
          <div className="md:col-span-2">
            <Field label="Search title or company">
              <input type="search" className={inputClass} value={q} onChange={(e) => setQ(e.target.value)} placeholder="e.g. developer, Bank of Kigali" />
            </Field>
          </div>
          <div className="md:col-span-2">
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Link a student</span>
            <StudentPicker
              value={studentId}
              onChange={(s) => setParams(s ? { student: String(s.id) } : {})}
              placeholder="Search students…"
            />
          </div>
        </div>
        {studentId !== null && student.data && (
          <p className="mt-3 text-sm text-gray-600">
            Matching against <strong>{student.data.name}</strong>'s {student.data.skills.length} skill{student.data.skills.length === 1 ? '' : 's'}.
            {student.data.skills.length === 0 && ' Add skills on the Skill Assessment page to see matches.'}
          </p>
        )}
        {studentId !== null && (
          <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={onlyMatches} onChange={(e) => setOnlyMatches(e.target.checked)} className="h-4 w-4 accent-[#1D4ED8]" />
              Only postings that ask for a skill this student has
            </label>
            <label className="inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
              <input type="checkbox" checked={bestFirst} onChange={(e) => setBestFirst(e.target.checked)} className="h-4 w-4 accent-[#1D4ED8]" />
              Best match first
            </label>
          </div>
        )}
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <SectionTitle hint={jobs.data ? `${fmtInt(jobs.data.count)} posting${jobs.data.count === 1 ? '' : 's'} match` : undefined}>
            Postings
          </SectionTitle>
          {jobs.isLoading ? (
            <Loading />
          ) : jobs.isError ? (
            <ErrorState error={jobs.error} onRetry={() => jobs.refetch()} />
          ) : jobs.data!.results.length === 0 ? (
            <EmptyState title="No postings match these filters" hint="Widen the date range or clear a filter." />
          ) : (
            <>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {jobs.data!.results.map((j) => <JobCard key={j.id} job={j} studentSkills={studentSkills} />)}
              </div>
              {pages > 1 && (
                <div className="mt-5 flex items-center justify-between">
                  <button className={buttonGhost} disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</button>
                  <span className="text-sm text-gray-500">Page {page} of {pages}</span>
                  <button className={buttonGhost} disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
                </div>
              )}
            </>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-5">
            <SectionTitle hint="Who is hiring most, for the filters above.">Company hiring patterns</SectionTitle>
            {insights.isLoading ? <Loading className="py-6" /> : !insights.data || insights.data.top_companies.length === 0 ? (
              <p className="text-sm text-gray-400">No company data for these filters.</p>
            ) : (
              <ul className="space-y-3">
                {insights.data.top_companies.map((c) => (
                  <li key={c.company}>
                    <div className="flex justify-between text-sm">
                      <span className="truncate font-semibold text-gray-800">{c.company}</span>
                      <span className="text-gray-500">{c.count}</span>
                    </div>
                    <div className="mt-1 h-1.5 rounded-full bg-gray-100">
                      <div className="h-full rounded-full bg-primary" style={{ width: `${(c.count / maxCompany) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <SectionTitle hint="Postings per month, last six months.">Demand trend by role</SectionTitle>
            {insights.isLoading ? <Loading className="py-6" /> : !insights.data || insights.data.roles.length === 0 ? (
              <p className="text-sm text-gray-400">No dated postings for these filters.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {insights.data.roles.map((r) => (
                  <li key={r.role} className="py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-sm font-semibold text-gray-800">{r.role}</span>
                      <TrendMark trend={r.trend} />
                    </div>
                    <Sparkline points={r.series} color="#1D4ED8" />
                    <div className="flex justify-between text-[10px] text-gray-400">
                      <span>{insights.data!.months[0] && monthLabel(insights.data!.months[0])}</span>
                      <span>{r.postings} postings</span>
                      <span>{insights.data!.months.at(-1) && monthLabel(insights.data!.months.at(-1)!)}</span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {insights.data && insights.data.top_locations.length > 0 && (
            <Card className="p-5">
              <SectionTitle>Where the jobs are</SectionTitle>
              <ul className="space-y-1.5 text-sm">
                {insights.data.top_locations.map((l) => (
                  <li key={l.location} className="flex justify-between">
                    <span className="text-gray-700">{l.location}</span>
                    <span className="text-gray-500">{l.count}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <Notice>Salary ranges are not shown because the scraped postings do not carry pay information.</Notice>
        </div>
      </div>
    </DashboardLayout>
  )
}
