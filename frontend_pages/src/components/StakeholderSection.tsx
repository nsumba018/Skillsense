import { BarChart3, BookOpen, Compass, Shield } from 'lucide-react'

const stakeholders = [
  {
    icon: BarChart3,
    title: 'Labour Market Analysts',
    description: 'Sector-level demand forecasts and role-growth trends drawn from NISR survey data and live job postings.',
    bg: '#E2E7FB',
    color: '#2F4CDD',
  },
  {
    icon: BookOpen,
    title: 'Education & Curriculum Planners',
    description: 'Curriculum alignment reports that show which skills the market needs and where programmes fall short.',
    bg: '#EDEBFB',
    color: '#6D4FE0',
  },
  {
    icon: Compass,
    title: 'Career & Training Advisors',
    description: 'Student employability scores and placement plans that match graduates to the roles employers are hiring for.',
    bg: '#DCF3ED',
    color: '#0F9D6E',
  },
  {
    icon: Shield,
    title: 'Platform Administrators',
    description: 'User management, data uploads, and system-wide oversight across all roles and institutions.',
    bg: '#F1EFEC',
    color: '#44403C',
  },
]

export default function StakeholderSection() {
  return (
    <section id="stakeholders" className="py-20 scroll-mt-24">
      <div className="container-1200">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
            Four roles, one platform
          </h2>
          <p className="text-base text-gray-500 mt-3">
            Each user sees the dashboards, forecasts, and actions relevant to their mandate.
          </p>
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stakeholders.map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.title}
                className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6"
              >
                <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4" style={{ backgroundColor: s.bg }}>
                  <Icon className="w-5 h-5" style={{ color: s.color }} />
                </div>
                <h3 className="text-sm font-bold text-gray-900 mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
