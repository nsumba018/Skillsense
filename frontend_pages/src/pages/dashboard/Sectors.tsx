import { useMemo } from 'react'
import { Briefcase, Percent, Rocket, Users, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import DashboardLayout, { Card } from './DashboardLayout'
import { EmploymentBars, type BarPoint } from './charts'
import { EmptyState, QueryGate } from '../../components/ui/State'
import { useForecasts, useMacro, useOverview, useSectors, useTaxonomy } from '../../services/queries'
import { employmentSeries, forecastEmployment } from '../../lib/derive'
import { fmtInt, fmtNum, fmtPct, HORIZON_LABEL } from '../../lib/format'

interface GroupRow {
  name: string
  roles: number
  shareNow: number
  share1y: number
  demand1y: number
}

export default function Sectors() {
  const macro = useMacro()
  const forecasts = useForecasts()
  const overview = useOverview()
  const taxonomy = useTaxonomy()
  const sectors = useSectors()

  const series = macro.data ? employmentSeries(macro.data, 2017) : []
  const latest = series[series.length - 1]
  const prev = series[series.length - 2]

  const bars: BarPoint[] = useMemo(() => {
    const data: BarPoint[] = series.map((m) => ({ label: String(m.year), value: m.ict_employment, forecast: false }))
    if (forecasts.data && data.length) {
      const totals = forecastEmployment(forecasts.data.forecasts)
      ;(['6m', '1y', '2y'] as const).forEach((h) => data.push({ label: `+${HORIZON_LABEL[h]}`, value: Math.round(totals[h]), forecast: true }))
    }
    return data
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [macro.data, forecasts.data])

  const groups: GroupRow[] = useMemo(() => {
    if (!taxonomy.data || !forecasts.data || !overview.data) return []
    const nowShare = new Map(overview.data.role_distribution.map((r) => [r.role_id, r.share_pct]))
    const f1y = new Map(forecasts.data.forecasts.filter((f) => f.horizon === '1y').map((f) => [f.role_id, f]))
    return taxonomy.data
      .map((g) => {
        const ids = g.families.flatMap((f) => f.roles.map((r) => r.id)).filter((id) => f1y.has(id))
        return {
          name: g.name,
          roles: ids.length,
          shareNow: ids.reduce((s, id) => s + (nowShare.get(id) ?? 0), 0),
          share1y: ids.reduce((s, id) => s + (f1y.get(id)?.share_pct ?? 0), 0),
          demand1y: ids.length ? ids.reduce((s, id) => s + (f1y.get(id)?.demand_index ?? 0), 0) / ids.length : 0,
        }
      })
      .filter((g) => g.roles > 0)
  }, [taxonomy.data, forecasts.data, overview.data])

  const movers = [...groups].sort((a, b) => b.share1y - b.shareNow - (a.share1y - a.shareNow)).slice(0, 3)
  const industries = sectors.data ?? []
  const named = industries.filter((r) => r.industry_raw.toLowerCase() !== 'not specified')
  const maxPostings = Math.max(1, ...industries.map((r) => r.posting_count))
  const empDelta = latest && prev ? ((latest.ict_employment - prev.ict_employment) / prev.ict_employment) * 100 : null

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-navy">ICT Sector Intelligence</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Size and growth of Rwanda's ICT workforce, how each ICT role group is expected to change, and which industries
          are hiring ICT talent.
        </p>
      </div>

      <QueryGate query={macro} className="mt-8">
        {() => (
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="text-sm font-medium text-gray-600">ICT Employment ({latest?.year})</span>
                {empDelta !== null && (
                  <span className={`flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-bold ${empDelta >= 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {empDelta >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                    {Math.abs(empDelta).toFixed(1)}% YoY
                  </span>
                )}
              </div>
              <div className="mt-4 flex items-center gap-3">
                <Users className="h-7 w-7 text-primary" />
                <span data-testid="sector-employment" className="text-4xl font-extrabold tracking-tight text-navy">{fmtInt(latest?.ict_employment)}</span>
              </div>
            </Card>
            <Card className="p-6">
              <span className="text-sm font-medium text-gray-600">ICT Share of National Employment</span>
              <div className="mt-4 flex items-center gap-3">
                <Percent className="h-7 w-7 text-primary" />
                <span data-testid="sector-share" className="text-4xl font-extrabold tracking-tight text-navy">{fmtPct(latest?.ict_employment_share_pct, 2)}</span>
              </div>
              <p className="mt-3 text-xs text-gray-500">of {fmtInt(latest?.total_employment)} employed people</p>
            </Card>
            <Card className="p-6">
              <span className="text-sm font-medium text-gray-600">Industries Hiring ICT Talent</span>
              <div className="mt-4 flex items-center gap-3">
                <Briefcase className="h-7 w-7 text-primary" />
                <span data-testid="sector-industries" className="text-4xl font-extrabold tracking-tight text-navy">{named.length}</span>
              </div>
              <p className="mt-3 text-xs text-gray-500">{named[0] ? `Top: ${named[0].industry_raw}` : 'No industry data'} · from job postings</p>
            </Card>
          </div>
        )}
      </QueryGate>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="flex flex-col p-6 lg:col-span-2">
          <h2 className="text-xl font-extrabold tracking-tight text-navy">ICT Workforce Growth</h2>
          <p className="mt-1 text-sm text-gray-500">People employed in ICT: survey-based history and 2-year forecast</p>
          <QueryGate query={forecasts} className="mt-6">
            {() => (
              <div className="mt-6" data-testid="sector-bars"><EmploymentBars data={bars} /></div>
            )}
          </QueryGate>
          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-6 text-[11px] text-gray-400">
            <span>SOURCE: NISR Labour Force Survey (2017 onward) · SkillSense forecast</span>
            <span className="font-semibold uppercase tracking-wide">Dashed = forecast</span>
          </div>
        </Card>

        <div className="flex flex-col rounded-2xl bg-navy p-6 text-white shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-emerald-300"><Rocket className="h-5 w-5" /></div>
          <h2 className="mt-5 text-xl font-extrabold tracking-tight">Fastest-Growing Role Groups</h2>
          <p className="mt-1 text-sm text-blue-200/70">Change in ICT share, now → 1-year forecast</p>
          <div className="mt-6 space-y-4" data-testid="group-movers">
            {movers.length === 0 && <p className="text-sm text-blue-200/70">No data.</p>}
            {movers.map((g) => {
              const d = g.share1y - g.shareNow
              return (
                <div key={g.name} className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-base font-bold">{g.name}</span>
                    <span className={`shrink-0 text-xs font-bold ${d >= 0 ? 'text-emerald-300' : 'text-red-300'}`}>{d >= 0 ? '+' : ''}{d.toFixed(2)} pts</span>
                  </div>
                  <p className="mt-2 text-sm text-blue-200/70">{fmtPct(g.shareNow)} → {fmtPct(g.share1y)} of ICT employment</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <Card className="mt-6 p-6">
        <h2 className="text-xl font-extrabold tracking-tight text-navy">Industries Hiring ICT Talent</h2>
        <p className="mt-1 text-sm text-gray-500">ICT job postings by hiring industry (current postings dataset)</p>
        <QueryGate query={sectors} className="mt-6">
          {() =>
            industries.length === 0 ? (
              <EmptyState title="No job postings yet" hint="Upload a CSV of postings to see industry demand." className="mt-6" />
            ) : (
              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2" data-testid="industry-list">
                {industries.slice(0, 10).map((r) => (
                  <div key={r.industry_raw} className="rounded-xl border border-gray-200 bg-white p-4">
                    <div className="flex items-center justify-between gap-3 text-sm">
                      <span className="truncate font-bold text-gray-800" title={r.industry_raw}>{r.industry_raw}</span>
                      <span className="shrink-0 font-bold text-navy">{r.posting_count}</span>
                    </div>
                    <div className="mt-3 h-1.5 rounded-full bg-gray-100"><div className="h-1.5 rounded-full bg-emerald-700" style={{ width: `${(r.posting_count / maxPostings) * 100}%` }} /></div>
                  </div>
                ))}
              </div>
            )
          }
        </QueryGate>
      </Card>

      <div className="mt-10">
        <h2 className="text-2xl font-extrabold tracking-tight text-navy">ICT Role-Group Comparison</h2>
        <p className="mt-1 text-sm text-gray-500">How each group of ICT roles is expected to change over the next year.</p>
        <Card className="mt-5 overflow-x-auto">
          <QueryGate query={forecasts} className="m-6">
            {() => (
              <table className="w-full min-w-[760px] text-left" data-testid="group-table">
                <thead>
                  <tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="px-6 py-4 font-bold">Role group</th>
                    <th className="px-6 py-4 font-bold">Roles</th>
                    <th className="px-6 py-4 font-bold">Share now</th>
                    <th className="px-6 py-4 font-bold">Share (1y)</th>
                    <th className="px-6 py-4 font-bold">Change</th>
                    <th className="px-6 py-4 text-right font-bold">Avg demand index</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {[...groups].sort((a, b) => b.share1y - a.share1y).map((g) => {
                    const d = g.share1y - g.shareNow
                    return (
                      <tr key={g.name} className="text-sm">
                        <td className="px-6 py-5 font-bold text-navy">{g.name}</td>
                        <td className="px-6 py-5 text-gray-600">{g.roles}</td>
                        <td className="px-6 py-5 text-gray-600">{fmtPct(g.shareNow)}</td>
                        <td className="px-6 py-5 text-gray-600">{fmtPct(g.share1y)}</td>
                        <td className={`px-6 py-5 font-bold ${d >= 0 ? 'text-emerald-600' : 'text-red-500'}`}>{d >= 0 ? '+' : ''}{d.toFixed(2)} pts</td>
                        <td className="px-6 py-5 text-right font-medium text-gray-700">{fmtNum(g.demand1y)}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}
          </QueryGate>
        </Card>
      </div>
    </DashboardLayout>
  )
}
