import { lazy, Suspense } from 'react'
import InsightCard from './InsightCard'

const SupplyDemandChart = lazy(() => import('./SupplyDemandChart'))

export default function EducationLaborMismatch() {
  return (
    <section id="insights" className="py-20 scroll-mt-24">
      <div className="container-1200">
        <div className="max-w-2xl mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Graduates without the skills employers need
          </h2>
          <p className="text-base text-gray-500 leading-relaxed">
            Rwanda's universities are producing more graduates than ever, but many leave with
            skills that don't match what the job market is hiring for. Without a reliable signal
            showing which roles are growing and which are shrinking, curricula drift out of
            alignment — and the gap widens quietly until graduates can't find work.
          </p>
        </div>

        <div className="grid lg:grid-cols-[49%_1fr] gap-6">
          <div>
            <Suspense fallback={<div className="bg-white rounded-2xl border border-gray-200 shadow-sm h-[400px]" />}>
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
