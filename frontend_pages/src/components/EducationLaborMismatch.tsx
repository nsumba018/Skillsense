import { lazy, Suspense } from 'react'
import InsightCard from './InsightCard'

const SupplyDemandChart = lazy(() => import('./SupplyDemandChart'))

export default function EducationLaborMismatch() {
  return (
    <section id="insights" className="scroll-mt-20 py-20 sm:py-28">
      <div className="container-1200">
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">Why it matters</p>
          <h2 className="mb-4 text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Why ICT Workforce Intelligence?
          </h2>
          <p className="text-base text-gray-500 leading-relaxed">
            Rwanda's ICT sector is expanding quickly. Knowing which roles will be needed, and when, lets training
            and hiring keep pace.
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <Suspense fallback={<div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm h-[400px]" />}>
              <SupplyDemandChart />
            </Suspense>
          </div>
          <div>
            <InsightCard />
          </div>
        </div>
      </div>
    </section>
  )
}
