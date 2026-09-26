import { TrendingUp, GraduationCap, Globe2, Briefcase } from 'lucide-react'

const insights = [
  {
    icon: TrendingUp,
    title: 'A fast-growing ICT workforce',
    description:
      'ICT employment has grown from 1.45% to 4.80% of all jobs in Rwanda in under a decade. Demand is moving faster than planning cycles.',
    bg: '#E2E7FB',
    color: '#2F4CDD',
  },
  {
    icon: GraduationCap,
    title: 'Training must follow demand',
    description:
      'Forecasts show which ICT roles will grow or shrink, so programmes can be aligned before skills gaps open.',
    bg: '#EDEBFB',
    color: '#6D4FE0',
  },
  {
    icon: Globe2,
    title: 'Built on evidence',
    description:
      'Trained on NISR Labour Force Survey data, then validated against 92 real ICT job postings from four Rwandan job boards.',
    bg: '#DCF3ED',
    color: '#0F9D6E',
  },
  {
    icon: Briefcase,
    title: 'Roles, not just titles',
    description:
      'Every posting is mapped to a controlled taxonomy of 22 ICT roles, so demand for Backend, DevOps or Data roles is comparable over time.',
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
          <div key={insight.title} className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: insight.bg }}>
                <Icon className="w-4 h-4" style={{ color: insight.color }} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-900 mb-0.5">{insight.title}</h4>
                <p className="text-xs text-gray-500 leading-relaxed">{insight.description}</p>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}
