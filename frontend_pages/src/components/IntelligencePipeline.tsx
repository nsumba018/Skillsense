import { ClipboardList, Settings2, MapPin, Zap, LayoutGrid, ChevronRight, ChevronDown } from 'lucide-react'

const steps = [
  {
    icon: ClipboardList,
    title: 'Ingest',
    details: ['Job postings', 'Census data', 'Education outputs', 'Surveys'],
  },
  {
    icon: Settings2,
    title: 'Process',
    details: ['Clean', 'Standardize', 'NLP'],
  },
  {
    icon: MapPin,
    title: 'Predict',
    details: ['Skill demand', 'Employment', 'Sector growth'],
  },
  {
    icon: Zap,
    title: 'Analyze',
    details: ['Insights', 'Regional comparison', 'Risk alerts'],
  },
  {
    icon: LayoutGrid,
    title: 'Deliver',
    details: ['Dashboards', 'Reports', 'API Access', 'Institutional Portals'],
  },
]

export default function IntelligencePipeline() {
  return (
    <section id="how-it-works" className="py-20 scroll-mt-24">
      <div className="container-1200">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 text-center tracking-tight">
          The Intelligence Pipeline
        </h2>
        <p className="text-base text-gray-500 text-center mt-3 mb-14">
          From raw data to actionable workforce intelligence.
        </p>

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
                  <h3 className="text-sm font-bold text-primary mb-1">{step.title}</h3>
                  <div className="text-xs text-gray-500 leading-relaxed max-w-[140px]">
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
