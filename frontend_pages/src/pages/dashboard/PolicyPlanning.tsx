import { useMemo } from 'react'
import { AlertTriangle, ArrowDownRight, ArrowUpRight, Briefcase, Landmark, Lightbulb, MapPin, Shield, Sparkles, TrendingUp } from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardLayout, { Card } from './DashboardLayout'
import SectorSelector, { useSectorParam } from '../../components/ui/SectorSelector'
import { QueryGate } from '../../components/ui/State'
import { useForecasts, useHistoricalSince, useKpis, useTaxonomy, useSectorForecasts, useSectorEmployment, useSectorPositions, usePolicyInsights } from '../../services/queries'
import { fmtInt, fmtPct, HORIZON_LABEL } from '../../lib/format'
import type { Horizon } from '../../types/api'

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
  const sectorEmployment = useSectorEmployment()
  const forecasts = sectorForecasts.data?.forecasts ?? []

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

  const empBySlug = useMemo(() => {
    const m = new Map<string, number>()
    if (sectorEmployment.data) {
      const latestYear = new Map<string, number>()
      for (const row of sectorEmployment.data) {
        if (!latestYear.has(row.sector_slug) || row.year > latestYear.get(row.sector_slug)!) {
          latestYear.set(row.sector_slug, row.year)
          m.set(row.sector_slug, row.employment_count)
        }
      }
    }
    return m
  }, [sectorEmployment.data])

  const oneYear = horizonData.get('1y') ?? []
  const growing = oneYear.filter((f) => f.employment_trend === 'growing')
  const stable = oneYear.filter((f) => f.employment_trend === 'stable')
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
            <div className="rounded-xl bg-blue-50 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-blue-700">Stable sectors</div>
              <div className="mt-2 text-2xl font-extrabold text-blue-700">{stable.length}</div>
              <div className="mt-1 text-xs text-blue-500">steady employment</div>
            </div>
          </div>

          <div className="mt-5 space-y-3" data-testid="sector-brief">
            {sorted.map((f) => {
              const current = empBySlug.get(f.sector_slug)
              const growth = current && current > 0 ? (f.employment_count - current) / current * 100 : null
              return (
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
                  {growth !== null && (
                    <span className={`w-16 text-right text-sm font-bold ${growth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                      {growth >= 0 ? '+' : ''}{growth.toFixed(1)}%
                    </span>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {sectorSlug && oneYear[0] && (() => {
        const f = oneYear[0]
        const current = empBySlug.get(f.sector_slug)
        const growth = current && current > 0 ? (f.employment_count - current) / current * 100 : null
        return (
          <div className="mt-5">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Projected employment</div>
                <div className="mt-2 text-2xl font-extrabold text-navy">{fmtInt(f.employment_count)}</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Employment share</div>
                <div className="mt-2 text-2xl font-extrabold text-navy">{fmtPct(f.employment_share_pct)}</div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Forecast growth</div>
                <div className={`mt-2 text-2xl font-extrabold ${growth !== null && growth >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                  {growth !== null ? `${growth >= 0 ? '+' : ''}${growth.toFixed(1)}%` : '—'}
                </div>
              </div>
              <div className="rounded-xl bg-gray-50 p-4">
                <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Job postings</div>
                <div className="mt-2 text-2xl font-extrabold text-navy">{fmtInt(f.posting_count)}</div>
              </div>
            </div>
          </div>
        )
      })()}
    </Card>
  )
}

const INSIGHT_STYLE: Record<string, { icon: typeof Sparkles; bg: string; border: string; iconColor: string }> = {
  opportunity: { icon: TrendingUp, bg: 'bg-emerald-50', border: 'border-emerald-200', iconColor: 'text-emerald-600' },
  training: { icon: Lightbulb, bg: 'bg-amber-50', border: 'border-amber-200', iconColor: 'text-amber-600' },
  risk: { icon: AlertTriangle, bg: 'bg-red-50', border: 'border-red-200', iconColor: 'text-red-500' },
  protection: { icon: Shield, bg: 'bg-blue-50', border: 'border-blue-200', iconColor: 'text-blue-600' },
  geographic: { icon: MapPin, bg: 'bg-violet-50', border: 'border-violet-200', iconColor: 'text-violet-600' },
  demand: { icon: Briefcase, bg: 'bg-orange-50', border: 'border-orange-200', iconColor: 'text-orange-600' },
  overview: { icon: Sparkles, bg: 'bg-gray-50', border: 'border-gray-200', iconColor: 'text-gray-600' },
  stability: { icon: Shield, bg: 'bg-blue-50', border: 'border-blue-200', iconColor: 'text-blue-600' },
  ranking: { icon: TrendingUp, bg: 'bg-gray-50', border: 'border-gray-200', iconColor: 'text-gray-500' },
  data: { icon: AlertTriangle, bg: 'bg-yellow-50', border: 'border-yellow-200', iconColor: 'text-yellow-600' },
}

const PRIORITY_LABEL: Record<string, { text: string; color: string }> = {
  high: { text: 'High priority', color: 'bg-red-100 text-red-700' },
  medium: { text: 'Medium', color: 'bg-amber-100 text-amber-700' },
  low: { text: 'Info', color: 'bg-gray-100 text-gray-600' },
}

function PolicyInsights({ sectorSlug }: { sectorSlug: string | null }) {
  const insights = usePolicyInsights(sectorSlug)
  const list = insights.data?.insights ?? []
  if (insights.isLoading) return null
  if (list.length === 0) return null

  return (
    <Card className="p-6">
      <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-navy">
        <Sparkles className="h-5 w-5 text-primary" />
        AI Policy Insights
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Data-driven recommendations computed from forecasts, employment trends, and job postings
      </p>
      <div className="mt-5 space-y-3">
        {list.map((insight, i) => {
          const style = INSIGHT_STYLE[insight.type] ?? INSIGHT_STYLE.overview!
          const priority = PRIORITY_LABEL[insight.priority] ?? PRIORITY_LABEL.low!
          const Icon = style.icon
          return (
            <div key={i} className={`flex items-start gap-4 rounded-xl border ${style.border} ${style.bg} p-4`}>
              <div className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/80 ${style.iconColor}`}>
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-gray-900">{insight.title}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${priority.color}`}>{priority.text}</span>
                </div>
                <p className="mt-1 text-sm leading-relaxed text-gray-700">{insight.description}</p>
              </div>
            </div>
          )
        })}
      </div>
    </Card>
  )
}

function TopPositions({ sectorSlug }: { sectorSlug: string | null }) {
  const positions = useSectorPositions(sectorSlug)
  const list = positions.data?.positions ?? []
  if (positions.isLoading) return null
  if (list.length === 0) return null
  const maxCount = Math.max(1, ...list.map((p) => p.count))

  return (
    <Card className="p-6">
      <h2 className="flex items-center gap-2 text-xl font-extrabold tracking-tight text-navy">
        <Briefcase className="h-5 w-5 text-primary" />
        {sectorSlug ? 'Top Positions in This Sector' : 'Top Positions Across All Sectors'}
      </h2>
      <p className="mt-1 text-sm text-gray-500">
        Most common job titles from current postings{sectorSlug ? '' : ' across all sectors'}
      </p>
      <ul className="mt-5 space-y-3">
        {list.map((p, i) => (
          <li key={p.title}>
            <div className="flex items-center justify-between gap-3 text-sm">
              <span className="font-bold text-gray-900">{i + 1}. {p.title}</span>
              <span className="shrink-0 text-sm font-bold text-navy">{p.count} posting{p.count !== 1 ? 's' : ''}</span>
            </div>
            <div className="mt-1.5 h-2 rounded-full bg-gray-100">
              <div className="h-2 rounded-full bg-primary" style={{ width: `${(p.count / maxCount) * 100}%` }} />
            </div>
          </li>
        ))}
      </ul>
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

  const showIctDetail = sectorSlug === 'ict-technology'

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

      <div className="mt-6">
        <PolicyInsights sectorSlug={sectorSlug} />
      </div>

      {sectorSlug && (
        <div className="mt-6">
          <TopPositions sectorSlug={sectorSlug} />
        </div>
      )}

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
                    <p className="mt-1 text-sm text-gray-500">ICT roles projected to need fewer people — plan transitions rather than new intake</p>
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
                    See <Link to="/dashboard/geography" className="font-bold text-primary hover:underline">Geography</Link> for where demand is located.
                  </p>
                </Card>
              </div>
            )
          }}
        </QueryGate>
      )}
    </DashboardLayout>
  )
}
