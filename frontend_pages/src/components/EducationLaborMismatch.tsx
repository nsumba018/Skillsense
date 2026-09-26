import { lazy, Suspense } from 'react'
import InsightCard from './InsightCard'

const SupplyDemandChart = lazy(() => import('./SupplyDemandChart'))

export default function EducationLaborMismatch() {
  return (
    <section id="insights" className="py-20 scroll-mt-24">
      <div className="container-1200">
        <div className="max-w-2xl mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4 tracking-tight">
            Why ICT Workforce Intelligence?
          </h2>
          <p className="text-base text-gray-500 leading-relaxed">
            Rwanda's ICT sector is expanding quickly. Knowing which roles will be needed, and when, lets training
            and hiring keep pace.
          </p>
        </div>

        <div className="grid lg:grid-cols-[49%_1fr] gap-6">
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
