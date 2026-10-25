import { useState } from 'react'
import { Check, Compass, GraduationCap, LineChart, ShieldCheck } from 'lucide-react'

interface Role {
  id: string
  icon: React.ComponentType<{ className?: string }>
  label: string
  headline: string
  text: string
  points: string[]
  preview: React.ReactNode
}

const Pill = ({ tone, children }: { tone: 'ok' | 'gap'; children: React.ReactNode }) => (
  <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${tone === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>{children}</span>
)

const Bar = ({ label, pct, color }: { label: string; pct: number; color: string }) => (
  <div>
    <div className="mb-1 flex justify-between text-xs"><span className="font-medium text-gray-700">{label}</span><span className="font-bold text-gray-900">{pct}%</span></div>
    <div className="h-2 rounded-full bg-gray-100"><div className={`h-2 rounded-full ${color}`} style={{ width: `${pct}%` }} /></div>
  </div>
)

const ROLES: Role[] = [
  {
    id: 'advisor',
    icon: Compass,
    label: 'Career & Training Advisors',
    headline: 'Turn the job market into advice for one student',
    text: 'See how ready each student is for the roles they want, what to learn next, and whether your graduates are actually getting hired.',
    points: [
      'Score a student against any ICT or Business role',
      'Match them to live postings by the skills employers ask for',
      'Build a pathway using Innovation Center courses',
      'Track placements and report outcomes to funders',
    ],
    preview: (
      <>
        <div className="flex items-start justify-between">
          <div><div className="text-sm font-bold text-gray-900">Sample student</div><div className="text-xs text-gray-500">Target: Full-Stack Developer</div></div>
          <div className="text-right"><div className="text-3xl font-extrabold text-gray-900">72%</div><div className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">Ready</div></div>
        </div>
        <div className="mt-3 h-2.5 rounded-full bg-gray-100"><div className="h-full w-[72%] rounded-full bg-amber-500" /></div>
        <div className="mt-4 flex flex-wrap gap-1.5"><Pill tone="ok">Python</Pill><Pill tone="ok">SQL</Pill><Pill tone="ok">Git</Pill><Pill tone="ok">REST APIs</Pill><Pill tone="gap">TypeScript</Pill><Pill tone="gap">Docker</Pill></div>
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs leading-relaxed text-amber-900">Focus on TypeScript and Docker. The Innovation Center&apos;s Web Development course covers both.</div>
      </>
    ),
  },
  {
    id: 'planner',
    icon: GraduationCap,
    label: 'Education & Curriculum Planners',
    headline: 'Teach what employers will hire for',
    text: 'Upload a programme and see which in-demand skills it teaches and which it misses, department by department.',
    points: [
      'Upload curricula and read the skills they teach',
      'Compare each department with market demand',
      'See gaps the Innovation Center can fill',
      'Export alignment reports for review committees',
    ],
    preview: (
      <div className="space-y-4">
        <div className="text-sm font-bold text-gray-900">Curriculum alignment</div>
        <Bar label="Software Engineering" pct={61} color="bg-amber-500" />
        <Bar label="Network & Info Management" pct={44} color="bg-amber-500" />
        <Bar label="Finance" pct={73} color="bg-emerald-500" />
        <Bar label="Business Administration" pct={33} color="bg-red-400" />
        <p className="text-[11px] text-gray-400">Illustrative figures</p>
      </div>
    ),
  },
  {
    id: 'analyst',
    icon: LineChart,
    label: 'Labour Market Analysts',
    headline: 'See demand by role, sector and region',
    text: 'Forecasts with confidence ranges, sector comparisons and planning briefs, ready to drop into a report.',
    points: [
      'Role demand forecasts at six, twelve and twenty-four months',
      'Nine sectors compared side by side',
      'Regional demand from posting locations',
      'Planning briefs and exportable reports',
    ],
    preview: (
      <>
        <div className="text-sm font-bold text-gray-900">ICT demand outlook</div>
        <div className="mt-4 flex h-32 items-end gap-2" aria-hidden>
          {[28, 34, 31, 42, 49, 58, 66, 74].map((h, i) => (
            <div key={i} className={`flex-1 rounded-t ${i >= 5 ? 'bg-primary/40 ring-1 ring-primary/50' : 'bg-primary'}`} style={{ height: `${h}%` }} />
          ))}
        </div>
        <div className="mt-2 flex justify-between text-[10px] text-gray-400"><span>History</span><span>Forecast</span></div>
        <p className="mt-2 text-[11px] text-gray-400">Illustrative shape</p>
      </>
    ),
  },
  {
    id: 'admin',
    icon: ShieldCheck,
    label: 'Administrators',
    headline: 'Keep the data and the people in order',
    text: 'Bring in new job-posting data, manage who can see what, and keep forecasts current.',
    points: [
      'Upload job-posting CSVs and watch processing',
      'Invite users and assign roles',
      'Re-run forecasts when new data lands',
      'Every role keeps its own focused pages',
    ],
    preview: (
      <div className="space-y-3">
        <div className="text-sm font-bold text-gray-900">Recent uploads</div>
        {[['rwandajob_sep.csv', 'Completed'], ['jobweb_oct.csv', 'Processing'], ['greatjobs_oct.csv', 'Completed']].map(([f, s]) => (
          <div key={f} className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5 text-xs">
            <span className="font-medium text-gray-700">{f}</span>
            <span className={`font-bold ${s === 'Completed' ? 'text-emerald-600' : 'text-amber-600'}`}>{s}</span>
          </div>
        ))}
        <p className="text-[11px] text-gray-400">Illustrative</p>
      </div>
    ),
  },
]

export default function RoleShowcase() {
  const [active, setActive] = useState(ROLES[0].id)
  const role = ROLES.find((r) => r.id === active) ?? ROLES[0]

  return (
    <section id="stakeholders" className="scroll-mt-20 bg-gradient-to-b from-white to-primary-light/40 py-20 sm:py-28">
      <div className="container-1200">
        <div className="mx-auto mb-12 max-w-2xl text-center">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">Built for your role</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">Everyone gets the pages they actually need</h2>
          <p className="mt-4 text-base text-gray-500">No shared clutter. Each role signs in to its own focused workspace.</p>
        </div>

        <div role="tablist" aria-label="Roles" className="no-scrollbar -mx-5 mb-8 flex snap-x gap-2 overflow-x-auto px-5 pb-2 sm:mx-0 sm:flex-wrap sm:justify-center sm:overflow-visible sm:px-0">
          {ROLES.map((r) => (
            <button
              key={r.id}
              role="tab"
              id={`tab-${r.id}`}
              aria-selected={active === r.id}
              aria-controls={`panel-${r.id}`}
              onClick={() => setActive(r.id)}
              className={`inline-flex shrink-0 snap-start items-center gap-2 whitespace-nowrap rounded-full px-4 py-2.5 text-sm font-semibold transition-all ${
                active === r.id ? 'bg-navy text-white shadow-md' : 'border border-gray-200 bg-white text-gray-600 hover:border-primary/40 hover:text-primary'
              }`}
            >
              <r.icon className="h-4 w-4" />
              {r.label}
            </button>
          ))}
        </div>

        <div
          role="tabpanel"
          id={`panel-${role.id}`}
          aria-labelledby={`tab-${role.id}`}
          className="grid items-center gap-8 rounded-3xl border border-gray-200/80 bg-white p-6 shadow-xl shadow-gray-200/50 md:p-10 lg:grid-cols-2 lg:gap-14"
        >
          <div>
            <h3 className="text-2xl font-extrabold tracking-tight text-gray-900 md:text-3xl">{role.headline}</h3>
            <p className="mt-3 text-base leading-relaxed text-gray-500">{role.text}</p>
            <ul className="mt-6 space-y-3">
              {role.points.map((p) => (
                <li key={p} className="flex items-start gap-3 text-sm text-gray-700">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-100"><Check className="h-3 w-3 text-emerald-700" /></span>
                  {p}
                </li>
              ))}
            </ul>
          </div>
          <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-3 sm:p-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">{role.preview}</div>
          </div>
        </div>
      </div>
    </section>
  )
}
