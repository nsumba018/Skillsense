import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Building2, CalendarDays, Check, Eye, EyeOff, KeyRound, Laptop, Loader2, LogOut, Mail, ShieldCheck, Sparkles, UserCog } from 'lucide-react'
import DashboardLayout, { Card } from './DashboardLayout'
import { EmptyState, QueryGate } from '../../components/ui/State'
import { ROLE_LABELS, useAuth } from '../../auth/AuthContext'
import { ACCESS, ROLE_FOCUS } from '../../auth/access'
import { authApi } from '../../services/api'
import { ApiError, tokenStore } from '../../services/http'
import { fmtDate, fmtDateTime } from '../../lib/format'
import type { UserRole } from '../../types/api'

const PAGE_LABEL: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/forecast': 'Role Forecast',
  '/dashboard/taxonomy': 'Role Taxonomy',
  '/dashboard/reports': 'Reports',
  '/dashboard/settings': 'Settings',
  '/dashboard/employability': 'Employability',
  '/dashboard/career': 'Career Guidance',
  '/dashboard/education': 'Education Alignment',
  '/dashboard/sectors': 'Sector Overview',
  '/dashboard/geography': 'Geography',
  '/dashboard/planning': 'Policy & Planning',
  '/dashboard/advisor': 'Advisor Dashboard',
  '/dashboard/advisor/assessment': 'Skill Assessment',
  '/dashboard/advisor/jobs': 'Job Navigator',
  '/dashboard/advisor/pathways': 'Career Pathways',
  '/dashboard/advisor/placements': 'Placement Tracker',
  '/dashboard/advisor/reports': 'Advisor Reports',
  '/dashboard/uploads': 'Data Upload',
  '/dashboard/users': 'User Management',
}

/** What each role can actually change (everything else is read-only for them). */
const ROLE_POWERS: Record<UserRole, string[]> = {
  admin: ['Upload job-posting data', 'Create and manage users', 'Run forecasts', 'See every role\'s pages'],
  career_training_advisor: ['Create student profiles', 'Run skill assessments', 'Save career pathways', 'Record placements and import them from CSV'],
  education_curriculum_planner: ['Upload curricula for gap analysis', 'Compare programmes with market demand', 'Export planning reports'],
  labor_market_analyst: ['Explore sector, role and regional demand', 'Build and export market reports', 'Read-only: no data changes'],
}

const inputClass =
  'mt-2 w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-800 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20'
const labelClass = 'text-[11px] font-bold uppercase tracking-wider text-navy'
const primaryBtn =
  'inline-flex items-center gap-2 rounded-lg bg-navy px-6 py-3 text-sm font-bold text-white shadow-sm transition-colors hover:bg-dark-navy disabled:cursor-not-allowed disabled:opacity-50'

const NAV = [
  { id: 'profile', label: 'Profile' },
  { id: 'workspace', label: 'Your access' },
  { id: 'password', label: 'Password' },
  { id: 'sessions', label: 'Sessions' },
]

function Section({ id, icon: Icon, title, desc, children }: { id: string; icon: React.ComponentType<{ className?: string }>; title: string; desc: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-28">
      <Card className="p-6 sm:p-8">
        <div className="mb-6 flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-light text-primary"><Icon className="h-5 w-5" /></span>
          <div>
            <h2 className="text-lg font-extrabold tracking-tight text-gray-900">{title}</h2>
            <p className="text-sm text-gray-500">{desc}</p>
          </div>
        </div>
        {children}
      </Card>
    </section>
  )
}

function strength(pw: string): { score: number; label: string; tone: string } {
  let score = 0
  if (pw.length >= 8) score++
  if (pw.length >= 12) score++
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++
  if (/\d/.test(pw) && /[^A-Za-z0-9]/.test(pw)) score++
  const levels = [
    { label: 'Too short', tone: 'bg-gray-300' },
    { label: 'Weak', tone: 'bg-red-500' },
    { label: 'Fair', tone: 'bg-amber-500' },
    { label: 'Good', tone: 'bg-emerald-400' },
    { label: 'Strong', tone: 'bg-emerald-600' },
  ]
  return { score, ...levels[pw ? score : 0] }
}

export default function Settings() {
  const { user, setUser, logout } = useAuth()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')
  const [email, setEmail] = useState('')
  const [oldPw, setOldPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [showPw, setShowPw] = useState(false)

  useEffect(() => {
    if (user) {
      setFirst(user.first_name)
      setLast(user.last_name)
      setEmail(user.email)
    }
  }, [user])

  const save = useMutation({
    mutationFn: () => authApi.updateMe({ first_name: first.trim(), last_name: last.trim(), email: email.trim(), username: user!.username }),
    onSuccess: setUser,
  })
  const changePw = useMutation({
    mutationFn: () => authApi.changePassword(oldPw, newPw, tokenStore.refresh),
    onSuccess: () => {
      setOldPw('')
      setNewPw('')
      setConfirmPw('')
      queryClient.invalidateQueries({ queryKey: ['sessions'] })
    },
  })
  const sessions = useQuery({ queryKey: ['sessions'], queryFn: () => authApi.sessions(tokenStore.refresh) })
  const revoke = useMutation({
    mutationFn: (id: number) => authApi.revokeSession(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sessions'] }),
  })

  const pages = useMemo(
    () => (user ? Object.entries(ACCESS).filter(([, roles]) => roles.includes(user.role)).map(([path]) => ({ path, label: PAGE_LABEL[path] ?? path })) : []),
    [user],
  )

  if (!user) return null
  const dirty = first !== user.first_name || last !== user.last_name || email !== user.email
  const fullName = `${user.first_name} ${user.last_name}`.trim() || user.email
  const initials = ((user.first_name[0] ?? '') + (user.last_name[0] ?? '')).toUpperCase() || user.email.slice(0, 2).toUpperCase()
  const pwMismatch = confirmPw.length > 0 && newPw !== confirmPw
  const pw = strength(newPw)
  const focus = ROLE_FOCUS[user.role]
  const others = (sessions.data ?? []).filter((s) => !s.current)

  return (
    <DashboardLayout>
      {/* Identity banner */}
      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy to-primary text-white shadow-md">
        <div className="flex flex-col gap-5 p-6 sm:flex-row sm:items-center sm:p-8">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-2xl font-extrabold ring-1 ring-white/30">{initials}</div>
          <div className="min-w-0">
            <p className="text-[11px] font-bold uppercase tracking-widest text-blue-200/80">Account settings</p>
            <h1 data-testid="settings-name" className="truncate text-2xl font-extrabold tracking-tight sm:text-3xl">{fullName}</h1>
            <p data-testid="settings-role" className="mt-1 text-sm text-blue-100/90">{ROLE_LABELS[user.role]} · member since {fmtDate(user.date_joined)}</p>
            <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-blue-100/80">
              <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{user.email}</span>
              <span className="inline-flex items-center gap-1.5"><Building2 className="h-3.5 w-3.5" />{user.institution?.name ?? 'No institution set'}</span>
              <span className="inline-flex items-center gap-1.5"><CalendarDays className="h-3.5 w-3.5" />Joined {fmtDate(user.date_joined)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[200px_1fr]">
        <nav aria-label="Settings sections" className="hidden lg:block">
          <ul className="sticky top-28 space-y-1">
            {NAV.map((n) => (
              <li key={n.id}>
                <a href={`#${n.id}`} className="block rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 transition-colors hover:bg-white hover:text-navy">{n.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="space-y-6">
          <Section id="profile" icon={UserCog} title="Profile" desc="How you appear in SkillSense.">
            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); save.mutate() }}>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <label className="block"><span className={labelClass}>First name</span><input value={first} onChange={(e) => setFirst(e.target.value)} className={inputClass} aria-label="First name" /></label>
                <label className="block"><span className={labelClass}>Last name</span><input value={last} onChange={(e) => setLast(e.target.value)} className={inputClass} aria-label="Last name" /></label>
              </div>
              <label className="block"><span className={labelClass}>Email address</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} aria-label="Email address" /></label>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div><span className={labelClass}>Role</span><div className="mt-2 rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-600">{ROLE_LABELS[user.role]}</div></div>
                <div><span className={labelClass}>Institution</span><div className="mt-2 rounded-lg bg-gray-100 px-4 py-3 text-sm text-gray-600">{user.institution?.name ?? 'Not set'}</div></div>
              </div>
              <p className="text-xs text-gray-400">Your role and institution are set by an administrator.</p>
              <div className="flex flex-wrap items-center justify-end gap-4">
                {save.isError && <span role="alert" className="text-sm font-medium text-red-600">{save.error instanceof ApiError ? save.error.message : 'Could not save.'}</span>}
                {save.isSuccess && !dirty && <span data-testid="saved" className="flex items-center gap-1 text-sm font-medium text-emerald-700"><Check className="h-4 w-4" /> Saved</span>}
                <button type="submit" disabled={!dirty || save.isPending} className={primaryBtn}>
                  {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
                </button>
              </div>
            </form>
          </Section>

          <Section id="workspace" icon={Sparkles} title={`Your access as ${ROLE_LABELS[user.role]}`} desc={focus.tagline}>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">What you can do</h3>
                <ul className="space-y-2">
                  {ROLE_POWERS[user.role].map((p) => (
                    <li key={p} className="flex items-start gap-2 text-sm text-gray-700"><Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />{p}</li>
                  ))}
                </ul>
                <h3 className="mb-3 mt-6 text-xs font-bold uppercase tracking-wider text-gray-500">Jump to</h3>
                <ul className="space-y-1.5">
                  {focus.links.map((l) => (
                    <li key={l.to}>
                      <Link to={l.to} className="group inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
                        {l.label}<ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Pages open to you ({pages.length})</h3>
                <ul className="flex flex-wrap gap-2" data-testid="role-pages">
                  {pages.map((p) => (
                    <li key={p.path}>
                      <Link to={p.path} className="inline-block rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-semibold text-gray-700 transition-colors hover:border-primary hover:bg-primary-light hover:text-primary">{p.label}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </Section>

          <Section id="password" icon={KeyRound} title="Password" desc="Changing your password signs out every other device.">
            <form className="space-y-5" onSubmit={(e) => { e.preventDefault(); changePw.mutate() }} noValidate>
              <label className="block"><span className={labelClass}>Current password</span><input type={showPw ? 'text' : 'password'} autoComplete="current-password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} className={inputClass} aria-label="Current password" /></label>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className={labelClass}>New password</span>
                  <input type={showPw ? 'text' : 'password'} autoComplete="new-password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="At least 8 characters" className={inputClass} aria-label="New password" />
                  {newPw && (
                    <span className="mt-2 flex items-center gap-2" aria-live="polite">
                      <span className="flex flex-1 gap-1">{[1, 2, 3, 4].map((i) => <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= pw.score ? pw.tone : 'bg-gray-200'}`} />)}</span>
                      <span className="text-xs font-semibold text-gray-500">{pw.label}</span>
                    </span>
                  )}
                </label>
                <label className="block">
                  <span className={labelClass}>Confirm new password</span>
                  <input type={showPw ? 'text' : 'password'} autoComplete="new-password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className={inputClass} aria-label="Confirm new password" />
                  {pwMismatch && <span className="mt-1 block text-xs font-medium text-red-600">Passwords do not match.</span>}
                </label>
              </div>
              <button type="button" onClick={() => setShowPw(!showPw)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-800">
                {showPw ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />} {showPw ? 'Hide' : 'Show'} passwords
              </button>
              <div className="flex flex-wrap items-center justify-end gap-4">
                {changePw.isError && <span role="alert" data-testid="pw-error" className="text-sm font-medium text-red-600">{changePw.error instanceof ApiError ? changePw.error.message : 'Could not change the password.'}</span>}
                {changePw.isSuccess && <span data-testid="pw-changed" className="flex items-center gap-1 text-sm font-medium text-emerald-700"><Check className="h-4 w-4" /> Password updated{changePw.data.other_sessions_signed_out ? ` · ${changePw.data.other_sessions_signed_out} other session(s) signed out` : ''}</span>}
                <button type="submit" disabled={!oldPw || newPw.length < 8 || newPw !== confirmPw || changePw.isPending} className={primaryBtn}>
                  {changePw.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Change password
                </button>
              </div>
            </form>
          </Section>

          <Section id="sessions" icon={ShieldCheck} title="Sessions and security" desc="Devices signed in to your account.">
            <QueryGate query={sessions}>
              {(list) =>
                list.length === 0 ? (
                  <EmptyState title="No active sessions" />
                ) : (
                  <ul className="divide-y divide-gray-100 rounded-xl border border-gray-100" data-testid="sessions-table">
                    {list.map((s) => (
                      <li key={s.id} data-current={s.current} className="flex flex-wrap items-center gap-4 px-4 py-4">
                        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${s.current ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}><Laptop className="h-5 w-5" /></span>
                        <div className="min-w-0 flex-1">
                          <div className="text-sm font-bold text-gray-900">{s.current ? 'This device' : 'Another device'}</div>
                          <div className="text-xs text-gray-500">Signed in {fmtDateTime(s.created_at)} · expires {fmtDate(s.expires_at)}</div>
                        </div>
                        {s.current ? (
                          <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-bold text-emerald-700">Current</span>
                        ) : (
                          <button onClick={() => revoke.mutate(s.id)} disabled={revoke.isPending} className="text-sm font-bold text-red-500 hover:underline">Sign out</button>
                        )}
                      </li>
                    ))}
                  </ul>
                )
              }
            </QueryGate>

            <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-gray-100 pt-6">
              <div className="flex gap-2">
                {others.length > 0 && (
                  <button onClick={() => others.forEach((s) => revoke.mutate(s.id))} disabled={revoke.isPending} className="rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50">
                    Sign out other devices ({others.length})
                  </button>
                )}
                <button onClick={async () => { await logout(); navigate('/signin') }} className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50">
                  <LogOut className="h-4 w-4" /> Sign out
                </button>
              </div>
            </div>
          </Section>
        </div>
      </div>
    </DashboardLayout>
  )
}
