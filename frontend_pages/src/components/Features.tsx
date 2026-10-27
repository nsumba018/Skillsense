import { ClipboardCheck, GraduationCap, LineChart, FileBarChart } from 'lucide-react'

const chip = 'rounded-full px-2.5 py-1 text-[11px] font-semibold'

function Card({ className = '', icon: Icon, tone, title, text, children }: {
  className?: string
  icon: React.ComponentType<{ className?: string }>
  tone: string
  title: string
  text: string
  children?: React.ReactNode
}) {
  return (
    <article className={`group flex flex-col overflow-hidden rounded-3xl border border-gray-200/80 bg-white p-6 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 sm:p-8 ${className}`}>
      <span className={`flex h-11 w-11 items-center justify-center rounded-xl ${tone}`}><Icon className="h-5 w-5" /></span>
      <h3 className="mt-5 text-xl font-bold tracking-tight text-gray-900">{title}</h3>
      <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-500">{text}</p>
      {children && <div className="mt-6 flex-1" aria-hidden>{children}</div>}
    </article>
  )
}

export default function Features() {
  return (
    <section id="features" className="scroll-mt-20 py-20 sm:py-28">
      <div className="container-1200">
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">What SkillSense does</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">From forecasts to placed graduates</h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500 sm:text-lg">
            Four capabilities that close the loop between knowing what employers will need — across all sectors — and getting students ready.
          </p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <Card icon={LineChart} tone="bg-blue-50 text-blue-600" title="Role & sector demand forecasts"
            text="Six-month, one-year and two-year outlooks across 9 sectors, with confidence ranges. Trained on NISR Labour Force Survey data.">
            <div className="flex h-28 items-end gap-1.5 sm:h-36">
              {[22, 28, 25, 34, 41, 38, 52, 60, 68, 76].map((h, i) => (
                <div key={i} className={`flex-1 rounded-t-md ${i >= 7 ? 'bg-primary/35 ring-1 ring-primary/40' : 'bg-gradient-to-t from-primary to-blue-400'}`} style={{ height: `${h}%` }} />
              ))}
            </div>
          </Card>

          <Card icon={ClipboardCheck} tone="bg-emerald-50 text-emerald-600" title="Student skill assessment"
            text="Score any student against market roles. See matched and missing skills, readiness percentage, and a recommendation.">
            <div>
              <div className="flex items-end justify-between"><span className="text-4xl font-extrabold text-gray-900">72%</span><span className="text-xs font-semibold text-gray-400">ready</span></div>
              <div className="mt-2 h-2.5 rounded-full bg-gray-100"><div className="h-full w-[72%] rounded-full bg-amber-500" /></div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {['Python', 'SQL', 'Git'].map(s => <span key={s} className={`${chip} bg-emerald-50 text-emerald-700`}>{s}</span>)}
                {['TypeScript', 'Docker'].map(s => <span key={s} className={`${chip} bg-red-50 text-red-600`}>{s}</span>)}
              </div>
            </div>
          </Card>

          <Card icon={GraduationCap} tone="bg-rose-50 text-rose-600" title="Curriculum alignment"
            text="Upload a department's curriculum and see which in-demand skills it teaches and which it misses.">
            <div className="space-y-2.5">
              {[['SE', 61, 'bg-amber-500'], ['Network', 44, 'bg-amber-500'], ['Finance', 73, 'bg-emerald-500'], ['Business', 33, 'bg-red-400']].map(([l, p, c]) => (
                <div key={l as string} className="flex items-center gap-3 text-xs"><span className="w-14 font-semibold text-gray-600">{l}</span><span className="h-2 flex-1 rounded-full bg-gray-100"><span className={`block h-2 rounded-full ${c}`} style={{ width: `${p}%` }} /></span></div>
              ))}
            </div>
          </Card>

          <Card icon={FileBarChart} tone="bg-sky-50 text-sky-600" title="Exportable reports"
            text="Role-specific reports for leadership, donors and employers — on-screen briefs, CSV and PDF.">
            <div className="flex flex-wrap gap-2">
              {['Student readiness', 'Cohort outcomes', 'Employer demand', 'Skills gap', 'Sector outlook'].map((r) => (
                <span key={r} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs font-semibold text-gray-700">
                  {r}<span className="rounded bg-white px-1.5 py-0.5 text-[10px] font-bold text-gray-400 ring-1 ring-gray-200">PDF</span>
                </span>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </section>
  )
}
