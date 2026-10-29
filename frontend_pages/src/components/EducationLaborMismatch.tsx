import { lazy, Suspense } from 'react'
import InsightCard from './InsightCard'

const SupplyDemandChart = lazy(() => import('./SupplyDemandChart'))

export default function EducationLaborMismatch() {
  return (
    <section id="insights" className="py-20 scroll-mt-24">
      <div className="container-1200">
        <div className="max-w-2xl mb-12">
          <h2 className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4 tracking-tight">
            Why Rwanda needs workforce intelligence
          </h2>
          <p className="text-base text-gray-500 leading-relaxed">
            Rwanda is investing heavily in becoming a knowledge-based economy under <strong className="text-gray-700">Vision 2050</strong> and <strong className="text-gray-700">NST2</strong>. But there's a gap — universities are producing graduates whose skills don't match what employers are actually hiring for. There's no centralized system that tracks what the job market needs in real time. SkillSense solves this by collecting real job postings from five Rwandan job boards, combining them with NISR Labour Force Survey data, and using machine learning to forecast which roles will grow and where the skills gaps are forming.
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
