import {
  Sparkles,
  AlertTriangle,
  RefreshCw,
  Calendar,
  Gauge,
  TrendingUp,
} from 'lucide-react'
import DashboardLayout, { Card } from './DashboardLayout'
import { SkillDemandIndexChart } from './charts'

const filters = [
  { label: 'Industrial Sector', options: ['Sector (All)', 'ICT', 'Agriculture', 'Manufacturing', 'Tourism'] },
  { label: 'Geographic Region', options: ['Region (National)', 'Kigali City', 'Northern Province', 'Southern Province', 'Eastern Province', 'Western Province'] },
]

const modelMetrics = [
  { label: 'Model Confidence Score', value: '94.2%' },
  { label: 'Data Points Analyzed', value: '2.4M+' },
  { label: 'Model Bias Variance', value: '+/- 1.8%' },
]

const legend = [
  { name: 'Tech & Digital', color: '#0B2373' },
  { name: 'Green Energy', color: '#10b981' },
  { name: 'Manufacturing', color: '#F59E0B' },
]

const risingSkills = [
  { skill: 'LLM Prompt Eng.', sub: 'Generative AI', growth: '+240%', sector: 'Technology' },
  { skill: 'Grid Architect', sub: 'Sustainability', growth: '+115%', sector: 'Energy' },
  { skill: 'Bio-Informatics', sub: 'Genomic Data', growth: '+88%', sector: 'Healthcare' },
]

const decliningSkills = [
  {
    skill: 'Data Entry Op.',
    sub: 'Administrative',
    risk: 'Critical',
    riskTone: 'bg-red-50 text-red-600',
    dotTone: 'bg-red-500',
    replacement: 'AI Ops Specialist',
  },
  {
    skill: 'Basic Front-end',
    sub: 'Manual Coding',
    risk: 'Moderate',
    riskTone: 'bg-amber-50 text-amber-700',
    dotTone: 'bg-amber-400',
    replacement: 'AI Workflow Eng.',
  },
  {
    skill: 'Manual QA Test',
    sub: 'Legacy Methods',
    risk: 'High Risk',
    riskTone: 'bg-red-50 text-red-600',
    dotTone: 'bg-red-400',
    replacement: 'Automation Arch.',
  },
]

export default function SkillsForecast() {
  return (
    <DashboardLayout>
      {/* Page header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-navy">
            Predictive Skills Forecasting
          </h1>
          <p className="mt-3 text-base leading-relaxed text-gray-600">
            Leverage high-fidelity Bayesian modeling to anticipate shifting labor requirements across
            national industrial sectors.
          </p>
        </div>

        <span className="flex shrink-0 items-center gap-2.5 rounded-full bg-emerald-50 px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-emerald-800">
          <span className="h-2 w-2 rounded-full bg-emerald-500" />
          Model Alpha 4.2 Active
        </span>
      </div>

      {/* Filter bar */}
      <Card className="mt-8 p-6">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
          {filters.map((f) => (
            <label key={f.label} className="block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-navy">{f.label}</span>
              <select className="mt-2 w-full cursor-pointer appearance-none border-b border-gray-200 bg-white bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 stroke=%22%230B2373%22 stroke-width=%222%22 viewBox=%220 0 24 24%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-[length:16px] bg-[right_center] bg-no-repeat py-2 pr-8 text-sm font-medium text-gray-800 outline-none focus:border-primary">
                {f.options.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
          ))}

          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-navy">Time Horizon</span>
            <div className="mt-2 flex items-center gap-2 border-b border-gray-200 py-2 focus-within:border-primary">
              <input
                type="text"
                defaultValue="12-36 Months"
                className="w-full bg-transparent text-sm font-medium text-gray-800 outline-none"
              />
              <Calendar className="h-4 w-4 shrink-0 text-navy" />
            </div>
          </label>
        </div>

        <div className="mt-8 flex justify-end">
          <button className="flex items-center gap-2 rounded-lg bg-navy px-5 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-dark-navy">
            <RefreshCw className="h-4 w-4" />
            Recalculate Forecast
          </button>
        </div>
      </Card>

      {/* AI advisory */}
      <Card className="mt-6 p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-center">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy text-white">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
              Strategic AI Advisory
            </div>
            <p className="mt-1.5 text-base font-bold leading-relaxed text-gray-900">
              AI Insight: <span className="text-primary">15% increase</span> in Cybersecurity demand in
              the Northern Province predicted for Q3 2025.
            </p>
          </div>
          <button className="shrink-0 rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-bold text-navy shadow-sm transition-colors hover:bg-gray-50">
            View Regional Report
          </button>
        </div>
      </Card>

      {/* Chart + side panels */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-navy">
                Aggregate Skill Demand Index
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Forecasted demand vs supply equilibrium (Normalized)
              </p>
            </div>
            <div className="flex items-center gap-4 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-600">
              {legend.map((l) => (
                <span key={l.name} className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: l.color }} />
                  {l.name}
                </span>
              ))}
            </div>
          </div>

          <div className="mt-6">
            <SkillDemandIndexChart />
          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] font-bold uppercase tracking-wide text-gray-400">
            <span>Q1 2024 (Actual)</span>
            <span className="rounded-full bg-primary-light px-3 py-1 text-navy">Q1 2025 (Predicted)</span>
            <span>Q4 2026</span>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-6 border-t border-gray-100 pt-6 sm:grid-cols-3">
            {modelMetrics.map((m) => (
              <div key={m.label}>
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  {m.label}
                </div>
                <div className="mt-2 text-3xl font-extrabold tracking-tight text-navy">{m.value}</div>
              </div>
            ))}
          </div>
        </Card>

        <div className="space-y-6">
          {/* Skill Velocity Index */}
          <Card className="p-6">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-navy">
              <Gauge className="h-5 w-5" />
            </div>
            <h3 className="mt-5 text-xl font-extrabold tracking-tight text-navy">Skill Velocity Index</h3>
            <p className="mt-3 text-sm leading-relaxed text-gray-600">
              The average lifespan of technical skills in the digital sector has decreased by{' '}
              <span className="font-bold text-primary">14 months</span> since 2022.
            </p>

            <div className="mt-6">
              <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider">
                <span className="text-gray-400">Renewal Rate</span>
                <span className="text-primary">Critical High</span>
              </div>
              <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                <div className="h-2 w-[88%] rounded-full bg-navy" />
              </div>
            </div>
          </Card>

          {/* Urgent pivot alert */}
          <div className="rounded-2xl bg-[#3B1E0B] p-6 text-white shadow-sm">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-400">
              <AlertTriangle className="h-4 w-4" />
              Strategic Alert
            </div>
            <h3 className="mt-4 text-xl font-extrabold tracking-tight">Urgent Pivot Alert</h3>
            <p className="mt-3 text-sm leading-relaxed text-amber-100/70">
              Demand for legacy manufacturing operators is set to decline sharply as automated
              production lines expand across the Eastern Province.
            </p>
            <button className="mt-6 w-full rounded-lg bg-amber-400 px-4 py-3 text-sm font-bold text-[#3B1E0B] transition-colors hover:bg-amber-300">
              Review Reskilling Path
            </button>
          </div>
        </div>
      </div>

      {/* Rising / declining skills */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div>
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="text-2xl font-extrabold tracking-tight text-navy">Top Rising Skills</h2>
            <span className="rounded-full bg-emerald-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              High Growth Opportunity
            </span>
          </div>

          <Card className="mt-5 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-4 font-bold">Skill Identity</th>
                  <th className="px-6 py-4 font-bold">Growth %</th>
                  <th className="px-6 py-4 font-bold">Sector</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {risingSkills.map((s) => (
                  <tr key={s.skill}>
                    <td className="px-6 py-5">
                      <div className="text-sm font-bold text-gray-900">{s.skill}</div>
                      <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                        {s.sub}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="flex items-center gap-1.5 text-sm font-bold text-emerald-600">
                        <TrendingUp className="h-4 w-4" />
                        {s.growth}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="rounded-md bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-600">
                        {s.sector}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>

        <div>
          <div className="flex flex-wrap items-center gap-4">
            <h2 className="text-2xl font-extrabold tracking-tight text-navy">Declining Skills</h2>
            <span className="rounded-full bg-red-50 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-red-600">
              Obsolescence Risk
            </span>
          </div>

          <Card className="mt-5 overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-4 font-bold">Skill Identity</th>
                  <th className="px-6 py-4 font-bold">Risk Status</th>
                  <th className="px-6 py-4 font-bold">Replacement Path</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {decliningSkills.map((s) => (
                  <tr key={s.skill}>
                    <td className="px-6 py-5">
                      <div className="text-sm font-bold text-gray-900">{s.skill}</div>
                      <div className="mt-0.5 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                        {s.sub}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide ${s.riskTone}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${s.dotTone}`} />
                        {s.risk}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <span className="rounded-md bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700">
                        {s.replacement}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  )
}
