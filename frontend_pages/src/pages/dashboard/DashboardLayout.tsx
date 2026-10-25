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
  Network,
  Compass,
  GraduationCap,
  UploadCloud,
  LogOut,
  Landmark,
  Users,
  UserCheck,
  Target,
  BriefcaseBusiness,
  Route,
  BarChart4,
  ClipboardList,
  Menu,
  X,
} from 'lucide-react'
import { canAccess } from '../../auth/access'
import { ROLE_LABELS, useAuth } from '../../auth/AuthContext'
import { useOverview } from '../../services/queries'
import { fmtDateTime } from '../../lib/format'
interface NavItem {
  label: string
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>
  to: string
}

/** Every page; each user sees only the ones their role can open (see auth/access.ts). */
const navItems: NavItem[] = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Advisor Dashboard', icon: UserCheck, to: '/dashboard/advisor' },
  { label: 'Skill Assessment', icon: Target, to: '/dashboard/advisor/assessment' },
  { label: 'Job Navigator', icon: BriefcaseBusiness, to: '/dashboard/advisor/jobs' },
  { label: 'Career Pathways', icon: Route, to: '/dashboard/advisor/pathways' },
  { label: 'Placement Tracker', icon: BarChart4, to: '/dashboard/advisor/placements' },
  { label: 'Advisor Reports', icon: ClipboardList, to: '/dashboard/advisor/reports' },
  { label: 'Sector Overview', icon: Layers, to: '/dashboard/sectors' },
  { label: 'Role Forecast', icon: TrendingUp, to: '/dashboard/forecast' },
  { label: 'Employability', icon: Briefcase, to: '/dashboard/employability' },
  { label: 'Career Guidance', icon: Compass, to: '/dashboard/career' },
  { label: 'Education Alignment', icon: GraduationCap, to: '/dashboard/education' },
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
  const [menuOpen, setMenuOpen] = useState(false)
  const items = navItems.filter((n) => canAccess(user?.role, n.to))
  const fullName = user ? `${user.first_name} ${user.last_name}`.trim() || user.email : ''
  const lastRun = overview.data?.model_info.last_run

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const q = search.trim()
    navigate(q ? `/dashboard/taxonomy?q=${encodeURIComponent(q)}` : '/dashboard/taxonomy')
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
                <div className="text-[11px] text-gray-400">
                  Workforce Intelligence
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

          {user && (
            <div className="m-3 rounded-xl border border-gray-200 bg-gray-50 p-3">
              <div className="text-xs font-bold text-gray-900">{fullName}</div>
              <div className="mt-0.5 text-[11px] text-gray-500">{ROLE_LABELS[user.role]}</div>
            </div>
          )}
        </aside>

        {/* ---------------- Mobile navigation drawer ---------------- */}
        {menuOpen && (
          <div className="fixed inset-0 z-40 lg:hidden" role="dialog" aria-modal="true" aria-label="Navigation">
            <button type="button" aria-label="Close menu" className="absolute inset-0 bg-gray-900/40" onClick={() => setMenuOpen(false)} />
            <div className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-white shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
                <Link to="/" className="flex items-center gap-2">
                  <img src="/logo_icon.webp" alt="" className="h-7 w-auto" />
                  <span className="text-lg font-extrabold tracking-tight text-navy">SkillSense</span>
                </Link>
                <button type="button" onClick={() => setMenuOpen(false)} aria-label="Close menu" className="rounded-lg p-2 text-gray-500 hover:bg-gray-100">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <nav className="flex-1 space-y-1 overflow-y-auto p-3" aria-label="Main">
                {items.map((item) => (
                  <NavLink key={item.label} to={item.to} end className={linkClass} onClick={() => setMenuOpen(false)}>
                    <item.icon className="h-5 w-5" strokeWidth={2} />
                    {item.label}
                  </NavLink>
                ))}
              </nav>
              {user && (
                <div className="border-t border-gray-100 p-4">
                  <div className="text-sm font-bold text-gray-900">{fullName}</div>
                  <div className="text-xs text-gray-500">{ROLE_LABELS[user.role]}</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ---------------- Main column ---------------- */}
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 border-b border-gray-200 bg-page/95 backdrop-blur-sm">
            <div className="flex items-center gap-3 px-4 py-3 sm:gap-4 sm:px-6 sm:py-4 lg:px-8">
              <button
                type="button"
                onClick={() => setMenuOpen(true)}
                aria-label="Open navigation menu"
                aria-expanded={menuOpen}
                className="-ml-1 rounded-lg p-2 text-gray-600 hover:bg-white lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </button>
              <Link to="/" className="flex items-center gap-2 lg:hidden" aria-label="SkillSense home">
                <img src="/logo_icon.webp" alt="" className="h-7 w-auto" />
                <span className="hidden text-base font-extrabold tracking-tight text-navy min-[420px]:inline">SkillSense</span>
              </Link>
              <form onSubmit={onSearch} className="relative hidden max-w-md flex-1 sm:block" role="search">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search sectors & roles…"
                  aria-label="Search roles"
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </form>

              <div className="ml-auto flex items-center gap-3 sm:gap-4">
                <span
                  data-testid="last-run"
                  className="hidden items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 md:flex"
                >
                  <span className={`h-1.5 w-1.5 rounded-full ${lastRun ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                  {lastRun ? `Forecast run ${fmtDateTime(lastRun)}` : 'No forecast run yet'}
                </span>
                <div className="flex items-center gap-3 sm:border-l sm:border-gray-200 sm:pl-4">
                  <div className="hidden text-right leading-tight sm:block">
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

          </header>

          <main className="px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  )
}
