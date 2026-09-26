import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { AlertTriangle, CheckCircle2, FileUp, GraduationCap, Loader2, Trash2 } from 'lucide-react'
import DashboardLayout, { Card } from './DashboardLayout'
import { EmptyState, QueryGate } from '../../components/ui/State'
import { useAuth } from '../../auth/AuthContext'
import { useCurricula, useCurriculum, useEducation, useInstitutions } from '../../services/queries'
import { analyticsApi } from '../../services/api'
import { ApiError } from '../../services/http'
import { fmtDate, fmtNum } from '../../lib/format'
import { TREND_LABEL, TREND_TONE } from '../../lib/derive'

const LEVELS = [
  ['certificate', 'Certificate'],
  ['diploma', 'Diploma'],
  ['bachelor', "Bachelor's degree"],
  ['master', "Master's degree"],
  ['short_course', 'Short course / bootcamp'],
  ['other', 'Other'],
] as const

const inputClass = 'mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

export default function Education() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const overview = useEducation()
  const list = useCurricula()
  const institutions = useInstitutions()

  const [name, setName] = useState('')
  const [level, setLevel] = useState('bachelor')
  const [institutionId, setInstitutionId] = useState(user?.institution ? String(user.institution.id) : '')
  const [file, setFile] = useState<File | null>(null)
  const [text, setText] = useState('')
  const [openId, setOpenId] = useState<number | null>(null)
  const detail = useCurriculum(openId)

  const submit = useMutation({
    mutationFn: () => {
      const form = new FormData()
      form.append('name', name.trim())
      form.append('level', level)
      if (institutionId) form.append('institution_id', institutionId)
      if (file) form.append('file', file)
      if (text.trim()) form.append('text', text)
      return analyticsApi.submitCurriculum(form)
    },
    onSuccess: (created) => {
      setName('')
      setFile(null)
      setText('')
      setOpenId(created.id)
      queryClient.setQueryData(['curriculum', created.id], created)
      queryClient.invalidateQueries({ queryKey: ['curricula'] })
      queryClient.invalidateQueries({ queryKey: ['education'] })
    },
  })
  const remove = useMutation({
    mutationFn: (id: number) => analyticsApi.deleteCurriculum(id),
    onSuccess: (_, id) => {
      if (openId === id) setOpenId(null)
      queryClient.invalidateQueries({ queryKey: ['curricula'] })
      queryClient.invalidateQueries({ queryKey: ['education'] })
    },
  })

  const canSubmit = name.trim().length > 0 && (file !== null || text.trim().length > 0) && !submit.isPending

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-navy">Education Alignment</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Submit a programme's courses to see which forecast ICT roles it prepares graduates for, and which in-demand
          skills it doesn't teach yet.
        </p>
        {overview.data && (
          <p data-testid="education-method" className="mt-3 text-xs text-gray-400">{overview.data.method}</p>
        )}
      </div>

      <Card className="mt-8 p-6">
        <h2 className="text-lg font-extrabold tracking-tight text-navy">1. Submit a curriculum</h2>
        <form className="mt-5 space-y-5" onSubmit={(e) => { e.preventDefault(); submit.mutate() }}>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            <label className="block md:col-span-1"><span className="text-[11px] font-bold uppercase tracking-wider text-navy">Programme name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="BSc Computer Science" className={inputClass} aria-label="Programme name" /></label>
            <label className="block"><span className="text-[11px] font-bold uppercase tracking-wider text-navy">Level</span>
              <select value={level} onChange={(e) => setLevel(e.target.value)} className={inputClass} aria-label="Level">
                {LEVELS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select></label>
            <label className="block"><span className="text-[11px] font-bold uppercase tracking-wider text-navy">Institution</span>
              <select value={institutionId} onChange={(e) => setInstitutionId(e.target.value)} className={inputClass} aria-label="Institution">
                <option value="">Not specified</option>
                {(institutions.data ?? []).map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select></label>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-navy">Option A: CSV file</span>
              <label htmlFor="curriculum-file" className="mt-2 flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/60 px-4 py-6 text-sm text-gray-600 hover:border-primary/40">
                <FileUp className="h-5 w-5 text-primary" />
                <span>{file ? file.name : 'Choose a .csv with a "course" column (and optional "description")'}</span>
              </label>
              <input id="curriculum-file" data-testid="curriculum-file" type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            </div>
            <label className="block"><span className="text-[11px] font-bold uppercase tracking-wider text-navy">Option B: paste courses (one per line, "Title: description")</span>
              <textarea value={text} onChange={(e) => setText(e.target.value)} rows={4} placeholder={'Introduction to Python programming\nComputer networks: routing and switching'} className={`${inputClass} font-mono text-xs`} aria-label="Courses" /></label>
          </div>

          {submit.isError && <p role="alert" data-testid="curriculum-error" className="text-sm font-medium text-red-600">{submit.error instanceof ApiError ? submit.error.message : 'Could not analyse the curriculum.'}</p>}
          <button type="submit" disabled={!canSubmit} className="flex items-center gap-2 rounded-lg bg-navy px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-dark-navy disabled:cursor-not-allowed disabled:opacity-50">
            {submit.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />}
            Analyse curriculum
          </button>
        </form>
      </Card>

      <div className="mt-8">
        <h2 className="text-2xl font-extrabold tracking-tight text-navy">Your curricula</h2>
        <Card className="mt-5 overflow-x-auto">
          <QueryGate query={list} className="m-6">
            {(l) =>
              l.results.length === 0 ? (
                <EmptyState title="No curricula yet" hint="Submit one above to see how well it matches forecast ICT demand." className="m-6" />
              ) : (
                <table className="w-full min-w-[720px] text-left" data-testid="curricula-table">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/60 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      <th className="px-6 py-4 font-bold">Programme</th><th className="px-6 py-4 font-bold">Level</th><th className="px-6 py-4 font-bold">Institution</th><th className="px-6 py-4 font-bold">Courses</th><th className="px-6 py-4 font-bold">Alignment</th><th className="px-6 py-4 font-bold">Added</th><th className="px-6 py-4" />
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {l.results.map((c) => (
                      <tr key={c.id} onClick={() => setOpenId(c.id)} className={`cursor-pointer text-sm hover:bg-gray-50 ${openId === c.id ? 'bg-primary-light/40' : ''}`}>
                        <td className="px-6 py-4 font-bold text-gray-900">{c.name}</td>
                        <td className="px-6 py-4 text-gray-600">{c.level_label}</td>
                        <td className="px-6 py-4 text-gray-600">{c.institution_name ?? '-'}</td>
                        <td className="px-6 py-4 text-gray-700">{c.course_count}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3"><span className="h-1.5 w-20 rounded-full bg-gray-100"><span className="block h-1.5 rounded-full bg-emerald-600" style={{ width: `${c.alignment_score}%` }} /></span><span className="font-bold text-navy">{fmtNum(c.alignment_score)}%</span></div>
                        </td>
                        <td className="px-6 py-4 text-gray-600">{fmtDate(c.created_at)}</td>
                        <td className="px-6 py-4 text-right">
                          <button aria-label={`Delete ${c.name}`} onClick={(e) => { e.stopPropagation(); remove.mutate(c.id) }} className="text-gray-400 hover:text-red-500"><Trash2 className="h-4 w-4" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            }
          </QueryGate>
        </Card>
      </div>

      {openId !== null && (
        <div className="mt-8" data-testid="curriculum-detail">
          <QueryGate query={detail}>
            {(d) => {
              const a = d.analysis
              return (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                    <Card className="p-6">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Market alignment score</div>
                      <div className="mt-3 flex items-baseline gap-2"><span data-testid="edu-score" className="text-5xl font-extrabold tracking-tight text-navy">{fmtNum(a.alignment_score)}%</span></div>
                      <p className="mt-3 text-sm text-gray-500">{d.name} · {d.level_label} · {d.course_count} courses</p>
                      <p className="mt-2 text-xs text-gray-400">Share of each forecast role's core skills taught, weighted by that role's demand.</p>
                    </Card>
                    <Card className="p-6 lg:col-span-2">
                      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-700"><AlertTriangle className="h-4 w-4" /> Biggest gaps (demand × missing skills)</div>
                      <ul className="mt-4 space-y-3" data-testid="edu-gaps">
                        {a.top_gaps.length === 0 && <li className="text-sm text-gray-500">No gaps: every forecast role is fully covered.</li>}
                        {a.top_gaps.map((g) => (
                          <li key={g.role_id} className="text-sm">
                            <div className="flex items-center justify-between gap-3"><span className="font-bold text-gray-900">{g.role_name}</span><span className="text-xs text-gray-500">demand {fmtNum(g.demand_index, 0)} · covered {fmtNum(g.coverage_pct, 0)}%</span></div>
                            <div className="mt-1 flex flex-wrap gap-1.5">{g.missing_skills.slice(0, 6).map((s) => <span key={s} className="rounded-full bg-red-50 px-2.5 py-0.5 text-[11px] font-semibold text-red-600">{s}</span>)}</div>
                          </li>
                        ))}
                      </ul>
                    </Card>
                  </div>

                  <Card className="overflow-x-auto p-6">
                    <h3 className="text-lg font-extrabold tracking-tight text-navy">Coverage by ICT role</h3>
                    <p className="mt-1 text-sm text-gray-500">Roles ordered by 1-year forecast demand.</p>
                    <table className="mt-4 w-full min-w-[760px] text-left" data-testid="edu-roles">
                      <thead><tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-400"><th className="pb-3 font-bold">Role</th><th className="pb-3 font-bold">Demand</th><th className="pb-3 font-bold">Trend</th><th className="pb-3 font-bold">Curriculum coverage</th><th className="pb-3 font-bold">Skills still missing</th></tr></thead>
                      <tbody className="divide-y divide-gray-100">
                        {a.roles.map((r) => (
                          <tr key={r.role_id} className="text-sm">
                            <td className="py-3 pr-3 font-bold text-gray-900">{r.role_name}</td>
                            <td className="py-3 pr-3 font-bold text-navy">{fmtNum(r.demand_index)}</td>
                            <td className="py-3 pr-3"><span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${TREND_TONE[r.trend]}`}>{TREND_LABEL[r.trend]}</span></td>
                            <td className="py-3 pr-3"><div className="flex items-center gap-3"><span className="h-1.5 w-24 rounded-full bg-gray-100"><span className="block h-1.5 rounded-full bg-emerald-600" style={{ width: `${r.coverage_pct}%` }} /></span><span className="font-semibold text-gray-700">{fmtNum(r.coverage_pct, 0)}%</span></div></td>
                            <td className="py-3 text-xs text-gray-500">{r.missing_skills.length ? r.missing_skills.join(', ') : <span className="flex items-center gap-1 text-emerald-600"><CheckCircle2 className="h-3.5 w-3.5" /> Fully covered</span>}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>

                  <Card className="p-6">
                    <h3 className="text-lg font-extrabold tracking-tight text-navy">What each course teaches</h3>
                    <ul className="mt-4 divide-y divide-gray-100" data-testid="edu-courses">
                      {a.courses.map((c) => (
                        <li key={c.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm">
                          <span className="font-medium text-gray-900">{c.title}</span>
                          <span className="flex flex-wrap gap-1.5">{c.skills.length ? c.skills.map((s) => <span key={s} className="rounded-full bg-primary-light px-2.5 py-0.5 text-[11px] font-semibold text-navy">{s}</span>) : <span className="text-xs text-gray-400">No ICT skill recognised</span>}</span>
                        </li>
                      ))}
                    </ul>
                    {a.unmatched_courses.length > 0 && <p data-testid="edu-unmatched" className="mt-4 text-xs text-gray-400">{a.unmatched_courses.length} course(s) matched no ICT skill and don't count toward the score.</p>}
                  </Card>
                </div>
              )
            }}
          </QueryGate>
        </div>
      )}
    </DashboardLayout>
  )
}
