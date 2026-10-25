import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Award, BookOpen, Flag, Loader2, Route as RouteIcon, Save, Trash2 } from 'lucide-react'
import DashboardLayout, { Card } from './DashboardLayout'
import {
  Field,
  Notice,
  PageHeader,
  ReadinessBar,
  SectionTitle,
  StudentPicker,
  buttonPrimary,
  errorText,
  inputClass,
} from './advisorUi'
import { EmptyState, Loading } from '../../components/ui/State'
import { advisoryApi } from '../../services/api'
import { usePathways, useStudent } from '../../services/queries'
import {
  CERTIFICATIONS,
  LADDERS,
  PATHWAY_MODES,
  ROLES,
  ROLE_BY_NAME,
  generatePathway,
  pathwayMonths,
  scoreRole,
  type PathwayMode,
} from '../../data/auca-skills'
import { fmtDate } from '../../lib/format'
import type { PathwayStep, SavedPathway } from '../../types/advisory'

const MODES = Object.keys(PATHWAY_MODES) as PathwayMode[]
const isCourse = (source: string) => source.startsWith('Innovation Center')

function Timeline({ steps, role, months }: { steps: PathwayStep[]; role: string; months: number }) {
  return (
    <ol className="relative ml-3 border-l-2 border-gray-200 pl-6">
      {steps.map((s, i) => (
        <li key={`${s.skill}-${i}`} className="relative pb-5 last:pb-0">
          <span className="absolute -left-[33px] top-1 flex h-4 w-4 items-center justify-center rounded-full border-2 border-primary bg-white">
            {s.completed && <span className="h-2 w-2 rounded-full bg-primary" />}
          </span>
          <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className={`text-sm font-bold ${s.completed ? 'text-gray-400 line-through' : 'text-gray-900'}`}>{s.skill}</span>
            <span className={`text-xs font-semibold ${isCourse(s.source) ? 'text-primary' : 'text-gray-500'}`}>{s.source}</span>
            <span className="text-xs text-gray-400">{s.duration_weeks} wk</span>
          </div>
        </li>
      ))}
      <li className="relative pt-1">
        <span className="absolute -left-[35px] top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-navy text-white">
          <Flag className="h-3 w-3" />
        </span>
        <span className="text-sm font-extrabold text-navy">
          Target: {role} <span className="font-semibold text-gray-500">(about {months} month{months === 1 ? '' : 's'})</span>
        </span>
      </li>
    </ol>
  )
}

function SavedPathwayCard({ p, onChanged }: { p: SavedPathway; onChanged: () => void }) {
  const qc = useQueryClient()
  const refresh = () => {
    for (const k of ['pathways', 'student']) qc.invalidateQueries({ queryKey: [k] })
    onChanged()
  }
  const toggle = useMutation({
    mutationFn: (index: number) =>
      advisoryApi.updatePathway(p.id, { steps: p.steps.map((s, i) => (i === index ? { ...s, completed: !s.completed } : s)) }),
    onSuccess: refresh,
  })
  const remove = useMutation({ mutationFn: () => advisoryApi.deletePathway(p.id), onSuccess: refresh })

  return (
    <Card className="p-5" data-testid="saved-pathway">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-bold text-gray-900">{p.student.name} → {p.target_role}</h3>
          <p className="text-xs text-gray-500">Saved {fmtDate(p.created_at)} · about {p.estimated_months} month{p.estimated_months === 1 ? '' : 's'}</p>
        </div>
        <button
          type="button"
          aria-label={`Delete pathway for ${p.student.name}`}
          disabled={remove.isPending}
          onClick={() => window.confirm('Delete this saved pathway?') && remove.mutate()}
          className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <div className="mt-3 flex items-center gap-3">
        <ReadinessBar score={p.progress_pct} />
        <span className="w-12 text-right text-sm font-bold text-gray-700">{Math.round(p.progress_pct)}%</span>
      </div>
      <ul className="mt-3 space-y-1">
        {p.steps.map((s, i) => (
          <li key={`${s.skill}-${i}`}>
            <label className="flex cursor-pointer items-center gap-2 rounded-lg px-1 py-1 text-sm hover:bg-gray-50">
              <input type="checkbox" checked={s.completed} disabled={toggle.isPending} onChange={() => toggle.mutate(i)} className="h-4 w-4 accent-[#1D4ED8]" />
              <span className={s.completed ? 'text-gray-400 line-through' : 'text-gray-800'}>{s.skill}</span>
              <span className="text-xs text-gray-400">{s.source}</span>
            </label>
          </li>
        ))}
      </ul>
      {(toggle.isError || remove.isError) && <p className="mt-2 text-xs text-red-600">{errorText(toggle.error ?? remove.error)}</p>}
    </Card>
  )
}

export default function AdvisorPathways() {
  const qc = useQueryClient()
  const [params, setParams] = useSearchParams()
  const studentId = params.get('student') ? Number(params.get('student')) : null
  const student = useStudent(studentId)
  const saved = usePathways(studentId ?? undefined)

  const [role, setRole] = useState('')
  const [mode, setMode] = useState<PathwayMode>('balanced')
  const [generated, setGenerated] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  // Default the destination to the student's first target role.
  const firstTarget = student.data?.target_roles[0]
  useEffect(() => {
    if (firstTarget) setRole((r) => r || firstTarget)
  }, [firstTarget])
  useEffect(() => setGenerated(false), [studentId, role, mode])

  const skills = student.data?.skills ?? []
  const steps = useMemo(() => (role && student.data ? generatePathway(skills, role, mode) : []), [skills, role, mode, student.data])
  const months = pathwayMonths(steps)
  const roleSpec = ROLE_BY_NAME[role]
  const readiness = role ? scoreRole(skills, role).score : null

  const routes = useMemo(
    () => (role && student.data ? MODES.map((m) => ({ mode: m, months: pathwayMonths(generatePathway(skills, role, m)) })) : []),
    [skills, role, student.data],
  )

  const courses = useMemo(() => {
    const byCourse = new Map<string, string[]>()
    for (const s of steps) if (isCourse(s.source)) byCourse.set(s.source.replace('Innovation Center: ', ''), [...(byCourse.get(s.source.replace('Innovation Center: ', '')) ?? []), s.skill])
    return [...byCourse.entries()]
  }, [steps])

  const saveMut = useMutation({
    mutationFn: () => advisoryApi.createPathway({ student_id: studentId!, target_role: role, steps, estimated_months: months }),
    onSuccess: () => {
      for (const k of ['pathways', 'student']) qc.invalidateQueries({ queryKey: [k] })
      setMessage({ tone: 'ok', text: 'Pathway saved. Tick steps off below as the student completes them.' })
    },
    onError: (e) => setMessage({ tone: 'error', text: errorText(e) }),
  })

  return (
    <DashboardLayout>
      <PageHeader
        icon={RouteIcon}
        title="Career Pathways"
        subtitle="A step-by-step plan from the student's current skills to a target role, using Innovation Center courses where they exist."
      />

      <Card className="mt-8 p-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div>
            <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">Student</span>
            <StudentPicker value={studentId} onChange={(s) => { setParams(s ? { student: String(s.id) } : {}); setRole('') }} />
          </div>
          <Field label="Destination role">
            <select className={inputClass} value={role} onChange={(e) => setRole(e.target.value)} disabled={!studentId}>
              <option value="">Select a role…</option>
              {student.data && student.data.target_roles.length > 0 && (
                <optgroup label="Student's target roles">
                  {student.data.target_roles.map((r) => <option key={`t-${r}`} value={r}>{r}</option>)}
                </optgroup>
              )}
              <optgroup label="ICT & Technology">
                {ROLES.filter((r) => r.sector === 'ict').map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
              </optgroup>
              <optgroup label="Finance & Business">
                {ROLES.filter((r) => r.sector === 'business').map((r) => <option key={r.name} value={r.name}>{r.name}</option>)}
              </optgroup>
            </select>
          </Field>
        </div>
        {studentId !== null && student.isLoading && <Loading label="Loading student…" className="py-4" />}
        {student.data && skills.length === 0 && (
          <div className="mt-4">
            <Notice tone="warn">This student has no skills recorded, so every skill would count as a gap. Add skills on the Skill Assessment page first.</Notice>
          </div>
        )}
        <button type="button" className={`${buttonPrimary} mt-5`} disabled={!student.data || !role} onClick={() => { setGenerated(true); setMessage(null) }}>
          <RouteIcon className="h-4 w-4" /> Generate pathway
        </button>
      </Card>

      {message && <div className="mt-6"><Notice tone={message.tone}>{message.text}</Notice></div>}

      {generated && student.data && roleSpec && (
        <div className="mt-6 space-y-6" data-testid="generated-pathway">
          <Card className="p-6">
            <SectionTitle hint={`${student.data.name} is ${Math.round(readiness ?? 0)}% ready for ${role} today.`}>Choose a route</SectionTitle>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {routes.map((r) => (
                <button
                  key={r.mode}
                  type="button"
                  onClick={() => setMode(r.mode)}
                  aria-pressed={mode === r.mode}
                  className={`rounded-xl border p-4 text-left transition-colors ${mode === r.mode ? 'border-primary bg-primary-light' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                >
                  <div className="text-sm font-bold text-gray-900">{PATHWAY_MODES[r.mode].label}</div>
                  <div className="text-xs text-gray-500">{PATHWAY_MODES[r.mode].blurb}</div>
                  <div className="mt-2 text-2xl font-extrabold text-navy">{r.months} <span className="text-sm font-semibold text-gray-500">month{r.months === 1 ? '' : 's'}</span></div>
                </button>
              ))}
            </div>
          </Card>

          <Card className="p-6">
            <SectionTitle hint="In the order to learn them.">Generated pathway</SectionTitle>
            {steps.length === 0 ? (
              <Notice tone="ok">No gaps: {student.data.name} already has every skill listed for {role}.</Notice>
            ) : (
              <>
                <Timeline steps={steps} role={role} months={months} />
                <div className="mt-6 flex flex-wrap items-center gap-3">
                  <button type="button" className={buttonPrimary} disabled={saveMut.isPending} onClick={() => saveMut.mutate()}>
                    {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save this pathway
                  </button>
                </div>
              </>
            )}
          </Card>

          {courses.length > 0 && (
            <Card className="p-6">
              <SectionTitle hint="Innovation Center courses that cover steps of this pathway.">
                <span className="inline-flex items-center gap-2"><BookOpen className="h-5 w-5 text-primary" /> Courses to register for</span>
              </SectionTitle>
              <ul className="space-y-2 text-sm">
                {courses.map(([course, covered]) => (
                  <li key={course} className="rounded-lg border border-gray-100 bg-gray-50 px-4 py-3">
                    <span className="font-bold text-gray-900">{course}</span>
                    <span className="text-gray-500"> covers {covered.join(', ')}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <SectionTitle hint={LADDERS[roleSpec.ladder].label}>Role progression</SectionTitle>
              <ol className="space-y-3">
                {LADDERS[roleSpec.ladder].steps.map((s, i) => (
                  <li key={s.title} className="flex gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary-light text-xs font-bold text-primary">{i + 1}</span>
                    <div>
                      <div className="text-sm font-bold text-gray-900">{s.title}</div>
                      <div className="text-xs text-gray-500">Unlocked by: {s.unlocks}</div>
                    </div>
                  </li>
                ))}
              </ol>
            </Card>
            <Card className="p-6">
              <SectionTitle hint="Worth pursuing for this career family.">
                <span className="inline-flex items-center gap-2"><Award className="h-5 w-5 text-primary" /> Certifications</span>
              </SectionTitle>
              <ul className="space-y-3">
                {(CERTIFICATIONS[roleSpec.ladder] ?? []).map((c) => (
                  <li key={c.name}>
                    <div className="text-sm font-bold text-gray-900">{c.name}</div>
                    <div className="text-xs text-gray-500">{c.when}</div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      )}

      <div className="mt-10">
        <SectionTitle hint={studentId ? 'For the selected student.' : 'For all students. Pick a student above to narrow it down.'}>Saved pathways</SectionTitle>
        {saved.isLoading ? (
          <Loading />
        ) : !saved.data || saved.data.results.length === 0 ? (
          <EmptyState title="No saved pathways yet" hint="Generate a pathway and save it to track progress." />
        ) : (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {saved.data.results.map((p) => <SavedPathwayCard key={p.id} p={p} onChanged={() => undefined} />)}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
