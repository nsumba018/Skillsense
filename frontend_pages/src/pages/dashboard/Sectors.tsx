import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  Layers,
  Users,
  Briefcase,
  TrendingUp,
  TrendingDown,
  Minus,
  ArrowUpRight,
  ArrowDownRight,
  Percent,
  BarChart3,
} from 'lucide-react'
import DashboardLayout, { Card, PageHeader } from './DashboardLayout'
import { Sparkline, EmploymentBars, type BarPoint } from './charts'
import { EmptyState, QueryGate } from '../../components/ui/State'
import { useSectorList, useSectorForecasts, useSectorEmployment, useKpis } from '../../services/queries'
import { TREND_LABEL, TREND_TONE } from '../../lib/derive'
import { fmtInt, fmtPct, HORIZON_LABEL } from '../../lib/format'
import type { Horizon, Trend, SectorForecastEntry } from '../../types/api'

const HORIZONS: Horizon[] = ['6m', '1y', '2y']

function TrendBadge({ trend, label }: { trend: Trend; label: string }) {
  const Icon = trend === 'growing' ? TrendingUp : trend === 'declining' ? TrendingDown : Minus
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${TREND_TONE[trend]}`}>
      <Icon className="h-3 w-3" />
      {label} {TREND_LABEL[trend]}
    </span>
  )
}

function AllSectorsView({ horizon, forecasts }: { horizon: Horizon; forecasts: SectorForecastEntry[] }) {
  const sectorEmployment = useSectorEmployment()
  const kpis = useKpis()
  const filtered = forecasts.filter((f) => f.horizon === horizon)
  const totalEmp = filtered.reduce((s, f) => s + f.employment_count, 0)
  const growing = filtered.filter((f) => f.employment_trend === 'growing')
  const maxShare = Math.max(1, ...filtered.map((f) => f.employment_share_pct))

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

  const growthBySlug = new Map<string, number>()
  for (const f of filtered) {
    const current = empBySlug.get(f.sector_slug)
    if (current && current > 0) {
      growthBySlug.set(f.sector_slug, (f.employment_count - current) / current * 100)
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Sectors Tracked</span>
            <Layers className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900">{filtered.length}</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Total Employment</span>
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900">{fmtInt(totalEmp)}</div>
          <p className="mt-2 text-xs text-gray-500">{HORIZON_LABEL[horizon]} forecast</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Growing (jobs)</span>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="mt-3 text-4xl font-extrabold tracking-tight text-emerald-700">{growing.length}</div>
          <p className="mt-2 text-xs text-gray-500">sectors adding jobs</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Job Postings</span>
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900">{fmtInt(kpis.data?.total_postings ?? 0)}</div>
          <p className="mt-2 text-xs text-gray-500">across all sectors</p>
        </Card>
      </div>

      {/* Sector comparison table */}
      <Card className="mt-6 overflow-x-auto">
        <div className="px-6 pt-6">
          <h2 className="text-xl font-extrabold tracking-tight text-navy">Sector Comparison</h2>
          <p className="mt-1 text-sm text-gray-500">{HORIZON_LABEL[horizon]} forecast · all sectors ranked by employment share</p>
        </div>
        <table className="mt-4 w-full min-w-[900px] text-left" data-testid="sector-table">
          <thead>
            <tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              <th className="px-6 py-4 font-bold">Sector</th>
              <th className="px-6 py-4 font-bold">Employment share</th>
              <th className="px-6 py-4 font-bold">Employment</th>
              <th className="px-6 py-4 font-bold">GDP %</th>
              <th className="px-6 py-4 font-bold">Growth</th>
              <th className="px-6 py-4 font-bold">Jobs trend</th>
              <th className="px-6 py-4 font-bold">Postings</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[...filtered].sort((a, b) => b.employment_share_pct - a.employment_share_pct).map((f) => (
              <tr key={f.sector_slug} className="text-sm">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2.5">
                    <span className="h-3 w-3 rounded-full shrink-0" style={{ backgroundColor: f.sector_color }} />
                    <span className="font-bold text-navy">{f.sector_name}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <span className="h-1.5 w-20 rounded-full bg-gray-100">
                      <span className="block h-1.5 rounded-full" style={{ width: `${(f.employment_share_pct / maxShare) * 100}%`, backgroundColor: f.sector_color }} />
                    </span>
                    <span className="font-bold text-gray-900">{fmtPct(f.employment_share_pct)}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-gray-700 font-variant-numeric-tabular">{fmtInt(f.employment_count)}</td>
                <td className="px-6 py-4 text-gray-700">{f.gdp_contribution_pct != null ? fmtPct(f.gdp_contribution_pct) : '-'}</td>
                <td className="px-6 py-4">
                  {(() => {
                    const g = growthBySlug.get(f.sector_slug)
                    if (g == null) return <span className="text-gray-400">—</span>
                    return (
                      <span className={`font-bold ${g >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {g >= 0 ? '+' : ''}{g.toFixed(1)}%
                      </span>
                    )
                  })()}
                </td>
                <td className="px-6 py-4"><TrendBadge trend={f.employment_trend} label="" /></td>
                <td className="px-6 py-4 text-gray-700">{fmtInt(f.posting_count)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Sector cards grid */}
      <div className="mt-6">
        <h2 className="text-xl font-extrabold tracking-tight text-navy">Sector Cards</h2>
        <p className="mt-1 text-sm text-gray-500">Click a sector above to see its full detail</p>
        <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" data-testid="sector-cards">
          {[...filtered].sort((a, b) => b.employment_share_pct - a.employment_share_pct).map((f) => {
            const g = growthBySlug.get(f.sector_slug)
            return (
              <Card key={f.sector_slug} className="p-5">
                <div className="flex items-center gap-2.5">
                  <span className="h-3.5 w-3.5 rounded-full shrink-0" style={{ backgroundColor: f.sector_color }} />
                  <span className="text-base font-bold text-gray-900">{f.sector_name}</span>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Share</div>
                    <div className="mt-1 text-2xl font-extrabold tracking-tight text-navy">{fmtPct(f.employment_share_pct)}</div>
                  </div>
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Employment</div>
                    <div className="mt-1 text-2xl font-extrabold tracking-tight text-navy">{fmtInt(f.employment_count)}</div>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-2">
                  <TrendBadge trend={f.employment_trend} label="Jobs" />
                  {g != null && (
                    <span className={`text-xs font-bold ${g >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {g >= 0 ? '+' : ''}{g.toFixed(1)}%
                    </span>
                  )}
                </div>
                {f.posting_count > 0 && (
                  <p className="mt-2 text-xs text-gray-500">{fmtInt(f.posting_count)} job postings</p>
                )}
                {f.confidence_lower != null && f.confidence_upper != null && (
                  <p className="mt-1 text-[11px] text-gray-400">
                    Confidence: {fmtPct(f.confidence_lower)} – {fmtPct(f.confidence_upper)}
                  </p>
                )}
              </Card>
            )
          })}
        </div>
      </div>
    </>
  )
}

function SingleSectorView({ slug, sectorName, sectorColor, forecasts }: {
  slug: string
  sectorName: string
  sectorColor: string
  forecasts: SectorForecastEntry[]
}) {
  const sectorForecasts = forecasts.filter((f) => f.sector_slug === slug)
  const employment = useSectorEmployment(slug)

  const bars: BarPoint[] = useMemo(() => {
    if (!employment.data) return []
    const sorted = [...employment.data].sort((a, b) => a.year - b.year)
    const data: BarPoint[] = sorted.map((e) => ({
      label: String(e.year),
      value: e.employment_count,
      forecast: false,
    }))
    for (const h of HORIZONS) {
      const fc = sectorForecasts.find((f) => f.horizon === h)
      if (fc) data.push({ label: `+${HORIZON_LABEL[h]}`, value: fc.employment_count, forecast: true })
    }
    return data
  }, [employment.data, sectorForecasts])

  const historyShares = useMemo(() => {
    if (!employment.data) return []
    return [...employment.data].sort((a, b) => a.year - b.year).map((e) => e.employment_share_pct)
  }, [employment.data])

  const fc1y = sectorForecasts.find((f) => f.horizon === '1y')
  const fc6m = sectorForecasts.find((f) => f.horizon === '6m')
  const fc2y = sectorForecasts.find((f) => f.horizon === '2y')

  const latestHistory = employment.data ? [...employment.data].sort((a, b) => b.year - a.year)[0] : null
  const prevHistory = employment.data ? [...employment.data].sort((a, b) => b.year - a.year)[1] : null
  const empDelta = latestHistory && prevHistory
    ? ((latestHistory.employment_count - prevHistory.employment_count) / prevHistory.employment_count) * 100
    : null

  return (
    <>
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Card className="p-5" style={{ borderTop: `3px solid ${sectorColor}` }}>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Employment ({latestHistory?.year})</span>
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-4xl font-extrabold tracking-tight text-gray-900">{fmtInt(latestHistory?.employment_count)}</span>
            {empDelta !== null && (
              <span className={`flex items-center gap-0.5 text-sm font-semibold ${empDelta >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                {empDelta >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <ArrowDownRight className="h-3.5 w-3.5" />}
                {Math.abs(empDelta).toFixed(1)}%
              </span>
            )}
          </div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Employment Share</span>
            <Percent className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900">{fmtPct(latestHistory?.employment_share_pct, 2)}</div>
          <div className="mt-3"><Sparkline points={historyShares} color={sectorColor} /></div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">GDP Contribution</span>
            <BarChart3 className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900">{latestHistory?.gdp_contribution_pct != null ? fmtPct(latestHistory.gdp_contribution_pct) : '-'}</div>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Job Postings</span>
            <Briefcase className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900">{fmtInt(fc1y?.posting_count ?? 0)}</div>
        </Card>
      </div>

      {/* Trends */}
      {fc1y && (
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <TrendBadge trend={fc1y.employment_trend} label="Jobs" />
          {latestHistory && latestHistory.employment_count > 0 && (
            <span className={`text-sm font-bold ${
              fc1y.employment_count >= latestHistory.employment_count ? 'text-emerald-600' : 'text-red-500'
            }`}>
              {((fc1y.employment_count - latestHistory.employment_count) / latestHistory.employment_count * 100) >= 0 ? '+' : ''}
              {((fc1y.employment_count - latestHistory.employment_count) / latestHistory.employment_count * 100).toFixed(1)}% forecast growth
            </span>
          )}
        </div>
      )}

      {/* Employment history + forecast bars */}
      <Card className="mt-6 p-6">
        <h2 className="text-xl font-extrabold tracking-tight text-navy">{sectorName} Employment</h2>
        <p className="mt-1 text-sm text-gray-500">Historical employment count and forecast at 6m, 1y, 2y</p>
        <QueryGate query={employment} className="mt-6">
          {() => bars.length > 0 ? (
            <div className="mt-6" data-testid="sector-detail-bars">
              <EmploymentBars data={bars} />
            </div>
          ) : (
            <EmptyState title="No historical data" hint="Run the data loader to populate sector employment history." className="mt-6" />
          )}
        </QueryGate>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-[11px] text-gray-400">
          <span>SOURCE: NISR Labour Force Survey + SkillSense backcast · SkillSense sector forecast</span>
          <span className="font-semibold uppercase tracking-wide">Dashed = forecast</span>
        </div>
      </Card>

      {/* Forecast horizons */}
      <Card className="mt-6 overflow-x-auto p-6">
        <h2 className="text-xl font-extrabold tracking-tight text-navy">Forecast Horizons</h2>
        <table className="mt-5 w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              <th className="pb-3 font-bold">Horizon</th>
              <th className="pb-3 font-bold">Employment share</th>
              <th className="pb-3 font-bold">Employment</th>
              <th className="pb-3 font-bold">Confidence band</th>
              <th className="pb-3 font-bold">Growth</th>
              <th className="pb-3 font-bold">Jobs trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {[fc6m, fc1y, fc2y].map((fc) => fc && (
              <tr key={fc.horizon} className="text-sm">
                <td className="py-4 font-bold text-navy">{HORIZON_LABEL[fc.horizon]}</td>
                <td className="py-4 text-gray-700">{fmtPct(fc.employment_share_pct)}</td>
                <td className="py-4 text-gray-700">{fmtInt(fc.employment_count)}</td>
                <td className="py-4 text-xs text-gray-500">
                  {fc.confidence_lower != null && fc.confidence_upper != null
                    ? `${fmtPct(fc.confidence_lower)} – ${fmtPct(fc.confidence_upper)}`
                    : '-'}
                </td>
                <td className="py-4">
                  {latestHistory && latestHistory.employment_count > 0 ? (() => {
                    const g = (fc.employment_count - latestHistory.employment_count) / latestHistory.employment_count * 100
                    return (
                      <span className={`font-bold ${g >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                        {g >= 0 ? '+' : ''}{g.toFixed(1)}%
                      </span>
                    )
                  })() : '—'}
                </td>
                <td className="py-4"><TrendBadge trend={fc.employment_trend} label="" /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Historical data table */}
      <Card className="mt-6 overflow-x-auto p-6">
        <h2 className="text-xl font-extrabold tracking-tight text-navy">Historical Data</h2>
        <p className="mt-1 text-sm text-gray-500">{sectorName} employment over time</p>
        <QueryGate query={employment} className="mt-4">
          {(data) => (
            <table className="mt-4 w-full min-w-[640px] text-left" data-testid="history-table">
              <thead>
                <tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  <th className="pb-3 font-bold">Year</th>
                  <th className="pb-3 font-bold">Employment</th>
                  <th className="pb-3 font-bold">Share %</th>
                  <th className="pb-3 font-bold">GDP %</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[...data].sort((a, b) => b.year - a.year).map((row) => (
                  <tr key={row.year} className="text-sm">
                    <td className="py-3 font-bold text-navy">{row.year}</td>
                    <td className="py-3 text-gray-700">{fmtInt(row.employment_count)}</td>
                    <td className="py-3 text-gray-700">{fmtPct(row.employment_share_pct, 2)}</td>
                    <td className="py-3 text-gray-700">{row.gdp_contribution_pct != null ? fmtPct(row.gdp_contribution_pct) : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </QueryGate>
      </Card>
    </>
  )
}

export default function Sectors() {
  const [searchParams, setSearchParams] = useSearchParams()
  const selectedSlug = searchParams.get('sector') || null
  const [horizon, setHorizon] = useState<Horizon>('1y')
  useKpis()
  const sectorList = useSectorList()
  const sectorForecasts = useSectorForecasts()

  const allForecasts = sectorForecasts.data?.forecasts ?? []
  const sectors = sectorList.data ?? []
  const selectedSector = sectors.find((s) => s.slug === selectedSlug)

  const selectSector = (slug: string | null) => {
    if (slug) {
      setSearchParams({ sector: slug })
    } else {
      setSearchParams({})
    }
  }

  const query = {
    isLoading: sectorList.isLoading || sectorForecasts.isLoading,
    isError: sectorList.isError || sectorForecasts.isError,
    error: sectorList.error ?? sectorForecasts.error,
    data: sectors.length > 0 ? true : undefined,
    refetch: () => { sectorList.refetch(); sectorForecasts.refetch() },
  }

  return (
    <DashboardLayout>
      <PageHeader
        icon={Layers}
        title="Sector Workforce Overview"
        subtitle="Employment forecasts, trends and job postings across all sectors of Rwanda's economy."
      />

      {/* Sector selector */}
      <Card className="mt-6 p-4">
        <div className="text-[11px] font-bold uppercase tracking-wider text-navy mb-3">Select a sector</div>
        <div className="flex flex-wrap gap-2" role="tablist" data-testid="sector-selector">
          <button
            role="tab"
            aria-selected={!selectedSlug}
            onClick={() => selectSector(null)}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              !selectedSlug
                ? 'bg-navy text-white shadow-sm'
                : 'border border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            All Sectors
          </button>
          {sectors.map((s) => (
            <button
              key={s.slug}
              role="tab"
              aria-selected={selectedSlug === s.slug}
              onClick={() => selectSector(s.slug)}
              className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                selectedSlug === s.slug
                  ? 'text-white shadow-sm'
                  : 'border border-gray-200 bg-white text-gray-700 hover:border-gray-300'
              }`}
              style={selectedSlug === s.slug ? { backgroundColor: s.color } : undefined}
            >
              <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
              {s.name}
            </button>
          ))}
        </div>
      </Card>

      {/* Horizon selector (all-sectors view only) */}
      {!selectedSlug && (
        <div className="mt-4 flex items-center gap-3">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Forecast horizon</span>
          <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
            {HORIZONS.map((h) => (
              <button
                key={h}
                onClick={() => setHorizon(h)}
                className={`rounded-md px-3 py-1.5 text-xs font-bold uppercase tracking-wider transition-colors ${
                  horizon === h ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                {HORIZON_LABEL[h]}
              </button>
            ))}
          </div>
        </div>
      )}

      <QueryGate query={query} className="mt-6">
        {() => (
          <div className="mt-6">
            {selectedSlug && selectedSector ? (
              <SingleSectorView
                slug={selectedSlug}
                sectorName={selectedSector.name}
                sectorColor={selectedSector.color}
                forecasts={allForecasts}
              />
            ) : (
              <AllSectorsView horizon={horizon} forecasts={allForecasts} />
            )}
          </div>
        )}
      </QueryGate>
    </DashboardLayout>
  )
}
