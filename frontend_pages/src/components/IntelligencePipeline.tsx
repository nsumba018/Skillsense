import { ClipboardList, Settings2, MapPin, Zap, LayoutGrid, ArrowRight, CheckCircle2 } from 'lucide-react'
import { SNAPSHOT } from '../lib/snapshot'

const steps = [
  { icon: ClipboardList, title: 'Ingest', details: ['NISR Labour Force Survey', `Job postings from ${SNAPSHOT.jobBoards.length} boards`, 'University curricula'], color: 'bg-blue-50 text-blue-600' },
  { icon: Settings2, title: 'Process', details: ['Classify by sector', 'Normalise job titles', `Map to ${SNAPSHOT.roles} roles across ${SNAPSHOT.sectors} sectors`], color: 'bg-violet-50 text-violet-600' },
  { icon: MapPin, title: 'Predict', details: ['Role-level demand index', 'Sector employment trends', '6m, 1y, 2y horizons'], color: 'bg-emerald-50 text-emerald-600' },
  { icon: Zap, title: 'Validate', details: ['Test against held-out postings', 'Spearman rank correlation', `Result: ${SNAPSHOT.rankCorrelation.toFixed(2)}`], color: 'bg-amber-50 text-amber-600' },
  { icon: LayoutGrid, title: 'Deliver', details: ['Role-based dashboards', 'PDF & CSV reports', 'REST API for all data'], color: 'bg-rose-50 text-rose-600' },
]

export default function IntelligencePipeline() {
  return (
    <section id="how-it-works" className="scroll-mt-20 bg-gradient-to-b from-white to-primary-light/30 py-20 sm:py-28">
      <div className="container-1200">
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">How it works</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">From raw data to workforce intelligence</h2>
          <p className="mt-4 text-base text-gray-500 sm:text-lg">
            A five-stage pipeline turns historical labour data and live job postings into validated, sector-level workforce forecasts.
          </p>
        </div>

        <ol className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {steps.map((s, i) => (
            <li key={s.title} className="group relative">
              <div className="h-full rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg">
                <div className="flex items-center justify-between">
                  <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.color}`}><s.icon className="h-5 w-5" /></span>
                  <span className="text-3xl font-extrabold text-gray-100">0{i + 1}</span>
                </div>
                <h3 className="mt-4 text-lg font-bold text-gray-900">{s.title}</h3>
                <ul className="mt-3 space-y-2">
                  {s.details.map((d) => (
                    <li key={d} className="flex items-start gap-2 text-sm text-gray-500">
                      <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-500" />
                      {d}
                    </li>
                  ))}
                </ul>
              </div>
              {i < steps.length - 1 && (
                <div className="absolute -right-3 top-1/2 z-10 hidden -translate-y-1/2 lg:block" aria-hidden>
                  <ArrowRight className="h-5 w-5 text-gray-300" />
                </div>
              )}
            </li>
          ))}
        </ol>

        <div className="mx-auto mt-10 max-w-2xl rounded-2xl bg-navy p-8 text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/50">Validation result</p>
          <p className="mt-3 text-2xl font-extrabold text-white sm:text-3xl">
            {SNAPSHOT.rankCorrelation.toFixed(2)} Spearman rank correlation
          </p>
          <p className="mt-2 text-sm text-blue-200/70">
            Forecasts were validated against {SNAPSHOT.totalPostings} real job postings from four Rwandan job boards.
            The model correctly ranks which roles will be most in demand across sectors.
          </p>
        </div>
      </div>
    </section>
  )
}
