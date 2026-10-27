import { lazy, Suspense } from 'react'
import { Briefcase, Compass, FileText, LayoutDashboard, TrendingUp } from 'lucide-react'
import RwandaMap from './RwandaMap'
import TopSkills from './TopSkills'
import { SNAPSHOT } from '../lib/snapshot'

const SkillDemandChart = lazy(() => import('./SkillDemandChart'))

const kpis = [
  { value: String(SNAPSHOT.roles), label: 'Roles tracked' },
  { value: String(SNAPSHOT.totalPostings), label: 'Job postings analysed' },
  { value: String(SNAPSHOT.sectors), label: 'Economic sectors' },
  { value: SNAPSHOT.rankCorrelation.toFixed(2), label: 'Rank correlation' },
]

const sidebar = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: TrendingUp, label: 'Role Forecast' },
  { icon: Briefcase, label: 'Employability' },
  { icon: Compass, label: 'Career Guidance' },
  { icon: FileText, label: 'Reports' },
]

/**
 * Decorative product preview in a browser frame. The numbers are the static snapshot in lib/snapshot.ts;
 * the map shading is decorative. Collapses to a single column on phones.
 */
export default function HeroDashboard() {
  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white text-left shadow-2xl shadow-navy/10 ring-1 ring-black/5">
      {/* browser chrome */}
      <div className="flex items-center gap-3 border-b border-gray-100 bg-gray-50 px-4 py-2.5">
        <div className="flex gap-1.5" aria-hidden>
          <span className="h-2.5 w-2.5 rounded-full bg-red-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-amber-300" />
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-300" />
        </div>
        <div className="mx-auto w-full max-w-xs truncate rounded-md border border-gray-200 bg-white px-3 py-1 text-center text-[11px] text-gray-400">
          skillsense.rw/dashboard
        </div>
        <div className="w-10" aria-hidden />
      </div>

      <div className="flex">
        <aside className="hidden w-52 shrink-0 border-r border-gray-100 bg-white p-3 md:block" aria-hidden>
          <div className="mb-4 flex items-center gap-2 px-2 pt-1">
            <img src="/logo_icon.webp" alt="" className="h-6 w-auto" />
            <span className="text-sm font-extrabold text-navy">SkillSense</span>
          </div>
          <ul className="space-y-1">
            {sidebar.map((s) => (
              <li key={s.label} className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs font-semibold ${s.active ? 'bg-primary-light text-navy' : 'text-gray-500'}`}>
                <s.icon className="h-4 w-4" />
                {s.label}
              </li>
            ))}
          </ul>
        </aside>

        <div className="min-w-0 flex-1 bg-page p-3 sm:p-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="text-sm font-extrabold text-gray-900">Workforce Demand Overview</p>
              <p className="text-[11px] text-gray-500">Rwanda · snapshot {SNAPSHOT.asOf}</p>
            </div>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-gray-500">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Forecast run current
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-4">
            {kpis.map((k) => (
              <div key={k.label} className="rounded-xl border border-gray-200 bg-white p-3">
                <div className="text-lg font-extrabold leading-tight text-gray-900 sm:text-xl">{k.value}</div>
                <div className="mt-0.5 text-[10px] text-gray-500 sm:text-[11px]">{k.label}</div>
              </div>
            ))}
          </div>

          <div className="mt-3 grid gap-2.5 sm:gap-3 lg:grid-cols-5">
            <div className="rounded-xl border border-gray-200 bg-white p-3 lg:col-span-3">
              <Suspense fallback={<div className="h-52" />}>
                <SkillDemandChart />
              </Suspense>
            </div>
            <div className="grid gap-2.5 sm:grid-cols-2 sm:gap-3 lg:col-span-2 lg:grid-cols-1">
              <div className="rounded-xl border border-gray-200 bg-white p-3">
                <TopSkills />
              </div>
              <div className="hidden rounded-xl border border-gray-200 bg-white p-3 sm:block lg:hidden xl:block">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">Regional demand</p>
                <div className="mx-auto mt-1 h-24 max-w-[180px]"><RwandaMap /></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
