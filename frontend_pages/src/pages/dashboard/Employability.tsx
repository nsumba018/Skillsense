import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { Calculator, Check, Lightbulb, Loader2, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react'
import DashboardLayout, { Card } from './DashboardLayout'
import { ProfileRadar } from './charts'
import { QueryGate } from '../../components/ui/State'
import { useEmployabilityOverview, useForecasts } from '../../services/queries'
import { analyticsApi } from '../../services/api'
import { ApiError } from '../../services/http'
import { fmtNum } from '../../lib/format'
import { TREND_LABEL, TREND_TONE } from '../../lib/derive'
import type { EmployabilityRole } from '../../types/api'

function RoleTable({ title, rows, testid }: { title: string; rows: EmployabilityRole[]; testid: string }) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-extrabold tracking-tight text-navy">{title}</h3>
      {rows.length === 0 ? (
        <p className="mt-4 text-sm text-gray-500">None.</p>
      ) : (
        <table className="mt-4 w-full text-left" data-testid={testid}>
          <thead>
            <tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-400">
              <th className="pb-3 font-bold">Role</th>
              <th className="pb-3 font-bold">Demand index</th>
              <th className="pb-3 font-bold">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {rows.map((r) => (
              <tr key={r.role_id} className="text-sm">
                <td className="py-3 pr-3 font-bold text-gray-900">{r.role_name}</td>
                <td className="py-3 pr-3 font-bold text-navy">{fmtNum(r.demand_index)}</td>
                <td className="py-3">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${TREND_TONE[r.trend]}`}>
                    {r.trend === 'growing' ? <TrendingUp className="h-3 w-3" /> : r.trend === 'declining' ? <TrendingDown className="h-3 w-3" /> : null}
                    {TREND_LABEL[r.trend]}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  )
}

export default function Employability() {
  const overview = useEmployabilityOverview()
  const forecasts = useForecasts('1y')
  const [selected, setSelected] = useState<Set<number>>(new Set())

  const score = useMutation({ mutationFn: (ids: number[]) => analyticsApi.score(ids) })

  // Only roles that have a forecast can be scored meaningfully.
  const roles = useMemo(() => {
    const forecastIds = new Set(forecasts.data?.forecasts.map((f) => f.role_id))
    return (overview.data?.available_roles ?? []).filter((r) => forecastIds.has(r.id))
  }, [overview.data, forecasts.data])

  const radarData = useMemo(() => {
    const top = [...(forecasts.data?.forecasts ?? [])].sort((a, b) => b.demand_index - a.demand_index).slice(0, 6)
    return top.map((f) => ({ role: f.role_name.split(' / ')[0], market: f.demand_index, profile: selected.has(f.role_id) ? 100 : 0 }))
  }, [forecasts.data, selected])

  const toggle = (id: number) =>
    setSelected((s) => {
      const n = new Set(s)
      if (n.has(id)) n.delete(id)
      else n.add(id)
      return n
    })

  const result = score.data

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-navy">ICT Employability Outlook</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Select the ICT roles your skills cover. SkillSense scores your profile against forecast market demand and
          shows the highest-demand roles you could move into next.
        </p>
      </div>

      <Card className="mt-8 p-6">
        <h2 className="text-lg font-extrabold tracking-tight text-navy">1. Your skill profile</h2>
        <QueryGate query={overview} className="mt-4">
          {() => (
            <>
              <div className="mt-4 flex flex-wrap gap-2.5" data-testid="role-picker">
                {roles.map((r) => {
                  const on = selected.has(r.id)
                  return (
                    <button
                      key={r.id}
                      onClick={() => toggle(r.id)}
                      aria-pressed={on}
                      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${on ? 'border-navy bg-navy text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}
                    >
                      {on && <Check className="h-3.5 w-3.5" />}
                      {r.name}
                    </button>
                  )
                })}
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => score.mutate([...selected])}
                  disabled={selected.size === 0 || score.isPending}
                  className="flex items-center gap-2 rounded-lg bg-navy px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-dark-navy disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {score.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
                  Calculate employability
                </button>
                <span className="text-sm text-gray-500">{selected.size} role{selected.size === 1 ? '' : 's'} selected</span>
                {overview.data && <span className="text-xs text-gray-400">Method: {overview.data.scoring_method}</span>}
              </div>
              {score.isError && (
                <p role="alert" className="mt-4 text-sm font-medium text-red-600">
                  {score.error instanceof ApiError ? score.error.message : 'Could not calculate the score.'}
                </p>
              )}
            </>
          )}
        </QueryGate>
      </Card>

      {result && (
        <div className="mt-6 space-y-6" data-testid="score-result">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="relative overflow-hidden p-6">
              <ShieldCheck className="absolute right-6 top-6 h-14 w-14 text-gray-100" strokeWidth={1.5} />
              <div className="relative">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Employability score</div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span data-testid="score-value" className="text-5xl font-extrabold tracking-tight text-navy">{result.overall_score}%</span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-gray-500">
                  Share of forecast 1-year ICT demand covered by the roles you selected.
                </p>
              </div>
            </Card>
            <Card className="flex flex-col border-primary/30 p-6 ring-1 ring-primary/10 lg:col-span-2">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-navy">
                <Lightbulb className="h-4 w-4" />
                Recommendations
              </div>
              {result.recommendations.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">No further high-demand roles to recommend.</p>
              ) : (
                <ul className="mt-4 space-y-3" data-testid="recommendations">
                  {result.recommendations.map((r) => (
                    <li key={r} className="flex items-start gap-2 text-base font-semibold text-gray-900">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                      {r}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
            <RoleTable title="Roles you cover" rows={result.matched_roles} testid="matched-table" />
            <RoleTable title="Skill gaps: high-demand roles to add" rows={result.skill_gaps} testid="gaps-table" />
          </div>
        </div>
      )}

      <Card className="mt-6 p-6">
        <h2 className="text-xl font-extrabold tracking-tight text-navy">Your profile vs market demand</h2>
        <p className="mt-1 text-sm text-gray-500">Top 6 roles by 1-year forecast demand index · your selected roles show at 100</p>
        <QueryGate query={forecasts} className="mt-4">
          {() => (
            <div className="mt-4" data-testid="radar">
              <ProfileRadar data={radarData} />
            </div>
          )}
        </QueryGate>
      </Card>
    </DashboardLayout>
  )
}
