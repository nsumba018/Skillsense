import { ListChecks, TrendingUp, Target, CalendarRange, ShieldCheck, BarChart3 } from 'lucide-react'

const stats = [
  { icon: ListChecks, value: '20+', label: 'ICT Roles Tracked' },
  { icon: BarChart3, value: '3', label: 'Forecast Horizons' },
  { icon: Target, value: '98.9%', label: 'Rank Accuracy' },
  { icon: CalendarRange, value: '20+', label: 'Years of Data' },
  { icon: TrendingUp, value: '2026', label: 'Market-Validated' },
  { icon: ShieldCheck, value: 'NISR', label: 'Verified Data Source' },
]

export default function StatisticsStrip() {
  return (
    <section className="bg-navy">
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
