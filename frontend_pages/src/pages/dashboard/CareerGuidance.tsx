import { Link } from 'react-router-dom'
import { ArrowRight, Compass, TrendingUp } from 'lucide-react'
import DashboardLayout, { Card } from './DashboardLayout'
import { EmptyState, QueryGate } from '../../components/ui/State'
import { useCareer } from '../../services/queries'
import { fmtNum, fmtPct } from '../../lib/format'

export default function CareerGuidance() {
  const career = useCareer()

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <h1 className="text-3xl font-extrabold tracking-tight text-navy">ICT Career Guidance</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          The ICT roles forecast to grow over the next year, the best bets for learners, job seekers and training
          providers.
        </p>
      </div>

      <QueryGate query={career} className="mt-8">
        {(c) => (
          <div className="mt-8 space-y-6">
            <Card className="flex flex-col gap-4 border-primary/30 p-6 ring-1 ring-primary/10 md:flex-row md:items-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy text-white"><Compass className="h-6 w-6" /></div>
              <p data-testid="career-advice" className="flex-1 text-base font-bold leading-relaxed text-gray-900">{c.advice}</p>
              <Link to="/dashboard/employability" className="flex shrink-0 items-center gap-2 rounded-lg bg-navy px-5 py-3 text-sm font-bold text-white hover:bg-dark-navy">
                Score my skills <ArrowRight className="h-4 w-4" />
              </Link>
            </Card>

            <Card className="overflow-x-auto">
              <div className="px-6 pt-6">
                <h2 className="text-xl font-extrabold tracking-tight text-navy">Growing ICT roles (1-year outlook)</h2>
                <p className="mt-1 text-sm text-gray-500">Ranked by forecast demand index</p>
              </div>
              {c.growing_roles.length === 0 ? (
                <EmptyState title="No growing roles in the latest forecast" className="m-6" />
              ) : (
                <table className="mt-4 w-full min-w-[560px] text-left" data-testid="career-table">
                  <thead>
                    <tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                      <th className="px-6 py-4 font-bold">#</th><th className="px-6 py-4 font-bold">Role</th><th className="px-6 py-4 font-bold">Demand index</th><th className="px-6 py-4 font-bold">Share of ICT jobs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {c.growing_roles.map((r, i) => (
                      <tr key={r.role_name} className="text-sm">
                        <td className="px-6 py-4 text-gray-400">{i + 1}</td>
                        <td className="px-6 py-4 font-bold text-gray-900"><span className="mr-2 inline-block align-middle"><TrendingUp className="h-4 w-4 text-emerald-600" /></span>{r.role_name}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3"><span className="h-1.5 w-24 rounded-full bg-gray-100"><span className="block h-1.5 rounded-full bg-navy" style={{ width: `${r.demand_index}%` }} /></span><span className="font-bold text-navy">{fmtNum(r.demand_index)}</span></div>
                        </td>
                        <td className="px-6 py-4 text-gray-700">{fmtPct(r.share_pct, 2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Card>
          </div>
        )}
      </QueryGate>
    </DashboardLayout>
  )
}
