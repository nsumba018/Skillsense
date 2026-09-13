import { TrendingUp, GraduationCap, Globe2, MapPin } from 'lucide-react'

const insights = [
  {
    icon: TrendingUp,
    title: 'Supply-Demand Disparity',
    description:
      'Addressing the widening gap between available talent and industry demand with precision data.',
    bg: '#E2E7FB',
    color: '#2F4CDD',
  },
  {
    icon: GraduationCap,
    title: 'Emerging Skills Gap',
    description:
      'Identifying and forecasting critical shortages in the digital economy and fintech requirements.',
    bg: '#EDEBFB',
    color: '#6D4FE0',
  },
  {
    icon: Globe2,
    title: 'Data-Driven Alignment',
    description:
      'Real-time signals from 5,000+ employers analyzed monthly to ensure curriculum relevance.',
    bg: '#DCF3ED',
    color: '#0F9D6E',
  },
  {
    icon: MapPin,
    title: 'Regional Imbalance',
    description:
      'Counteracting the high concentration of specialized technical skills within urban hubs.',
    bg: '#E2E7FB',
    color: '#2F4CDD',
  },
]

export default function InsightCard() {
  return (
    <div className="space-y-4">
      {insights.map((insight) => {
        const Icon = insight.icon
        return (
          <div
            key={insight.title}
            className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: insight.bg }}>
                <Icon className="w-4 h-4" style={{ color: insight.color }} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-0.5">
                  {insight.title}
                </h4>
                <p className="text-xs text-gray-500 leading-relaxed">
                  {insight.description}
                </p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
