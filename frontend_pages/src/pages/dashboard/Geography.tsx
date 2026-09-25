import { MapPin, Info } from 'lucide-react'
import DashboardLayout, { Card } from './DashboardLayout'
import { EmptyState, QueryGate } from '../../components/ui/State'
import { useGeographicSummary } from '../../services/queries'
import { fmtInt, fmtPct } from '../../lib/format'

export default function Geography() {
  const geo = useGeographicSummary()

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-navy">Geographic ICT Demand</h1>
        <p className="mt-2 text-sm text-gray-500">Where in Rwanda employers are hiring for ICT roles, from current job postings.</p>
      </div>

      <QueryGate query={geo} className="mt-8">
        {(g) => {
          const maxProvince = Math.max(1, ...g.by_province.map((p) => p.postings))
          const coverage = g.total_ict_postings ? (g.located_postings / g.total_ict_postings) * 100 : 0
          return (
            <div className="mt-8 space-y-6">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
                <Card className="p-6">
                  <span className="text-sm font-medium text-gray-600">ICT postings analysed</span>
                  <div data-testid="geo-total" className="mt-3 text-4xl font-extrabold tracking-tight text-navy">{fmtInt(g.total_ict_postings)}</div>
                </Card>
                <Card className="p-6">
                  <span className="text-sm font-medium text-gray-600">With a location in Rwanda</span>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span data-testid="geo-located" className="text-4xl font-extrabold tracking-tight text-navy">{fmtInt(g.located_postings)}</span>
                    <span data-testid="geo-coverage" className="text-sm font-semibold text-gray-500">{fmtPct(coverage, 0)}</span>
                  </div>
                </Card>
                <Card className="p-6">
                  <span className="text-sm font-medium text-gray-600">Districts identified</span>
                  <div data-testid="geo-districts" className="mt-3 text-4xl font-extrabold tracking-tight text-navy">
                    {g.by_district.filter((d) => d.district !== 'District not specified').length}
                  </div>
                </Card>
              </div>

              <div className="flex items-start gap-3 rounded-xl border border-blue-100 bg-blue-50/60 px-5 py-4 text-sm text-blue-900">
                <Info className="mt-0.5 h-5 w-5 shrink-0 text-blue-600" />
                <p data-testid="geo-note">
                  {fmtInt(g.unlocated_postings)} of {fmtInt(g.total_ict_postings)} postings don't name a place ("Rwanda" or remote), so they can't be mapped.
                  Postings that say only "Kigali" are shown under Kigali City without a district.
                </p>
              </div>

              {g.located_postings === 0 ? (
                <EmptyState title="No postings with a location yet" hint="Upload job postings that include a location to see regional demand." />
              ) : (
                <>
                  <Card className="p-6">
                    <h2 className="text-xl font-extrabold tracking-tight text-navy">Demand by province</h2>
                    <div className="mt-6 space-y-5" data-testid="province-bars">
                      {g.by_province.map((p) => (
                        <div key={p.province} className="flex items-center gap-4" data-province={p.province}>
                          <span className="w-28 shrink-0 text-sm font-medium text-gray-700">{p.province}</span>
                          <div className="h-2.5 flex-1 rounded-full bg-gray-100"><div className="h-2.5 rounded-full bg-navy" style={{ width: `${(p.postings / maxProvince) * 100}%` }} /></div>
                          <span className="w-24 shrink-0 text-right text-sm font-bold text-gray-900">{p.postings} · {fmtPct(p.share_pct, 0)}</span>
                        </div>
                      ))}
                    </div>
                  </Card>

                  <Card className="overflow-x-auto p-6">
                    <h2 className="text-xl font-extrabold tracking-tight text-navy">Districts</h2>
                    <table className="mt-5 w-full min-w-[640px] text-left" data-testid="district-table">
                      <thead>
                        <tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                          <th className="pb-4 font-bold">District</th><th className="pb-4 font-bold">Province</th><th className="pb-4 font-bold">ICT postings</th><th className="pb-4 font-bold">Most-requested roles</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {g.by_district.map((d) => (
                          <tr key={`${d.province}-${d.district}`} className="text-sm">
                            <td className="py-4 font-bold text-gray-900"><span className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" />{d.district}</span></td>
                            <td className="py-4 text-gray-600">{d.province}</td>
                            <td className="py-4 font-bold text-navy">{d.postings}</td>
                            <td className="py-4 text-gray-600">{d.roles.map((r) => `${r.name} (${r.count})`).join(', ')}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Card>
                </>
              )}
            </div>
          )
        }}
      </QueryGate>
    </DashboardLayout>
  )
}
