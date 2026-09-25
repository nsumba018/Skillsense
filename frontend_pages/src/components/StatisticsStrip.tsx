import { Database, ListChecks, TrendingUp, Building2, Newspaper, CalendarRange } from 'lucide-react'
import { SNAPSHOT } from '../lib/snapshot'

const stats = [
  { icon: ListChecks, value: String(SNAPSHOT.roles), label: 'ICT Roles Tracked' },
  { icon: Newspaper, value: String(SNAPSHOT.postings), label: 'Real ICT Job Postings' },
  { icon: Building2, value: String(SNAPSHOT.companies), label: 'Hiring Companies' },
  { icon: Database, value: String(SNAPSHOT.jobBoards.length), label: 'Job-Board Sources' },
  { icon: CalendarRange, value: SNAPSHOT.historyYears, label: 'Years of Labour Data' },
  { icon: TrendingUp, value: '2-Yr', label: 'Forecast Horizon' },
]

export default function StatisticsStrip() {
  return (
    <section id="reports" className="bg-navy scroll-mt-24">
      <div className="container-1200">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6 py-12">
          {stats.map((stat) => {
            const Icon = stat.icon
            return (
              <div key={stat.label} className="flex items-center gap-4">
                <Icon className="w-7 h-7 text-white/70 shrink-0" />
                <div>
                  <div className="text-xl md:text-2xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-white/70">{stat.label}</div>
                </div>
              </div>
            )
          })}
        </div>
        <p className="pb-6 text-[11px] text-white/50">Figures from the SkillSense datasets ({SNAPSHOT.asOf}), a static snapshot, not live.</p>
      </div>
    </section>
  )
}
