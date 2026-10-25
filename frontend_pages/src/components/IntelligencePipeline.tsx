import { ClipboardList, Settings2, MapPin, Zap, LayoutGrid } from 'lucide-react'

const steps = [
  { icon: ClipboardList, title: 'Ingest', details: ['Job-posting CSVs', 'NISR labour survey', 'Role taxonomy'] },
  { icon: Settings2, title: 'Process', details: ['Classify ICT / non-ICT', 'Normalise job titles', 'Map to 22 roles'] },
  { icon: MapPin, title: 'Predict', details: ['Role demand', 'ICT employment', 'Trend direction'] },
  { icon: Zap, title: 'Analyse', details: ['Employability scores', 'Sector mix', 'Skill gaps'] },
  { icon: LayoutGrid, title: 'Deliver', details: ['Dashboards', 'Reports & CSV', 'REST API'] },
]

export default function IntelligencePipeline() {
  return (
    <section id="how-it-works" className="scroll-mt-20 py-20 sm:py-28">
      <div className="container-1200">
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">How it works</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">The intelligence pipeline</h2>
          <p className="mt-4 text-base text-gray-500 sm:text-lg">From raw ICT job data to actionable workforce forecasts.</p>
        </div>

        <ol className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((s, i) => (
            <li key={s.title} className="relative rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-light text-primary"><s.icon className="h-5 w-5" /></span>
                <span className="text-3xl font-extrabold text-gray-100">0{i + 1}</span>
              </div>
              <h3 className="mt-5 text-lg font-bold text-gray-900">{s.title}</h3>
              <ul className="mt-2 space-y-1.5">
                {s.details.map((d) => (
                  <li key={d} className="flex items-center gap-2 text-sm text-gray-500"><span className="h-1 w-1 shrink-0 rounded-full bg-primary/50" />{d}</li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
