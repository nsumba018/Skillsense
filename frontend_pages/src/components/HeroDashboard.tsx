import { lazy, Suspense } from 'react'
import { ChevronDown } from 'lucide-react'
import RwandaMap from './RwandaMap'
import TopSkills from './TopSkills'
import AiInsightCard from './AiInsightCard'
import { SNAPSHOT } from '../lib/snapshot'

const SkillDemandChart = lazy(() => import('./SkillDemandChart'))

const stats = [
  { value: String(SNAPSHOT.totalPostings), label: 'Job Postings Analysed' },
  { value: String(SNAPSHOT.companies), label: 'Companies Identified' },
  { value: String(SNAPSHOT.sectors), label: 'Economic Sectors' },
  { value: String(SNAPSHOT.jobBoards.length), label: 'Job Boards Scraped' },
]

const legend = [
  { label: 'High', color: '#1E3A8A' },
  { label: 'Medium', color: '#5B85E0' },
  { label: 'Low', color: '#C7D6F5' },
]

export default function HeroDashboard() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200/80 shadow-xl shadow-gray-300/40 p-2.5">
      <div className="grid grid-cols-12 gap-2">
        <div className="col-span-12 lg:col-span-9 bg-white rounded-xl border border-gray-200 p-2.5">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-2.5">
            <span className="text-[11px] font-bold text-primary uppercase tracking-wide">
              Workforce Demand Overview
            </span>
            <div className="flex items-center gap-3">
              <button className="hidden sm:flex items-center gap-1 text-[10px] font-medium text-gray-600 border border-gray-200 rounded-lg px-2 py-1 shrink-0">
                Demand Level
                <ChevronDown className="w-3 h-3 shrink-0" />
              </button>
              <div className="flex items-center gap-2.5">
                {legend.map((l) => (
                  <div key={l.label} className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm shrink-0" style={{ backgroundColor: l.color }} />
                    <span className="text-[10px] text-gray-500">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="w-full" style={{ aspectRatio: '1.72' }}>
            <RwandaMap />
          </div>
        </div>

        <div className="col-span-12 lg:col-span-3 flex flex-col gap-1.5">
          {stats.map((s) => (
            <div key={s.label} className="bg-white rounded-xl border border-gray-200 px-2.5 py-2 flex-1 flex flex-col justify-center">
              <div className="text-base font-bold text-gray-900">{s.value}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2">
        <div className="bg-white rounded-xl border border-gray-200 p-2">
          <Suspense fallback={<div className="h-full min-h-[100px]" />}>
            <SkillDemandChart />
          </Suspense>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-2">
          <TopSkills />
        </div>
        <AiInsightCard />
      </div>
    </div>
  )
}
