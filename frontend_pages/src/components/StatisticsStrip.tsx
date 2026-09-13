import { Database, Landmark, ListChecks, TrendingUp, Building2, RefreshCw } from 'lucide-react'

const stats = [
  { icon: Building2, value: '5,000+', label: 'Employers Covered' },
  { icon: Landmark, value: '15+', label: 'Partner Institutions' },
  { icon: ListChecks, value: '120+', label: 'Skills Tracked' },
  { icon: Database, value: '6', label: 'National Data Sources' },
  { icon: TrendingUp, value: '10-Yr', label: 'Forecast Horizon' },
  { icon: RefreshCw, value: 'Monthly', label: 'Data Refresh' },
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
      </div>
    </section>
  )
}
