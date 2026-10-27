import { ClipboardCheck, GraduationCap, LineChart, FileBarChart } from 'lucide-react'

const chip = 'rounded-full px-2.5 py-1 text-[11px] font-semibold'

export default function Features() {
  return (
    <section id="features" className="scroll-mt-20 py-20 sm:py-28">
      <div className="container-1200">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            From forecasts to placed graduates
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500 sm:text-lg">
            Four capabilities that close the loop between knowing what employers will need — across all sectors — and getting students ready.
          </p>
        </div>

        <div className="grid gap-5">
          {/* Lead card — full width, horizontal layout */}
          <article className="overflow-hidden rounded-3xl border border-gray-200/80 bg-white shadow-sm">
            <div className="grid items-center gap-6 sm:grid-cols-2">
              <div className="p-6 sm:p-10">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
                  <LineChart className="h-5 w-5" />
                </span>
                <h3 className="mt-5 text-xl font-bold tracking-tight text-gray-900 sm:text-2xl">
                  Role & sector demand forecasts
                </h3>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500">
                  Six-month, one-year and two-year outlooks across 9 sectors, with confidence ranges. Trained on NISR Labour Force Survey data.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  {['6-month', '1-year', '2-year'].map((h) => (
                    <span
                      key={h}
                      className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700"
                    >
                      {h} horizon
                    </span>
                  ))}
                </div>
              </div>
              <div className="px-6 pb-6 sm:py-8 sm:pr-10 sm:pl-0" aria-hidden>
                <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-5">
                  <div className="mb-3 flex items-center justify-between text-xs">
                    <span className="font-semibold text-gray-700">Demand trend</span>
                    <span className="text-gray-400">Illustrative</span>
                  </div>
                  <div className="flex h-32 items-end gap-1.5 sm:h-40">
                    {[22, 28, 25, 34, 41, 38, 52, 60, 68, 76, 82].map((h, i) => (
                      <div
                        key={i}
                        className={`flex-1 rounded-t-md transition-colors ${
                          i >= 8
                            ? 'bg-primary/30 ring-1 ring-primary/40'
                            : 'bg-gradient-to-t from-primary to-blue-400'
                        }`}
                        style={{ height: `${h}%` }}
                      />
                    ))}
                  </div>
                  <div className="mt-2 flex justify-between text-[10px] text-gray-400">
                    <span>History</span>
                    <span>Forecast</span>
                  </div>
                </div>
              </div>
            </div>
          </article>

          {/* Three smaller cards in a row */}
          <div className="grid gap-5 sm:grid-cols-3">
            <article className="flex flex-col rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-50 text-emerald-600">
                <ClipboardCheck className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-bold tracking-tight text-gray-900">Student skill assessment</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Score any student against market roles. See matched and missing skills, readiness percentage, and a recommendation.
              </p>
              <div className="mt-6 flex-1" aria-hidden>
                <div className="flex items-end justify-between">
                  <span className="text-3xl font-extrabold text-gray-900">72%</span>
                  <span className="text-xs font-semibold text-gray-400">ready</span>
                </div>
                <div className="mt-2 h-2.5 rounded-full bg-gray-100">
                  <div className="h-full w-[72%] rounded-full bg-amber-500" />
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {['Python', 'SQL', 'Git'].map((s) => (
                    <span key={s} className={`${chip} bg-emerald-50 text-emerald-700`}>{s}</span>
                  ))}
                  {['TypeScript', 'Docker'].map((s) => (
                    <span key={s} className={`${chip} bg-red-50 text-red-600`}>{s}</span>
                  ))}
                </div>
              </div>
            </article>

            <article className="flex flex-col rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-rose-50 text-rose-600">
                <GraduationCap className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-bold tracking-tight text-gray-900">Curriculum alignment</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Upload a department's curriculum and see which in-demand skills it teaches and which it misses.
              </p>
              <div className="mt-6 flex-1 space-y-2.5" aria-hidden>
                {([['SE', 61, 'bg-amber-500'], ['Network', 44, 'bg-amber-500'], ['Finance', 73, 'bg-emerald-500'], ['Business', 33, 'bg-red-400']] as const).map(([l, p, c]) => (
                  <div key={l} className="flex items-center gap-3 text-xs">
                    <span className="w-14 font-semibold text-gray-600">{l}</span>
                    <span className="h-2 flex-1 rounded-full bg-gray-100">
                      <span className={`block h-2 rounded-full ${c}`} style={{ width: `${p}%` }} />
                    </span>
                  </div>
                ))}
              </div>
            </article>

            <article className="flex flex-col rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm sm:p-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-sky-50 text-sky-600">
                <FileBarChart className="h-5 w-5" />
              </span>
              <h3 className="mt-5 text-lg font-bold tracking-tight text-gray-900">Exportable reports</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-500">
                Role-specific reports for leadership, donors and employers — on-screen briefs, CSV and PDF.
              </p>
              <div className="mt-6 flex flex-1 flex-wrap content-start gap-2" aria-hidden>
                {['Student readiness', 'Cohort outcomes', 'Employer demand', 'Skills gap', 'Sector outlook'].map((r) => (
                  <span key={r} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
                    {r}
                    <span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-gray-400 ring-1 ring-gray-200">PDF</span>
                  </span>
                ))}
              </div>
            </article>
          </div>
        </div>
      </div>
    </section>
  )
}
