import {
  AlertTriangle,
  TrendingUp,
  Rocket,
  Database,
  ExternalLink,
} from 'lucide-react'
import DashboardLayout, { Card } from './DashboardLayout'
import { SectorGrowthChart } from './charts'

const subSectors = [
  {
    name: 'FinTech',
    growth: '+24% YoY',
    desc: 'Dominating mobile payments and micro-insurance infrastructure.',
  },
  {
    name: 'Precision AgTech',
    growth: '+18% YoY',
    desc: 'Integration of IoT sensor networks with rural systems.',
  },
]

const transferability = [
  { name: 'Agriculture', pct: 88 },
  { name: 'Finance', pct: 94 },
  { name: 'Manufacturing', pct: 72 },
  { name: 'Health', pct: 81 },
]

const macroSectors = [
  {
    name: 'Information & Communication Tech',
    growth: '+14.2%',
    labor: '48,200',
    gap: 'Critical',
    gapTone: 'bg-red-50 text-red-600',
    wage: 'RWF 1.8M',
    risk: '0.24',
  },
  {
    name: 'Agriculture & Food Systems',
    growth: '+3.1%',
    labor: '2,410k',
    gap: 'Stable',
    gapTone: 'bg-emerald-50 text-emerald-700',
    wage: 'RWF 0.3M',
    risk: '0.68',
  },
  {
    name: 'Tourism & Hospitality',
    growth: '+8.4%',
    labor: '142,000',
    gap: 'Moderate',
    gapTone: 'bg-amber-50 text-amber-700',
    wage: 'RWF 0.6M',
    risk: '0.41',
  },
]

const sectorOptions = [
  'Information & Communication Technology (ICT)',
  'Agriculture & Food Systems',
  'Tourism & Hospitality',
  'Manufacturing',
  'Financial Services',
]

export default function Sectors() {
  return (
    <DashboardLayout>
      {/* Page header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-md">
          <h1 className="text-2xl font-extrabold tracking-tight text-navy">Mapping National Demand</h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Real-time mapping of labor demand and workforce capability.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <label className="min-w-[320px] rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Active Sector
            </span>
            <select className="mt-1 w-full cursor-pointer appearance-none bg-white bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 stroke=%22%230B2373%22 stroke-width=%222%22 viewBox=%220 0 24 24%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-[length:18px] bg-[right_center] bg-no-repeat pr-8 text-sm font-bold text-navy outline-none">
              {sectorOptions.map((o) => (
                <option key={o}>{o}</option>
              ))}
            </select>
          </label>

          <span className="flex shrink-0 items-center gap-2 rounded-lg bg-emerald-100/70 px-4 py-3 text-sm font-medium text-emerald-900">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            Updated 12m ago
          </span>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6">
          <div className="flex items-start justify-between gap-3">
            <span className="text-sm font-medium text-gray-600">Total Employment</span>
            <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-bold text-emerald-700">
              +4.2% YoY
            </span>
          </div>
          <div className="mt-4 flex items-end justify-between gap-4">
            <span className="text-4xl font-extrabold tracking-tight text-navy">48,200</span>
            <div className="flex items-end gap-1">
              {[30, 45, 60, 75, 100].map((h, i) => (
                <span
                  key={h}
                  className={`w-2 rounded-sm ${i === 4 ? 'bg-navy' : 'bg-primary-light'}`}
                  style={{ height: `${h * 0.36}px` }}
                />
              ))}
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between gap-3">
            <span className="text-sm font-medium text-gray-600">Skill Shortage Index</span>
            <span className="flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-amber-700">
              <AlertTriangle className="h-3 w-3" />
              High
            </span>
          </div>
          <div className="mt-4 text-4xl font-extrabold tracking-tight text-navy">68.4</div>
          <p className="mt-4 text-sm leading-relaxed text-gray-500">
            Critical gaps in <span className="font-semibold text-gray-800">AI Ethics</span> and{' '}
            <span className="font-semibold text-gray-800">Cloud Architecture</span>.
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-start justify-between gap-3">
            <span className="text-sm font-medium text-gray-600">Avg Monthly Wage</span>
            <span className="flex items-center gap-1.5 rounded-full bg-emerald-100/70 px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-emerald-900">
              <TrendingUp className="h-3 w-3" />
              +12% vs Market
            </span>
          </div>
          <div className="mt-4 text-4xl font-extrabold tracking-tight text-navy">RWF 1.8M</div>
          <p className="mt-4 text-[11px] font-bold uppercase tracking-wider text-gray-400">
            Base Market Baseline: RWF 1.4M
          </p>
        </Card>
      </div>

      {/* Growth trend + emerging sub-sectors */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="flex flex-col p-6 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-navy">
                Sector Growth Trend - ICT
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Annual workforce deployment and 24-month forecast
              </p>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-wider text-gray-600">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm bg-navy" />
                Historical
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-sm border border-dashed border-navy" />
                Forecast
              </span>
            </div>
          </div>

          <div className="mt-6">
            <SectorGrowthChart />
          </div>

          <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-6 text-[11px] text-gray-400">
            <span>SOURCE: National Bureau of Labor Statistics</span>
            <span className="font-semibold uppercase tracking-wide">v4.2 Projection Model</span>
          </div>
        </Card>

        <div className="flex flex-col rounded-2xl bg-navy p-6 text-white shadow-sm">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-emerald-300">
            <Rocket className="h-5 w-5" />
          </div>
          <h2 className="mt-5 text-xl font-extrabold tracking-tight">Emerging Sub-sectors</h2>
          <p className="mt-1 text-sm text-blue-200/70">High-velocity niches within ICT.</p>

          <div className="mt-6 space-y-4">
            {subSectors.map((s) => (
              <div key={s.name} className="rounded-xl bg-white/5 p-4 ring-1 ring-white/10">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-base font-bold">{s.name}</span>
                  <span className="shrink-0 text-xs font-bold text-emerald-300">{s.growth}</span>
                </div>
                <p className="mt-2 text-sm leading-relaxed text-blue-200/70">{s.desc}</p>
              </div>
            ))}
          </div>

          <button className="mt-auto w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3.5 text-[11px] font-bold uppercase tracking-wider text-white transition-colors hover:bg-white/10">
            Explore All Sub-sectors
          </button>
        </div>
      </div>

      {/* Cross-sector transferability */}
      <div className="mt-6 rounded-2xl border border-gray-200 bg-gray-50 p-8">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold tracking-tight text-navy">
            Cross-Sector Skills Transferability
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            How foundational competencies in ICT translate across the national economy.
          </p>
        </div>

        <div className="mt-8 grid grid-cols-1 items-center gap-8 lg:grid-cols-2">
          <div className="flex justify-center">
            <div className="flex w-full max-w-xs flex-col items-center rounded-2xl border border-gray-200 bg-white px-8 py-10 shadow-sm">
              <Database className="h-7 w-7 text-navy" />
              <div className="mt-4 text-sm font-extrabold uppercase tracking-wider text-navy">
                Data Analytics
              </div>
              <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Anchor Competency
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {transferability.map((t) => (
              <div key={t.name} className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                  {t.name}
                </div>
                <div className="mt-3 flex items-center gap-3">
                  <div className="h-1.5 flex-1 rounded-full bg-gray-100">
                    <div
                      className="h-1.5 rounded-full bg-emerald-700"
                      style={{ width: `${t.pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-bold text-gray-900">{t.pct}%</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Macro-sector comparison */}
      <div className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-navy">
              Macro-Sector Comparison
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              Comparative analysis across core economic pillars.
            </p>
          </div>
          <a
            href="#"
            className="flex items-center gap-2 text-sm font-bold text-navy hover:underline"
          >
            View Full Benchmark
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <Card className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[840px] text-left">
            <thead>
              <tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <th className="px-6 py-4 font-bold">Sector Name</th>
                <th className="px-6 py-4 font-bold">Growth %</th>
                <th className="px-6 py-4 font-bold">Labor Force</th>
                <th className="px-6 py-4 font-bold">Skill Gap</th>
                <th className="px-6 py-4 font-bold">Avg Wage</th>
                <th className="px-6 py-4 text-right font-bold">Risk Index</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {macroSectors.map((s) => (
                <tr key={s.name} className="text-sm">
                  <td className="px-6 py-5 font-bold text-navy">{s.name}</td>
                  <td className="px-6 py-5 font-bold text-emerald-600">{s.growth}</td>
                  <td className="px-6 py-5 text-gray-600">{s.labor}</td>
                  <td className="px-6 py-5">
                    <span
                      className={`rounded px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${s.gapTone}`}
                    >
                      {s.gap}
                    </span>
                  </td>
                  <td className="px-6 py-5 text-gray-600">{s.wage}</td>
                  <td className="px-6 py-5 text-right font-medium text-gray-700">{s.risk}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </DashboardLayout>
  )
}
