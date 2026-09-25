import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { Check, Laptop, Loader2, LogOut, Lock } from 'lucide-react'
import DashboardLayout, { Card } from './DashboardLayout'
import { EmptyState, QueryGate } from '../../components/ui/State'
import { ROLE_LABELS, useAuth } from '../../auth/AuthContext'
import { authApi } from '../../services/api'
import { ApiError, tokenStore } from '../../services/http'
import { fmtDateTime, fmtDate } from '../../lib/format'

const UNAVAILABLE = ['Two-factor authentication', 'Notification preferences']

const inputClass =
  'mt-2 w-full rounded-lg border border-transparent bg-gray-50 px-4 py-3.5 text-sm text-gray-800 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20'

function Section({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr]">
      <div className="lg:pt-2">
        <h2 className="text-xl font-extrabold tracking-tight text-navy">{title}</h2>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">{desc}</p>
      </div>
      {children}
    </div>
  )
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

  if (!user) return null
  const dirty = first !== user.first_name || last !== user.last_name || email !== user.email
  const initials = ((user.first_name[0] ?? '') + (user.last_name[0] ?? '')).toUpperCase() || user.email.slice(0, 2).toUpperCase()
  const pwMismatch = confirmPw.length > 0 && newPw !== confirmPw

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-navy">Account Settings</h1>
        <p className="mt-2 text-sm text-gray-500">Manage your SkillSense profile and security.</p>
      </div>

      <Section title="Personal Profile" desc="Your identity within the SkillSense platform.">
        <Card className="p-8">
          <div className="flex items-center gap-5 border-b border-gray-100 pb-6">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy text-xl font-bold text-white">{initials}</div>
            <div>
              <div data-testid="settings-name" className="text-lg font-bold text-gray-900">{`${user.first_name} ${user.last_name}`.trim() || user.email}</div>
              <div data-testid="settings-role" className="mt-0.5 text-sm text-gray-500">{ROLE_LABELS[user.role]} · member since {fmtDate(user.date_joined)}</div>
            </div>
          </div>

          <form className="mt-6 space-y-6" onSubmit={(e) => { e.preventDefault(); save.mutate() }}>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <label className="block"><span className="text-[11px] font-bold uppercase tracking-wider text-navy">First name</span><input value={first} onChange={(e) => setFirst(e.target.value)} className={inputClass} aria-label="First name" /></label>
              <label className="block"><span className="text-[11px] font-bold uppercase tracking-wider text-navy">Last name</span><input value={last} onChange={(e) => setLast(e.target.value)} className={inputClass} aria-label="Last name" /></label>
            </div>
            <label className="block"><span className="text-[11px] font-bold uppercase tracking-wider text-navy">Email address</span><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} aria-label="Email address" /></label>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div><span className="text-[11px] font-bold uppercase tracking-wider text-navy">Role</span><div className="mt-2 rounded-lg bg-gray-100 px-4 py-3.5 text-sm text-gray-600">{ROLE_LABELS[user.role]}</div></div>
              <div><span className="text-[11px] font-bold uppercase tracking-wider text-navy">Institution</span><div className="mt-2 rounded-lg bg-gray-100 px-4 py-3.5 text-sm text-gray-600">{user.institution?.name ?? 'Not set'}</div></div>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-4">
              {save.isError && <span role="alert" className="text-sm font-medium text-red-600">{save.error instanceof ApiError ? save.error.message : 'Could not save.'}</span>}
              {save.isSuccess && !dirty && <span data-testid="saved" className="flex items-center gap-1 text-sm font-medium text-emerald-700"><Check className="h-4 w-4" /> Saved</span>}
              <button type="submit" disabled={!dirty || save.isPending} className="flex items-center gap-2 rounded-lg bg-navy px-8 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-dark-navy disabled:cursor-not-allowed disabled:opacity-50">
                {save.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Save changes
              </button>
            </div>
          </form>
        </Card>
      </Section>

      <Section title="Password" desc="Changing your password signs out every other device.">
        <Card className="p-8">
          <div className="flex items-center gap-2.5"><Lock className="h-5 w-5 text-navy" /><h3 className="text-lg font-bold text-gray-900">Update password</h3></div>
          <form className="mt-6 space-y-5" onSubmit={(e) => { e.preventDefault(); changePw.mutate() }} noValidate>
            <label className="block"><span className="text-[11px] font-bold uppercase tracking-wider text-navy">Current password</span><input type="password" autoComplete="current-password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} className={inputClass} aria-label="Current password" /></label>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <label className="block"><span className="text-[11px] font-bold uppercase tracking-wider text-navy">New password</span><input type="password" autoComplete="new-password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="At least 8 characters" className={inputClass} aria-label="New password" /></label>
              <label className="block"><span className="text-[11px] font-bold uppercase tracking-wider text-navy">Confirm new password</span><input type="password" autoComplete="new-password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className={inputClass} aria-label="Confirm new password" />{pwMismatch && <span className="mt-1 block text-xs font-medium text-red-600">Passwords do not match.</span>}</label>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-4">
              {changePw.isError && <span role="alert" data-testid="pw-error" className="text-sm font-medium text-red-600">{changePw.error instanceof ApiError ? changePw.error.message : 'Could not change the password.'}</span>}
              {changePw.isSuccess && <span data-testid="pw-changed" className="flex items-center gap-1 text-sm font-medium text-emerald-700"><Check className="h-4 w-4" /> Password updated{changePw.data.other_sessions_signed_out ? ` · ${changePw.data.other_sessions_signed_out} other session(s) signed out` : ''}</span>}
              <button type="submit" disabled={!oldPw || newPw.length < 8 || newPw !== confirmPw || changePw.isPending} className="flex items-center gap-2 rounded-lg bg-navy px-8 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-dark-navy disabled:cursor-not-allowed disabled:opacity-50">
                {changePw.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Change password
              </button>
            </div>
          </form>
        </Card>
      </Section>

      <Section title="Active Sessions" desc="Devices currently signed in to your account.">
        <Card className="overflow-x-auto p-2">
          <QueryGate query={sessions} className="m-6">
            {(list) =>
              list.length === 0 ? (
                <EmptyState title="No active sessions" className="m-4" />
              ) : (
                <table className="w-full min-w-[520px] text-left" data-testid="sessions-table">
                  <thead>
                    <tr className="text-[11px] font-bold uppercase tracking-wider text-gray-500"><th className="px-4 py-3 font-bold">Session</th><th className="px-4 py-3 font-bold">Signed in</th><th className="px-4 py-3 font-bold">Expires</th><th className="px-4 py-3 text-right font-bold">Action</th></tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {list.map((s) => (
                      <tr key={s.id} data-current={s.current} className="text-sm">
                        <td className="px-4 py-4"><span className="flex items-center gap-3 font-medium text-gray-900"><Laptop className="h-5 w-5 text-gray-500" />{s.current ? 'This device' : 'Another device'}</span></td>
                        <td className="px-4 py-4 text-gray-600">{fmtDateTime(s.created_at)}</td>
                        <td className="px-4 py-4 text-gray-600">{fmtDate(s.expires_at)}</td>
                        <td className="px-4 py-4 text-right">
                          {s.current ? <span className="text-sm font-semibold text-emerald-600">Current</span> : <button onClick={() => revoke.mutate(s.id)} disabled={revoke.isPending} className="text-sm font-bold text-red-500 hover:underline">Sign out</button>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )
            }
          </QueryGate>
        </Card>
      </Section>

      <Section title="Other Security Options" desc="Options that are planned but not built yet.">
        <Card className="divide-y divide-gray-100" data-testid="settings-unavailable">
          {UNAVAILABLE.map((u) => (
            <div key={u} className="flex items-center justify-between gap-4 px-6 py-5">
              <span className="text-base font-bold text-gray-400">{u}</span>
              <span data-mock="true" className="rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-700">Not available yet</span>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 px-6 py-5">
            <span className="text-base font-bold text-gray-900">Sign out on this device</span>
            <button onClick={async () => { await logout(); navigate('/signin') }} className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50"><LogOut className="h-4 w-4" /> Sign out</button>
          </div>
        </Card>
      </Section>
    </DashboardLayout>
  )
}
