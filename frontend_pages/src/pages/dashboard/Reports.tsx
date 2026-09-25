import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Download, FileSpreadsheet, FileText, FileType2, Loader2, Presentation, Table2, BarChart3 } from 'lucide-react'
import DashboardLayout, { Card } from './DashboardLayout'
import { EmptyState, ErrorState, QueryGate } from '../../components/ui/State'
import { useDemandOutlook, useForecasts, useReportList } from '../../services/queries'
import { reportsApi } from '../../services/api'
import { ApiError } from '../../services/http'
import { fmtDate, fmtNum, fmtPct, HORIZON_LABEL } from '../../lib/format'
import { TREND_LABEL, TREND_TONE } from '../../lib/derive'
import type { Horizon } from '../../types/api'

type ReportType = 'demand_outlook' | 'role_deep_dive'

const TEMPLATES: { id: ReportType; title: string; desc: string; icon: typeof FileText; tone: string }[] = [
  { id: 'demand_outlook', title: 'ICT Demand Outlook', desc: 'Forecast demand for every ICT role at 6 months, 1 year and 2 years, with confidence ranges.', icon: FileText, tone: 'bg-red-50 text-red-500' },
  { id: 'role_deep_dive', title: 'Role Deep Dive', desc: 'Full demand history and forecast for a single ICT role.', icon: Table2, tone: 'bg-emerald-50 text-emerald-600' },
]

const UNAVAILABLE = [
  { label: 'PDF', icon: FileType2 },
  { label: 'Excel', icon: Table2 },
  { label: 'Slides', icon: Presentation },
]

export default function Reports() {
  const list = useReportList()
  const forecasts = useForecasts('1y')
  const [type, setType] = useState<ReportType>('demand_outlook')
  const [roleId, setRoleId] = useState<number | null>(null)
  const [horizon, setHorizon] = useState<Horizon>('1y')
  const [csvError, setCsvError] = useState<string | null>(null)
  const [generated, setGenerated] = useState(false)

  const roles = [...(forecasts.data?.forecasts ?? [])].sort((a, b) => a.role_name.localeCompare(b.role_name))
  const activeRole = roleId ?? roles[0]?.role_id ?? null

  const outlook = useDemandOutlook(generated && type === 'demand_outlook')
  const deepDive = useMutation({ mutationFn: (id: number) => reportsApi.roleDeepDive(id) })
  const csv = useMutation({ mutationFn: reportsApi.downloadDemandOutlookCsv })

  const generate = () => {
    setGenerated(true)
    if (type === 'role_deep_dive' && activeRole !== null) deepDive.mutate(activeRole)
  }

  const rows = outlook.data?.forecasts[horizon] ?? []

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-8 lg:col-span-2">
          <h1 className="text-2xl font-extrabold tracking-tight text-navy">ICT Report Builder</h1>
          <p className="mt-2 text-sm text-gray-500">Generate a live report from the latest forecast run.</p>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2">
            <label className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-navy">Report type</span>
              <select value={type} onChange={(e) => { setType(e.target.value as ReportType); setGenerated(false) }} aria-label="Report type" className="mt-2 w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-3.5 text-sm font-medium text-gray-800 outline-none focus:border-primary">
                {TEMPLATES.map((t) => <option key={t.id} value={t.id}>{t.title}</option>)}
              </select>
            </label>
            {type === 'role_deep_dive' && (
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wider text-navy">ICT role</span>
                <select value={activeRole ?? ''} onChange={(e) => { setRoleId(Number(e.target.value)); setGenerated(false) }} aria-label="ICT role" className="mt-2 w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-3.5 text-sm font-medium text-gray-800 outline-none focus:border-primary">
                  {roles.map((r) => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
                </select>
              </label>
            )}
          </div>

          <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50 p-6">
            <div className="text-[11px] font-bold uppercase tracking-wider text-navy">Export format</div>
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div className="flex items-center justify-center gap-2 rounded-lg border-2 border-navy bg-white py-4 text-base font-bold text-navy">
                <FileSpreadsheet className="h-5 w-5" /> {type === 'demand_outlook' ? 'CSV' : 'On-screen'}
              </div>
              {UNAVAILABLE.map((u) => (
                <div key={u.label} title="Not supported by the backend yet" className="flex flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-gray-200 bg-white py-3 text-gray-300">
                  <span className="flex items-center gap-2 text-base font-bold"><u.icon className="h-5 w-5" />{u.label}</span>
                  <span data-mock="true" className="text-[9px] font-extrabold uppercase tracking-wider text-amber-600">Not available yet</span>
                </div>
              ))}
            </div>
          </div>

          <button onClick={generate} disabled={type === 'role_deep_dive' && activeRole === null} className="mt-8 w-full rounded-lg bg-navy py-5 text-base font-bold text-white shadow-sm transition-colors hover:bg-dark-navy disabled:opacity-50">
            Generate report
          </button>
        </Card>

        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-navy">Report Types</h2>
          <p className="mt-1 text-sm text-gray-500">Built from live model output.</p>
          <div className="mt-6 space-y-6">
            {TEMPLATES.map((t) => (
              <button key={t.id} onClick={() => { setType(t.id); setGenerated(false) }} aria-pressed={type === t.id} className={`w-full rounded-2xl border bg-white p-6 text-left shadow-sm transition-colors hover:border-primary/40 ${type === t.id ? 'border-primary' : 'border-gray-200'}`}>
                <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${t.tone}`}><t.icon className="h-5 w-5" /></span>
                <h3 className="mt-5 text-lg font-extrabold tracking-tight text-navy">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{t.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Generated report */}
      {generated && type === 'demand_outlook' && (
        <Card className="mt-8 overflow-hidden" data-testid="report-outlook">
          <QueryGate query={outlook} className="m-8">
            {(r) => (
              <>
                <div className="bg-navy p-8 text-white">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-extrabold tracking-tight">{r.title}</h2>
                      <p className="mt-2 text-sm text-blue-200/80">Model {r.model_version} · run {fmtDate(r.generated_at)} · rank correlation {fmtNum(r.accuracy.spearman, 4)} · R² {fmtNum(r.accuracy.r2, 4)}</p>
                    </div>
                    <button onClick={() => { setCsvError(null); csv.mutate(undefined, { onError: () => setCsvError('CSV export failed') }) }} className="flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-navy hover:bg-gray-100">
                      {csv.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />} Download CSV
                    </button>
                  </div>
                  {csvError && <p className="mt-3 text-sm text-red-300">{csvError}</p>}
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
                        <th className="pb-4 font-bold">Role</th><th className="pb-4 font-bold">Demand index</th><th className="pb-4 font-bold">ICT share</th><th className="pb-4 font-bold">Range</th><th className="pb-4 font-bold">Trend</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {rows.map((x) => (
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

      {generated && type === 'role_deep_dive' && (
        <Card className="mt-8 p-6" data-testid="report-deepdive">
          {deepDive.isPending && <div className="flex items-center gap-2 text-sm text-gray-500"><Loader2 className="h-4 w-4 animate-spin" /> Generating…</div>}
          {deepDive.isError && <ErrorState error={deepDive.error instanceof ApiError ? deepDive.error : new Error('failed')} />}
          {deepDive.data && (
            <>
              <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-navy"><BarChart3 className="h-5 w-5" /> {roles.find((r) => r.role_id === activeRole)?.role_name}: deep dive</h2>
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
                  <thead><tr className="sticky top-0 border-b border-gray-200 bg-white text-[11px] font-bold uppercase tracking-wider text-gray-400"><th className="pb-3 font-bold">Year</th><th className="pb-3 font-bold">Demand index</th><th className="pb-3 font-bold">ICT share</th><th className="pb-3 font-bold">People employed</th></tr></thead>
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

      {/* Archive */}
      <div className="mt-10">
        <h2 className="text-2xl font-extrabold tracking-tight text-navy">Saved Reports</h2>
        <p className="mt-1 text-sm text-gray-500">Reports stored by the system.</p>
        <Card className="mt-5 overflow-x-auto">
          <QueryGate query={list} className="m-6">
            {(l) =>
              l.results.length === 0 ? (
                <EmptyState title="No saved reports yet" hint="The backend doesn't archive generated reports yet, so reports above are generated live." className="m-6" />
              ) : (
                <table className="w-full min-w-[640px] text-left" data-testid="archive-table">
                  <thead><tr className="border-b border-gray-200 bg-gray-50/60 text-[11px] font-bold uppercase tracking-wider text-gray-500"><th className="px-6 py-4 font-bold">Report</th><th className="px-6 py-4 font-bold">Type</th><th className="px-6 py-4 font-bold">Format</th><th className="px-6 py-4 font-bold">Created</th></tr></thead>
                  <tbody className="divide-y divide-gray-100">
                    {l.results.map((r) => (
                      <tr key={r.id} className="text-sm"><td className="px-6 py-4 font-bold text-gray-900">{r.title}</td><td className="px-6 py-4 text-gray-600">{r.report_type}</td><td className="px-6 py-4 text-gray-600">{r.format}</td><td className="px-6 py-4 text-gray-600">{fmtDate(r.created_at)}</td></tr>
                    ))}
                  </tbody>
                </table>
              )
            }
          </QueryGate>
        </Card>
      </div>
    </DashboardLayout>
  )
}
