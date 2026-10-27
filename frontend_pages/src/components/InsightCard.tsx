import { TrendingUp, GraduationCap, Globe2, MapPin } from 'lucide-react'

const insights = [
  {
    icon: TrendingUp,
    title: 'Services dominate hiring',
    description:
      'Services & Commerce accounts for 41% of all scraped postings (378 of 919), more than double any other sector.',
    bg: '#E2E7FB',
    color: '#2F4CDD',
  },
  {
    icon: GraduationCap,
    title: 'ICT demand outpaces supply',
    description:
      'ICT & Technology is the second-largest sector with 198 postings, yet it represents only 3–5% of total employment in NISR surveys.',
    bg: '#EDEBFB',
    color: '#6D4FE0',
  },
  {
    icon: Globe2,
    title: 'Five job boards, one picture',
    description:
      'SkillSense aggregates listings from BrighterMonday, JobInRwanda, RwandaJob, JobWebRwanda, and GreatRwandaJobs to build a single demand signal.',
    bg: '#DCF3ED',
    color: '#0F9D6E',
  },
  {
    icon: MapPin,
    title: 'Kigali concentration',
    description:
      '67% of all job postings are located in Kigali, highlighting the opportunity for decentralised skills development in secondary cities.',
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
