import { FileSpreadsheet, FileUp, Loader2 } from 'lucide-react'
import { Card } from '../../pages/dashboard/DashboardLayout'
import { HORIZON_LABEL } from '../../lib/format'
import { TREND_LABEL, TREND_TONE } from '../../lib/derive'
import type { Horizon, Trend } from '../../types/api'

/**
 * Presentational kit shared by every role's Reports page: a report library on the left, and a live
 * document on the right (banner with exports, an options bar, then KPIs, charts and tables).
 */

export function ReportPageHeader({
  icon: Icon,
  title,
  subtitle,
  chip,
}: {
  icon: React.ComponentType<{ className?: string }>
  title: string
  subtitle: string
  chip?: string
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-navy text-white shadow-md shadow-primary/20">
          <Icon className="h-7 w-7" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">{title}</h1>
          <p className="mt-0.5 max-w-2xl text-sm text-gray-500">{subtitle}</p>
        </div>
      </div>
      {chip && (
        <span className="inline-flex w-fit items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-gray-500">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          {chip}
        </span>
      )}
    </div>
  )
}

export interface ReportTemplate<Id extends string = string> {
  id: Id
  title: string
  desc: string
  icon: React.ComponentType<{ className?: string }>
  tone: string
  /** What it can be exported as. */
  formats: string[]
}

/** Library of reports on the left (a tab strip on phones) with the open report on the right. */
export function ReportWorkspace<Id extends string>({
  templates,
  value,
  onChange,
  children,
}: {
  templates: ReportTemplate<Id>[]
  value: Id
  onChange: (id: Id) => void
  children: React.ReactNode
}) {
  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* phones and tablets: scrollable tabs */}
      <div role="tablist" aria-label="Reports" className="no-scrollbar -mx-4 flex snap-x gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0 lg:hidden">
        {templates.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={value === t.id}
            onClick={() => onChange(t.id)}
            className={`inline-flex shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition-colors ${
              value === t.id ? 'bg-navy text-white shadow-sm' : 'border border-gray-200 bg-white text-gray-600 hover:border-primary/40'
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.title}
          </button>
        ))}
      </div>

      {/* desktop: library */}
      <aside className="hidden lg:block">
        <Card className="sticky top-24 p-3">
          <p className="px-3 pb-2 pt-3 text-[11px] font-bold uppercase tracking-widest text-gray-400">Report library</p>
          <ul className="space-y-1" role="tablist" aria-label="Reports" aria-orientation="vertical">
            {templates.map((t) => {
              const active = value === t.id
              return (
                <li key={t.id}>
                  <button
                    role="tab"
                    aria-selected={active}
                    onClick={() => onChange(t.id)}
                    className={`relative flex w-full items-start gap-3 rounded-xl px-3 py-3 text-left transition-colors ${active ? 'bg-primary-light/60' : 'hover:bg-gray-50'}`}
                  >
                    {active && <span className="absolute inset-y-2 left-0 w-1 rounded-full bg-primary" aria-hidden />}
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${t.tone}`}>
                      <t.icon className="h-[18px] w-[18px]" />
                    </span>
                    <span className="min-w-0">
                      <span className={`block text-sm font-bold ${active ? 'text-navy' : 'text-gray-900'}`}>{t.title}</span>
                      <span className="mt-0.5 block text-xs leading-snug text-gray-500">{t.desc}</span>
                      <span className="mt-2 flex flex-wrap gap-1">
                        {t.formats.map((f) => (
                          <span key={f} className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-gray-400 ring-1 ring-gray-200">{f}</span>
                        ))}
                      </span>
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        </Card>
      </aside>

      <section className="min-w-0" aria-live="polite">{children}</section>
    </div>
  )
}

/** The open report: banner on top, an optional options strip, then the body. */
export function ReportDocument({
  banner,
  options,
  children,
}: {
  banner: React.ReactNode
  options?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <Card className="overflow-hidden">
      {banner}
      {options && <div className="border-b border-gray-100 bg-gray-50/80 px-5 py-4 sm:px-8">{options}</div>}
      <div className="space-y-8 p-5 sm:p-8">{children}</div>
    </Card>
  )
}

export function ExportBar({
  onCsv,
  onPdf,
  csvPending,
  pdfPending,
  error,
}: {
  onCsv?: () => void
  onPdf?: () => void
  csvPending?: boolean
  pdfPending?: boolean
  error?: string | null
}) {
  const base = 'inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-bold transition-colors disabled:opacity-60'
  return (
    <div className="flex flex-col items-start gap-1 sm:items-end">
      <div className="flex gap-2">
        {onCsv && (
          <button type="button" onClick={onCsv} disabled={csvPending} className={`${base} bg-white text-navy hover:bg-gray-100`}>
            {csvPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileSpreadsheet className="h-4 w-4" />} CSV
          </button>
        )}
        {onPdf && (
          <button type="button" onClick={onPdf} disabled={pdfPending} className={`${base} bg-white/10 text-white ring-1 ring-white/30 hover:bg-white/20`}>
            {pdfPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileUp className="h-4 w-4" />} PDF
          </button>
        )}
      </div>
      {error && <p role="alert" className="text-xs font-medium text-red-300">{error}</p>}
    </div>
  )
}

export function HorizonTabs({ value, onChange }: { value: Horizon; onChange: (h: Horizon) => void }) {
  return (
    <div className="inline-flex rounded-lg bg-white p-1 ring-1 ring-gray-200" role="tablist" aria-label="Forecast horizon">
      {(['6m', '1y', '2y'] as Horizon[]).map((h) => (
        <button
          key={h}
          role="tab"
          aria-selected={value === h}
          onClick={() => onChange(h)}
          className={`rounded-md px-3.5 py-1.5 text-xs font-bold transition-colors ${value === h ? 'bg-navy text-white' : 'text-gray-500 hover:text-gray-900'}`}
        >
          {HORIZON_LABEL[h]}
        </button>
      ))}
    </div>
  )
}

/** The dark banner on top of a report: kind, title, run details and exports. */
export function ReportBanner({
  kind,
  title,
  meta,
  exports,
}: {
  kind: string
  title: string
  meta?: React.ReactNode
  exports?: React.ReactNode
}) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-navy via-navy to-dark-navy p-5 text-white sm:p-8">
      <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-primary/30 blur-3xl" aria-hidden />
      <div className="relative flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-[11px] font-bold uppercase tracking-widest text-blue-200/70">{kind}</p>
          <h2 className="mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl">{title}</h2>
          {meta && <p className="mt-2 text-sm text-blue-200/80">{meta}</p>}
        </div>
        {exports}
      </div>
    </div>
  )
}

/** Headline number with a label and optional note; used in a row at the top of a report. */
export function Kpi({ label, value, note, tone = 'text-navy' }: { label: string; value: React.ReactNode; note?: string; tone?: string }) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
      <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</div>
      <div className={`mt-1 text-2xl font-extrabold tracking-tight sm:text-3xl ${tone}`}>{value}</div>
      {note && <div className="mt-0.5 text-xs text-gray-500">{note}</div>}
    </div>
  )
}

export function KpiRow({ children }: { children: React.ReactNode }) {
  return <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">{children}</div>
}

/** A titled block inside a report (chart, table, list). */
export function Block({ title, hint, icon: Icon, children }: { title: string; hint?: string; icon?: React.ComponentType<{ className?: string }>; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-3">
        <h3 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-navy">
          {Icon && <Icon className="h-4 w-4" />} {title}
        </h3>
        {hint && <p className="mt-0.5 text-xs text-gray-500">{hint}</p>}
      </div>
      {children}
    </section>
  )
}

export function DataTable({
  head,
  children,
  minWidth = 560,
  testId,
  scroll,
}: {
  head: string[]
  children: React.ReactNode
  minWidth?: number
  testId?: string
  scroll?: string
}) {
  return (
    <div className={`overflow-x-auto rounded-xl border border-gray-100 ${scroll ?? ''}`}>
      <table className="w-full text-left" style={{ minWidth }} data-testid={testId}>
        <thead>
          <tr className="sticky top-0 bg-gray-50 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            {head.map((h) => (
              <th key={h} className="px-4 py-3 font-bold">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 text-sm [&_td]:px-4 [&_td]:py-3">{children}</tbody>
      </table>
    </div>
  )
}

export const TrendPill = ({ trend }: { trend: Trend }) => (
  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold uppercase ${TREND_TONE[trend]}`}>{TREND_LABEL[trend]}</span>
)

export const Growth = ({ pct }: { pct: number }) => (
  <span className={`font-bold ${pct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
    {pct >= 0 ? '+' : ''}
    {pct}%
  </span>
)

/** Ranked name + count rows, for top positions / companies / locations. */
export function RankList({
  items,
  badge,
  empty,
}: {
  items: { name: string; count: number }[]
  badge: string
  empty: string
}) {
  const max = Math.max(1, ...items.map((i) => i.count))
  return (
    <ul className="space-y-2">
      {items.map((i) => (
        <li key={i.name} className="relative overflow-hidden rounded-lg bg-gray-50 px-3 py-2 text-sm">
          <span className="absolute inset-y-0 left-0 bg-primary/5" style={{ width: `${(i.count / max) * 100}%` }} aria-hidden />
          <span className="relative flex items-center justify-between gap-2">
            <span className="truncate font-medium text-gray-800">{i.name}</span>
            <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold ${badge}`}>{i.count}</span>
          </span>
        </li>
      ))}
      {items.length === 0 && <li className="text-sm text-gray-400">{empty}</li>}
    </ul>
  )
}
