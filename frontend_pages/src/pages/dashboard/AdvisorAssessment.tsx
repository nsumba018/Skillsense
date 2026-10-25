import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Lightbulb, Loader2, Save, Target, UserPlus, X } from 'lucide-react'
import DashboardLayout, { Card } from './DashboardLayout'
import { ProfileRadar } from './charts'
import {
  Field,
  Notice,
  Pill,
  PageHeader,
  ReadinessBar,
  SectionTitle,
  StudentPicker,
  SkillPicker,
  buttonGhost,
  buttonPrimary,
  errorText,
  inputClass,
  readinessTone,
} from './advisorUi'
import { Loading } from '../../components/ui/State'
import { advisoryApi } from '../../services/api'
import { ApiError } from '../../services/http'
import { useStudent } from '../../services/queries'
import {
  DEPT_LABEL,
  ROLES,
  ROLE_BY_NAME,
  SKILL_CATEGORIES,
  assessStudent,
  type DeptCode,
} from '../../data/auca-skills'
import type { CreateStudentPayload } from '../../types/advisory'

const MAX_ROLES = 3

interface ResultView {
  role: string
  score: number
  matched: string[]
  missing: string[]
  other: string[]
  recommendations: string[]
  alternatives: { role: string; score: number }[]
}

const sameList = (a: string[], b: string[]) => a.length === b.length && a.every((v, i) => v === b[i])

const BLANK = { first_name: '', last_name: '', email: '', department: 'se' as DeptCode, graduation_year: '', gender: '' as '' | 'M' | 'F' }

export default function AdvisorAssessment() {
  const qc = useQueryClient()
  const [params, setParams] = useSearchParams()
  const studentId = params.get('student') ? Number(params.get('student')) : null
  const student = useStudent(studentId)

  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [skills, setSkills] = useState<string[]>([])
  const [targets, setTargets] = useState<string[]>([])
  const [results, setResults] = useState<ResultView[] | null>(null)
  const [offline, setOffline] = useState(false)
  const [message, setMessage] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)

  const loaded = student.data
  useEffect(() => {
    if (loaded) {
      setSkills(loaded.skills)
      setTargets(loaded.target_roles.slice(0, MAX_ROLES))
      setResults(null)
    }
  }, [loaded?.id]) // eslint-disable-line react-hooks/exhaustive-deps -- reset only when a different student loads

  const select = (id: number | null) => {
    setCreating(false)
    setMessage(null)
    setResults(null)
    if (id === null) {
      setParams({})
      setSkills([])
      setTargets([])
    } else {
      setParams({ student: String(id) })
    }
  }

  const dirty = !!loaded && (!sameList([...skills].sort(), [...loaded.skills].sort()) || !sameList(targets, loaded.target_roles.slice(0, MAX_ROLES)))

  const createMut = useMutation({
    mutationFn: () => {
      const payload: CreateStudentPayload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        department: form.department,
        graduation_year: form.graduation_year ? Number(form.graduation_year) : null,
        gender: form.gender,
        skills,
        target_roles: targets,
      }
      return advisoryApi.createStudent(payload)
    },
    onSuccess: (s) => {
      qc.invalidateQueries({ queryKey: ['students'] })
      qc.invalidateQueries({ queryKey: ['advisor-dashboard'] })
      setForm(BLANK)
      setMessage({ tone: 'ok', text: `${s.name} was added.` })
      select(s.id)
    },
    onError: (e) => setMessage({ tone: 'error', text: errorText(e) }),
  })

  const saveMut = useMutation({
    mutationFn: () => advisoryApi.updateStudent(studentId!, { skills, target_roles: targets }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['student', studentId] })
      qc.invalidateQueries({ queryKey: ['students'] })
      setMessage({ tone: 'ok', text: 'Skills and target roles saved.' })
    },
    onError: (e) => setMessage({ tone: 'error', text: errorText(e) }),
  })

  const assessMut = useMutation({
    mutationFn: async () => {
      const toView = (role: string, base: Omit<ResultView, 'other'>): ResultView => ({
        ...base,
        other: assessStudent(skills, role).other_skills,
      })
      try {
        if (dirty) await advisoryApi.updateStudent(studentId!, { skills, target_roles: targets })
        const saved = []
        for (const role of targets) saved.push(await advisoryApi.assess(studentId!, role))
        return {
          offline: false,
          views: saved.map((a) =>
            toView(a.target_role, {
              role: a.target_role,
              score: a.readiness_score,
              matched: a.matched_skills,
              missing: a.missing_skills,
              recommendations: a.recommendations,
              alternatives: a.alternative_roles,
            }),
          ),
        }
      } catch (e) {
        // Server unreachable or broken: score in the browser so the conversation can go on (nothing is saved).
        if (e instanceof ApiError && e.status !== 0 && e.status < 500) throw e
        return {
          offline: true,
          views: targets.map((role) => {
            const a = assessStudent(skills, role)
            return toView(role, {
              role,
              score: a.readiness_score,
              matched: a.matched_skills,
              missing: a.missing_skills,
              recommendations: a.recommendations,
              alternatives: a.alternative_roles,
            })
          }),
        }
      }
    },
    onSuccess: ({ views, offline: off }) => {
      setResults(views)
      setOffline(off)
      setMessage(null)
      if (!off) {
        for (const k of ['student', 'students', 'assessments', 'advisor-dashboard']) qc.invalidateQueries({ queryKey: [k] })
      }
    },
    onError: (e) => setMessage({ tone: 'error', text: errorText(e) }),
  })

  const addRole = (name: string) => {
    if (name && !targets.includes(name) && targets.length < MAX_ROLES) setTargets([...targets, name])
  }

  const radar = useMemo(() => (results && results.length >= 3 ? results.map((r) => ({ role: r.role, market: 100, profile: r.score })) : null), [results])
  const canAssess = !!loaded && targets.length > 0 && skills.length > 0

  return (
    <DashboardLayout>
      <PageHeader
        icon={Target}
        title="Skill Assessment"
        subtitle="Score a student against the skills employers ask for, see the gaps, and get a recommendation to talk through."
      />

      <Card className="mt-8 p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <SectionTitle hint="Pick a registered student or create a quick profile.">1. Student</SectionTitle>
          <button type="button" onClick={() => { setCreating(!creating); setMessage(null) }} className={buttonGhost}>
            {creating ? <X className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {creating ? 'Cancel' : 'New student'}
          </button>
        </div>

        {!creating && <StudentPicker value={studentId} onChange={(s) => select(s?.id ?? null)} />}
        {!creating && studentId !== null && student.isLoading && <Loading label="Loading student…" className="py-4" />}
        {!creating && loaded && (
          <p className="mt-3 text-sm text-gray-500">
            {DEPT_LABEL[loaded.department]}
            {loaded.graduation_year ? ` · class of ${loaded.graduation_year}` : ''} · status {loaded.status}
            {loaded.latest_assessment && ` · last assessed ${loaded.latest_assessment.target_role} ${Math.round(loaded.latest_assessment.readiness_score)}%`}
          </p>
        )}

        {creating && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Field label="First name">
              <input className={inputClass} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
            </Field>
            <Field label="Last name">
              <input className={inputClass} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
            </Field>
            <Field label="Email" hint="Optional; used to match CSV placement imports">
              <input type="email" className={inputClass} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Department">
              <select className={inputClass} value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value as DeptCode })}>
                {(Object.keys(DEPT_LABEL) as DeptCode[]).map((c) => (
                  <option key={c} value={c}>{DEPT_LABEL[c]}</option>
                ))}
              </select>
            </Field>
            <Field label="Graduation year">
              <input type="number" min={2000} max={2100} className={inputClass} value={form.graduation_year} onChange={(e) => setForm({ ...form, graduation_year: e.target.value })} />
            </Field>
            <Field label="Gender" hint="For donor reporting only">
              <select className={inputClass} value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as '' | 'M' | 'F' })}>
                <option value="">Prefer not to say</option>
                <option value="F">Female</option>
                <option value="M">Male</option>
              </select>
            </Field>
          </div>
        )}
      </Card>

      {(loaded || creating) && (
        <>
          <Card className="mt-6 p-6">
            <SectionTitle hint="Tick every skill the student can show evidence of.">2. Current skills</SectionTitle>
            <SkillPicker categories={SKILL_CATEGORIES} value={skills} onChange={setSkills} />
          </Card>

          <Card className="mt-6 p-6">
            <SectionTitle hint={`Choose up to ${MAX_ROLES} roles the student is interested in.`}>3. Target roles</SectionTitle>
            <div className="flex flex-wrap gap-2">
              {targets.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setTargets(targets.filter((x) => x !== t))}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary-light px-3 py-1.5 text-sm font-semibold text-primary"
                  aria-label={`Remove ${t}`}
                >
                  {t} <X className="h-3.5 w-3.5" />
                </button>
              ))}
              {targets.length === 0 && <span className="text-sm text-gray-400">No role chosen yet</span>}
            </div>
            <select
              aria-label="Add a target role"
              value=""
              disabled={targets.length >= MAX_ROLES}
              onChange={(e) => addRole(e.target.value)}
              className={`${inputClass} mt-3 max-w-md`}
            >
              <option value="">{targets.length >= MAX_ROLES ? 'Maximum reached' : 'Add a role…'}</option>
              <optgroup label="ICT & Technology">
                {ROLES.filter((r) => r.sector === 'ict').map((r) => (
                  <option key={r.name} value={r.name} disabled={targets.includes(r.name)}>{r.name}</option>
                ))}
              </optgroup>
              <optgroup label="Finance & Business">
                {ROLES.filter((r) => r.sector === 'business').map((r) => (
                  <option key={r.name} value={r.name} disabled={targets.includes(r.name)}>{r.name}</option>
                ))}
              </optgroup>
            </select>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {creating ? (
                <button
                  type="button"
                  className={buttonPrimary}
                  disabled={createMut.isPending || !form.first_name.trim() || !form.last_name.trim()}
                  onClick={() => createMut.mutate()}
                >
                  {createMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
                  Create student
                </button>
              ) : (
                <>
                  <button type="button" className={buttonPrimary} disabled={!canAssess || assessMut.isPending} onClick={() => assessMut.mutate()}>
                    {assessMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Target className="h-4 w-4" />}
                    Assess
                  </button>
                  <button type="button" className={buttonGhost} disabled={!dirty || saveMut.isPending} onClick={() => saveMut.mutate()}>
                    {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                    Save without assessing
                  </button>
                  {dirty && <span className="text-xs font-semibold text-amber-700">Unsaved changes. Assessing saves them.</span>}
                  {!canAssess && <span className="text-xs text-gray-500">Add at least one skill and one target role.</span>}
                </>
              )}
            </div>
          </Card>
        </>
      )}

      {message && <div className="mt-6"><Notice tone={message.tone}>{message.text}</Notice></div>}

      {results && (
        <div className="mt-6 space-y-6" data-testid="assessment-results">
          {offline && (
            <Notice tone="warn">The server could not be reached, so these scores were calculated in your browser and were not saved.</Notice>
          )}

          {radar && (
            <Card className="p-6">
              <SectionTitle hint="Readiness for each chosen role against full market coverage.">Profile across roles</SectionTitle>
              <ProfileRadar data={radar} />
            </Card>
          )}

          {results.map((r) => (
            <Card key={r.role} className="p-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-900">{r.role}</h2>
                  <p className="text-sm text-gray-500">
                    {ROLE_BY_NAME[r.role] ? DEPT_LABEL[ROLE_BY_NAME[r.role].dept] : ''} · {r.matched.length} of {r.matched.length + r.missing.length} employer-demanded skills
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-extrabold text-gray-900" data-testid="readiness-score">{Math.round(r.score)}%</div>
                  <div className="text-xs font-semibold uppercase tracking-wide text-gray-400">Readiness</div>
                </div>
              </div>
              <ReadinessBar score={r.score} className="mt-4 !h-3" />

              <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div>
                  <h3 className="mb-2 text-sm font-bold text-emerald-700">Skills employers want that the student has</h3>
                  <div className="flex flex-wrap gap-2">
                    {r.matched.length ? r.matched.map((s) => <Pill key={s} tone="match">{s}</Pill>) : <span className="text-sm text-gray-400">None yet</span>}
                  </div>
                </div>
                <div>
                  <h3 className="mb-2 text-sm font-bold text-red-700">Gaps to close</h3>
                  <div className="flex flex-wrap gap-2">
                    {r.missing.length ? r.missing.map((s) => <Pill key={s} tone="gap">{s}</Pill>) : <span className="text-sm text-gray-400">No gaps</span>}
                  </div>
                </div>
              </div>
              {r.other.length > 0 && (
                <div className="mt-5">
                  <h3 className="mb-2 text-sm font-bold text-gray-600">Skills the student has that this role does not prioritise</h3>
                  <div className="flex flex-wrap gap-2">{r.other.map((s) => <Pill key={s} tone="other">{s}</Pill>)}</div>
                </div>
              )}

              <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
                <h3 className="flex items-center gap-2 text-sm font-bold text-amber-900"><Lightbulb className="h-4 w-4" /> Recommendation</h3>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-amber-900">
                  {r.recommendations.map((t, i) => <li key={i}>{t}</li>)}
                </ul>
              </div>

              {r.alternatives.length > 0 && (
                <div className="mt-6">
                  <h3 className="mb-2 text-sm font-bold text-gray-700">Other roles the student is partly qualified for</h3>
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                        <th className="py-2 pr-4 font-bold">Role</th>
                        <th className="py-2 pr-4 font-bold">Department</th>
                        <th className="py-2 font-bold">Match</th>
                      </tr>
                    </thead>
                    <tbody>
                      {r.alternatives.map((a) => (
                        <tr key={a.role} className="border-b border-gray-100 last:border-0">
                          <td className="py-2.5 pr-4 font-semibold text-gray-900">{a.role}</td>
                          <td className="py-2.5 pr-4 text-gray-600">{ROLE_BY_NAME[a.role] ? DEPT_LABEL[ROLE_BY_NAME[a.role].dept] : ''}</td>
                          <td className="py-2.5">
                            <span className="inline-flex items-center gap-2">
                              <span className={`h-2.5 w-2.5 rounded-full ${readinessTone(a.score)}`} />
                              <span className="font-bold text-gray-700">{Math.round(a.score)}%</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </DashboardLayout>
  )
}
