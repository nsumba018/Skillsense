import { useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, Sparkles, Gauge } from 'lucide-react'
import DashboardLayout, { Card } from './DashboardLayout'
import { RoleForecastChart, type RoleChartPoint } from './charts'
import { EmptyState, QueryGate } from '../../components/ui/State'
import { useForecasts, useHistorical, useTaxonomy, useTrends } from '../../services/queries'
import { fmtInt, fmtNum, fmtPct, HORIZON_LABEL } from '../../lib/format'
import { TREND_LABEL, TREND_TONE } from '../../lib/derive'
import type { Horizon, RoleForecast as RF } from '../../types/api'

const HORIZONS: Horizon[] = ['6m', '1y', '2y']

export default function RoleForecast() {
  const forecasts = useForecasts()
  const taxonomy = useTaxonomy()
  const trends = useTrends()
  const [horizon, setHorizon] = useState<Horizon>('1y')
  const [group, setGroup] = useState('All')
  const [picked, setPicked] = useState<number | null>(null)

  const roleGroup = useMemo(() => {
    const m = new Map<number, string>()
    taxonomy.data?.forEach((g) => g.families.forEach((f) => f.roles.forEach((r) => m.set(r.id, g.name))))
    return m
  }, [taxonomy.data])

  const rows: RF[] = useMemo(() => {
    const list = (forecasts.data?.forecasts ?? []).filter((f) => f.horizon === horizon)
    return list
      .filter((f) => group === 'All' || roleGroup.get(f.role_id) === group)
      .sort((a, b) => b.demand_index - a.demand_index)
  }, [forecasts.data, horizon, group, roleGroup])

  const oneYear = useMemo(
    () => (forecasts.data?.forecasts ?? []).filter((f) => f.horizon === '1y').sort((a, b) => b.demand_index - a.demand_index),
    [forecasts.data],
  )
  const selectedId = picked ?? oneYear[0]?.role_id ?? null
  const selected = oneYear.find((f) => f.role_id === selectedId)
  const history = useHistorical(selectedId ?? undefined, selectedId !== null)

  const chartData: RoleChartPoint[] = useMemo(() => {
    if (!selected || !history.data) return []
    const points = Object.values(history.data)[0] ?? []
    const data: RoleChartPoint[] = points
      .filter((p) => p.year >= 2010)
      .map((p) => ({
        label: String(p.year),
        ...(p.synthetic ? { estimated: p.demand_index } : { verified: p.demand_index }),
      }))
    const firstVerified = data.findIndex((d) => d.verified !== undefined)
    if (firstVerified > 0) data[firstVerified - 1].verified = data[firstVerified - 1].estimated
    const last = data[data.length - 1]
    if (last) last.forecast = last.verified ?? last.estimated
    for (const h of HORIZONS) {
      const f = (forecasts.data?.forecasts ?? []).find((x) => x.role_id === selected.role_id && x.horizon === h)
      if (f)
        data.push({
          label: `+${HORIZON_LABEL[h]}`,
          forecast: f.demand_index,
          band: [f.confidence_lower ?? f.demand_index, f.confidence_upper ?? f.demand_index],
        })
    }
    return data
  }, [selected, history.data, forecasts.data])

  const insight = trends.data?.growing[0]
  const groupNames = ['All', ...(taxonomy.data?.map((g) => g.name) ?? [])]
  const run = forecasts.data?.forecast_run

  return (
    <DashboardLayout>
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-navy">ICT Role Demand Forecast</h1>
          <p className="mt-3 text-base leading-relaxed text-gray-600">
            Two-stage forecasting model (gradient-boosted trend model corrected against current job postings) projecting
            demand for each ICT role at 6 months, 1 year and 2 years.
          </p>
        </div>
        {run && (
          <span data-testid="model-version" className="flex shrink-0 items-center gap-2.5 rounded-full bg-emerald-50 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Model {run.model_version}
          </span>
        )}
      </div>

      {/* Controls */}
      <Card className="mt-8 p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-navy">Forecast Horizon</span>
            <div className="mt-2 flex rounded-lg border border-gray-200 bg-gray-50 p-1" role="tablist">
              {HORIZONS.map((h) => (
                <button
                  key={h}
                  role="tab"
                  aria-selected={horizon === h}
                  onClick={() => setHorizon(h)}
                  className={`flex-1 rounded-md px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${horizon === h ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-800'}`}
                >
                  {HORIZON_LABEL[h]}
                </button>
              ))}
            </div>
          </div>
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-navy">ICT Role Group</span>
            <select value={group} onChange={(e) => setGroup(e.target.value)} aria-label="Role group" className="mt-2 w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 outline-none focus:border-primary">
              {groupNames.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-navy">Role (chart)</span>
            <select value={selectedId ?? ''} onChange={(e) => setPicked(Number(e.target.value))} aria-label="Role" className="mt-2 w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 outline-none focus:border-primary">
              {oneYear.map((f) => (
                <option key={f.role_id} value={f.role_id}>{f.role_name}</option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      {/* Insight */}
      {insight && (
        <Card className="mt-6 p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy text-white">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Model Insight</div>
              <p data-testid="insight" className="mt-1.5 text-base font-bold leading-relaxed text-gray-900">
                <span className="text-primary">{insight.role_name}</span> leads the 1-year outlook with a demand index of{' '}
                {fmtNum(insight.demand_index)} ({fmtPct(insight.share_pct)} of ICT employment).{' '}
                {trends.data ? `${trends.data.growing.length} roles are growing, ${trends.data.declining.length} declining.` : ''}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Chart + metrics */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 data-testid="chart-role" className="text-xl font-extrabold tracking-tight text-navy">{selected?.role_name ?? 'Role'}</h2>
              <p className="mt-1 text-sm text-gray-500">Demand index (0–100, top role of each year = 100), history and forecast</p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold uppercase tracking-wide text-gray-500">
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-navy" /> Verified</span>
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 border-t-2 border-dotted border-gray-400" /> Estimated</span>
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 border-t-2 border-dashed border-emerald-500" /> Forecast</span>
            </div>
          </div>
          <QueryGate query={history} className="mt-6">
            {() => (
              <div className="mt-6" data-testid="role-chart">
                <RoleForecastChart data={chartData} />
              </div>
            )}
          </QueryGate>
          <p className="mt-3 text-xs text-gray-400">
            Shaded band = forecast confidence interval. Years before 2017 are back-extrapolated estimates, not survey data.
          </p>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-navy"><Gauge className="h-5 w-5" /></div>
            <h3 className="mt-5 text-xl font-extrabold tracking-tight text-navy">Selected Role Outlook</h3>
            <div className="mt-4 space-y-3" data-testid="role-outlook">
              {HORIZONS.map((h) => {
                const f = (forecasts.data?.forecasts ?? []).find((x) => x.role_id === selectedId && x.horizon === h)
                return (
                  <div key={h} className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-gray-600">{HORIZON_LABEL[h]}</span>
                    <span className="font-bold text-navy">{f ? `${fmtNum(f.demand_index)} · ${fmtPct(f.share_pct)}` : '-'}</span>
                  </div>
                )
              })}
            </div>
          </Card>
          {run && (
            <Card className="p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Model Validation</h3>
              <div className="mt-4 space-y-3 text-sm" data-testid="metrics">
                <div className="flex justify-between"><span className="text-gray-600">Rank correlation</span><span className="font-bold text-navy">{fmtNum(run.accuracy_spearman, 4)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Pearson correlation</span><span className="font-bold text-navy">{fmtNum(run.accuracy_pearson, 4)}</span></div>
                <div className="flex justify-between"><span className="text-gray-600">Cross-validated R²</span><span className="font-bold text-navy">{fmtNum(run.accuracy_r2, 4)}</span></div>
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* All roles table */}
      <Card className="mt-8 overflow-x-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-6">
          <h2 className="text-xl font-extrabold tracking-tight text-navy">All ICT Roles: {HORIZON_LABEL[horizon]} outlook</h2>
          <span className="text-xs text-gray-400">{rows.length} roles{group !== 'All' ? ` in ${group}` : ''}</span>
        </div>
        <QueryGate query={forecasts} className="m-6">
          {() =>
            rows.length === 0 ? (
              <EmptyState title="No roles in this group" hint="Choose a different role group." className="m-6" />
            ) : (
              <table className="mt-4 w-full min-w-[820px] text-left" data-testid="forecast-table">
                <thead>
                  <tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="px-6 py-4 font-bold">Role</th>
                    <th className="px-6 py-4 font-bold">Group</th>
                    <th className="px-6 py-4 font-bold">Demand index</th>
                    <th className="px-6 py-4 font-bold">ICT share</th>
                    <th className="px-6 py-4 font-bold">Est. jobs</th>
                    <th className="px-6 py-4 font-bold">Range</th>
                    <th className="px-6 py-4 font-bold">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r) => (
                    <tr key={r.id} onClick={() => setPicked(r.role_id)} className={`cursor-pointer text-sm transition-colors hover:bg-gray-50 ${r.role_id === selectedId ? 'bg-primary-light/50' : ''}`}>
                      <td className="px-6 py-4 font-bold text-gray-900">{r.role_name}</td>
                      <td className="px-6 py-4 text-gray-600">{roleGroup.get(r.role_id) ?? '-'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="h-1.5 w-20 rounded-full bg-gray-100"><span className="block h-1.5 rounded-full bg-navy" style={{ width: `${r.demand_index}%` }} /></span>
                          <span className="font-bold text-navy">{fmtNum(r.demand_index)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-gray-700">{fmtPct(r.share_pct, 2)}</td>
                      <td className="px-6 py-4 text-gray-700">{fmtInt(r.employment_proxy)}</td>
                      <td className="px-6 py-4 text-xs text-gray-500">{fmtNum(r.confidence_lower)} – {fmtNum(r.confidence_upper)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${TREND_TONE[r.trend_direction]}`}>
                          {r.trend_direction === 'growing' ? <TrendingUp className="h-3 w-3" /> : r.trend_direction === 'declining' ? <TrendingDown className="h-3 w-3" /> : null}
                          {TREND_LABEL[r.trend_direction]}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </QueryGate>
      </Card>
    </DashboardLayout>
  )
}
