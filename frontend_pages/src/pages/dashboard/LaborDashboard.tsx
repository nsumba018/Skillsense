import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  TrendingUp,
  TrendingDown,
  BadgeCheck,
  Zap,
  Users,
  Briefcase,
  Download,
  Loader2,
  ArrowUpRight,
  ArrowDownRight,
  LayoutDashboard,
  Layers,
  Minus,
  Sparkles,
} from 'lucide-react'
import DashboardLayout, { Card, PageHeader } from './DashboardLayout'
import { Sparkline, EmploymentTrendChart, Donut, DONUT_COLORS, SectorEmploymentChart } from './charts'
import { QueryGate } from '../../components/ui/State'
import { ROLE_LABELS, useAuth } from '../../auth/AuthContext'
import { ROLE_FOCUS } from '../../auth/access'
import { useKpis, useMacro, useOverview, usePolicyInsights, useSectors, useSectorEmployment, useTrends } from '../../services/queries'
import { predictionsApi, reportsApi } from '../../services/api'
import { employmentChartData, employmentSeries, TREND_LABEL, TREND_TONE } from '../../lib/derive'
import { fmtInt, fmtPct } from '../../lib/format'
import { ApiError } from '../../services/http'
import type { SectorForecastKpi, Trend } from '../../types/api'


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

function TrendBadge({ trend, label }: { trend: Trend; label: string }) {
  const Icon = trend === 'growing' ? TrendingUp : trend === 'declining' ? TrendingDown : Minus
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${TREND_TONE[trend]}`}>
      <Icon className="h-3 w-3" />
      {label} {TREND_LABEL[trend]}
    </span>
  )
}

function SectorCard({ sf, growthPct }: { sf: SectorForecastKpi; growthPct: number | null }) {
  return (
    <Link to={`/dashboard/sectors?sector=${sf.sector_slug}`} className="block">
      <Card className="p-4 transition-colors hover:border-primary/40">
        <div className="flex items-center gap-2.5">
          <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: sf.sector_color }} />
          <span className="text-sm font-bold text-gray-900 truncate">{sf.sector_name}</span>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Share</div>
            <div className="mt-0.5 text-lg font-extrabold tracking-tight text-navy">{fmtPct(sf.employment_share_pct)}</div>
          </div>
          <div>
            <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Employment</div>
            <div className="mt-0.5 text-lg font-extrabold tracking-tight text-navy">{fmtInt(sf.employment_count)}</div>
          </div>
        </div>
        <div className="mt-3 flex items-center gap-2">
          <TrendBadge trend={sf.employment_trend} label="Jobs" />
          {growthPct !== null && (
            <span className={`text-xs font-bold ${growthPct >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
              {growthPct >= 0 ? '+' : ''}{growthPct.toFixed(1)}%
            </span>
          )}
        </div>
        {sf.posting_count > 0 && (
          <div className="mt-2 text-[11px] text-gray-500">{fmtInt(sf.posting_count)} job postings</div>
        )}
      </Card>
    </Link>
  )
}

export default function LaborDashboard() {
  const { user, isAdmin } = useAuth()
  const queryClient = useQueryClient()
  const kpis = useKpis()
  const overview = useOverview()
  const macro = useMacro()
  const trends = useTrends()
  const sectors = useSectors()
  const sectorEmployment = useSectorEmployment()
  const policyInsights = usePolicyInsights()
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
  const sectorForecasts = kpis.data?.sector_forecasts ?? []
  const totalSectorPostings = sectorForecasts.reduce((s, sf) => s + sf.posting_count, 0)
  const totalSectorEmployment = sectorForecasts.reduce((s, sf) => s + sf.employment_count, 0)
  const growingSectors = sectorForecasts.filter((sf) => sf.employment_trend === 'growing')

  const empBySlug = new Map<string, number>()
  if (sectorEmployment.data) {
    const latestYear = new Map<string, number>()
    for (const row of sectorEmployment.data) {
      if (!latestYear.has(row.sector_slug) || row.year > latestYear.get(row.sector_slug)!) {
        latestYear.set(row.sector_slug, row.year)
        empBySlug.set(row.sector_slug, row.employment_count)
      }
    }
  }

  const sectorGrowth = new Map<string, number>()
  for (const sf of sectorForecasts) {
    const current = empBySlug.get(sf.sector_slug)
    if (current && current > 0) {
      sectorGrowth.set(sf.sector_slug, (sf.employment_count - current) / current * 100)
    }
  }

  const sectorDonutData = sectorForecasts.map((sf) => ({
    name: sf.sector_name,
    value: sf.employment_count,
    color: sf.sector_color,
  }))

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
      <PageHeader
        icon={LayoutDashboard}
        title={`Welcome, ${user?.first_name || user?.email}`}
        subtitle={user ? ROLE_FOCUS[user.role].tagline : 'Rwanda workforce intelligence'}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/dashboard/sectors" className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
              <TrendingUp className="h-4 w-4" />
              Sector forecast
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
        }
      />
      {runForecast.isError && (
        <p role="alert" className="mt-3 text-sm font-medium text-red-600">
          {runForecast.error instanceof ApiError ? runForecast.error.message : 'Forecast run failed.'}
        </p>
      )}
      {runForecast.isSuccess && <p className="mt-3 text-sm font-medium text-emerald-700">New forecast run stored (#{runForecast.data.id}).</p>}
      {exportError && <p className="mt-3 text-sm font-medium text-red-600">{exportError}</p>}

      {/* Sector KPI row */}
      <QueryGate query={kpis} className="mt-8">
        {(k) => (
          <>
            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Sectors Tracked</span>
                  <Layers className="h-5 w-5 text-primary" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span data-testid="kpi-sectors" className="text-4xl font-extrabold tracking-tight text-gray-900">{k.total_sectors || 9}</span>
                </div>
                <p className="mt-3 text-xs text-gray-500">{growingSectors.length} with growing employment</p>
              </Card>
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Total Employment (forecast)</span>
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="mt-3">
                  <span data-testid="kpi-total-emp" className="text-4xl font-extrabold tracking-tight text-gray-900">{fmtInt(totalSectorEmployment)}</span>
                </div>
                <p className="mt-3 text-xs text-gray-500">Across all sectors · 1-year forecast</p>
              </Card>
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Top Growing Sector</span>
                  <TrendingUp className="h-5 w-5 text-emerald-600" />
                </div>
                {growingSectors.length > 0 ? (() => {
                  const top = [...sectorForecasts].sort((a, b) => b.employment_count - a.employment_count).find(s => s.employment_trend === 'growing')
                  if (!top) return <p className="mt-3 text-sm text-gray-400">No growing sectors</p>
                  return (
                    <>
                      <div className="mt-3 flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: top.sector_color }} />
                        <span data-testid="kpi-top-sector" className="text-lg font-extrabold tracking-tight text-gray-900 truncate">{top.sector_name}</span>
                      </div>
                      <div className="mt-2 flex items-baseline gap-2">
                        <span className="text-2xl font-extrabold text-navy">{fmtPct(top.employment_share_pct)}</span>
                        <span className="text-xs text-gray-500">share · {fmtInt(top.employment_count)} jobs</span>
                      </div>
                      <TrendBadge trend={top.employment_trend} label="Jobs" />
                    </>
                  )
                })() : <p className="mt-3 text-sm text-gray-400">No forecast data</p>}
              </Card>
              <Card className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Job Postings</span>
                  <Briefcase className="h-5 w-5 text-primary" />
                </div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span data-testid="kpi-postings" className="text-4xl font-extrabold tracking-tight text-gray-900">{fmtInt(k.total_postings)}+</span>
                </div>
                <p className="mt-3 text-xs text-gray-500">
                  From job posting platforms · {sectorForecasts.filter(s => s.posting_count > 0).length} of {sectorForecasts.length} sectors
                </p>
              </Card>
            </div>

            {/* Sector overview grid */}
            {sectorForecasts.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">Sector Overview</h2>
                    <p className="mt-1 text-sm text-gray-500">1-year forecast · click a sector for details</p>
                  </div>
                  <Link to="/dashboard/sectors" className="text-sm font-semibold text-primary hover:underline">View all &rarr;</Link>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="sector-grid">
                  {sectorForecasts.map((sf) => (
                    <SectorCard key={sf.sector_slug} sf={sf} growthPct={sectorGrowth.get(sf.sector_slug) ?? null} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </QueryGate>

      {/* Sector employment growth outlook */}
      {sectorForecasts.length > 0 && (() => {
        const chartData = [...sectorForecasts]
          .sort((a, b) => a.employment_count - b.employment_count)
          .map(sf => ({
            name: sf.sector_name,
            current: empBySlug.get(sf.sector_slug) ?? 0,
            forecast: sf.employment_count,
            color: sf.sector_color,
          }))
        const ranked = [...sectorForecasts]
          .map(sf => ({ ...sf, growth: sectorGrowth.get(sf.sector_slug) ?? 0 }))
          .sort((a, b) => b.growth - a.growth)
        return (
          <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="p-6 lg:col-span-2">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="text-lg font-bold text-gray-900">Sector Employment Forecast</h2>
                  <p className="mt-1 text-sm text-gray-500">Current employment vs. 1-year forecast — the gap shows where demand is heading</p>
                </div>
              </div>
              <div className="mt-4" data-testid="sector-employment-chart">
                <SectorEmploymentChart data={chartData} />
              </div>
              <p className="mt-2 text-xs text-gray-400">
                Based on SkillSense sector forecast model · NISR Labour Force Survey + GDP national accounts
              </p>
            </Card>

            <Card className="p-6">
              <h2 className="text-lg font-bold text-gray-900">Growth Ranking</h2>
              <p className="mt-1 text-xs text-gray-500">Sectors ranked by forecast employment growth rate</p>
              <ol className="mt-5 space-y-3" data-testid="growth-ranking">
                {ranked.map((sf, i) => (
                  <li key={sf.sector_slug} className="flex items-center gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-gray-100 text-[11px] font-bold text-gray-500">
                      {i + 1}
                    </span>
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: sf.sector_color }} />
                    <span className="font-medium text-gray-800 truncate flex-1">{sf.sector_name}</span>
                    <span className={`shrink-0 font-bold ${sf.growth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {sf.growth >= 0 ? '+' : ''}{sf.growth.toFixed(1)}%
                    </span>
                  </li>
                ))}
              </ol>
            </Card>
          </div>
        )
      })()}

      {/* Sector employment share donut + Forecast movers */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900">Employment by Sector</h2>
          <p className="mt-1 text-xs text-gray-500">Forecast employment distribution across {sectorForecasts.length || 9} sectors</p>
          {sectorDonutData.length > 0 ? (
            <div className="mt-6 flex flex-col items-center gap-8 sm:flex-row sm:justify-around" data-testid="sector-donut">
              <Donut data={sectorDonutData} centerValue={fmtInt(totalSectorEmployment)} centerLabel="Total" />
              <ul className="space-y-2.5">
                {sectorDonutData.map((s) => (
                  <li key={s.name} className="flex items-center gap-3 text-sm">
                    <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
                    <span className="w-40 truncate text-gray-600" title={s.name}>{s.name}</span>
                    <span className="font-bold text-gray-900">{fmtInt(s.value)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
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
          )}
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-bold text-gray-900">AI Policy Insights</h2>
          </div>
          <p className="mt-1 text-xs text-gray-500">AI-generated recommendations from labour market data</p>
          {(() => {
            const list = policyInsights.data?.insights ?? []
            const priorityDot: Record<string, string> = { high: 'bg-gray-900', medium: 'bg-gray-400', low: 'bg-gray-300' }
            const priorityLabel: Record<string, string> = { high: 'High', medium: 'Medium', low: 'Low' }
            if (policyInsights.isLoading) return <p className="mt-4 text-sm text-gray-400">Loading insights…</p>
            if (!list.length) return <p className="mt-4 text-sm text-gray-400">Run a forecast to generate policy insights.</p>
            return (
              <div className="mt-4 space-y-2.5 max-h-72 overflow-y-auto">
                {list.slice(0, 5).map((ins, i) => (
                  <div key={i} className="rounded-lg border border-gray-200 bg-gray-50/60 px-3.5 py-3">
                    <div className="flex items-center gap-2">
                      <span className={`h-2 w-2 shrink-0 rounded-full ${priorityDot[ins.priority]}`} />
                      <span className="text-sm font-bold text-gray-900">{ins.title}</span>
                      <span className="ml-auto shrink-0 text-[10px] font-bold uppercase tracking-wider text-gray-400">{priorityLabel[ins.priority]}</span>
                    </div>
                    <p className="mt-1.5 pl-4 text-xs leading-relaxed text-gray-600">{ins.description}</p>
                  </div>
                ))}
              </div>
            )
          })()}
        </Card>
      </div>

      {/* Sector heat map */}
      {sectorForecasts.length > 0 && (() => {
        const maxEmp = Math.max(1, ...sectorForecasts.map(sf => sf.employment_count))
        const sorted = [...sectorForecasts]
          .map(sf => ({ ...sf, growth: sectorGrowth.get(sf.sector_slug) ?? 0 }))
          .sort((a, b) => b.employment_count - a.employment_count)
        return (
          <Card className="mt-6 p-6">
            <h2 className="text-lg font-bold text-gray-900">Sector Demand Heat Map</h2>
            <p className="mt-1 text-xs text-gray-500">Tile intensity reflects employment volume — darker tiles = higher demand. Click any sector for details.</p>
            <ul className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5" data-testid="sector-heatmap">
              {sorted.map((sf) => {
                const strength = sf.employment_count / maxEmp
                const dark = strength > 0.55
                return (
                  <li key={sf.sector_slug}>
                    <Link
                      to={`/dashboard/sectors?sector=${sf.sector_slug}`}
                      className="block rounded-lg border border-primary/10 px-3 py-2.5 transition-shadow hover:shadow-md"
                      style={{ backgroundColor: `rgba(29, 78, 216, ${(0.06 + strength * 0.5).toFixed(2)})` }}
                      title={`${sf.sector_name}: ${fmtInt(sf.employment_count)} jobs`}
                    >
                      <div className={`truncate text-sm font-bold ${dark ? 'text-white' : 'text-navy'}`}>{sf.sector_name}</div>
                      <div className={`text-xs font-medium ${dark ? 'text-white/80' : 'text-gray-500'}`}>{fmtInt(sf.employment_count)} jobs</div>
                      <div className={`mt-1 text-xs font-bold ${dark ? (sf.growth >= 0 ? 'text-emerald-300' : 'text-red-300') : (sf.growth >= 0 ? 'text-emerald-600' : 'text-red-500')}`}>
                        {sf.growth >= 0 ? '+' : ''}{sf.growth.toFixed(1)}% growth
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </Card>
        )
      })()}
    </DashboardLayout>
  )
}
