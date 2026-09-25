import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  Layers,
  MapPin,
  FileText,
  Settings,
  Search,
  User,
  Download,
  BookOpen,
  Network,
  Compass,
  GraduationCap,
  UploadCloud,
  LogOut,
  Code2,
  Landmark,
  Users,
} from 'lucide-react'
import { canAccess } from '../../auth/access'
import { API_URL } from '../../config'
import { ROLE_LABELS, useAuth } from '../../auth/AuthContext'
import { useOverview } from '../../services/queries'
import { reportsApi } from '../../services/api'
import { fmtDateTime } from '../../lib/format'
interface NavItem {
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  to: string
}

/** Every page; each user sees only the ones their role can open (see auth/access.ts). */
const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Role Forecast', icon: TrendingUp, to: '/dashboard/forecast' },
  { label: 'Employability', icon: Briefcase, to: '/dashboard/employability' },
  { label: 'Career Guidance', icon: Compass, to: '/dashboard/career' },
  { label: 'Education Alignment', icon: GraduationCap, to: '/dashboard/education' },
  { label: 'ICT Sector', icon: Layers, to: '/dashboard/sectors' },
  { label: 'Geography', icon: MapPin, to: '/dashboard/geography' },
  { label: 'Policy & Planning', icon: Landmark, to: '/dashboard/planning' },
  { label: 'Role Taxonomy', icon: Network, to: '/dashboard/taxonomy' },
  { label: 'Reports', icon: FileText, to: '/dashboard/reports' },
  { label: 'Data Upload', icon: UploadCloud, to: '/dashboard/uploads' },
  { label: 'User Management', icon: Users, to: '/dashboard/users' },
  { label: 'Settings', icon: Settings, to: '/dashboard/settings' },
]

export function Card({ children, className = '', ...rest }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`} {...rest}>
      {children}
    </div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const overview = useOverview()
  const [search, setSearch] = useState('')
  const [exportError, setExportError] = useState<string | null>(null)

  const items = navItems.filter((n) => canAccess(user?.role, n.to))
  const fullName = user ? `${user.first_name} ${user.last_name}`.trim() || user.email : ''
  const lastRun = overview.data?.model_info.last_run

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = search.trim()
    navigate(q ? `/dashboard/taxonomy?q=${encodeURIComponent(q)}` : '/dashboard/taxonomy')
  }

  const onExport = async () => {
    setExportError(null)
    try {
      await reportsApi.downloadDemandOutlookCsv()
    } catch {
      setExportError('Export failed')
    }
  }

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
      isActive ? 'bg-primary-light text-navy' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
    }`

  return (
    <div className="min-h-screen bg-page text-gray-900">
      <div className="flex">
        {/* ---------------- Sidebar ---------------- */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col overflow-y-auto border-r border-gray-200 bg-white lg:flex">
          <div className="px-6 py-6">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo_icon.webp" alt="SkillSense logo" className="h-8 w-auto" />
              <div className="leading-tight">
                <div className="text-lg font-extrabold tracking-tight text-navy">SkillSense</div>
                <div className="flex items-center gap-1 text-[11px] text-gray-400">
                  <Code2 className="h-3 w-3" /> ICT Intelligence
                </div>
              </div>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 px-3" aria-label="Main">
            {items.map((item) => (
              <NavLink key={item.label} to={item.to} end className={linkClass}>
                <item.icon className="h-5 w-5" strokeWidth={2} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="space-y-4 px-4 py-6">
            <button
              onClick={onExport}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-dark-navy"
            >
              <Download className="h-4 w-4" />
              Export Forecast CSV
            </button>
            {exportError && <p className="text-center text-xs text-red-500">{exportError}</p>}
            <div className="space-y-1 px-1">
              <a
                href={`${API_URL}/api/docs/`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-3 py-1.5 text-sm text-gray-500 hover:text-gray-900"
              >
                <BookOpen className="h-4 w-4" />
                API Documentation
              </a>
            </div>
          </div>
        </aside>

        {/* ---------------- Main column ---------------- */}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-gray-200 bg-page/95 backdrop-blur-sm">
            <div className="flex items-center gap-4 px-6 py-4 lg:px-8">
              <form onSubmit={onSearch} className="relative hidden max-w-md flex-1 sm:block" role="search">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search ICT roles…"
                  aria-label="Search ICT roles"
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </form>

              <div className="ml-auto flex items-center gap-4">
                <span
                  data-testid="last-run"
                  className="hidden items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 md:flex"
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${lastRun ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  {lastRun ? `Forecast run ${fmtDateTime(lastRun)}` : 'No forecast run yet'}
                </span>
                <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
                  <div className="text-right leading-tight">
                    <div data-testid="user-name" className="text-sm font-bold text-gray-900">
                      {fullName}
                    </div>
                    <div data-testid="user-role" className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                      {user ? ROLE_LABELS[user.role] : ''}
                    </div>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-primary">
                    <User className="h-5 w-5" />
                  </div>
                  <button
                    onClick={async () => {
                      await logout()
                      navigate('/signin')
                    }}
                    aria-label="Sign out"
                    title="Sign out"
                    className="text-gray-400 transition-colors hover:text-red-500"
                  >
                    <LogOut className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Compact navigation for small screens */}
            <nav className="flex gap-1 overflow-x-auto border-t border-gray-100 px-4 py-2 lg:hidden" aria-label="Mobile">
              {items.map((item) => (
                <NavLink key={item.label} to={item.to} end className={linkClass}>
                  <item.icon className="h-4 w-4" />
                  <span className="whitespace-nowrap">{item.label}</span>
                </NavLink>
              ))}
            </nav>
          </header>

          <main className="px-6 py-8 lg:px-8">
            {children}

            <footer className="mt-10 flex flex-col gap-2 border-t border-gray-200 pt-6 text-sm md:flex-row md:items-center md:justify-between">
              <div className="font-bold text-navy">SkillSense: ICT Workforce Intelligence for Rwanda</div>
              <p className="text-xs text-gray-500">
                Forecasts for 20 ICT roles · trained on NISR Labour Force Survey data and current ICT job postings
              </p>
            </footer>
          </main>
        </div>
      </div>
    </div>
  )
}
