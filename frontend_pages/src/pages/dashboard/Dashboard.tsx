import { Link } from 'react-router-dom'
import {
  Shield,
  Users,
  UploadCloud,
  Settings,
  Database,
  Activity,
  Clock,
  FileText,
  TrendingUp,
  BookOpen,
  Briefcase,
  UserCheck,
  Mail,
} from 'lucide-react'
import DashboardLayout, { Card, PageHeader } from './DashboardLayout'
import { QueryGate } from '../../components/ui/State'
import { useAuth, ROLE_LABELS } from '../../auth/AuthContext'
import { useAdminStats } from '../../services/queries'
import { fmtInt, fmtDate, fmtDateTime } from '../../lib/format'

const ROLE_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  admin: Shield,
  labor_market_analyst: Briefcase,
  education_curriculum_planner: BookOpen,
  career_training_advisor: UserCheck,
}

const ROLE_COLOR: Record<string, string> = {
  admin: 'bg-red-50 text-red-700',
  labor_market_analyst: 'bg-blue-50 text-blue-700',
  education_curriculum_planner: 'bg-emerald-50 text-emerald-700',
  career_training_advisor: 'bg-purple-50 text-purple-700',
}

const STATUS_STYLE: Record<string, string> = {
  completed: 'bg-emerald-50 text-emerald-700',
  processing: 'bg-blue-50 text-blue-700',
  failed: 'bg-red-50 text-red-700',
  pending: 'bg-amber-50 text-amber-700',
}

export default function Dashboard() {
  const { user } = useAuth()
  const stats = useAdminStats()

  return (
    <DashboardLayout>
      <PageHeader
        icon={Shield}
        title="Admin Dashboard"
        subtitle={`Welcome back, ${user?.first_name ?? 'Admin'}. Platform overview and management.`}
        actions={
          <div className="flex flex-wrap items-center gap-3">
            <Link to="/dashboard/uploads" className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
              <UploadCloud className="h-4 w-4" />
              Upload Data
            </Link>
            <Link to="/dashboard/users" className="flex items-center gap-2 rounded-lg bg-navy px-4 py-2.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-dark-navy">
              <Users className="h-4 w-4" />
              Manage Users
            </Link>
          </div>
        }
      />

      <QueryGate query={stats} className="mt-8">
        {(s) => (<>

          {/* ══════ System Overview KPIs ══════ */}
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Total Users</span>
                <Users className="h-5 w-5 text-purple-600" />
              </div>
              <div className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900">{s.users.total}</div>
              <p className="mt-3 text-xs text-gray-500">
                {s.users.pending_invites > 0
                  ? `${s.users.pending_invites} pending invite${s.users.pending_invites > 1 ? 's' : ''}`
                  : 'All invitations accepted'}
              </p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Job Postings</span>
                <Database className="h-5 w-5 text-blue-600" />
              </div>
              <div className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900">{fmtInt(s.data.total_postings)}</div>
              <p className="mt-3 text-xs text-gray-500">{s.data.total_roles} roles · {s.data.total_sectors} sectors tracked</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Active Bulletins</span>
                <BookOpen className="h-5 w-5 text-emerald-600" />
              </div>
              <div className="mt-3 text-4xl font-extrabold tracking-tight text-gray-900">{s.data.active_bulletins}</div>
              <p className="mt-3 text-xs text-gray-500">Department curricula loaded</p>
            </Card>
            <Card className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">Last Forecast</span>
                <TrendingUp className="h-5 w-5 text-amber-600" />
              </div>
              <div className="mt-3 text-lg font-extrabold tracking-tight text-gray-900">
                {s.forecasts.last_role_forecast ? fmtDate(s.forecasts.last_role_forecast) : 'Never'}
              </div>
              {s.forecasts.accuracy != null && (
                <p className="mt-3 text-xs text-gray-500">Model accuracy: {(s.forecasts.accuracy * 100).toFixed(1)}% (Spearman)</p>
              )}
              {s.forecasts.accuracy == null && (
                <p className="mt-3 text-xs text-gray-500">{s.forecasts.model_version ?? 'No forecast run yet'}</p>
              )}
            </Card>
          </div>

          {/* ══════ Quick Actions ══════ */}
          <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <Link to="/dashboard/uploads">
              <Card className="p-5 transition-colors hover:border-primary/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50">
                    <UploadCloud className="h-5 w-5 text-blue-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Upload Data</h3>
                    <p className="text-xs text-gray-500">Job posting datasets</p>
                  </div>
                </div>
              </Card>
            </Link>
            <Link to="/dashboard/users">
              <Card className="p-5 transition-colors hover:border-primary/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-50">
                    <Users className="h-5 w-5 text-purple-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Manage Users</h3>
                    <p className="text-xs text-gray-500">Invite & manage accounts</p>
                  </div>
                </div>
              </Card>
            </Link>
            <Link to="/dashboard/settings">
              <Card className="p-5 transition-colors hover:border-primary/40">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100">
                    <Settings className="h-5 w-5 text-gray-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">Settings</h3>
                    <p className="text-xs text-gray-500">Account & system config</p>
                  </div>
                </div>
              </Card>
            </Link>
            {s.users.pending_invites > 0 && (
              <Link to="/dashboard/users">
                <Card className="border-amber-200 p-5 ring-1 ring-amber-100 transition-colors hover:border-amber-300">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
                      <Mail className="h-5 w-5 text-amber-700" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-amber-900">{s.users.pending_invites} Pending Invite{s.users.pending_invites > 1 ? 's' : ''}</h3>
                      <p className="text-xs text-amber-600">Resend or check status</p>
                    </div>
                  </div>
                </Card>
              </Link>
            )}
          </div>

          {/* ══════ Users by Role + Recent Activity ══════ */}
          <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">

            {/* Users by role */}
            <Card className="p-6">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold text-gray-900">Users by Role</h2>
                <Link to="/dashboard/users" className="text-sm font-semibold text-primary hover:underline">Manage &rarr;</Link>
              </div>
              <div className="mt-5 space-y-4">
                {Object.entries(s.users.by_role).map(([role, count]) => {
                  const Icon = ROLE_ICON[role] ?? Users
                  const color = ROLE_COLOR[role] ?? 'bg-gray-50 text-gray-700'
                  const label = ROLE_LABELS[role as keyof typeof ROLE_LABELS] ?? role
                  const pct = s.users.total > 0 ? Math.round((count / s.users.total) * 100) : 0
                  return (
                    <div key={role}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className={`flex h-8 w-8 items-center justify-center rounded-lg ${color}`}>
                            <Icon className="h-4 w-4" />
                          </span>
                          <span className="text-sm font-medium text-gray-800">{label}</span>
                        </div>
                        <span className="text-sm font-bold text-gray-900">{count}</span>
                      </div>
                      <div className="mt-1.5 ml-10 h-1.5 w-full rounded-full bg-gray-100">
                        <div className={`h-1.5 rounded-full ${color.split(' ')[0].replace('50', '400')}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Card>

            {/* Recent user activity */}
            <Card className="p-6">
              <div className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-bold text-gray-900">Recent User Activity</h2>
              </div>
              <div className="mt-5 divide-y divide-gray-100">
                {s.users.recent.length === 0 ? (
                  <p className="py-4 text-sm text-gray-400">No login activity recorded yet.</p>
                ) : (
                  s.users.recent.map(u => (
                    <div key={u.id} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <span className={`flex h-8 w-8 items-center justify-center rounded-full text-[11px] font-bold ${ROLE_COLOR[u.role] ?? 'bg-gray-50 text-gray-700'}`}>
                          {u.first_name?.[0] ?? u.email[0].toUpperCase()}
                        </span>
                        <div>
                          <span className="text-sm font-medium text-gray-800">
                            {u.first_name && u.last_name ? `${u.first_name} ${u.last_name}` : u.email}
                          </span>
                          <div className="text-[11px] text-gray-400">{ROLE_LABELS[u.role as keyof typeof ROLE_LABELS] ?? u.role}</div>
                        </div>
                      </div>
                      <div className="text-right">
                        {u.last_login ? (
                          <>
                            <div className="text-xs font-medium text-gray-600">{fmtDate(u.last_login)}</div>
                            <div className="text-[10px] text-gray-400">{fmtDateTime(u.last_login).split(',')[1]?.trim()}</div>
                          </>
                        ) : (
                          <span className="text-xs text-gray-400">Never logged in</span>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>

          {/* ══════ Data Health ══════ */}
          <Card className="mt-8 p-6">
            <div className="flex items-center gap-2">
              <Database className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-900">Data Health</h2>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-5 sm:grid-cols-4">
              <div className="rounded-xl bg-blue-50 p-4 text-center">
                <div className="text-2xl font-extrabold text-blue-700">{fmtInt(s.data.total_postings)}</div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-blue-500">Job Postings</div>
              </div>
              <div className="rounded-xl bg-indigo-50 p-4 text-center">
                <div className="text-2xl font-extrabold text-indigo-700">{s.data.total_roles}</div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-indigo-500">Roles Tracked</div>
              </div>
              <div className="rounded-xl bg-emerald-50 p-4 text-center">
                <div className="text-2xl font-extrabold text-emerald-700">{s.data.total_sectors}</div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-emerald-500">Sectors</div>
              </div>
              <div className="rounded-xl bg-amber-50 p-4 text-center">
                <div className="text-2xl font-extrabold text-amber-700">{s.data.active_bulletins}</div>
                <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-amber-500">Curricula</div>
              </div>
            </div>
          </Card>

          {/* ══════ Recent Uploads ══════ */}
          <Card className="mt-8 p-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-gray-400" />
                <h2 className="text-lg font-bold text-gray-900">Recent Uploads</h2>
              </div>
              <Link to="/dashboard/uploads" className="text-sm font-semibold text-primary hover:underline">View all &rarr;</Link>
            </div>
            {s.data.recent_uploads.length === 0 ? (
              <p className="mt-4 text-sm text-gray-400">No uploads yet. Upload job posting data to power the platform.</p>
            ) : (
              <div className="mt-4 divide-y divide-gray-100">
                {s.data.recent_uploads.map(u => (
                  <div key={u.id} className="flex items-center justify-between py-3">
                    <div className="flex items-center gap-3">
                      <FileText className="h-4 w-4 text-gray-400" />
                      <div>
                        <span className="text-sm font-medium text-gray-800">{u.original_filename}</span>
                        <div className="text-[11px] text-gray-400">{fmtDate(u.created_at)} · {fmtInt(u.total_records)} records ({fmtInt(u.ict_records)} ICT)</div>
                      </div>
                    </div>
                    <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ${STATUS_STYLE[u.status] ?? 'bg-gray-100 text-gray-500'}`}>{u.status}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* ══════ Forecast Status ══════ */}
          <Card className="mt-8 p-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-gray-400" />
              <h2 className="text-lg font-bold text-gray-900">Forecast Status</h2>
            </div>
            <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="rounded-xl border border-gray-200 p-5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Role Forecast</div>
                <div className="mt-2 text-sm font-bold text-gray-900">
                  {s.forecasts.last_role_forecast ? `Last run: ${fmtDateTime(s.forecasts.last_role_forecast)}` : 'No forecast run yet'}
                </div>
                {s.forecasts.model_version && (
                  <div className="mt-1 text-xs text-gray-500">Model: {s.forecasts.model_version}</div>
                )}
                {s.forecasts.accuracy != null && (
                  <div className="mt-1 text-xs text-gray-500">Accuracy: {(s.forecasts.accuracy * 100).toFixed(1)}% Spearman correlation</div>
                )}
              </div>
              <div className="rounded-xl border border-gray-200 p-5">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Sector Forecast</div>
                <div className="mt-2 text-sm font-bold text-gray-900">
                  {s.forecasts.last_sector_forecast ? `Last run: ${fmtDateTime(s.forecasts.last_sector_forecast)}` : 'No sector forecast yet'}
                </div>
                <div className="mt-1 text-xs text-gray-500">{s.data.total_sectors} sectors · {s.data.total_roles} roles covered</div>
              </div>
            </div>
          </Card>

        </>)}
      </QueryGate>
    </DashboardLayout>
  )
}
