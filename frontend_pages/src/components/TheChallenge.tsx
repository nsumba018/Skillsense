import { lazy, Suspense } from 'react'
import { AlertTriangle, Target, TrendingUp } from 'lucide-react'

const SupplyDemandChart = lazy(() => import('./SupplyDemandChart'))

const challenges = [
  {
    icon: TrendingUp,
    color: 'bg-blue-50 text-blue-600',
    title: 'Rapid sector growth',
    text: 'Rwanda's economy is diversifying fast across technology, finance, healthcare and more. New roles appear every year, but workforce planning still relies on outdated data.',
  },
  {
    icon: AlertTriangle,
    color: 'bg-amber-50 text-amber-600',
    title: 'Curricula lag behind',
    text: 'Universities design programmes based on yesterday's demand. Without forecasts, graduates finish training for roles that have already shifted.',
  },
  {
    icon: Target,
    color: 'bg-emerald-50 text-emerald-600',
    title: 'Policy needs evidence',
    text: 'NST2 and Vision 2050 call for a skilled, future-ready workforce. Government planners need sector-level data to know where to invest — not guesswork.',
  },
]

export default function TheChallenge() {
  return (
    <section id="challenge" className="scroll-mt-20 border-t border-gray-200/70 bg-white py-20 sm:py-28">
      <div className="container-1200">
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">The challenge</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Rwanda's workforce is evolving — but who's planning for it?
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500 sm:text-lg">
            Rwanda's <strong className="text-gray-700">National Strategy for Transformation (NST2)</strong> and <strong className="text-gray-700">Vision 2050</strong> set ambitious targets for a knowledge-based economy. Achieving them requires forecasting which skills employers will need across every sector — before the gap opens.
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
              <div key={c.title} className="rounded-2xl border border-gray-200/80 bg-white p-5 shadow-sm transition-shadow hover:shadow-md">
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
