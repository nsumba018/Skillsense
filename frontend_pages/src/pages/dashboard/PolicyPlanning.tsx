import { useMemo } from 'react'
import { ArrowDownRight, ArrowUpRight, Landmark, Lightbulb } from 'lucide-react'
import { Link } from 'react-router-dom'
import DashboardLayout, { Card } from './DashboardLayout'
import { QueryGate } from '../../components/ui/State'
import { useForecasts, useHistoricalSince, useKpis, useTaxonomy } from '../../services/queries'
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

export default function PolicyPlanning() {
  const kpis = useKpis()
  const forecasts = useForecasts()
  const taxonomy = useTaxonomy()
  const latestYear = kpis.data?.latest_year ?? null
  const history = useHistoricalSince(latestYear ?? 2026)

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
          Where Rwanda's ICT workforce is heading and where to focus training investment, derived from the latest forecast run.
        </p>
      </div>

      <QueryGate query={query} className="mt-8">
        {(p) => {
          const top = p.needMore[0]
          return (
            <div className="mt-8 space-y-6">
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
                  <p className="mt-1 text-sm text-gray-500">Roles needing the most additional people within 2 years</p>
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
                  <p className="mt-1 text-sm text-gray-500">Roles projected to need fewer people, so plan transitions rather than new intake</p>
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
    </DashboardLayout>
  )
}
