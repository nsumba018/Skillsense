import {
  TrendingUp,
  FileText,
  BadgeCheck,
  ArrowLeftRight,
  Zap,
  BarChart3,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  ClipboardList,
  Share2,
  Mail,
  ChevronRight,
  CheckCircle2,
  Clock,
} from 'lucide-react'
import DashboardLayout, { Card } from './DashboardLayout'
import { Sparkline, DemandTrendChart, SectorDonut, sectorShare } from './charts'

const stats = [
  { label: 'Sectors Monitored', icon: BarChart3, value: '12', delta: '+1', color: '#7DD3C0', spark: [4, 6, 3, 7, 5, 8, 6, 9], iconTone: 'text-primary' },
  { label: 'Emerging Skills', icon: Sparkles, value: '47', delta: '+8', color: '#7DD3C0', spark: [3, 4, 4, 5, 6, 6, 7, 9], iconTone: 'text-primary' },
  { label: 'Employability Index', icon: TrendingUp, value: '68.4', delta: '+2.1', color: '#C9B99B', spark: [6, 7, 8, 8, 7, 6, 5, 5], iconTone: 'text-primary' },
  { label: 'Active Alerts', icon: AlertTriangle, value: '5', delta: '2 new', color: '#EF6B6B', spark: [5, 3, 6, 4, 7, 5, 8, 6], iconTone: 'text-red-500', deltaTone: 'text-red-500' },
]

const topSkills = [
  { name: 'Data Analysis', pct: 94 },
  { name: 'Software Dev', pct: 88 },
  { name: 'Financial Literacy', pct: 76 },
  { name: 'Digital Marketing', pct: 64 },
  { name: 'Supply Chain Mgmt', pct: 59 },
]

const districts = [
  { rank: '01', name: 'Gasabo', jobs: '12.4k Jobs', pct: 100, badge: 'HIGHEST GROWTH' },
  { rank: '02', name: 'Nyarugenge', jobs: '9.8k Jobs', pct: 79 },
  { rank: '03', name: 'Kicukiro', jobs: '8.2k Jobs', pct: 66 },
  { rank: '04', name: 'Musanze', jobs: '5.4k Jobs', pct: 44 },
  { rank: '05', name: 'Rubavu', jobs: '4.9k Jobs', pct: 40 },
  { rank: '06', name: 'Huye', jobs: '4.2k Jobs', pct: 34 },
]

const alerts = [
  {
    title: 'Critical Skills Shortage',
    time: '2H AGO',
    body: 'Cybersecurity demand in the financial sector has exceeded local supply by 42%. Immediate training intervention recommended.',
    accent: 'border-amber-400',
    bg: 'bg-amber-50/60',
    title_color: 'text-amber-900',
  },
  {
    title: 'Employability Surge',
    time: '5H AGO',
    body: 'Vocational graduates in Musanze District show a 15% higher placement rate this quarter due to tourism industry recovery.',
    accent: 'border-emerald-500',
    bg: 'bg-emerald-50/60',
    title_color: 'text-emerald-900',
  },
  {
    title: 'Data Reporting Lag',
    time: '1D AGO',
    body: 'Nyarugenge district labor data reporting has been delayed for the second consecutive period. Potential data integrity risk.',
    accent: 'border-red-500',
    bg: 'bg-red-50/60',
    title_color: 'text-red-900',
  },
]

const quickActions = [
  { icon: RefreshCw, title: 'Trigger Data Sync', desc: 'Manual pull from District Labor Offices' },
  { icon: ClipboardList, title: 'New Policy Brief', desc: 'Draft recommendation based on current trends' },
  { icon: Share2, title: 'Publish to Public Portal', desc: 'Export anonymized data to national dashboard' },
  { icon: Mail, title: 'Contact District Leads', desc: 'Bulk notification to labor market focal points' },
]

const refreshes = [
  {
    entity: 'Rwanda Development Board (RDB)',
    entitySub: 'Foreign Investment & Job Creation',
    stream: 'Investment Trends Q3',
    scheduled: 'Tomorrow, 09:00 AM',
    priority: 'HIGH',
    priorityTone: 'bg-red-100 text-red-600',
    status: 'Validated',
    statusIcon: CheckCircle2,
    statusTone: 'text-emerald-600',
  },
  {
    entity: 'TVET Board',
    entitySub: 'Vocational Training Outcomes',
    stream: 'Graduation Rates 2024',
    scheduled: 'Oct 14, 2024',
    priority: 'MEDIUM',
    priorityTone: 'bg-gray-100 text-gray-600',
    status: 'Pending',
    statusIcon: Clock,
    statusTone: 'text-gray-400',
  },
  {
    entity: 'National Institute of Statistics',
    entitySub: 'Demographic Labor Survey',
    stream: 'Active Workforce Ratio',
    scheduled: 'Oct 16, 2024',
    priority: 'LOW',
    priorityTone: 'bg-gray-100 text-gray-600',
    status: 'Pending',
    statusIcon: Clock,
    statusTone: 'text-gray-400',
  },
]

export default function Dashboard() {
  return (
    <DashboardLayout>
      {/* Welcome header */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900">
            Welcome, Jean Uwimana
          </h1>
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
            <span className="flex items-center gap-2 font-semibold text-gray-700">
              <BadgeCheck className="h-4 w-4 text-primary" />
              Policy Maker · MIFOTRA
            </span>
            <span className="hidden h-4 w-px bg-gray-300 sm:block" />
            <span className="text-gray-500">National Employment Program Oversight</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
            <ArrowLeftRight className="h-4 w-4" />
            Compare Districts
          </button>
          <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
            <Zap className="h-4 w-4" />
            Run Forecast
          </button>
          <button className="flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-dark-navy">
            <FileText className="h-4 w-4" />
            Generate Report
          </button>
        </div>
      </div>

      {/* Stat cards */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500">{s.label}</span>
              <s.icon className={`h-5 w-5 ${s.iconTone}`} />
            </div>
            <div className="mt-3 flex items-baseline gap-2">
              <span className="text-4xl font-extrabold tracking-tight text-gray-900">{s.value}</span>
              <span className={`text-sm font-semibold ${s.deltaTone ?? 'text-emerald-600'}`}>
                {s.deltaTone ? s.delta : `↑${s.delta}`}
              </span>
            </div>
            <div className="mt-3">
              <Sparkline points={s.spark} color={s.color} />
            </div>
          </Card>
        ))}
      </div>

      {/* Demand trend + Top skills */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="p-6 lg:col-span-2">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold text-gray-900">National Skills Demand Trend</h2>
              <p className="mt-1 text-sm text-gray-500">
                Aggregate demand projection across all sectors
              </p>
            </div>
            <div className="flex items-center gap-4 text-[11px] font-bold uppercase tracking-wide">
              <span className="flex items-center gap-1.5 text-navy">
                <span className="h-2.5 w-2.5 rounded-sm bg-navy" /> Historical
              </span>
              <span className="flex items-center gap-1.5 text-gray-400">
                <span className="h-2.5 w-2.5 rounded-sm bg-gray-300" /> Forecast
              </span>
            </div>
          </div>
          <div className="mt-4">
            <DemandTrendChart />
          </div>
          <p className="mt-3 text-xs text-gray-400">
            Source: MIFOTRA Labor Market Information System (LMIS) 2024 Report. Confidence
            interval: ±4.2%
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900">Top 5 In-Demand Skills</h2>
          <div className="mt-6 space-y-5">
            {topSkills.map((sk) => (
              <div key={sk.name}>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-bold text-gray-900">{sk.name}</span>
                  <span className="font-bold text-navy">{sk.pct}%</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-navy" style={{ width: `${sk.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Sector share + Top districts */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900">Sector Demand Share</h2>
          <div className="mt-6 flex flex-col items-center gap-8 sm:flex-row sm:items-center sm:justify-around">
            <SectorDonut />
            <ul className="space-y-2.5">
              {sectorShare.map((s) => (
                <li key={s.name} className="flex items-center gap-3 text-sm">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: s.color }} />
                  <span className="w-32 text-gray-600">{s.name}</span>
                  <span className="font-bold text-gray-900">{s.value}%</span>
                </li>
              ))}
            </ul>
          </div>
          <p className="mt-6 text-[11px] text-gray-400">
            Data Source: Rwanda Sector Skills Council Annual Projection 2024
          </p>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900">Top Districts by Demand</h2>
          <div className="mt-5 space-y-4">
            {districts.map((d) => (
              <div key={d.name}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-sm font-bold text-gray-300">{d.rank}</span>
                    <span className="text-sm font-bold text-gray-900">{d.name}</span>
                    {d.badge && (
                      <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-700">
                        {d.badge}
                      </span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-700">{d.jobs}</span>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-gray-100">
                  <div className="h-2 rounded-full bg-primary" style={{ width: `${d.pct}%` }} />
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Policy alerts + Quick actions */}
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900">Recent Policy Alerts</h2>
          <div className="mt-5 space-y-4">
            {alerts.map((a) => (
              <div key={a.title} className={`rounded-r-lg border-l-4 ${a.accent} ${a.bg} p-4`}>
                <div className="flex items-start justify-between gap-3">
                  <h3 className={`text-sm font-bold ${a.title_color}`}>{a.title}</h3>
                  <span className="shrink-0 text-[11px] font-semibold uppercase tracking-wide text-gray-400">
                    {a.time}
                  </span>
                </div>
                <p className="mt-1.5 text-sm leading-relaxed text-gray-600">{a.body}</p>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900">Quick Actions</h2>
          <div className="mt-5 space-y-3">
            {quickActions.map((q) => (
              <button
                key={q.title}
                className="flex w-full items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:border-gray-300 hover:bg-gray-50"
              >
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary-light text-primary">
                  <q.icon className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-gray-900">{q.title}</div>
                  <div className="text-xs text-gray-500">{q.desc}</div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-300" />
              </button>
            ))}
          </div>
        </Card>
      </div>

      {/* Upcoming data refreshes */}
      <Card className="mt-6 p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Upcoming Data Refreshes</h2>
          <a href="#" className="text-sm font-bold text-primary hover:underline">
            View Schedule
          </a>
        </div>
        <div className="mt-5 overflow-x-auto">
          <table className="w-full min-w-[640px] text-left">
            <thead>
              <tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                <th className="pb-3 pr-4 font-bold">Source Entity</th>
                <th className="pb-3 pr-4 font-bold">Data Stream</th>
                <th className="pb-3 pr-4 font-bold">Scheduled For</th>
                <th className="pb-3 pr-4 font-bold">Priority</th>
                <th className="pb-3 font-bold">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {refreshes.map((r) => (
                <tr key={r.entity} className="text-sm">
                  <td className="py-4 pr-4">
                    <div className="font-bold text-gray-900">{r.entity}</div>
                    <div className="text-xs text-gray-500">{r.entitySub}</div>
                  </td>
                  <td className="py-4 pr-4 text-gray-600">{r.stream}</td>
                  <td className="py-4 pr-4 text-gray-600">{r.scheduled}</td>
                  <td className="py-4 pr-4">
                    <span className={`rounded px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${r.priorityTone}`}>
                      {r.priority}
                    </span>
                  </td>
                  <td className="py-4">
                    <span className={`flex items-center gap-1.5 font-semibold ${r.statusTone}`}>
                      <r.statusIcon className="h-4 w-4" />
                      {r.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </DashboardLayout>
  )
}
