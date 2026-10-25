import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ArrowDown, ArrowRight, ArrowUp, Briefcase, GraduationCap, Minus, Target, TrendingUp, UserCheck, Users } from 'lucide-react'
import DashboardLayout, { Card } from './DashboardLayout'
import { QueryGate, EmptyState } from '../../components/ui/State'
import { Kpi, PageHeader, ReadinessBar, SectionTitle, DEPT_SHORT, buttonGhost, buttonPrimary } from './advisorUi'
import { useAdvisorDashboard } from '../../services/queries'
import { DEPT_LABEL } from '../../data/auca-skills'
import { fmtDate, fmtInt, fmtPct } from '../../lib/format'
import type { AdvisorDashboardData, DeptCode, DemandTrend } from '../../types/advisory'

const TREND_ICON: Record<DemandTrend, { Icon: typeof ArrowUp; cls: string; label: string }> = {
  rising: { Icon: ArrowUp, cls: 'text-emerald-600', label: 'Rising' },
  stable: { Icon: Minus, cls: 'text-gray-400', label: 'Stable' },
  falling: { Icon: ArrowDown, cls: 'text-red-500', label: 'Falling' },
  declining: { Icon: ArrowDown, cls: 'text-red-500', label: 'Declining' },
}

export function TrendMark({ trend }: { trend: DemandTrend }) {
  const { Icon, cls, label } = TREND_ICON[trend]
  return (
    <span className={`inline-flex items-center gap-1 text-xs font-semibold ${cls}`}>
      <Icon className="h-3.5 w-3.5" aria-hidden />
      {label}
    </span>
  )
}

/** Skills as tiles, shaded by how many postings ask for them. */
export function SkillHeatmap({ skills }: { skills: { skill: string; count: number }[] }) {
  const max = Math.max(1, ...skills.map((s) => s.count))
  return (
    <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
      {skills.map((s) => {
        const strength = s.count / max
        return (
          <li
            key={s.skill}
            className="rounded-lg border border-primary/10 px-3 py-2.5"
            style={{ backgroundColor: `rgba(29, 78, 216, ${0.06 + strength * 0.5})` }}
            title={`${s.skill}: ${s.count} postings`}
          >
            <div className={`truncate text-sm font-bold ${strength > 0.55 ? 'text-white' : 'text-navy'}`}>{s.skill}</div>
            <div className={`text-xs font-medium ${strength > 0.55 ? 'text-white/80' : 'text-gray-500'}`}>{fmtInt(s.count)} postings</div>
          </li>
        )
      })}
    </ul>
  )
}

function Body({ d }: { d: AdvisorDashboardData }) {
  const noStudents = d.active_students === 0 && d.recent_placements.length === 0
  const [showAll, setShowAll] = useState(false)
  const FEW = 8
  const attention = showAll ? d.students_needing_attention : d.students_needing_attention.slice(0, FEW)

  return (
    <>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-4">
        <Kpi
          label="Active trainees"
          icon={Users}
          value={fmtInt(d.active_students)}
          hint={
            <span className="flex flex-wrap gap-x-3 gap-y-1">
              {(Object.keys(DEPT_SHORT) as DeptCode[]).map((c) => (
                <span key={c} title={DEPT_LABEL[c]}>
                  {DEPT_SHORT[c]} <strong className="text-gray-700">{d.students_by_department[c] ?? 0}</strong>
                </span>
              ))}
            </span>
          }
        />
        <Kpi
          label="Average readiness"
          icon={Target}
          value={d.average_readiness == null ? '–' : fmtPct(d.average_readiness, 0)}
          hint={d.assessed_students ? `Across ${d.assessed_students} assessed student${d.assessed_students === 1 ? '' : 's'}` : 'No assessments yet'}
        />
        <Kpi
          label="Placement rate"
          icon={GraduationCap}
          value={fmtPct(d.placement_rate, 0)}
          hint="Placed graduates out of all graduates"
        />
        <Kpi label="Open positions" icon={Briefcase} value={fmtInt(d.open_positions)} hint="ICT and Business postings not yet closed" />
      </div>

      {noStudents && (
        <div className="mt-6 rounded-2xl border border-dashed border-primary/30 bg-primary-light/40 p-6">
          <h2 className="text-base font-bold text-navy">Start by adding a student</h2>
          <p className="mt-1 text-sm text-gray-600">
            Create a student profile on the Skill Assessment page. The numbers on this page fill in as you assess students and record placements.
          </p>
          <Link to="/dashboard/advisor/assessment" className={`${buttonPrimary} mt-4`}>
            Add a student <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      <Card className="mt-6 p-6">
        <SectionTitle hint="Never assessed, readiness below 50%, or a saved pathway with no progress for 30 days. Start your meetings here.">Students needing attention</SectionTitle>
        {d.students_needing_attention.length === 0 ? (
          <EmptyState title="Nobody needs attention right now" hint="Every active student has been assessed at 50% readiness or above." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-xs uppercase tracking-wide text-gray-500">
                  <th className="py-2 pr-4 font-bold">Student</th>
                  <th className="py-2 pr-4 font-bold">Department</th>
                  <th className="py-2 pr-4 font-bold">Readiness</th>
                  <th className="py-2 pr-4 font-bold">Last assessed</th>
                  <th className="py-2" />
                </tr>
              </thead>
              <tbody>
                {attention.map((s) => (
                  <tr key={s.id} className="border-b border-gray-100 last:border-0">
                    <td className="py-3 pr-4 font-semibold text-gray-900">
                      {s.name}
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {s.reasons.map((r) => (
                          <span
                            key={r}
                            className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                              r.startsWith('Readiness') ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {r}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="py-3 pr-4 text-gray-600">{DEPT_LABEL[s.department]}</td>
                    <td className="w-48 py-3 pr-4">
                      {s.readiness == null ? (
                        <span className="text-xs font-semibold text-amber-700">Not assessed</span>
                      ) : (
                        <div className="flex items-center gap-3">
                          <ReadinessBar score={s.readiness} />
                          <span className="w-10 text-right text-xs font-bold text-gray-700">{fmtPct(s.readiness, 0)}</span>
                        </div>
                      )}
                    </td>
                    <td className="py-3 pr-4 text-gray-500">{fmtDate(s.last_assessed)}</td>
                    <td className="py-3 text-right">
                      <Link to={`/dashboard/advisor/assessment?student=${s.id}`} className="text-sm font-semibold text-primary hover:underline">
                        Assess
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {d.students_needing_attention.length > FEW && (
          <button type="button" onClick={() => setShowAll(!showAll)} className="mt-4 text-sm font-semibold text-primary hover:underline">
            {showAll ? 'Show fewer' : `Show all ${d.attention_total} students`}
          </button>
        )}
      </Card>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <SectionTitle hint="Most posted in the last 90 days, compared with the 90 days before.">Hot roles this month</SectionTitle>
          {d.hot_roles.length === 0 ? (
            <EmptyState title="No job postings yet" hint="Upload postings on the Data Upload page (admin) to see demand here." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {d.hot_roles.map((r) => (
                <li key={r.role} className="flex items-center justify-between gap-3 py-3">
                  <span className="min-w-0 truncate text-sm font-semibold text-gray-900">{r.role}</span>
                  <span className="flex shrink-0 items-center gap-4">
                    <span className="text-sm text-gray-500">{fmtInt(r.postings)} postings</span>
                    <TrendMark trend={r.trend} />
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-6">
          <SectionTitle hint="The ten most recent.">Recent placements</SectionTitle>
          {d.recent_placements.length === 0 ? (
            <EmptyState title="No placements recorded yet" hint="Record one on the Placement Tracker page." />
          ) : (
            <ul className="divide-y divide-gray-100">
              {d.recent_placements.map((p, i) => (
                <li key={i} className="py-3">
                  <div className="text-sm font-semibold text-gray-900">{p.student}</div>
                  <div className="text-sm text-gray-600">
                    {p.role} at {p.company}
                  </div>
                  <div className="text-xs text-gray-400">{fmtDate(p.date)}</div>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <SectionTitle hint="How many recent postings mention each skill. Steer conversations toward the darker tiles.">Skill demand heatmap</SectionTitle>
        {d.top_demanded_skills.length === 0 ? (
          <EmptyState title="No skill data yet" hint="Skills are read from posting titles and descriptions." />
        ) : (
          <SkillHeatmap skills={d.top_demanded_skills} />
        )}
      </Card>
    </>
  )
}

export default function AdvisorDashboard() {
  const query = useAdvisorDashboard()
  return (
    <DashboardLayout>
      <PageHeader
        icon={UserCheck}
        title="Career Advisory Dashboard"
        subtitle="Where your students stand today and what the job market is asking for."
        actions={
          <>
            <Link to="/dashboard/advisor/jobs" className={buttonGhost}>
              <TrendingUp className="h-4 w-4" /> Job market
            </Link>
            <Link to="/dashboard/advisor/assessment" className={buttonPrimary}>
              <Target className="h-4 w-4" /> Assess a student
            </Link>
          </>
        }
      />
      <QueryGate query={query}>{(d) => <Body d={d} />}</QueryGate>
    </DashboardLayout>
  )
}
