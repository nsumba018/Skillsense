import { SNAPSHOT } from '../lib/snapshot'

const stats = [
  { value: String(SNAPSHOT.roles), label: 'Roles tracked' },
  { value: String(SNAPSHOT.sectors), label: 'Economic sectors' },
  { value: '3', label: 'Forecast horizons' },
  { value: SNAPSHOT.rankCorrelation.toFixed(2), label: 'Rank correlation on validation' },
  { value: SNAPSHOT.historyYears.replace('–20', '–'), label: 'Years of labour data' },
  { value: String(SNAPSHOT.totalPostings), label: 'Real job postings analysed' },
]

/** Figures are the static snapshot in lib/snapshot.ts. */
export default function StatisticsStrip() {
  return (
    <section className="border-y border-gray-200/70 bg-white">
      <div className="container-1200 py-12">
        <dl className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-3 lg:grid-cols-6 lg:gap-x-0">
          {stats.map((s, i) => (
            <div key={s.label} className={`flex flex-col-reverse justify-end lg:px-4 xl:px-6 ${i > 0 ? 'lg:border-l lg:border-gray-200' : 'lg:pl-0'}`}>
              <dt className="mt-1 text-xs leading-snug text-gray-500 sm:text-sm">{s.label}</dt>
              <dd className="whitespace-nowrap text-3xl font-extrabold tracking-tight text-navy sm:text-4xl lg:text-3xl xl:text-4xl">{s.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-8 text-center text-xs text-gray-400">Snapshot as of {SNAPSHOT.asOf}. The dashboard shows live values after sign-in.</p>
      </div>
    </section>
  )
}
