import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search, ChevronRight, Sparkles } from 'lucide-react'
import DashboardLayout, { Card } from './DashboardLayout'
import { RoleForecastChart, type RoleChartPoint } from './charts'
import { EmptyState, QueryGate } from '../../components/ui/State'
import { useEmergingRoles, useForecasts, useRoleDetail, useTaxonomy } from '../../services/queries'
import { taxonomyApi } from '../../services/api'
import { fmtNum, fmtPct, HORIZON_LABEL } from '../../lib/format'
import type { RoleBrief } from '../../types/api'

export default function Taxonomy() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const [selected, setSelected] = useState<number | null>(null)

  const groups = useTaxonomy()
  const emerging = useEmergingRoles()
  const forecasts = useForecasts()
  const search = useQuery({
    queryKey: ['role-search', q],
    queryFn: () => taxonomyApi.roles(q),
    enabled: q.trim().length > 0,
  })
  const detail = useRoleDetail(selected)

  const chart: RoleChartPoint[] = useMemo(
    () =>
      (detail.data?.historical_demand ?? [])
        .filter((p) => p.year >= 2010)
        .map((p) => ({
          label: String(p.year),
          ...(p.synthetic_flag ? { estimated: p.role_demand_index } : { verified: p.role_demand_index }),
        })),
    [detail.data],
  )
  const roleForecasts = (forecasts.data?.forecasts ?? []).filter((f) => f.role_id === selected)
  const totalRoles = groups.data?.reduce((n, g) => n + g.families.reduce((m, f) => m + f.roles.length, 0), 0) ?? 0

  const RoleButton = ({ r }: { r: RoleBrief }) => (
    <button
      onClick={() => setSelected(r.id)}
      aria-pressed={selected === r.id}
      className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${selected === r.id ? 'bg-primary-light font-bold text-navy' : 'text-gray-700 hover:bg-gray-50'}`}
    >
      <span>{r.name}</span>
      <span className="flex items-center gap-2 text-xs text-gray-400">since {r.emergence_year}<ChevronRight className="h-3.5 w-3.5" /></span>
    </button>
  )

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-navy">ICT Role Taxonomy</h1>
        <p className="mt-2 text-sm text-gray-500">
          The controlled vocabulary of ICT roles used across SkillSense: role group → role family → role
          {totalRoles ? ` (${totalRoles} roles)` : ''}.
        </p>
      </div>

      <form onSubmit={(e) => e.preventDefault()} className="relative mt-6 max-w-md" role="search">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
          placeholder="Search ICT roles…"
          aria-label="Search roles"
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </form>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="max-h-[720px] overflow-y-auto p-4 lg:col-span-2" data-testid="taxonomy-tree">
          {q.trim() ? (
            <QueryGate query={search} className="py-8">
              {(roles) =>
                roles.length === 0 ? (
                  <EmptyState title={`No roles match “${q}”`} />
                ) : (
                  <div data-testid="search-results">
                    <p className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-gray-400">{roles.length} result{roles.length === 1 ? '' : 's'}</p>
                    {roles.map((r) => <RoleButton key={r.id} r={r} />)}
                  </div>
                )
              }
            </QueryGate>
          ) : (
            <QueryGate query={groups} className="py-8">
              {(gs) => (
                <div className="space-y-5">
                  {gs.map((g) => (
                    <section key={g.id}>
                      <h2 className="px-3 text-xs font-extrabold uppercase tracking-wider text-navy">{g.name}</h2>
                      {g.families.map((f) => (
                        <div key={f.id} className="mt-1">
                          <div className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{f.name}</div>
                          {f.roles.map((r) => <RoleButton key={r.id} r={r} />)}
                        </div>
                      ))}
                    </section>
                  ))}
                </div>
              )}
            </QueryGate>
          )}
        </Card>

        <Card className="p-6 lg:col-span-3" data-testid="role-detail">
          {selected === null ? (
            <EmptyState title="Select a role" hint="Choose a role on the left to see its history and forecast." className="my-16" />
          ) : (
            <QueryGate query={detail}>
              {(d) => (
                <>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{d.group_name} · {d.family_name}</div>
                  <h2 data-testid="detail-name" className="mt-1 text-2xl font-extrabold tracking-tight text-navy">{d.name}</h2>
                  <p className="mt-2 text-sm text-gray-500">First appeared in Rwanda's ICT market around <strong>{d.emergence_year}</strong>.{d.description ? ` ${d.description}` : ''}</p>

                  <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-gray-400">Demand index history</h3>
                  {chart.length > 0 ? (
                    <div className="mt-2" data-testid="detail-chart"><RoleForecastChart data={chart} height={260} /></div>
                  ) : (
                    <EmptyState title="No history for this role" hint="This role only existed before 2010, which the model doesn't use." className="mt-3" />
                  )}

                  <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-gray-400">Latest forecast</h3>
                  {roleForecasts.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-500">This role has no forecast (it isn't part of the trained model).</p>
                  ) : (
                    <table className="mt-3 w-full text-left" data-testid="detail-forecast">
                      <thead><tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-400"><th className="pb-3 font-bold">Horizon</th><th className="pb-3 font-bold">Demand index</th><th className="pb-3 font-bold">ICT share</th></tr></thead>
                      <tbody className="divide-y divide-gray-100">
                        {roleForecasts.map((f) => (
                          <tr key={f.id} className="text-sm"><td className="py-3 font-bold text-gray-900">{HORIZON_LABEL[f.horizon]}</td><td className="py-3 font-bold text-navy">{fmtNum(f.demand_index)}</td><td className="py-3 text-gray-700">{fmtPct(f.share_pct, 2)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </>
              )}
            </QueryGate>
          )}
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-navy"><Sparkles className="h-5 w-5 text-primary" /> Emerging Roles</h2>
        <QueryGate query={emerging} className="mt-4">
          {(e) =>
            e.length === 0 ? (
              <EmptyState title="No emerging roles tracked yet" hint="AI/ML, MLOps and other roles with strong global demand but little local hiring will appear here once the emerging-skills layer is built." className="mt-4" />
            ) : (
              <ul className="mt-4 flex flex-wrap gap-2" data-testid="emerging-list">{e.map((r) => <li key={r.id} className="rounded-full bg-primary-light px-4 py-1.5 text-sm font-semibold text-navy">{r.name}</li>)}</ul>
            )
          }
        </QueryGate>
      </Card>
    </DashboardLayout>
  )
}
