import { useState } from 'react'
import {
  Share2,
  RefreshCw,
  SlidersHorizontal,
  ShieldCheck,
  Clock,
  Lightbulb,
  TrendingUp,
  ArrowRight,
  Code2,
  Database,
  Boxes,
  Cpu,
} from 'lucide-react'
import DashboardLayout, { Card } from './DashboardLayout'
import { SkillsAlignmentRadar } from './charts'

const filters = [
  { label: 'Institution', options: ['National Institute of Technology', 'University of Rwanda', 'Kigali Independent University'] },
  { label: 'Academic Program', options: ['Computer Science & Engineering', 'Data Science', 'Electrical Engineering', 'Business Analytics'] },
  { label: 'Graduation Year', options: ['Class of 2024 (Forecast)', 'Class of 2023', 'Class of 2022'] },
]

const sectorProbability = [
  { name: 'Tech & Software', pct: 92 },
  { name: 'Financial Services', pct: 84 },
  { name: 'Healthcare Tech', pct: 76 },
]

const risingSkills = [
  {
    icon: Code2,
    iconTone: 'bg-primary-light text-primary',
    skill: 'Full-Stack Development',
    demand: 'High',
    demandPct: 72,
    demandTone: 'bg-emerald-500',
    proficiency: '8.4 / 10',
    value: '$85k - $110k',
    trend: '14%',
  },
  {
    icon: Database,
    iconTone: 'bg-amber-50 text-amber-500',
    skill: 'Machine Learning Ops',
    demand: 'Critical',
    demandPct: 96,
    demandTone: 'bg-emerald-600',
    proficiency: '6.2 / 10',
    value: '$120k+',
    trend: '22%',
  },
]

const fallingSkills = [
  {
    icon: Boxes,
    iconTone: 'bg-gray-100 text-gray-500',
    skill: 'Legacy CMS Admin',
    demand: 'Low',
    demandPct: 24,
    demandTone: 'bg-red-400',
    proficiency: '7.8 / 10',
    value: '$38k - $46k',
    trend: '-19%',
  },
  {
    icon: Cpu,
    iconTone: 'bg-gray-100 text-gray-500',
    skill: 'Manual Data Entry',
    demand: 'Declining',
    demandPct: 12,
    demandTone: 'bg-red-500',
    proficiency: '9.1 / 10',
    value: '$22k - $30k',
    trend: '-34%',
  },
]

export default function Employability() {
  const [tab, setTab] = useState<'rising' | 'falling'>('rising')
  const rows = tab === 'rising' ? risingSkills : fallingSkills

  return (
    <DashboardLayout>
      {/* Page header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="max-w-2xl">
          <h1 className="text-3xl font-extrabold tracking-tight text-navy">
            Graduate Employability Outcomes
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-gray-500">
            Predictive analysis and real-time market alignment for institutional curriculum
            optimization.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-3.5 text-sm font-bold text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
            <Share2 className="h-4 w-4" />
            Share Report
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-navy px-5 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-dark-navy">
            <RefreshCw className="h-4 w-4" />
            Recalculate Predictions
          </button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="mt-8 rounded-2xl border border-gray-200 bg-gray-50 p-6">
        <div className="flex flex-wrap items-end gap-6">
          {filters.map((f) => (
            <label key={f.label} className="min-w-[220px] flex-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                {f.label}
              </span>
              <select className="mt-2 w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-800 shadow-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                {f.options.map((o) => (
                  <option key={o}>{o}</option>
                ))}
              </select>
            </label>
          ))}

          <button
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg text-navy transition-colors hover:bg-gray-100"
            aria-label="Advanced filters"
          >
            <SlidersHorizontal className="h-5 w-5" />
          </button>
        </div>
      </div>

      <hr className="mt-8 border-gray-200" />

      {/* Stat cards + action recommendation */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="relative overflow-hidden p-6">
          <ShieldCheck className="absolute right-6 top-6 h-14 w-14 text-gray-100" strokeWidth={1.5} />
          <div className="relative">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Avg. Employability Score
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-5xl font-extrabold tracking-tight text-navy">78%</span>
              <span className="flex items-center gap-1 text-sm font-bold text-emerald-600">
                <TrendingUp className="h-3.5 w-3.5" />
                +3.2%
              </span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-gray-500">
              Composite score based on technical skills, soft skills, and historical placement data.
            </p>
          </div>
        </Card>

        <Card className="relative overflow-hidden p-6">
          <Clock className="absolute right-6 top-6 h-14 w-14 text-gray-100" strokeWidth={1.5} />
          <div className="relative">
            <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
              Avg. Time-to-Placement
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-5xl font-extrabold tracking-tight text-navy">4.2</span>
              <span className="text-lg font-semibold text-gray-500">months</span>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-gray-500">
              Median duration from graduation to first full-time professional employment offer.
            </p>
          </div>
        </Card>

        <Card className="flex flex-col border-primary/30 bg-white p-6 ring-1 ring-primary/10">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-navy">
            <Lightbulb className="h-4 w-4" />
            Action Recommendation
          </div>
          <p className="mt-4 text-lg font-bold leading-relaxed text-gray-900">
            Update Data Analytics curriculum to include advanced Python modules for{' '}
            <span className="text-primary underline decoration-primary/40 underline-offset-4">
              12% higher placement
            </span>{' '}
            likelihood.
          </p>
          <button className="mt-auto w-full rounded-lg bg-navy px-5 py-3.5 text-sm font-bold uppercase tracking-wide text-white shadow-sm transition-colors hover:bg-dark-navy">
            Implement Now
          </button>
        </Card>
      </div>

      {/* Radar + sector probability */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="p-6 lg:col-span-3">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-extrabold tracking-tight text-navy">Skills Alignment Radar</h2>
              <p className="mt-1 text-sm text-gray-500">
                Curriculum focus vs. Market demand (Top 6 Skills)
              </p>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-wider text-gray-600">
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full border-2 border-navy" />
                Curriculum
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-2.5 w-2.5 rounded-full border-2 border-emerald-500" />
                Market
              </span>
            </div>
          </div>
          <div className="mt-4">
            <SkillsAlignmentRadar />
          </div>
        </Card>

        <Card className="p-6 lg:col-span-2">
          <h2 className="text-xl font-extrabold tracking-tight text-navy">
            Sector Employment Probability
          </h2>
          <p className="mt-1 text-sm leading-relaxed text-gray-500">
            Likelihood of placement within 6 months by industry vertical.
          </p>

          <div className="mt-6 space-y-5">
            {sectorProbability.map((s) => (
              <div key={s.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-gray-900">{s.name}</span>
                  <span className="font-bold text-navy">{s.pct}%</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${s.pct}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-emerald-100 bg-emerald-50/60 p-4">
            <div className="flex items-center gap-2 text-sm font-bold text-gray-900">
              <TrendingUp className="h-4 w-4 text-emerald-600" />
              Trend Insight
            </div>
            <p className="mt-2 text-sm leading-relaxed text-gray-600">
              Demand in Manufacturing/IoT has increased by 18% since the previous quarter, signaling a
              need for industrial automation modules.
            </p>
          </div>
        </Card>
      </div>

      {/* Skill demand velocity */}
      <Card className="mt-6 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-xl font-extrabold tracking-tight text-navy">Skill Demand Velocity</h2>

          <div className="flex rounded-lg border border-gray-200 bg-gray-50 p-1">
            {(['rising', 'falling'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`rounded-md px-4 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors ${
                  tab === t ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-800'
                }`}
              >
                Top {t}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <th className="pb-4 pr-4 font-bold">Skill Category</th>
                <th className="pb-4 pr-4 font-bold">Current Market Demand</th>
                <th className="pb-4 pr-4 font-bold">Grad Proficiency</th>
                <th className="pb-4 pr-4 font-bold">Market Value</th>
                <th className="pb-4 font-bold">Trend</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r) => (
                <tr key={r.skill} className="text-sm">
                  <td className="py-5 pr-4">
                    <div className="flex items-center gap-3">
                      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${r.iconTone}`}>
                        <r.icon className="h-4 w-4" />
                      </span>
                      <span className="font-bold text-gray-900">{r.skill}</span>
                    </div>
                  </td>
                  <td className="py-5 pr-4">
                    <div className="flex items-center gap-3">
                      <span className="h-1.5 w-12 rounded-full bg-gray-100">
                        <span
                          className={`block h-1.5 rounded-full ${r.demandTone}`}
                          style={{ width: `${r.demandPct}%` }}
                        />
                      </span>
                      <span className="font-medium text-gray-700">{r.demand}</span>
                    </div>
                  </td>
                  <td className="py-5 pr-4 font-medium text-gray-700">{r.proficiency}</td>
                  <td className="py-5 pr-4 font-bold text-navy">{r.value}</td>
                  <td className="py-5">
                    <span
                      className={`flex items-center gap-1.5 font-bold ${
                        tab === 'rising' ? 'text-emerald-600' : 'text-red-500'
                      }`}
                    >
                      <TrendingUp className={`h-4 w-4 ${tab === 'falling' ? 'rotate-90' : ''}`} />
                      {r.trend}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-2 border-t border-gray-100 pt-5 text-center">
          <a
            href="#"
            className="inline-flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-navy hover:underline"
          >
            View All 42 Skills
            <ArrowRight className="h-3.5 w-3.5" />
          </a>
        </div>
      </Card>
    </DashboardLayout>
  )
}
