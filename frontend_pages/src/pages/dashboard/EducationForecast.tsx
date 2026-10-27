import { useMemo, useState } from 'react'
import { TrendingUp, TrendingDown, Sparkles, Gauge, Minus, Briefcase } from 'lucide-react'
import DashboardLayout, { Card, PageHeader } from './DashboardLayout'
import { RoleForecastChart, type RoleChartPoint, EmploymentTrendChart, type EmploymentPoint } from './charts'
import { EmptyState, QueryGate } from '../../components/ui/State'
import {
  useForecasts,
  useHistorical,
  useTaxonomy,
  useTrends,
  useSectorForecasts,
  useSectorPositions,
  useSectorEmployment,
} from '../../services/queries'
import { fmtInt, fmtNum, fmtPct, HORIZON_LABEL } from '../../lib/format'
import { TREND_LABEL, TREND_TONE } from '../../lib/derive'
import type { Horizon, RoleForecast as RF, Trend } from '../../types/api'

const HORIZONS: Horizon[] = ['6m', '1y', '2y']
type Faculty = 'it' | 'business'

/* ── AUCA IT Programme → Market Roles ── */
const AUCA_IT_PROGRAMS: Record<string, { roles: string[]; skills: string[] }> = {
  'Software Engineering': {
    roles: ['Software Developer', 'Web Developer', 'Mobile Developer', 'Full Stack Developer', 'Backend Developer', 'Frontend Developer', 'QA Engineer'],
    skills: ['Java', 'C', '.NET', 'Python', 'React', 'Mobile Programming', 'Software Testing', 'Design Patterns', 'Project Management'],
  },
  'Information Management': {
    roles: ['Data Analyst', 'Database Administrator', 'Business Analyst', 'IT Manager', 'Systems Administrator'],
    skills: ['DBMS', 'PL/SQL', 'MIS', 'Statistics'],
  },
  'Networks & Communication': {
    roles: ['Network Engineer', 'Network Administrator', 'Systems Engineer', 'IT Support Specialist'],
    skills: ['Computer Networks', 'Linux', 'Computer Maintenance', 'Software Security'],
  },
  'Big Data Analytics (MSc)': {
    roles: ['Data Scientist', 'Data Engineer', 'ML Engineer', 'Business Intelligence Analyst'],
    skills: ['Python', 'Big Data', 'Statistics', 'Data Analysis'],
  },
}

/* ── AUCA Business Programme → Market Roles ── */
const BUSINESS_ROLE_GROUPS: Record<string, string[]> = {
  'Accounting & Auditing': ['Accountant', 'Auditor', 'Internal Auditor', 'Financial Controller', 'Bookkeeper', 'Accounting Associate'],
  'Finance & Banking': ['Finance Manager', 'Finance Officer', 'Financial Analyst', 'Investment Manager', 'Credit Controller', 'Teller', 'Financial Reporting Specialist'],
  'Management & Strategy': ['CEO', 'Managing Director', 'Business Controller', 'Territory Lead', 'Chief Executive Officer'],
  'Marketing & Sales': ['Marketing Manager', 'Sales Manager', 'Brand Manager', 'Digital Marketer', 'Business Development'],
}

const AUCA_BIZ_PROGRAMS: Record<string, { roles: string[]; skills: string[] }> = {
  'Accounting': {
    roles: ['Accountant', 'Auditor', 'Internal Auditor', 'Financial Controller', 'Bookkeeper'],
    skills: ['Financial Accounting', 'Auditing', 'Tax', 'IFRS', 'Principles of Accounting'],
  },
  'Finance': {
    roles: ['Finance Manager', 'Finance Officer', 'Financial Analyst', 'Investment Manager', 'Credit Controller'],
    skills: ['Corporate Finance', 'Investment', 'Risk Management', 'Financial Analysis', 'Banking'],
  },
  'Management': {
    roles: ['CEO', 'Managing Director', 'Business Controller', 'Territory Lead', 'Project Manager'],
    skills: ['Strategic Management', 'Operations', 'HR Management', 'Project Management', 'Leadership'],
  },
  'Marketing': {
    roles: ['Marketing Manager', 'Sales Manager', 'Brand Manager', 'Digital Marketer', 'Business Development'],
    skills: ['Digital Marketing', 'Market Research', 'Brand Management', 'Social Media', 'Analytics'],
  },
}

function TrendBadge({ trend }: { trend: Trend }) {
  const Icon = trend === 'growing' ? TrendingUp : trend === 'declining' ? TrendingDown : Minus
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${TREND_TONE[trend]}`}>
      <Icon className="h-3 w-3" />
      {TREND_LABEL[trend]}
    </span>
  )
}

/* ═══════════════ IT Faculty Tab ═══════════════ */
function ITFacultyTab() {
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
    <>
      {/* Controls */}
      <Card className="mt-6 p-6">
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
              <p className="mt-1.5 text-base font-bold leading-relaxed text-gray-900">
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
              <h2 className="text-xl font-extrabold tracking-tight text-navy">{selected?.role_name ?? 'Role'}</h2>
              <p className="mt-1 text-sm text-gray-500">Demand index (0–100), history and forecast</p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold uppercase tracking-wide text-gray-500">
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-navy" /> Verified</span>
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 border-t-2 border-dotted border-gray-400" /> Estimated</span>
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 border-t-2 border-dashed border-emerald-500" /> Forecast</span>
            </div>
          </div>
          <QueryGate query={history} className="mt-6">
            {() => (
              <div className="mt-6">
                <RoleForecastChart data={chartData} />
              </div>
            )}
          </QueryGate>
          <p className="mt-3 text-xs text-gray-400">
            Shaded band = forecast confidence interval. Years before 2017 are back-extrapolated estimates.
          </p>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-navy"><Gauge className="h-5 w-5" /></div>
            <h3 className="mt-5 text-xl font-extrabold tracking-tight text-navy">Selected Role Outlook</h3>
            <div className="mt-4 space-y-3">
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
              <div className="mt-4 space-y-3 text-sm">
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
              <table className="mt-4 w-full min-w-[820px] text-left">
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
                        <TrendBadge trend={r.trend_direction} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          }
        </QueryGate>
      </Card>

      {/* AUCA IT Programme → Market Roles */}
      <Card className="mt-8 p-6">
        <h2 className="text-xl font-extrabold tracking-tight text-navy">AUCA IT Programme &rarr; Market Roles</h2>
        <p className="mt-1 text-sm text-gray-500">How each programme maps to in-demand roles — check forecast trends above to prioritise curriculum updates</p>
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {Object.entries(AUCA_IT_PROGRAMS).map(([program, { roles, skills }]) => {
            const matchedForecasts = oneYear.filter(f => roles.some(r => f.role_name.toLowerCase().includes(r.toLowerCase().split(' ')[0])))
            const avgDemand = matchedForecasts.length > 0 ? matchedForecasts.reduce((s, f) => s + f.demand_index, 0) / matchedForecasts.length : null
            const growingMatches = matchedForecasts.filter(f => f.trend_direction === 'growing').length
            return (
              <div key={program} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900">{program}</h3>
                  {avgDemand !== null && (
                    <span className="rounded-full bg-navy/10 px-2.5 py-0.5 text-[11px] font-bold text-navy">
                      Avg demand: {avgDemand.toFixed(0)}
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Key skills taught</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {skills.map(s => (
                      <span key={s} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Target market roles</span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {roles.map(r => {
                      const match = oneYear.find(f => f.role_name.toLowerCase().includes(r.toLowerCase().split(' ')[0]))
                      return (
                        <span
                          key={r}
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                            match?.trend_direction === 'growing'
                              ? 'bg-emerald-50 text-emerald-700'
                              : match?.trend_direction === 'declining'
                              ? 'bg-red-50 text-red-600'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {r}
                        </span>
                      )
                    })}
                  </div>
                </div>
                {growingMatches > 0 && (
                  <p className="mt-2 text-[11px] text-emerald-600 font-medium">{growingMatches} of {matchedForecasts.length} matched roles are growing</p>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </>
  )
}

/* ═══════════════ Business Faculty Tab ═══════════════ */
function BusinessFacultyTab() {
  const sectorEmp = useSectorEmployment('finance-business')
  const bizFc6m = useSectorForecasts('6m', 'finance-business')
  const bizFc1y = useSectorForecasts('1y', 'finance-business')
  const bizFc2y = useSectorForecasts('2y', 'finance-business')
  const positions = useSectorPositions('finance-business')

  const [horizon, setHorizon] = useState<Horizon>('1y')
  const [bizGroup, setBizGroup] = useState('All')
  const [picked, setPicked] = useState<string | null>(null)

  const allPositions = positions.data?.positions ?? []
  const totalPostings = allPositions.reduce((s, p) => s + p.count, 0)
  const maxCount = allPositions[0]?.count ?? 1

  const groupNames = ['All', ...Object.keys(BUSINESS_ROLE_GROUPS)]

  const positionGroup = (title: string): string => {
    for (const [g, roles] of Object.entries(BUSINESS_ROLE_GROUPS)) {
      if (roles.some(r => title.toLowerCase().includes(r.toLowerCase().split(' ')[0]))) return g
    }
    return 'Other'
  }

  const rows = useMemo(() => {
    const list = allPositions.map(p => ({
      ...p,
      group: positionGroup(p.title),
      demand_index: maxCount > 0 ? (p.count / maxCount) * 100 : 0,
      share_pct: totalPostings > 0 ? (p.count / totalPostings) * 100 : 0,
    }))
    return list.filter(p => bizGroup === 'All' || p.group === bizGroup)
  }, [allPositions, bizGroup, maxCount, totalPostings])

  const selectedTitle = picked ?? 'All'
  const selectedPosition = allPositions.find(p => p.title === selectedTitle)
  const selectedShare = selectedPosition && totalPostings > 0 ? selectedPosition.count / totalPostings : 1

  const fcForHorizon = horizon === '6m' ? bizFc6m : horizon === '1y' ? bizFc1y : bizFc2y
  const fc = fcForHorizon.data?.forecasts?.[0]
  const sectorRun = bizFc1y.data?.forecast_run

  /* ── Chart data: sector employment or role-projected employment ── */
  const chartData: EmploymentPoint[] = useMemo(() => {
    const empData = (sectorEmp.data ?? [])
      .filter(p => p.sector_slug === 'finance-business' && p.year >= 2010)
      .sort((a, b) => a.year - b.year)

    const scale = selectedPosition ? selectedShare : 1

    const points: EmploymentPoint[] = empData.map(p => ({
      label: String(p.year),
      historical: Math.round(p.employment_count * scale),
    }))

    const last = points[points.length - 1]
    if (last) last.forecast = last.historical

    const fc6m = bizFc6m.data?.forecasts?.[0]
    const fc1y = bizFc1y.data?.forecasts?.[0]
    const fc2y = bizFc2y.data?.forecasts?.[0]
    if (fc6m) points.push({ label: '+6 months', forecast: Math.round(fc6m.employment_count * scale) })
    if (fc1y) points.push({ label: '+1 year', forecast: Math.round(fc1y.employment_count * scale) })
    if (fc2y) points.push({ label: '+2 years', forecast: Math.round(fc2y.employment_count * scale) })

    return points
  }, [sectorEmp.data, bizFc6m.data, bizFc1y.data, bizFc2y.data, selectedPosition, selectedShare])

  const topRole = allPositions[0]

  return (
    <>
      {/* Controls — same 3-column layout as IT tab */}
      <Card className="mt-6 p-6">
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
            <span className="text-[11px] font-bold uppercase tracking-wider text-navy">Business Role Group</span>
            <select value={bizGroup} onChange={(e) => setBizGroup(e.target.value)} aria-label="Business role group" className="mt-2 w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 outline-none focus:border-primary">
              {groupNames.map((g) => (
                <option key={g}>{g}</option>
              ))}
            </select>
          </label>
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-navy">Role (chart)</span>
            <select value={selectedTitle} onChange={(e) => setPicked(e.target.value === 'All' ? null : e.target.value)} aria-label="Role" className="mt-2 w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-800 outline-none focus:border-primary">
              <option value="All">All — Sector overview</option>
              {allPositions.map((p) => (
                <option key={p.title} value={p.title}>{p.title}</option>
              ))}
            </select>
          </label>
        </div>
      </Card>

      {/* Insight — same card as IT tab */}
      {topRole && (
        <Card className="mt-6 p-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy text-white">
              <Sparkles className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Market Insight</div>
              <p className="mt-1.5 text-base font-bold leading-relaxed text-gray-900">
                <span className="text-primary">{topRole.title}</span> leads the Finance &amp; Business hiring demand with{' '}
                {fmtInt(topRole.count)} postings ({fmtPct((topRole.count / totalPostings) * 100)} of sector job market).{' '}
                {`${allPositions.length} distinct roles tracked across ${totalPostings} total postings.`}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Chart + metrics — same 2/3 + 1/3 layout as IT tab */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-navy">
                {selectedPosition ? selectedPosition.title : 'Finance & Business Sector'}
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                {selectedPosition
                  ? `Projected employment based on ${fmtPct(selectedShare * 100)} sector share`
                  : 'Sector employment count, history and forecast'}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-[11px] font-bold uppercase tracking-wide text-gray-500">
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 bg-navy" /> Historical</span>
              <span className="flex items-center gap-1.5"><span className="h-0.5 w-4 border-t-2 border-dashed border-navy" /> Forecast</span>
            </div>
          </div>
          <QueryGate query={sectorEmp} className="mt-6">
            {() => (
              <div className="mt-6">
                <EmploymentTrendChart data={chartData} />
              </div>
            )}
          </QueryGate>
          <p className="mt-3 text-xs text-gray-400">
            {selectedPosition
              ? 'Projection assumes role maintains its current share of sector employment.'
              : 'Dashed line = forecast projection. Years before actual data collection are model estimates.'}
          </p>
        </Card>

        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-navy"><Gauge className="h-5 w-5" /></div>
            <h3 className="mt-5 text-xl font-extrabold tracking-tight text-navy">
              {selectedPosition ? 'Selected Role Outlook' : 'Sector Employment Outlook'}
            </h3>
            <div className="mt-4 space-y-3">
              {([['6m', bizFc6m], ['1y', bizFc1y], ['2y', bizFc2y]] as const).map(([h, q]) => {
                const f = q.data?.forecasts?.[0]
                if (!f) return <div key={h} className="flex items-center justify-between text-sm"><span className="font-semibold text-gray-600">{HORIZON_LABEL[h as Horizon]}</span><span className="text-gray-400">-</span></div>
                const emp = selectedPosition ? Math.round(f.employment_count * selectedShare) : f.employment_count
                const share = selectedPosition ? selectedShare * f.employment_share_pct : f.employment_share_pct
                return (
                  <div key={h} className="flex items-center justify-between text-sm">
                    <span className="font-semibold text-gray-600">{HORIZON_LABEL[h as Horizon]}</span>
                    <span className="font-bold text-navy">{fmtInt(emp)} · {fmtPct(share)}</span>
                  </div>
                )
              })}
            </div>
            {selectedPosition && (
              <div className="mt-4 border-t border-gray-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm"><span className="text-gray-500">Postings</span><span className="font-bold text-navy">{selectedPosition.count}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Demand score</span><span className="font-bold text-navy">{fmtNum((selectedPosition.count / maxCount) * 100)}</span></div>
                <div className="flex justify-between text-sm"><span className="text-gray-500">Group</span><span className="font-bold text-navy">{positionGroup(selectedPosition.title)}</span></div>
              </div>
            )}
          </Card>
          {sectorRun && (
            <Card className="p-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Sector Model</h3>
              <div className="mt-4 space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-600">Model version</span><span className="font-bold text-navy">{sectorRun.model_version}</span></div>
                {sectorRun.accuracy_r2 != null && (
                  <div className="flex justify-between"><span className="text-gray-600">R² score</span><span className="font-bold text-navy">{fmtNum(sectorRun.accuracy_r2, 4)}</span></div>
                )}
                {sectorRun.accuracy_mae != null && (
                  <div className="flex justify-between"><span className="text-gray-600">MAE</span><span className="font-bold text-navy">{fmtNum(sectorRun.accuracy_mae, 2)}</span></div>
                )}
                {fc && (
                  <div className="flex justify-between"><span className="text-gray-600">Posting count</span><span className="font-bold text-navy">{fmtInt(fc.posting_count)}</span></div>
                )}
              </div>
            </Card>
          )}
        </div>
      </div>

      {/* All business roles table — clickable rows like IT tab */}
      <Card className="mt-8 overflow-x-auto">
        <div className="flex flex-wrap items-center justify-between gap-3 px-6 pt-6">
          <h2 className="text-xl font-extrabold tracking-tight text-navy">All Business Roles: {HORIZON_LABEL[horizon]} outlook</h2>
          <span className="text-xs text-gray-400">{rows.length} roles{bizGroup !== 'All' ? ` in ${bizGroup}` : ''}</span>
        </div>
        <QueryGate query={positions} className="m-6">
          {() =>
            rows.length === 0 ? (
              <EmptyState title="No roles in this group" hint="Choose a different role group." className="m-6" />
            ) : (
              <table className="mt-4 w-full min-w-[820px] text-left">
                <thead>
                  <tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                    <th className="px-6 py-4 font-bold">Role</th>
                    <th className="px-6 py-4 font-bold">Group</th>
                    <th className="px-6 py-4 font-bold">Demand score</th>
                    <th className="px-6 py-4 font-bold">Sector share</th>
                    <th className="px-6 py-4 font-bold">Postings</th>
                    <th className="px-6 py-4 font-bold">Est. employment</th>
                    <th className="px-6 py-4 font-bold">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {rows.map((r) => {
                    const roleEmp = fc ? Math.round(fc.employment_count * r.share_pct / 100) : null
                    return (
                      <tr key={r.title} onClick={() => setPicked(r.title)} className={`cursor-pointer text-sm transition-colors hover:bg-gray-50 ${r.title === selectedTitle ? 'bg-primary-light/50' : ''}`}>
                        <td className="px-6 py-4 font-bold text-gray-900">{r.title}</td>
                        <td className="px-6 py-4 text-gray-600">{r.group}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="h-1.5 w-20 rounded-full bg-gray-100"><span className="block h-1.5 rounded-full bg-navy" style={{ width: `${r.demand_index}%` }} /></span>
                            <span className="font-bold text-navy">{fmtNum(r.demand_index)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-gray-700">{fmtPct(r.share_pct, 2)}</td>
                        <td className="px-6 py-4 text-gray-700">{fmtInt(r.count)}</td>
                        <td className="px-6 py-4 text-gray-700">{roleEmp != null ? fmtInt(roleEmp) : '-'}</td>
                        <td className="px-6 py-4">
                          {fc ? <TrendBadge trend={fc.employment_trend} /> : <span className="text-gray-400">-</span>}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )
          }
        </QueryGate>
      </Card>

      {/* AUCA Business Programme → Market Roles — same layout as IT tab */}
      <Card className="mt-8 p-6">
        <h2 className="text-xl font-extrabold tracking-tight text-navy">AUCA Business Programme &rarr; Market Roles</h2>
        <p className="mt-1 text-sm text-gray-500">How each programme maps to in-demand roles — check demand scores above to prioritise curriculum updates</p>
        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2">
          {Object.entries(AUCA_BIZ_PROGRAMS).map(([program, { roles, skills }]) => {
            const matchedPositions = allPositions.filter(p =>
              roles.some(r => p.title.toLowerCase().includes(r.toLowerCase().split(' ')[0]))
            )
            const totalMatched = matchedPositions.reduce((s, p) => s + p.count, 0)
            const avgDemand = matchedPositions.length > 0
              ? matchedPositions.reduce((s, p) => s + (maxCount > 0 ? (p.count / maxCount) * 100 : 0), 0) / matchedPositions.length
              : null
            return (
              <div key={program} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-gray-900">{program}</h3>
                  {avgDemand !== null && (
                    <span className="rounded-full bg-navy/10 px-2.5 py-0.5 text-[11px] font-bold text-navy">
                      Avg demand: {avgDemand.toFixed(0)}
                    </span>
                  )}
                </div>
                <div className="mt-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Key skills taught</span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {skills.map(s => (
                      <span key={s} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700">{s}</span>
                    ))}
                  </div>
                </div>
                <div className="mt-3">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Target market roles</span>
                  <div className="mt-1 flex flex-wrap gap-1.5">
                    {roles.map(r => {
                      const matchCount = allPositions.filter(p => p.title.toLowerCase().includes(r.toLowerCase().split(' ')[0])).reduce((s, p) => s + p.count, 0)
                      return (
                        <span
                          key={r}
                          className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                            matchCount > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {r}{matchCount > 0 ? ` (${matchCount})` : ''}
                        </span>
                      )
                    })}
                  </div>
                </div>
                {totalMatched > 0 && (
                  <p className="mt-2 text-[11px] text-emerald-600 font-medium">{totalMatched} postings match this programme</p>
                )}
              </div>
            )
          })}
        </div>
      </Card>
    </>
  )
}

/* ═══════════════ Main Page ═══════════════ */
export default function EducationForecast() {
  const [faculty, setFaculty] = useState<Faculty>('it')
  const run = useForecasts().data?.forecast_run

  return (
    <DashboardLayout>
      {/* Header */}
      <PageHeader
        icon={TrendingUp}
        title="Role Demand Forecast"
        subtitle={faculty === 'it'
          ? 'See which ICT roles are growing or declining. Use this to align AUCA IT programmes with where employer demand is heading.'
          : 'Track Finance & Business hiring trends. See which roles employers need and how AUCA Business programmes align.'}
        actions={run ? (
          <span className="flex shrink-0 items-center gap-2.5 rounded-full bg-emerald-50 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Model {run.model_version}
          </span>
        ) : undefined}
      />

      {/* Faculty tabs */}
      <div className="mt-8 flex rounded-xl border border-gray-200 bg-gray-50 p-1.5" role="tablist">
        <button
          role="tab"
          aria-selected={faculty === 'it'}
          onClick={() => setFaculty('it')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-bold transition-colors ${
            faculty === 'it' ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          IT Faculty
        </button>
        <button
          role="tab"
          aria-selected={faculty === 'business'}
          onClick={() => setFaculty('business')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-bold transition-colors ${
            faculty === 'business' ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Briefcase className="h-4 w-4" />
          Business Faculty
        </button>
      </div>

      {faculty === 'it' ? <ITFacultyTab /> : <BusinessFacultyTab />}
    </DashboardLayout>
  )
}
