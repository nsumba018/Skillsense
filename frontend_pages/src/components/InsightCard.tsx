import { TrendingUp, GraduationCap, Globe2, MapPin } from 'lucide-react'

const insights = [
  {
    icon: TrendingUp,
    title: 'Supply–Demand Disparity',
    description:
      'ICT roles show 38% excess demand while agriculture remains oversupplied, revealing where retraining investment is most urgent.',
    bg: '#E2E7FB',
    color: '#2F4CDD',
  },
  {
    icon: GraduationCap,
    title: 'Emerging Skills Gap',
    description:
      'Cloud engineering and data science demand grew 18% year-on-year, but fewer than 5% of TVET curricula cover these areas.',
    bg: '#EDEBFB',
    color: '#6D4FE0',
  },
  {
    icon: Globe2,
    title: 'Data-Driven Alignment',
    description:
      'SkillSense analyses postings from 4 Rwandan job boards and matches them against NISR labour force surveys to ground every forecast.',
    bg: '#DCF3ED',
    color: '#0F9D6E',
  },
  {
    icon: MapPin,
    title: 'Regional Imbalance',
    description:
      'Over 70% of ICT job postings concentrate in Kigali, signalling an opportunity for decentralised training centres in secondary cities.',
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
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-4"
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
