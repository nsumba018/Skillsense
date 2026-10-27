import { useState } from 'react'
import { Check, Search, X } from 'lucide-react'
import { DEPT_LABEL } from '../../data/auca-skills'
import { useStudents } from '../../services/queries'
import type { DeptCode, StudentProfile } from '../../types/advisory'

export { PageHeader } from './DashboardLayout'

/** Shared building blocks of the Career & Training Advisor pages. */

export const SECTOR_OPTIONS = [
  { slug: 'ict-technology', label: 'ICT & Technology' },
  { slug: 'finance-business', label: 'Finance & Business' },
]

export const DEPT_SHORT: Record<DeptCode, string> = { se: 'SE', net: 'Network', im: 'Info Mgmt', fin: 'Finance', ba: 'BA' }

export const inputClass =
  'w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

export const buttonPrimary =
  'inline-flex items-center justify-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-dark-navy disabled:cursor-not-allowed disabled:opacity-50'

export const buttonGhost =
  'inline-flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50'

export function Kpi({
  label,
  value,
  hint,
  icon: Icon,
}: {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  icon: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
      <div className="flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-gray-500 sm:text-sm">{label}</span>
        <Icon className="h-4 w-4 shrink-0 text-primary sm:h-5 sm:w-5" />
      </div>
      <div className="mt-2 text-3xl font-extrabold tracking-tight text-gray-900 sm:mt-3 sm:text-4xl">{value}</div>
      {hint && <p className="mt-2 text-[11px] text-gray-500 sm:mt-3 sm:text-xs">{hint}</p>}
    </div>
  )
}

export const readinessTone = (score: number | null | undefined): string =>
  score == null ? 'bg-gray-300' : score >= 75 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-red-500'

export function ReadinessBar({ score, className = '' }: { score: number | null | undefined; className?: string }) {
  return (
    <div className={`h-2 w-full overflow-hidden rounded-full bg-gray-100 ${className}`} role="presentation">
      <div className={`h-full rounded-full ${readinessTone(score)}`} style={{ width: `${Math.min(100, Math.max(0, score ?? 0))}%` }} />
    </div>
  )
}

type PillTone = 'match' | 'gap' | 'other' | 'info'
const PILL: Record<PillTone, string> = {
  match: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  gap: 'bg-red-50 text-red-700 ring-red-200',
  other: 'bg-gray-100 text-gray-600 ring-gray-200',
  info: 'bg-primary-light text-primary ring-blue-200',
}

export function Pill({ tone, children }: { tone: PillTone; children: React.ReactNode }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${PILL[tone]}`}>
      {children}
    </span>
  )
}

export function SectionTitle({ children, hint }: { children: React.ReactNode; hint?: string }) {
  return (
    <div className="mb-3">
      <h2 className="text-lg font-bold text-gray-900">{children}</h2>
      {hint && <p className="mt-0.5 text-sm text-gray-500">{hint}</p>}
    </div>
  )
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-gray-500">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-gray-400">{hint}</span>}
    </label>
  )
}

export function Notice({ tone = 'info', children }: { tone?: 'info' | 'warn' | 'error' | 'ok'; children: React.ReactNode }) {
  const cls = {
    info: 'border-blue-100 bg-blue-50 text-blue-800',
    warn: 'border-amber-200 bg-amber-50 text-amber-900',
    error: 'border-red-100 bg-red-50 text-red-700',
    ok: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  }[tone]
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl border px-4 py-3 text-sm ${cls}`}>
      {children}
    </div>
  )
}

/** Searchable single-select over the advisor's students. */
export function StudentPicker({
  value,
  onChange,
  placeholder = 'Search students by name…',
  extra,
}: {
  value: number | null
  onChange: (student: StudentProfile | null) => void
  placeholder?: string
  extra?: React.ReactNode
}) {
  const [search, setSearch] = useState('')
  const students = useStudents(search ? { search } : undefined)
  const list = students.data?.results ?? []
  const selected = list.find((s) => s.id === value)

  return (
    <div>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={placeholder}
          aria-label="Search students"
          className={`${inputClass} pl-9`}
        />
      </div>
      <div className="mt-2 flex items-center gap-2">
        <select
          aria-label="Student"
          value={value ?? ''}
          onChange={(e) => onChange(list.find((s) => s.id === Number(e.target.value)) ?? null)}
          className={inputClass}
        >
          <option value="">{students.isLoading ? 'Loading students…' : list.length ? 'Select a student…' : 'No students yet'}</option>
          {list.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name} · {DEPT_LABEL[s.department]}
              {s.graduation_year ? ` · ${s.graduation_year}` : ''}
            </option>
          ))}
          {value !== null && !selected && <option value={value}>Selected student</option>}
        </select>
        {value !== null && (
          <button type="button" onClick={() => onChange(null)} aria-label="Clear student" className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {extra}
    </div>
  )
}

/** Checkbox grid of catalogue skills, grouped by category, plus free-text additions. */
export function SkillPicker({
  categories,
  value,
  onChange,
}: {
  categories: { label: string; skills: string[] }[]
  value: string[]
  onChange: (skills: string[]) => void
}) {
  const [custom, setCustom] = useState('')
  const has = (s: string) => value.some((v) => v.toLowerCase() === s.toLowerCase())
  const toggle = (s: string) => onChange(has(s) ? value.filter((v) => v.toLowerCase() !== s.toLowerCase()) : [...value, s])
  const known = new Set(categories.flatMap((c) => c.skills.map((s) => s.toLowerCase())))
  const extras = value.filter((v) => !known.has(v.toLowerCase()))

  const addCustom = () => {
    const parts = custom.split(',').map((p) => p.trim()).filter(Boolean)
    if (parts.length) onChange([...value, ...parts.filter((p) => !has(p))])
    setCustom('')
  }

  return (
    <div>
      <div className="relative max-h-72 space-y-4 overflow-y-auto rounded-xl border border-gray-200 bg-gray-50/50 p-4">
        {categories.map((cat) => (
          <fieldset key={cat.label}>
            <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">{cat.label}</legend>
            <div className="flex flex-wrap gap-2">
              {cat.skills.map((s) => {
                const on = has(s)
                return (
                  <label
                    key={s}
                    className={`relative inline-flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold transition-colors ${
                      on ? 'border-primary bg-primary-light text-primary' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <input type="checkbox" checked={on} onChange={() => toggle(s)} className="sr-only" />
                    {on && <Check className="h-3 w-3" />}
                    {s}
                  </label>
                )
              })}
            </div>
          </fieldset>
        ))}
        {extras.length > 0 && (
          <fieldset>
            <legend className="mb-2 text-xs font-bold uppercase tracking-wide text-gray-500">Added manually</legend>
            <div className="flex flex-wrap gap-2">
              {extras.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => toggle(s)}
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary bg-primary-light px-3 py-1 text-xs font-semibold text-primary"
                >
                  {s}
                  <X className="h-3 w-3" />
                </button>
              ))}
            </div>
          </fieldset>
        )}
      </div>
      <div className="mt-2 flex gap-2">
        <input
          value={custom}
          onChange={(e) => setCustom(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              addCustom()
            }
          }}
          placeholder="Type other skills, separated by commas"
          aria-label="Add other skills"
          className={inputClass}
        />
        <button type="button" onClick={addCustom} className={buttonGhost}>
          Add
        </button>
      </div>
      <p className="mt-2 text-xs text-gray-500">{value.length} skill{value.length === 1 ? '' : 's'} selected</p>
    </div>
  )
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

/** "2026-09" → "Sep 26". */
export const monthLabel = (key: string): string => {
  const [y, m] = key.split('-')
  return `${MONTHS[Number(m) - 1] ?? key} ${y.slice(2)}`
}

export const errorText = (e: unknown): string => (e instanceof Error ? e.message : 'Something went wrong.')

export const todayIso = (): string => new Date().toISOString().slice(0, 10)
