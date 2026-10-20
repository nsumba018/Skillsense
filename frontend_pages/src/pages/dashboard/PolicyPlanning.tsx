import { useMemo } from 'react'
import { ArrowDownRight, ArrowUpRight, Landmark, Lightbulb, TrendingUp, TrendingDown, Minus } from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardLayout, { Card } from './DashboardLayout'
import SectorSelector, { useSectorParam } from '../../components/ui/SectorSelector'
import { QueryGate } from '../../components/ui/State'
import { useForecasts, useHistoricalSince, useKpis, useTaxonomy, useSectorForecasts } from '../../services/queries'
import { fmtInt, fmtPct, HORIZON_LABEL } from '../../lib/format'
import { TREND_LABEL, TREND_TONE } from '../../lib/derive'
import type { Horizon, Trend } from '../../types/api'

function TrendBadge({ trend }: { trend: Trend }) {
  const Icon = trend === 'growing' ? TrendingUp : trend === 'declining' ? TrendingDown : Minus
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${TREND_TONE[trend]}`}>
      <Icon className="h-3 w-3" />
      {TREND_LABEL[trend]}
    </span>
  )
}

interface RolePlan {
  roleId: number
  name: string
  group: string
  now: number
  in2y: number
  change: number
}

function SectorInvestmentBrief({ sectorSlug }: { sectorSlug: string | null }) {
  const sectorForecasts = useSectorForecasts()
  const forecasts = sectorForecasts.data ?? []

  const horizonData = useMemo(() => {
    const filtered = sectorSlug
      ? forecasts.filter((f) => f.sector_slug === sectorSlug)
      : forecasts
    const byHorizon = new Map<string, typeof filtered>()
    for (const f of filtered) {
      const arr = byHorizon.get(f.horizon) ?? []
      arr.push(f)
      byHorizon.set(f.horizon, arr)
    }
    return byHorizon
  }, [forecasts, sectorSlug])

  const oneYear = horizonData.get('1y') ?? []
  const growing = oneYear.filter((f) => f.employment_trend === 'growing')
  const declining = oneYear.filter((f) => f.share_trend === 'declining')
  const sorted = [...oneYear].sort((a, b) => b.employment_share_pct - a.employment_share_pct)
  const totalEmp = oneYear.reduce((s, f) => s + f.employment_count, 0)

  if (oneYear.length === 0) return null

  return (
    <Card className="p-6">
      <h2 className="text-xl font-extrabold tracking-tight text-navy">
        {sectorSlug ? `${oneYear[0]?.sector_name} Outlook` : 'Sector Investment Outlook'}
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        {sectorSlug
          ? 'Forecast employment trends and investment signals for this sector'
          : '1-year sector employment forecast — where to direct training and policy investment'}
      </p>

      {!sectorSlug && (
        <>
          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total workforce</div>
              <div className="mt-2 text-2xl font-extrabold text-navy">{fmtInt(totalEmp)}</div>
              <div className="mt-1 text-xs text-gray-500">1-year forecast</div>
            </div>
            <div className="rounded-xl bg-emerald-50 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Growing sectors</div>
              <div className="mt-2 text-2xl font-extrabold text-emerald-700">{growing.length}</div>
              <div className="mt-1 text-xs text-emerald-600">adding jobs</div>
            </div>
            <div className="rounded-xl bg-red-50 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-red-600">Declining share</div>
              <div className="mt-2 text-2xl font-extrabold text-red-600">{declining.length}</div>
              <div className="mt-1 text-xs text-red-500">shrinking relative to total</div>
            </div>
          </div>

          <div className="mt-5 space-y-3" data-testid="sector-brief">
            {sorted.map((f) => (
              <div key={f.sector_slug} className="flex items-center gap-3">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: f.sector_color }} />
                <span className="w-48 shrink-0 text-sm font-medium text-gray-800 truncate">{f.sector_name}</span>
                <div className="h-2 flex-1 rounded-full bg-gray-100">
                  <div
                    className="h-2 rounded-full"
                    style={{ width: `${(f.employment_share_pct / (sorted[0]?.employment_share_pct || 1)) * 100}%`, backgroundColor: f.sector_color }}
                  />
                </div>
                <span className="w-14 text-right text-sm font-bold text-gray-900">{fmtPct(f.employment_share_pct)}</span>
                <TrendBadge trend={f.employment_trend} />
              </div>
            ))}
          </div>
        </>
      )}

      {sectorSlug && oneYear[0] && (
        <div className="mt-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Projected employment</div>
              <div className="mt-2 text-2xl font-extrabold text-navy">{fmtInt(oneYear[0].employment_count)}</div>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Employment share</div>
              <div className="mt-2 text-2xl font-extrabold text-navy">{fmtPct(oneYear[0].employment_share_pct)}</div>
            </div>
            <div className="rounded-xl bg-gray-50 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Job postings</div>
              <div className="mt-2 text-2xl font-extrabold text-navy">{fmtInt(oneYear[0].posting_count)}</div>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <span className="text-xs text-gray-500">Share trend:</span>
            <TrendBadge trend={oneYear[0].share_trend} />
            <span className="ml-2 text-xs text-gray-500">Jobs trend:</span>
            <TrendBadge trend={oneYear[0].employment_trend} />
          </div>
        </div>
      )}
    </Card>
  )
}

export default function PolicyPlanning() {
  const [sectorSlug, setSectorSlug] = useSectorParam()
  const kpis = useKpis()
  const forecasts = useForecasts()
  const taxonomy = useTaxonomy()
  const latestYear = kpis.data?.latest_year ?? null
  const history = useHistoricalSince(latestYear ?? 2026)

  const showIctDetail = !sectorSlug || sectorSlug === 'ict-technology'

  const plan = useMemo(() => {
    if (!forecasts.data || !taxonomy.data || !history.data) return null
    const group = new Map<number, string>()
    taxonomy.data.forEach((g) => g.families.forEach((f) => f.roles.forEach((r) => group.set(r.id, g.name))))
    const nowByName = new Map<string, number>()
    for (const [name, pts] of Object.entries(history.data)) {
      const last = [...pts].sort((a, b) => a.year - b.year).pop()
      if (last) nowByName.set(name, last.employment_proxy)
    }
    const totals: Record<Horizon, number> = { '6m': 0, '1y': 0, '2y': 0 }
    for (const f of forecasts.data.forecasts) totals[f.horizon] += f.employment_proxy
    const roles: RolePlan[] = forecasts.data.forecasts
      .filter((f) => f.horizon === '2y')
      .map((f) => {
        const now = nowByName.get(f.role_name) ?? 0
        return { roleId: f.role_id, name: f.role_name, group: group.get(f.role_id) ?? '-', now, in2y: f.employment_proxy, change: f.employment_proxy - now }
      })
    const nowTotal = roles.reduce((s, r) => s + r.now, 0)
    const groups = new Map<string, { now: number; in2y: number }>()
    for (const r of roles) {
      const g = groups.get(r.group) ?? { now: 0, in2y: 0 }
      groups.set(r.group, { now: g.now + r.now, in2y: g.in2y + r.in2y })
    }
    return {
      nowTotal,
      totals,
      needMore: [...roles].sort((a, b) => b.change - a.change).filter((r) => r.change > 0).slice(0, 6),
      reskill: [...roles].sort((a, b) => a.change - b.change).filter((r) => r.change < 0).slice(0, 5),
      groups: [...groups.entries()].map(([name, v]) => ({ name, ...v, change: v.in2y - v.now })).sort((a, b) => b.change - a.change),
    }
  }, [forecasts.data, taxonomy.data, history.data])

  const query = { isLoading: forecasts.isLoading || taxonomy.isLoading || history.isLoading || kpis.isLoading, isError: forecasts.isError || taxonomy.isError || history.isError, error: forecasts.error ?? taxonomy.error ?? history.error, data: plan ?? undefined, refetch: () => { forecasts.refetch(); taxonomy.refetch(); history.refetch() } }
  const maxNeed = Math.max(1, ...(plan?.needMore.map((r) => r.change) ?? [1]))
  const maxReskill = Math.max(1, ...(plan?.reskill.map((r) => -r.change) ?? [1]))

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <h1 className="flex items-center gap-3 text-3xl font-extrabold tracking-tight text-navy"><Landmark className="h-8 w-8" /> Policy & Planning Brief</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Where Rwanda's workforce is heading and where to focus training investment, derived from the latest forecast run.
        </p>
      </div>

      <div className="mt-6">
        <SectorSelector selected={sectorSlug} onSelect={setSectorSlug} />
      </div>

      <div className="mt-6">
        <SectorInvestmentBrief sectorSlug={sectorSlug} />
      </div>

      {showIctDetail && (
        <QueryGate query={query} className="mt-6">
          {(p) => {
            const top = p.needMore[0]
            return (
              <div className="mt-2 space-y-6">
                <h2 className="text-xl font-extrabold tracking-tight text-navy">ICT Role-Level Detail</h2>

                {top && (
                  <Card className="flex items-start gap-4 border-primary/30 p-6 ring-1 ring-primary/10">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy text-white"><Lightbulb className="h-6 w-6" /></div>
                    <p data-testid="plan-headline" className="text-base font-bold leading-relaxed text-gray-900">
                      ICT employment is projected to grow from {fmtInt(p.nowTotal)} to {fmtInt(p.totals['2y'])} within two years
                      ({fmtPct(((p.totals['2y'] - p.nowTotal) / p.nowTotal) * 100, 0)}). The largest new demand is for{' '}
                      <span className="text-primary">{top.name}</span> (+{fmtInt(top.change)} jobs), so training capacity should be prioritised there first.
                    </p>
                  </Card>
                )}

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-4" data-testid="plan-totals">
                  <Card className="p-6"><div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Today ({latestYear})</div><div data-testid="plan-now" className="mt-3 text-3xl font-extrabold text-navy">{fmtInt(p.nowTotal)}</div><div className="mt-1 text-xs text-gray-500">ICT jobs</div></Card>
                  {(['6m', '1y', '2y'] as Horizon[]).map((h) => (
                    <Card key={h} className="p-6">
                      <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">In {HORIZON_LABEL[h]}</div>
                      <div data-testid={`plan-${h}`} className="mt-3 text-3xl font-extrabold text-navy">{fmtInt(p.totals[h])}</div>
                      <div className="mt-1 flex items-center gap-1 text-xs font-semibold text-emerald-600"><ArrowUpRight className="h-3.5 w-3.5" />+{fmtInt(p.totals[h] - p.nowTotal)} vs today</div>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                  <Card className="p-6">
                    <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-navy"><ArrowUpRight className="h-5 w-5 text-emerald-600" /> Training investment priorities</h2>
                    <p className="mt-1 text-sm text-gray-500">ICT roles needing the most additional people within 2 years</p>
                    <ul className="mt-5 space-y-4" data-testid="plan-priorities">
                      {p.needMore.map((r, i) => (
                        <li key={r.roleId}>
                          <div className="flex items-center justify-between gap-3 text-sm"><span className="font-bold text-gray-900">{i + 1}. {r.name}</span><span className="font-bold text-emerald-600">+{fmtInt(r.change)}</span></div>
                          <div className="mt-1.5 h-2 rounded-full bg-gray-100"><div className="h-2 rounded-full bg-emerald-600" style={{ width: `${(r.change / maxNeed) * 100}%` }} /></div>
                          <div className="mt-1 text-xs text-gray-400">{fmtInt(r.now)} now → {fmtInt(r.in2y)} · {r.group}</div>
                        </li>
                      ))}
                    </ul>
                  </Card>
                  <Card className="p-6">
                    <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-navy"><ArrowDownRight className="h-5 w-5 text-red-500" /> Reskilling watch-list</h2>
                    <p className="mt-1 text-sm text-gray-500">ICT roles projected to need fewer people, so plan transitions rather than new intake</p>
                    <ul className="mt-5 space-y-4" data-testid="plan-reskill">
                      {p.reskill.length === 0 && <li className="text-sm text-gray-500">No roles are projected to shrink.</li>}
                      {p.reskill.map((r) => (
                        <li key={r.roleId}>
                          <div className="flex items-center justify-between gap-3 text-sm"><span className="font-bold text-gray-900">{r.name}</span><span className="font-bold text-red-500">{fmtInt(r.change)}</span></div>
                          <div className="mt-1.5 h-2 rounded-full bg-gray-100"><div className="h-2 rounded-full bg-red-400" style={{ width: `${(-r.change / maxReskill) * 100}%` }} /></div>
                          <div className="mt-1 text-xs text-gray-400">{fmtInt(r.now)} now → {fmtInt(r.in2y)} · {r.group}</div>
                        </li>
                      ))}
                    </ul>
                  </Card>
                </div>

                <Card className="overflow-x-auto p-6">
                  <h2 className="text-xl font-extrabold tracking-tight text-navy">By ICT role group</h2>
                  <table className="mt-5 w-full min-w-[640px] text-left" data-testid="plan-groups">
                    <thead><tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-400"><th className="pb-3 font-bold">Role group</th><th className="pb-3 font-bold">Jobs now</th><th className="pb-3 font-bold">Jobs in 2 years</th><th className="pb-3 font-bold">Change</th></tr></thead>
                    <tbody className="divide-y divide-gray-100">
                      {p.groups.map((g) => (
                        <tr key={g.name} className="text-sm"><td className="py-3 font-bold text-navy">{g.name}</td><td className="py-3 text-gray-700">{fmtInt(g.now)}</td><td className="py-3 text-gray-700">{fmtInt(g.in2y)}</td><td className={`py-3 font-bold ${g.change >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{g.change >= 0 ? '+' : ''}{fmtInt(g.change)}</td></tr>
                      ))}
                    </tbody>
                  </table>
                  <p className="mt-4 text-xs text-gray-400">
                    Projected jobs apply the model's ICT growth assumptions to each role's forecast share (+15% in year one, a further +12% in year two).
                    See <Link to="/dashboard/geography" className="font-bold text-primary hover:underline">Geography</Link> for where demand is located.
                  </p>
                </Card>
              </div>
            )
          }}
        </QueryGate>
      )}

      {!showIctDetail && sectorSlug && sectorSlug !== 'ict-technology' && (
        <Card className="mt-6 p-6 text-center">
          <p className="text-sm text-gray-500">
            Role-level training priorities are currently available for the ICT & Technology sector.
            Select <button onClick={() => setSectorSlug('ict-technology')} className="font-bold text-primary hover:underline">ICT & Technology</button> or{' '}
            <button onClick={() => setSectorSlug(null)} className="font-bold text-primary hover:underline">All Sectors</button> to see the full policy brief.
          </p>
          <p className="mt-2 text-xs text-gray-400">Role-level detail for other sectors will be added as the taxonomy expands.</p>
        </Card>
      )}
    </DashboardLayout>
  )
}
