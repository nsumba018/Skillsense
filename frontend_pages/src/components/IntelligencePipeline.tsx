import { ClipboardList, Settings2, TrendingUp, Zap, LayoutGrid, ChevronRight, ChevronDown } from 'lucide-react'

const steps = [
  {
    icon: ClipboardList,
    title: 'Ingest',
    details: ['NISR labour surveys', 'Job board postings', 'TVET enrolment data'],
  },
  {
    icon: Settings2,
    title: 'Process',
    details: ['Role normalisation', 'Sector classification', 'Skill extraction'],
  },
  {
    icon: TrendingUp,
    title: 'Forecast',
    details: ['1-yr / 3-yr demand', 'Sector growth trends', 'ICT employment share'],
  },
  {
    icon: Zap,
    title: 'Analyse',
    details: ['Curriculum gaps', 'Employability scores', 'Regional imbalance'],
  },
  {
    icon: LayoutGrid,
    title: 'Deliver',
    details: ['Role-based dashboards', 'PDF reports', 'Placement plans'],
  },
]

export default function IntelligencePipeline() {
  return (
    <section id="how-it-works" className="py-20 bg-gray-50/60 scroll-mt-24">
      <div className="container-1200">
        <div className="max-w-2xl mx-auto text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
            How SkillSense works
          </h2>
          <p className="text-base text-gray-500 mt-3">
            From raw national data to actionable workforce intelligence in five stages.
          </p>
        </div>

        <div className="flex flex-col lg:flex-row items-start gap-0 relative">
          <div className="hidden lg:block absolute border-t-2 border-dashed border-primary/30" style={{ top: '27px', left: '10%', right: '10%' }} />
          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <div key={step.title} className="flex-1 flex flex-col items-center text-center relative">
                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-14 h-14 rounded-full bg-primary-light border-2 border-primary flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-sm font-bold text-gray-900 mb-1">{step.title}</h3>
                  <div className="text-xs text-gray-500 leading-relaxed max-w-[160px]">
                    {step.details.map((d) => (
                      <span key={d} className="block">{d}</span>
                    ))}
                  </div>
                </div>
                {idx < steps.length - 1 && (
                  <div
                    className="hidden lg:flex absolute z-20 items-center justify-center w-6 h-6 rounded-full bg-white"
                    style={{ top: '15px', left: '100%', transform: 'translateX(-50%)' }}
                  >
                    <ChevronRight className="w-4 h-4 text-primary" />
                  </div>
                )}
                {idx < steps.length - 1 && (
                  <div className="flex lg:hidden my-4">
                    <ChevronDown className="w-5 h-5 text-primary" />
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
