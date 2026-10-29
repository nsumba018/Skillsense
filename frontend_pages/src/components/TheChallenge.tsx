import { lazy, Suspense } from 'react'
import { AlertTriangle, Target, TrendingUp } from 'lucide-react'

const SupplyDemandChart = lazy(() => import('./SupplyDemandChart'))

const challenges = [
  {
    icon: TrendingUp,
    color: 'bg-blue-50 text-blue-600',
    title: 'No real-time labour data',
    text: "There's no centralized system tracking what employers are hiring for across Rwanda's 9 economic sectors. Workforce planning relies on outdated surveys instead of live market signals.",
  },
  {
    icon: AlertTriangle,
    color: 'bg-amber-50 text-amber-600',
    title: 'Graduates with mismatched skills',
    text: "Universities produce more graduates every year, but many leave with skills that don't match employer demand. Without forecasts, curricula drift out of alignment with the job market.",
  },
  {
    icon: Target,
    color: 'bg-emerald-50 text-emerald-600',
    title: 'Policy decisions without evidence',
    text: 'Vision 2050 and NST2 target a knowledge-based economy, but policymakers lack sector-level data to know where to invest in training and workforce development.',
  },
]

export default function TheChallenge() {
  return (
    <section id="challenge" className="scroll-mt-20 border-t border-gray-200/70 bg-white py-20 sm:py-28">
      <div className="container-1200">
        <div className="mb-12 max-w-xl sm:mb-16">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Rwanda's workforce is evolving — but who's planning for it?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500 sm:text-lg">
            Rwanda is investing heavily in becoming a knowledge-based economy under <strong className="text-gray-700">Vision 2050</strong> and <strong className="text-gray-700">NST2</strong>. But there's a gap — universities are producing graduates whose skills don't match what employers are actually hiring for. Without a centralized system that tracks what the job market needs in real time, curricula drift out of alignment and graduates struggle to find work.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
          <div>
            <Suspense fallback={<div className="h-[400px] rounded-2xl border border-gray-200 bg-white shadow-sm" />}>
              <SupplyDemandChart />
            </Suspense>
          </div>
          <div className="space-y-5">
            {challenges.map((c) => (
              <div key={c.title} className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm">
                <div className="flex items-start gap-4">
                  <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${c.color}`}>
                    <c.icon className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-gray-900">{c.title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-gray-500">{c.text}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
