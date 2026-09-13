import { Link, NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  TrendingUp,
  Briefcase,
  Layers,
  MapPin,
  FileText,
  Settings,
  Search,
  Bell,
  User,
  Download,
  LifeBuoy,
  Lock,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/dashboard' },
  { label: 'Skills Forecast', icon: TrendingUp, to: '/dashboard/skills-forecast' },
  { label: 'Employability', icon: Briefcase, to: '/dashboard/employability' },
  { label: 'Sectors', icon: Layers, to: '/dashboard/sectors' },
  { label: 'Geography', icon: MapPin, to: '/dashboard/geography' },
  { label: 'Reports', icon: FileText, to: '/dashboard/reports' },
  { label: 'Settings', icon: Settings, to: '/dashboard/settings' },
]

export function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-2xl border border-gray-200 bg-white shadow-sm ${className}`}>{children}</div>
  )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-page text-gray-900">
      <div className="flex">
        {/* ---------------- Sidebar ---------------- */}
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-gray-200 bg-white lg:flex">
          <div className="px-6 py-6">
            <Link to="/" className="flex items-center gap-2">
              <img src="/logo_icon.webp" alt="SkillSense logo" className="h-8 w-auto" />
              <div className="leading-tight">
                <div className="text-lg font-extrabold tracking-tight text-navy">SkillSense</div>
                <div className="text-[11px] text-gray-400">Intelligence Platform</div>
              </div>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 px-3">
            {navItems.map((item) => (
              <NavLink
                key={item.label}
                to={item.to}
                end
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-primary-light text-navy'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`
                }
              >
                <item.icon className="h-5 w-5" strokeWidth={2} />
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="space-y-4 px-4 pb-6">
            <button className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-dark-navy">
              <Download className="h-4 w-4" />
              Export Data
            </button>
            <div className="space-y-1 px-1">
              <a href="#" className="flex items-center gap-3 py-1.5 text-sm text-gray-500 hover:text-gray-900">
                <LifeBuoy className="h-4 w-4" />
                Help Center
              </a>
              <a href="#" className="flex items-center gap-3 py-1.5 text-sm text-gray-500 hover:text-gray-900">
                <Lock className="h-4 w-4" />
                Privacy
              </a>
            </div>
          </div>
        </aside>

        {/* ---------------- Main column ---------------- */}
        <div className="flex-1">
          {/* Top bar */}
          <header className="sticky top-0 z-20 border-b border-gray-200 bg-page/95 backdrop-blur-sm">
            <div className="flex items-center gap-4 px-6 py-4 lg:px-8">
              <div className="relative hidden max-w-md flex-1 sm:block">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search insights..."
                  className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>

              <div className="ml-auto flex items-center gap-4">
                <span className="hidden items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-gray-500 md:flex">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                  Updated 2m ago
                </span>
                <button className="text-gray-400 hover:text-gray-700" aria-label="Notifications">
                  <Bell className="h-5 w-5" />
                </button>
                <button className="text-gray-400 hover:text-gray-700" aria-label="Settings">
                  <Settings className="h-5 w-5" />
                </button>
                <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
                  <div className="text-right leading-tight">
                    <div className="text-sm font-bold text-gray-900">Dr. Jean Uwimana</div>
                    <div className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
                      Lead Analyst
                    </div>
                  </div>
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-light text-primary">
                    <User className="h-5 w-5" />
                  </div>
                </div>
              </div>
            </div>
          </header>

          {/* Page content */}
          <main className="px-6 py-8 lg:px-8">
            {children}

            {/* Footer */}
            <footer className="mt-10 flex flex-col gap-4 border-t border-gray-200 pt-6 text-sm md:flex-row md:items-center md:justify-between">
              <div>
                <div className="font-bold text-navy">National Skills Intelligence Platform</div>
                <p className="mt-1 text-xs text-gray-500">
                  © 2024 Ministry of Public Service and Labour (MIFOTRA), Rwanda. All rights reserved.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-gray-500">
                <a href="#" className="hover:text-gray-900">Methodology</a>
                <a href="#" className="hover:text-gray-900">Data Sources</a>
                <a href="#" className="hover:text-gray-900">Privacy Policy</a>
                <a href="#" className="hover:text-gray-900">Terms of Use</a>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </div>
  )
}
