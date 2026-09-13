import { useState } from 'react'
import {
  SlidersHorizontal,
  FileText,
  Table2,
  FileSpreadsheet,
  FileType2,
  Presentation,
  BarChart3,
  Download,
  Share2,
  Trash2,
  Pencil,
  X,
  Sparkles,
  ShieldCheck,
  CalendarClock,
  ChevronRight,
} from 'lucide-react'
import DashboardLayout, { Card } from './DashboardLayout'

const builderFilters = [
  { label: 'Scope', options: ['National Overview', 'Provincial', 'District', 'Institutional'] },
  { label: 'Time Range', options: ['Last 12 Months', 'Last 6 Months', 'Last 24 Months', 'Year to Date'] },
  { label: 'Metric Type', options: ['Employment Rate', 'Skill Shortage Index', 'Wage Growth', 'Placement Velocity'] },
]

const exportFormats = [
  { id: 'pdf', label: 'PDF', icon: FileType2 },
  { id: 'xls', label: 'XLS', icon: Table2 },
  { id: 'csv', label: 'CSV', icon: FileSpreadsheet },
] as const

const templates = [
  {
    title: 'National Skills Forecast',
    desc: 'Comprehensive annual projection of labor demands across all sectors.',
    badge: 'PDF',
    icon: FileText,
    iconTone: 'bg-red-50 text-red-500',
  },
  {
    title: 'Employability Benchmark',
    desc: 'Raw data and comparative metrics for institutional performance.',
    badge: 'Excel',
    icon: Table2,
    iconTone: 'bg-emerald-50 text-emerald-600',
  },
  {
    title: 'Sector Shortage Analysis',
    desc: 'Executive-ready slides detailing critical skill gaps and risks.',
    badge: 'PPT',
    icon: Presentation,
    iconTone: 'bg-amber-50 text-amber-500',
  },
]

const previewBars = [
  { height: 40, fill: '#C7CFE2' },
  { height: 58, fill: '#8C9BC0' },
  { height: 50, fill: '#5A6E9E' },
  { height: 76, fill: '#334D80' },
  { height: 92, fill: '#0F766E' },
]

const archive = [
  {
    name: 'Quarterly Employment Flux Analysis',
    sub: 'Regional Focus: Metropolitan South',
    date: 'Oct 24, 2024',
    status: 'Completed',
    statusTone: 'bg-emerald-50 text-emerald-700',
    dotTone: 'bg-emerald-500',
    icon: Sparkles,
    actions: 'completed',
  },
  {
    name: 'Security & Tech Infrastructure Audit',
    sub: 'Full Institutional Scope',
    date: 'Oct 25, 2024',
    status: 'In Progress',
    statusTone: 'bg-primary-light text-navy',
    dotTone: 'bg-primary',
    icon: ShieldCheck,
    actions: 'running',
  },
  {
    name: '2025 Strategic Skills Roadmapping',
    sub: 'Pending Automation Trigger',
    date: 'Nov 01, 2024',
    status: 'Scheduled',
    statusTone: 'bg-gray-100 text-gray-600',
    dotTone: 'bg-gray-400',
    icon: CalendarClock,
    actions: 'scheduled',
  },
] as const

export default function Reports() {
  const [format, setFormat] = useState<(typeof exportFormats)[number]['id']>('pdf')

  return (
    <DashboardLayout>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* ---------- Report builder ---------- */}
        <Card className="p-8 lg:col-span-2">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-navy">Custom Report Builder</h1>
              <p className="mt-2 text-sm text-gray-500">
                Configure specific parameters for real-time intelligence generation.
              </p>
            </div>
            <button className="text-navy transition-colors hover:text-primary" aria-label="Advanced settings">
              <SlidersHorizontal className="h-5 w-5" />
            </button>
          </div>

          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
            {builderFilters.map((f) => (
              <label key={f.label} className="block">
                <span className="text-[11px] font-bold uppercase tracking-wider text-navy">{f.label}</span>
                <select className="mt-2 w-full cursor-pointer appearance-none rounded-lg border border-gray-200 bg-white bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 fill=%22none%22 stroke=%22%230B2373%22 stroke-width=%222%22 viewBox=%220 0 24 24%22><path d=%22M6 9l6 6 6-6%22/></svg>')] bg-[length:16px] bg-[right_0.75rem_center] bg-no-repeat px-4 py-3.5 pr-10 text-sm font-medium text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20">
                  {f.options.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>

          <div className="mt-8 rounded-xl border border-gray-100 bg-gray-50 p-6">
            <div className="text-[11px] font-bold uppercase tracking-wider text-navy">Export Format</div>
            <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
              {exportFormats.map((f) => (
                <button
                  key={f.id}
                  onClick={() => setFormat(f.id)}
                  aria-pressed={format === f.id}
                  className={`flex items-center justify-center gap-2.5 rounded-lg border-2 py-4 text-base font-bold transition-colors ${
                    format === f.id
                      ? 'border-navy bg-white text-navy'
                      : 'border-gray-200 bg-white text-gray-500 hover:border-gray-300 hover:text-gray-700'
                  }`}
                >
                  <f.icon className="h-5 w-5" />
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <button className="mt-8 w-full rounded-lg bg-navy py-5 text-base font-bold text-white shadow-sm transition-colors hover:bg-dark-navy">
            Generate Intelligence Report
          </button>
        </Card>

        {/* ---------- Institutional templates ---------- */}
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-navy">Institutional Templates</h2>
          <p className="mt-1 text-sm text-gray-500">Quick-start with verified models.</p>

          <div className="mt-6 space-y-6">
            {templates.map((t) => (
              <Card
                key={t.title}
                className="cursor-pointer p-6 transition-colors hover:border-primary/40"
              >
                <div className="flex items-start justify-between gap-3">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-lg ${t.iconTone}`}>
                    <t.icon className="h-5 w-5" />
                  </span>
                  <span className="rounded bg-gray-100 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    {t.badge}
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-extrabold tracking-tight text-navy">{t.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{t.desc}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* ---------- Executive summary preview ---------- */}
      <div className="mt-8 overflow-hidden rounded-2xl border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="bg-navy p-10 text-white">
            <div className="flex items-center gap-3">
              <span className="rounded bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider">
                Live Preview
              </span>
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
            </div>

            <h2 className="mt-6 text-3xl font-extrabold tracking-tight">Executive Summary Preview</h2>
            <p className="mt-5 max-w-lg text-sm leading-relaxed text-blue-200/80">
              Preliminary data suggests a{' '}
              <span className="font-bold text-emerald-300">14.2% increase</span> in technical vacancy
              rates within the renewable energy sector. High-priority interventions recommended for
              vocational training alignment in coastal regions.
            </p>

            <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="rounded-xl bg-white/5 p-5 ring-1 ring-white/10">
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-200/70">
                  Confidence Score
                </div>
                <div className="mt-2 text-3xl font-extrabold">98.4%</div>
              </div>
              <div className="rounded-xl bg-white/5 p-5 ring-1 ring-white/10">
                <div className="text-[10px] font-bold uppercase tracking-wider text-blue-200/70">
                  Data Sources
                </div>
                <div className="mt-2 text-3xl font-extrabold">42+ Sites</div>
              </div>
            </div>
          </div>

          <div className="relative flex items-center justify-center bg-white p-10">
            <BarChart3 className="absolute right-10 top-10 h-10 w-10 text-gray-100" strokeWidth={1.5} />
            <div className="flex h-64 w-full max-w-md items-end justify-center gap-4 border-b border-l border-gray-100 px-4 pb-px">
              {previewBars.map((b, i) => (
                <div
                  key={i}
                  className="w-full max-w-[68px] rounded-t-sm"
                  style={{ height: `${b.height}%`, backgroundColor: b.fill }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Recent archive ---------- */}
      <div className="mt-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-navy">Recent Archive</h2>
            <p className="mt-1 text-sm text-gray-500">
              Manage and retrieve recently generated institutional assets.
            </p>
          </div>
          <a href="#" className="flex items-center gap-1 text-sm font-bold text-navy hover:underline">
            View Full Archive
            <ChevronRight className="h-4 w-4" />
          </a>
        </div>

        <Card className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[760px] text-left">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/60 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <th className="px-6 py-4 font-bold">Report Name</th>
                <th className="px-6 py-4 font-bold">Date Generated</th>
                <th className="px-6 py-4 font-bold">Status</th>
                <th className="px-6 py-4 text-right font-bold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {archive.map((r) => (
                <tr key={r.name} className="text-sm">
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-light text-navy">
                        <r.icon className="h-4 w-4" />
                      </span>
                      <div>
                        <div className="font-bold text-gray-900">{r.name}</div>
                        <div className="mt-0.5 text-xs text-gray-500">{r.sub}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-gray-600">{r.date}</td>
                  <td className="px-6 py-5">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider ${r.statusTone}`}
                    >
                      <span className={`h-1.5 w-1.5 rounded-full ${r.dotTone}`} />
                      {r.status}
                    </span>
                  </td>
                  <td className="px-6 py-5">
                    <div className="flex items-center justify-end gap-5 text-navy">
                      {r.actions === 'completed' && (
                        <>
                          <button aria-label="Download report" className="hover:text-primary">
                            <Download className="h-4.5 w-4.5" />
                          </button>
                          <button aria-label="Share report" className="hover:text-primary">
                            <Share2 className="h-4.5 w-4.5" />
                          </button>
                          <button aria-label="Delete report" className="hover:text-red-500">
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </>
                      )}
                      {r.actions === 'running' && (
                        <>
                          <span className="text-gray-300">
                            <Download className="h-4.5 w-4.5" />
                          </span>
                          <span className="text-gray-300">
                            <Share2 className="h-4.5 w-4.5" />
                          </span>
                          <button aria-label="Cancel generation" className="text-gray-400 hover:text-red-500">
                            <X className="h-4.5 w-4.5" />
                          </button>
                        </>
                      )}
                      {r.actions === 'scheduled' && (
                        <>
                          <button aria-label="Edit schedule" className="hover:text-primary">
                            <Pencil className="h-4.5 w-4.5" />
                          </button>
                          <button aria-label="Delete schedule" className="hover:text-red-500">
                            <Trash2 className="h-4.5 w-4.5" />
                          </button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </DashboardLayout>
  )
}
