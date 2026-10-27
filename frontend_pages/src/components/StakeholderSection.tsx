import { Users, MapPin, UserCheck, UserSearch, Share2 } from 'lucide-react'

const stakeholders = [
  {
    icon: Users,
    title: 'Policy Makers',
    description: 'Strategic labor planning and resource allocation.',
    bg: '#E2E7FB',
    color: '#2F4CDD',
  },
  {
    icon: MapPin,
    title: 'Education Planners',
    description: 'Curriculum alignment with market needs.',
    bg: '#E2E7FB',
    color: '#2F4CDD',
  },
  {
    icon: UserCheck,
    title: 'Career Advisors',
    description: 'Data-driven guidance for youth and job seekers.',
    bg: '#DCF3ED',
    color: '#0F9D6E',
  },
  {
    icon: UserSearch,
    title: 'Researchers',
    description: 'Granular datasets for labor economy studies.',
    bg: '#E2E7FB',
    color: '#2F4CDD',
  },
  {
    icon: Share2,
    title: 'Administrators',
    description: 'Monitoring performance of training initiatives.',
    bg: '#F1EFEC',
    color: '#44403C',
  },
]

export default function StakeholderSection() {
  return (
    <section id="stakeholders" className="py-20 scroll-mt-24">
      <div className="container-1200">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center mb-12 tracking-tight">
          Built for Rwanda's Decision-Makers
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
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
