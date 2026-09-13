import { BadgeCheck, TrendingUp, SlidersHorizontal, ArrowUp, ArrowDown } from 'lucide-react'
import DashboardLayout, { Card } from './DashboardLayout'
import { RwandaDemandHeatmap, UrbanRuralTrendChart, demandScale } from './charts'

const topDistricts = [
  { rank: '01', name: 'Gasabo', province: 'Kigali City', score: 94 },
  { rank: '02', name: 'Nyarugenge', province: 'Kigali City', score: 91 },
  { rank: '03', name: 'Kicukiro', province: 'Kigali City', score: 87 },
  { rank: '04', name: 'Musanze', province: 'Northern', score: 72 },
  { rank: '05', name: 'Rubavu', province: 'Western', score: 68 },
]

const restDistricts = [
  { rank: '06', name: 'Huye (Southern)', score: 64 },
  { rank: '07', name: 'Rusizi (Western)', score: 61 },
  { rank: '08', name: 'Nyagatare (Eastern)', score: 58 },
  { rank: '09', name: 'Rwamagana (Eastern)', score: 57 },
  { rank: '10', name: 'Muhanga (Southern)', score: 55 },
]

const provincialGap = [
  { name: 'Kigali City', pct: 18 },
  { name: 'Northern', pct: 34 },
  { name: 'Western', pct: 42 },
  { name: 'Southern', pct: 48 },
  { name: 'Eastern', pct: 51 },
]

const hotspots = [
  {
    province: 'Northern Province',
    district: 'Musanze',
    focus: 'Agro-Tourism & Tech',
    desc: 'Rapidly scaling high-value tourism services and precision agriculture startups.',
    jobs: '12,500+',
    growth: '+14.2%',
  },
  {
    province: 'Western Province',
    district: 'Rubavu',
    focus: 'Cross-Border Logistics',
    desc: 'Strategic hub for regional trade with expanding logistics and fintech sectors.',
    jobs: '8,200+',
    growth: '+11.8%',
  },
  {
    province: 'Eastern Province',
    district: 'Nyagatare',
    focus: 'Dairy Manufacturing',
    desc: 'Industrial transformation center for large-scale dairy and food processing.',
    jobs: '9,400+',
    growth: '+18.5%',
  },
]

const ranking = [
  { rank: '#01', district: 'Gasabo', province: 'Kigali City', employment: '94.2%', yoy: '3.4%', up: true, sector: 'Financial Services', alert: 'ok' },
  { rank: '#02', district: 'Nyarugenge', province: 'Kigali City', employment: '91.8%', yoy: '2.1%', up: true, sector: 'IT & Software', alert: 'ok' },
  { rank: '#03', district: 'Kicukiro', province: 'Kigali City', employment: '87.5%', yoy: '4.0%', up: true, sector: 'Manufacturing', alert: 'risk' },
  { rank: '#04', district: 'Musanze', province: 'Northern', employment: '72.1%', yoy: '14.2%', up: true, sector: 'Hospitality', alert: 'ok' },
  { rank: '#05', district: 'Rubavu', province: 'Western', employment: '68.4%', yoy: '8.7%', up: true, sector: 'Logistics', alert: 'ok' },
  { rank: '#06', district: 'Huye', province: 'Southern', employment: '64.9%', yoy: '3.1%', up: true, sector: 'Education/R&D', alert: 'risk' },
  { rank: '#07', district: 'Rusizi', province: 'Western', employment: '61.2%', yoy: '0.4%', up: false, sector: 'Energy/Mining', alert: 'ok' },
  { rank: '#08', district: 'Nyagatare', province: 'Eastern', employment: '58.5%', yoy: '18.5%', up: true, sector: 'Agri-Processing', alert: 'ok' },
  { rank: '#09', district: 'Rwamagana', province: 'Eastern', employment: '57.2%', yoy: '5.2%', up: true, sector: 'Manufacturing', alert: 'ok' },
  { rank: '#10', district: 'Muhanga', province: 'Southern', employment: '55.8%', yoy: '4.1%', up: true, sector: 'Trade/Retail', alert: 'ok' },
  { rank: '#11', district: 'Kamonyi', province: 'Southern', employment: '52.4%', yoy: '1.2%', up: true, sector: 'Agriculture', alert: 'risk' },
  { rank: '#12', district: 'Bugesera', province: 'Eastern', employment: '52.1%', yoy: '12.8%', up: true, sector: 'Construction', alert: 'ok' },
]

const legendLevels = [
  { label: 'Very High', color: '#115E4A' },
  { label: 'Moderate', color: '#2DD4BF' },
  { label: 'Low', color: '#CCFBF1' },
]

export default function Geography() {
  return (
    <DashboardLayout>
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-navy">
          Geographic Labor Market Intelligence
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          District-level workforce demand across Rwanda's 30 districts and 5 provinces
        </p>
      </div>

      {/* Heatmap + top districts */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-extrabold tracking-tight text-navy">
              Skills Demand Heatmap — Rwanda
            </h2>
            <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold text-gray-500">
              {demandScale.map((s) => (
                <span key={s.label} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: s.color }} />
                  {s.label}
                </span>
              ))}
            </div>
          </div>

          <div className="relative mt-5 rounded-xl border border-gray-100 bg-gray-50/60 p-4">
            <div className="absolute left-8 top-8 z-10 rounded-lg border border-gray-200 bg-white px-4 py-3 shadow-sm">
              <div className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                Demand Level
              </div>
              <div className="mt-2 space-y-1.5">
                {legendLevels.map((l) => (
                  <div key={l.label} className="flex items-center gap-2 text-[11px] text-gray-600">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: l.color }} />
                    {l.label}
                  </div>
                ))}
              </div>
            </div>

            <div className="h-[420px] w-full">
              <RwandaDemandHeatmap />
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-extrabold tracking-tight text-navy">Top 10 Districts by Demand</h2>

          <div className="mt-6 space-y-5">
            {topDistricts.map((d) => (
              <div key={d.name}>
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-medium text-gray-400">{d.rank}</span>
                    <span className="text-sm font-bold text-gray-900">{d.name}</span>
                  </div>
                  <span className="rounded bg-primary-light px-2 py-0.5 text-[10px] font-bold text-navy">
                    {d.province}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-3">
                  <div className="h-1.5 flex-1 rounded-full bg-gray-100">
                    <div
                      className="h-1.5 rounded-full bg-emerald-600"
                      style={{ width: `${d.score}%` }}
                    />
                  </div>
                  <span className="w-6 text-right text-xs font-bold text-gray-700">{d.score}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 space-y-3 border-t border-gray-100 pt-5">
            {restDistricts.map((d) => (
              <div key={d.name} className="flex items-center justify-between text-xs">
                <span className="text-gray-600">
                  {d.rank} {d.name}
                </span>
                <span className="font-bold text-emerald-600">{d.score}</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Urban vs rural + provincial gap */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <h2 className="text-xl font-extrabold tracking-tight text-navy">
              Urban vs Rural Employment Trend
            </h2>
            <div className="flex items-center gap-4 text-[11px] font-bold text-gray-600">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-navy" />
                Urban
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full bg-teal-400" />
                Rural
              </span>
            </div>
          </div>

          <div className="mt-6">
            <UrbanRuralTrendChart />
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                Urban Employment Index
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-navy">82%</span>
                <span className="text-xs font-semibold text-gray-500">+24% YoY</span>
              </div>
            </div>
            <div className="rounded-xl border border-teal-100 bg-teal-50/70 p-4">
              <div className="text-[10px] font-bold uppercase tracking-wider text-teal-700">
                Rural Employment Index
              </div>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-teal-700">61%</span>
                <span className="text-xs font-semibold text-teal-600">+9% YoY</span>
              </div>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-xl font-extrabold tracking-tight text-navy">Provincial Skills Gap (%)</h2>

          <div className="mt-8 space-y-5">
            {provincialGap.map((p) => (
              <div key={p.name} className="flex items-center gap-4">
                <span className="w-24 shrink-0 text-sm text-gray-600">{p.name}</span>
                <div className="h-2.5 flex-1 rounded-full bg-gray-100">
                  <div className="h-2.5 rounded-full bg-navy" style={{ width: `${p.pct}%` }} />
                </div>
                <span className="w-10 shrink-0 text-right text-sm font-bold text-gray-900">
                  {p.pct}%
                </span>
              </div>
            ))}
          </div>

          <p className="mt-8 text-xs italic text-gray-400">
            Gap indicates % of vacancies unfilled for &gt;90 days due to skill mismatch.
          </p>
        </Card>
      </div>

      {/* Emerging opportunity hotspots */}
      <div className="mt-10">
        <div className="flex items-center gap-2.5">
          <BadgeCheck className="h-5 w-5 text-emerald-600" />
          <h2 className="text-xl font-extrabold tracking-tight text-navy">
            Emerging Opportunity Hotspots
          </h2>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-3">
          {hotspots.map((h) => (
            <Card key={h.district} className="p-6">
              <div className="flex items-start justify-between gap-3">
                <span className="rounded bg-primary-light px-2.5 py-1 text-[10px] font-bold text-navy">
                  {h.province}
                </span>
                <TrendingUp className="h-4 w-4 text-emerald-600" />
              </div>

              <h3 className="mt-5 text-xl font-extrabold tracking-tight text-navy">{h.district}</h3>
              <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
                {h.focus}
              </div>
              <p className="mt-3 text-sm leading-relaxed text-gray-500">{h.desc}</p>

              <div className="mt-6 flex items-end gap-10 border-t border-gray-100 pt-4">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Projected Jobs
                  </div>
                  <div className="mt-1 text-sm font-bold text-gray-900">{h.jobs}</div>
                </div>
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Growth
                  </div>
                  <div className="mt-1 text-sm font-bold text-emerald-600">{h.growth}</div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* Full district ranking */}
      <Card className="mt-10 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-extrabold tracking-tight text-navy">Full District Ranking Table</h2>
          <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
            <SlidersHorizontal className="h-4 w-4" />
            Filter Districts
          </button>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[840px] text-left">
            <thead>
              <tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <th className="pb-4 pr-4 font-bold">Rank</th>
                <th className="pb-4 pr-4 font-bold">District</th>
                <th className="pb-4 pr-4 font-bold">Province</th>
                <th className="pb-4 pr-4 font-bold">Employment %</th>
                <th className="pb-4 pr-4 font-bold">YoY Change</th>
                <th className="pb-4 pr-4 font-bold">Dominant Sector</th>
                <th className="pb-4 font-bold">Alert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {ranking.map((r) => (
                <tr key={r.rank} className="text-sm">
                  <td className="py-4 pr-4 text-gray-400">{r.rank}</td>
                  <td className="py-4 pr-4 font-bold text-gray-900">{r.district}</td>
                  <td className="py-4 pr-4 text-gray-600">{r.province}</td>
                  <td className="py-4 pr-4 font-bold text-navy">{r.employment}</td>
                  <td className="py-4 pr-4">
                    <span
                      className={`flex items-center gap-1 font-bold ${
                        r.up ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      {r.up ? <ArrowUp className="h-3.5 w-3.5" /> : <ArrowDown className="h-3.5 w-3.5" />}
                      {r.yoy}
                    </span>
                  </td>
                  <td className="py-4 pr-4 text-gray-600">{r.sector}</td>
                  <td className="py-4">
                    <span
                      className={`block h-2.5 w-2.5 rounded-full ${
                        r.alert === 'risk' ? 'bg-red-500' : 'bg-emerald-500'
                      }`}
                      title={r.alert === 'risk' ? 'Attention required' : 'Healthy'}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  )
}
