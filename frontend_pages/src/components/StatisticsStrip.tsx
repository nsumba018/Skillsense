import { SNAPSHOT } from '../lib/snapshot'

const stats = [
  { value: String(SNAPSHOT.sectors), label: 'Economic Sectors' },
  { value: String(SNAPSHOT.jobBoards.length), label: 'Job Boards Scraped' },
  { value: String(SNAPSHOT.totalPostings), label: 'Job Postings Analysed' },
  { value: String(SNAPSHOT.companies), label: 'Companies Identified' },
  { value: String(SNAPSHOT.roleGroups), label: 'Role Groups' },
  { value: SNAPSHOT.historyYears.replace('–20', '–'), label: 'Years of Labour Data' },
]

export default function StatisticsStrip() {
  return (
    <section className="bg-navy">
      <div className="container-1200 py-10 sm:py-12">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-x-6 gap-y-8 lg:gap-x-0">
          {stats.map((s, i) => (
            <div
              key={s.label}
              className={`flex flex-col-reverse justify-end ${
                i > 0 ? 'lg:border-l lg:border-white/10 lg:pl-6 xl:pl-8' : ''
              }`}
            >
              <dt className="mt-1 text-xs text-white/60">{s.label}</dt>
              <dd className="whitespace-nowrap text-2xl font-extrabold tracking-tight text-white sm:text-3xl">
                {s.value}
              </dd>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
