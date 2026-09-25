import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  TrendingUp,
  BadgeCheck,
  Zap,
  Users,
  Briefcase,
  Percent,
  FileText,
  UploadCloud,
  Network,
  Download,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react'
import DashboardLayout, { Card } from './DashboardLayout'
import { Sparkline, EmploymentTrendChart, Donut, DONUT_COLORS } from './charts'
import { QueryGate } from '../../components/ui/State'
import { ROLE_LABELS, useAuth } from '../../auth/AuthContext'
import { ROLE_FOCUS } from '../../auth/access'
import { useForecasts, useKpis, useMacro, useOverview, useSectors, useTrends } from '../../services/queries'
import { predictionsApi, reportsApi } from '../../services/api'
import { employmentChartData, employmentSeries } from '../../lib/derive'
import { fmtDateTime, fmtInt, fmtNum, fmtPct } from '../../lib/format'
import { ApiError } from '../../services/http'

const LINK_ICONS: Record<string, typeof FileText> = {
  '/dashboard/uploads': UploadCloud,
  '/dashboard/users': Users,
  '/dashboard/taxonomy': Network,
  '/dashboard/reports': FileText,
  '/dashboard/career': Briefcase,
  '/dashboard/employability': Briefcase,
  '/dashboard/forecast': TrendingUp,
  '/dashboard/education': FileText,
  '/dashboard/planning': FileText,
  '/dashboard/geography': FileText,
  '/dashboard/sectors': FileText,
}

function Delta({ value, unit = '' }: { value: number | null; unit?: string }) {
  if (value === null) return null
  const up = value >= 0
  const Icon = up ? ArrowUpRight : ArrowDownRight
  return (
    <span className={`flex items-center gap-0.5 text-sm font-semibold ${up ? 'text-emerald-600' : 'text-red-500'}`}>
      <Icon className="h-3.5 w-3.5" />
      {Math.abs(value).toFixed(1)}
      {unit}
    </span>
  )
}

export default function Dashboard() {
  const { user, isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const kpis = useKpis()
  const overview = useOverview()
  const macro = useMacro()
  const forecasts = useForecasts()
  const trends = useTrends()
  const sectors = useSectors()
  const [confirmRun, setConfirmRun] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)

  const runForecast = useMutation({
    mutationFn: predictionsApi.run,
    onSuccess: () => {
      setConfirmRun(false)
      queryClient.invalidateQueries()
    },
  })

  const series = macro.data ? employmentSeries(macro.data, 2015) : []
  const latest = series.find((m) => m.year === kpis.data?.latest_year)
  const prev = latest ? series.find((m) => m.year === latest.year - 1) : undefined
  const empDelta = latest && prev ? ((latest.ict_employment - prev.ict_employment) / prev.ict_employment) * 100 : null
  const shareDelta = latest && prev ? latest.ict_employment_share_pct - prev.ict_employment_share_pct : null

  const top = overview.data?.forecast_summary['1y'] ?? []
  const industryRows = sectors.data ?? []
  const totalPostings = industryRows.reduce((s, r) => s + r.posting_count, 0)
  const donutData = [
    ...industryRows.slice(0, 5).map((r, i) => ({ name: r.industry_raw, value: r.posting_count, color: DONUT_COLORS[i] })),
    ...(industryRows.length > 5
      ? [{ name: 'Others', value: industryRows.slice(5).reduce((s, r) => s + r.posting_count, 0), color: DONUT_COLORS[5] }]
      : []),
  ]

  return (
    <DashboardLayout>
      {/* Welcome header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 data-testid="welcome" className="text-3xl font-extrabold tracking-tight text-gray-900">
            Welcome, {user?.first_name || user?.email}
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="flex items-center gap-2 font-semibold text-gray-700">
              <BadgeCheck className="h-4 w-4 text-primary" />
              {user ? ROLE_LABELS[user.role] : ''}
            </span>
            <span className="hidden h-4 w-px bg-gray-300 sm:block" />
            <span className="text-gray-500">
              Rwanda ICT sector{kpis.data?.latest_year ? ` · data through ${kpis.data.latest_year}` : ''}
            </span>
          </div>
          {user && <p data-testid="role-tagline" className="mt-2 max-w-xl text-sm text-gray-500">{ROLE_FOCUS[user.role].tagline}</p>}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link to="/dashboard/forecast" className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
            <TrendingUp className="h-4 w-4" />
            Role forecast
          </Link>
          {isAdmin &&
            (confirmRun ? (
              <button
                onClick={() => runForecast.mutate()}
                disabled={runForecast.isPending}
                className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-bold text-white shadow-sm hover:bg-amber-600 disabled:opacity-60"
              >
                {runForecast.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {runForecast.isPending ? 'Running model…' : 'Confirm: create new forecast run'}
              </button>
            ) : (
              <button onClick={() => setConfirmRun(true)} className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
                <Zap className="h-4 w-4" />
                Run Forecast
              </button>
            ))}
          <button
            onClick={async () => {
              setExportError(null)
              try {
                await reportsApi.downloadDemandOutlookCsv()
              } catch {
                setExportError('Export failed')
              }
            }}
            className="flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-dark-navy"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
        </div>
      </div>
      {runForecast.isError && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-600">
          {runForecast.error instanceof ApiError ? runForecast.error.message : 'Forecast run failed.'}
        </p>
      )}
      {runForecast.isSuccess && <p className="mt-3 text-sm font-medium text-emerald-700">New forecast run stored (#{runForecast.data.id}).</p>}
      {exportError && <p className="mt-3 text-sm font-medium text-red-600">{exportError}</p>}

      {/* KPI cards */}
      <QueryGate query={kpis} className="mt-8">
        {(k) => (
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">ICT Employment</span>
                <Users className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span data-testid="kpi-employment" className="text-4xl font-extrabold tracking-tight text-gray-900">{fmtInt(k.total_ict_employment)}</span>
                <Delta value={empDelta} unit="%" />
              </div>
              <div className="mt-3"><Sparkline points={series.map((m) => m.ict_employment)} color="#7DD3C0" /></div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">ICT Share of Employment</span>
                <Percent className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-3 flex items-baseline gap-2">
                <span data-testid="kpi-share" className="text-4xl font-extrabold tracking-tight text-gray-900">{fmtPct(k.ict_share_pct)}</span>
                <Delta value={shareDelta} unit=" pts" />
              </div>
              <div className="mt-3"><Sparkline points={series.map((m) => m.ict_employment_share_pct)} color="#C9B99B" /></div>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">ICT Roles Tracked</span>
                <Network className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-3">
                <span data-testid="kpi-roles" className="text-4xl font-extrabold tracking-tight text-gray-900">{k.total_roles_tracked}</span>
              </div>
              <p className="mt-3 text-xs text-gray-500">{new Set(forecasts.data?.forecasts.map((f) => f.role_id)).size || '-'} with active forecasts</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Job Postings Analysed</span>
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div className="mt-3">
                <span data-testid="kpi-postings" className="text-4xl font-extrabold tracking-tight text-gray-900">{fmtInt(k.total_postings)}</span>
              </div>
              <p className="mt-3 text-xs text-gray-500">Current ICT postings used to validate the model</p>
            </Card>
          </div>
        )}
      </QueryGate>

      {/* Trend + top roles */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">ICT Employment Trend & Forecast</h2>
              <p className="mt-1 text-sm text-gray-500">Rwanda ICT employment, with model-projected totals at 6 months, 1 year and 2 years</p>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-wide">
              <span className="flex items-center gap-1.5 text-navy"><span className="h-2.5 w-2.5 rounded-sm bg-navy" /> Historical</span>
              <span className="flex items-center gap-1.5 text-gray-400"><span className="h-2.5 w-2.5 rounded-sm border border-dashed border-navy" /> Forecast</span>
            </div>
          </div>
          <QueryGate query={macro} className="mt-4">
            {(m) => (
              <div className="mt-4" data-testid="employment-chart">
                <EmploymentTrendChart data={employmentChartData(m, forecasts.data)} />
              </div>
            )}
          </QueryGate>
          <p className="mt-3 text-xs text-gray-400">
            2017 onward: computed from NISR Labour Force Survey microdata. Earlier years are back-extrapolated estimates.
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900">Top 5 In-Demand ICT Roles</h2>
          <p className="mt-1 text-xs text-gray-500">1-year forecast · demand index (0–100)</p>
          <QueryGate query={overview} className="mt-6">
            {() => (
              <div className="mt-6 space-y-5">
                {top.map((r, i) => (
                  <div key={r.role_name}>
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span data-testid={`top-role-${i}`} className="font-bold text-gray-900">{r.role_name}</span>
                      <span className="font-bold text-navy">{fmtNum(r.demand_index)}</span>
                    </div>
                    <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                      <div className="h-2 rounded-full bg-navy" style={{ width: `${r.demand_index}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </QueryGate>
        </Card>
      </div>

      {/* Industries + movers */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900">Industries Hiring ICT Talent</h2>
          <p className="mt-1 text-xs text-gray-500">Share of {fmtInt(totalPostings)} ICT job postings by industry</p>
          <QueryGate query={sectors} className="mt-6">
            {() => (
              <div className="mt-6 flex flex-col items-center gap-8 sm:flex-row sm:justify-around" data-testid="industry-donut">
                <Donut data={donutData} centerValue={fmtInt(totalPostings)} centerLabel="Postings" />
                <ul className="space-y-2.5">
                  {donutData.map((s) => (
                    <li key={s.name} className="flex items-center gap-3 text-sm">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                      <span className="w-40 truncate text-gray-600" title={s.name}>{s.name}</span>
                      <span className="font-bold text-gray-900">{s.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </QueryGate>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900">Forecast Movers</h2>
          <p className="mt-1 text-xs text-gray-500">1-year outlook vs. current market share</p>
          <QueryGate query={trends} className="mt-6">
            {(t) => (
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Growing ({t.growing.length})</div>
                  <ul className="mt-3 space-y-2" data-testid="movers-growing">
                    {t.growing.slice(0, 4).map((r) => (
                      <li key={r.role_id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate font-medium text-gray-800" title={r.role_name}>{r.role_name}</span>
                        <span className="shrink-0 font-bold text-emerald-600">{fmtNum(r.demand_index, 0)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-red-600">Declining ({t.declining.length})</div>
                  <ul className="mt-3 space-y-2" data-testid="movers-declining">
                    {t.declining.slice(0, 4).map((r) => (
                      <li key={r.role_id} className="flex items-center justify-between gap-2 text-sm">
                        <span className="truncate font-medium text-gray-800" title={r.role_name}>{r.role_name}</span>
                        <span className="shrink-0 font-bold text-red-500">{fmtNum(r.demand_index, 0)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </QueryGate>
        </Card>
      </div>

      {/* Model + quick links */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <h2 className="text-lg font-bold text-gray-900">Forecasting Model</h2>
          <QueryGate query={forecasts} className="mt-4">
            {(f) => (
              <div className="mt-5 grid grid-cols-2 gap-6 sm:grid-cols-4" data-testid="model-card">
                {[
                  ['Version', f.forecast_run.model_version],
                  ['Rank correlation', fmtNum(f.forecast_run.accuracy_spearman, 4)],
                  ['Pearson correlation', fmtNum(f.forecast_run.accuracy_pearson, 4)],
                  ['CV R²', fmtNum(f.forecast_run.accuracy_r2, 4)],
                ].map(([label, value]) => (
                  <div key={label}>
                    <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{label}</div>
                    <div className="mt-1.5 text-2xl font-extrabold tracking-tight text-navy">{value}</div>
                  </div>
                ))}
                <div className="col-span-2 text-xs text-gray-500 sm:col-span-4">
                  Last run {fmtDateTime(f.forecast_run.created_at)} · validated against {fmtInt(kpis.data?.total_postings)} real ICT job postings
                </div>
              </div>
            )}
          </QueryGate>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900">Quick Links</h2>
          <div className="mt-4 space-y-3">
            {(user ? ROLE_FOCUS[user.role].links : []).map((q) => {
              const Icon = LINK_ICONS[q.to] ?? FileText
              return (
                <Link key={q.to} to={q.to} className="flex items-center gap-3 rounded-xl border border-gray-200 p-3.5 text-sm font-semibold text-gray-800 transition-colors hover:border-primary/40 hover:bg-gray-50">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-light text-primary"><Icon className="h-4 w-4" /></span>
                  {q.label}
                </Link>
              )
            })}
          </div>
        </Card>
      </div>
    </DashboardLayout>
  )
}
