import { Compass, GraduationCap, LineChart, ShieldCheck } from 'lucide-react'

const stakeholders = [
  {
    icon: Compass,
    title: 'Career & Training Advisors',
    description: 'Guide learners toward ICT roles with growing demand, and score skill profiles against the forecast.',
    bg: '#DCF3ED',
    color: '#0F9D6E',
  },
  {
    icon: GraduationCap,
    title: 'Education & Curriculum Planners',
    description: 'Upload a programme and see which in-demand ICT skills it teaches, and which it misses.',
    bg: '#E2E7FB',
    color: '#2F4CDD',
  },
  {
    icon: LineChart,
    title: 'Labour Market Analysts',
    description: 'Role, industry and regional demand, forecasts, and planning briefs for workforce investment.',
    bg: '#E2E7FB',
    color: '#2F4CDD',
  },
  {
    icon: ShieldCheck,
    title: 'Administrators',
    description: 'Upload job-posting data, manage users and keep the forecasts current.',
    bg: '#F1EFEC',
    color: '#44403C',
  },
]

export default function StakeholderSection() {
  return (
    <section id="stakeholders" className="py-20 scroll-mt-24">
      <div className="container-1200">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12 tracking-tight">
          Built for Rwanda's ICT Decision-Makers
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {stakeholders.map((s) => {
            const Icon = s.icon
            return (
              <div
                key={s.title}
                className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6 flex items-start gap-4 hover:shadow-md transition-shadow"
              >
                <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: s.bg }}>
                  <Icon className="w-6 h-6" style={{ color: s.color }} />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-primary mb-2">{s.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed">{s.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
