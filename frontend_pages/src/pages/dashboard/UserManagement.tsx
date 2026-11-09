import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Search, Trash2, Users, UserPlus } from 'lucide-react'
import DashboardLayout, { Card, PageHeader } from './DashboardLayout'
import { EmptyState, QueryGate } from '../../components/ui/State'
import { ROLE_LABELS, useAuth } from '../../auth/AuthContext'
import { ALL_ROLES } from '../../auth/access'
import { authApi } from '../../services/api'
import { ApiError } from '../../services/http'
import { useInstitutions } from '../../services/queries'
import { fmtDate } from '../../lib/format'
import type { AdminUser, UserRole } from '../../types/api'

const inputClass = 'mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

export default function UserManagement() {
  const { user: me } = useAuth()
  const queryClient = useQueryClient()
  const institutions = useInstitutions()
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [page, setPage] = useState(1)
  const [rowError, setRowError] = useState<string | null>(null)

  const users = useQuery({
    queryKey: ['users', search, roleFilter, page],
    queryFn: () => authApi.users({ search: search || undefined, role: roleFilter || undefined, page }),
    placeholderData: keepPreviousData,
  })
  const update = useMutation({
    mutationFn: ({ id, data }: { id: number; data: { role?: string; is_active?: boolean } }) => authApi.updateUser(id, data),
    onSuccess: () => { setRowError(null); queryClient.invalidateQueries({ queryKey: ['users'] }) },
    onError: (e) => setRowError(e instanceof ApiError ? e.message : 'Could not update the user.'),
  })

  const [showCreate, setShowCreate] = useState(false)
  const [inviteSent, setInviteSent] = useState<string | null>(null)
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', role: 'career_training_advisor', institution: '', password: '' })
  const create = useMutation({
    mutationFn: () => authApi.createUser({
      first_name: form.first_name.trim(), last_name: form.last_name.trim(), email: form.email.trim().toLowerCase(),
      role: form.role, institution_id: form.institution ? Number(form.institution) : null,
      password: form.password || undefined,
    }),
    onSuccess: () => {
      const email = form.email.trim().toLowerCase()
      setForm({ first_name: '', last_name: '', email: '', role: 'career_training_advisor', institution: '', password: '' })
      setShowCreate(false)
      setInviteSent(email)
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setTimeout(() => setInviteSent(null), 6000)
    },
  })
  const resend = useMutation({
    mutationFn: (userId: number) => authApi.resendInvite(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
    onError: (e) => setRowError(e instanceof ApiError ? e.message : 'Could not resend invitation.'),
  })
  const [toDelete, setToDelete] = useState<AdminUser | null>(null)
  const [deletePw, setDeletePw] = useState('')
  const [deleted, setDeleted] = useState<string | null>(null)
  const remove = useMutation({
    mutationFn: () => authApi.deleteUser(toDelete!.id, deletePw),
    onSuccess: () => {
      setDeleted(toDelete!.email)
      setToDelete(null)
      setDeletePw('')
      queryClient.invalidateQueries({ queryKey: ['users'] })
      setTimeout(() => setDeleted(null), 6000)
    },
  })
  const closeDelete = () => { setToDelete(null); setDeletePw(''); remove.reset() }
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value })

  return (
    <DashboardLayout>
      <PageHeader
        icon={Users}
        title="User Management"
        subtitle="Manage who can use SkillSense and what they can access."
        actions={
          <button onClick={() => setShowCreate((v) => !v)} className="flex items-center gap-2 rounded-lg bg-navy px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-dark-navy">
            <UserPlus className="h-4 w-4" /> {showCreate ? 'Cancel' : 'Invite user'}
          </button>
        }
      />

      {showCreate && (
        <Card className="mt-6 p-6" data-testid="create-user">
          <form className="grid grid-cols-1 gap-5 md:grid-cols-3" onSubmit={(e) => { e.preventDefault(); create.mutate() }}>
            <label className="block"><span className="text-[11px] font-bold uppercase tracking-wider text-navy">First name</span><input value={form.first_name} onChange={set('first_name')} className={inputClass} aria-label="First name" /></label>
            <label className="block"><span className="text-[11px] font-bold uppercase tracking-wider text-navy">Last name</span><input value={form.last_name} onChange={set('last_name')} className={inputClass} aria-label="Last name" /></label>
            <label className="block"><span className="text-[11px] font-bold uppercase tracking-wider text-navy">Email</span><input type="email" value={form.email} onChange={set('email')} className={inputClass} aria-label="Email" /></label>
            <label className="block"><span className="text-[11px] font-bold uppercase tracking-wider text-navy">Role</span>
              <select value={form.role} onChange={set('role')} className={inputClass} aria-label="Role">{ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}</select></label>
            <label className="block"><span className="text-[11px] font-bold uppercase tracking-wider text-navy">Institution</span>
              <select value={form.institution} onChange={set('institution')} className={inputClass} aria-label="Institution"><option value="">None</option>{(institutions.data ?? []).map((i) => <option key={i.id} value={i.id}>{i.name}</option>)}</select></label>
            <label className="block md:col-span-3"><span className="text-[11px] font-bold uppercase tracking-wider text-navy">Temporary password (optional)</span>
              <input type="text" autoComplete="off" value={form.password} onChange={set('password')} placeholder="Leave blank to generate one automatically" className={inputClass} aria-label="Temporary password" />
              <span className="mt-1 block text-xs text-gray-500">It is emailed to the user with a sign-in link. They must replace it the first time they sign in.</span></label>
            <div className="md:col-span-3 flex flex-wrap items-center justify-end gap-4">
              {create.isError && <span role="alert" data-testid="create-error" className="text-sm font-medium text-red-600">{create.error instanceof ApiError ? create.error.message : 'Could not send invitation.'}</span>}
              <button type="submit" disabled={!form.first_name || !form.email || create.isPending} className="flex items-center gap-2 rounded-lg bg-navy px-6 py-3 text-sm font-bold text-white hover:bg-dark-navy disabled:opacity-50">
                {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Send invite
              </button>
            </div>
          </form>
        </Card>
      )}

      {deleted && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Deleted {deleted}
        </div>
      )}
      {inviteSent && (
        <div className="mt-4 flex items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">
          Invitation with sign-in details sent to {inviteSent}
        </div>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={(e) => { setSearch(e.target.value); setPage(1) }} placeholder="Search name or email…" aria-label="Search users" className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
        </div>
        <select value={roleFilter} onChange={(e) => { setRoleFilter(e.target.value); setPage(1) }} aria-label="Filter by role" className="rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm outline-none focus:border-primary">
          <option value="">All roles</option>
          {ALL_ROLES.map((r) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
        </select>
      </div>
      {rowError && <p role="alert" data-testid="row-error" className="mt-4 text-sm font-medium text-red-600">{rowError}</p>}

      <Card className="mt-4 overflow-x-auto">
        <QueryGate query={users} className="m-6">
          {(u) =>
            u.results.length === 0 ? (
              <EmptyState title="No users match" className="m-6" />
            ) : (
              <>
                <table className="w-full min-w-[820px] text-left" data-testid="users-table">
                  <thead>
                    <tr className="border-b border-gray-200 bg-gray-50/60 text-[11px] font-bold uppercase tracking-wider text-gray-500">
                      <th className="px-6 py-4 font-bold">User</th><th className="px-6 py-4 font-bold">Role</th><th className="px-6 py-4 font-bold">Institution</th><th className="px-6 py-4 font-bold">Invite</th><th className="px-6 py-4 font-bold">Joined</th><th className="px-6 py-4 font-bold">Last sign-in</th><th className="px-6 py-4 font-bold">Status</th><th className="px-6 py-4 font-bold"><span className="sr-only">Actions</span></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {u.results.map((row) => {
                      const self = row.id === me?.id
                      return (
                        <tr key={row.id} data-email={row.email} className="text-sm">
                          <td className="px-6 py-4"><div className="font-bold text-gray-900">{`${row.first_name} ${row.last_name}`.trim() || row.email}{self && <span className="ml-2 text-[10px] font-bold uppercase text-primary">You</span>}</div><div className="text-xs text-gray-500">{row.email}</div></td>
                          <td className="px-6 py-4">
                            <select value={row.role} disabled={update.isPending} aria-label={`Role for ${row.email}`} onChange={(e) => update.mutate({ id: row.id, data: { role: e.target.value } })} className="rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm outline-none focus:border-primary">
                              {ALL_ROLES.map((r: UserRole) => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                            </select>
                          </td>
                          <td className="px-6 py-4 text-gray-600">{row.institution?.name ?? '-'}</td>
                          <td className="px-6 py-4">
                            {row.invitation_status === 'accepted' ? (
                              <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold uppercase text-emerald-700">Accepted</span>
                            ) : row.invitation_status === 'pending' ? (
                              <span className="inline-flex items-center gap-1.5">
                                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold uppercase text-amber-700">Pending</span>
                                <button onClick={() => resend.mutate(row.id)} disabled={resend.isPending} className="text-[11px] font-bold text-primary hover:underline disabled:opacity-50">Resend</button>
                              </span>
                            ) : row.invitation_status === 'expired' ? (
                              <span className="inline-flex items-center gap-1.5">
                                <span className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold uppercase text-red-600">Expired</span>
                                <button onClick={() => resend.mutate(row.id)} disabled={resend.isPending} className="text-[11px] font-bold text-primary hover:underline disabled:opacity-50">Resend</button>
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">-</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-gray-600">{fmtDate(row.date_joined)}</td>
                          <td className="px-6 py-4 text-gray-600">{fmtDate(row.last_login)}</td>
                          <td className="px-6 py-4">
                            <button disabled={update.isPending} onClick={() => update.mutate({ id: row.id, data: { is_active: !row.is_active } })} aria-label={`${row.is_active ? 'Deactivate' : 'Activate'} ${row.email}`} className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${row.is_active ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                              {row.is_active ? 'Active' : 'Inactive'}
                            </button>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {!self && (
                              <button onClick={() => setToDelete(row)} aria-label={`Delete ${row.email}`} title="Delete user" className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600">
                                <Trash2 className="h-4 w-4" />
                              </button>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
                <div className="flex items-center justify-between border-t border-gray-100 px-6 py-3 text-xs text-gray-500">
                  <span data-testid="users-count">{u.count} user{u.count === 1 ? '' : 's'}</span>
                  <span className="flex gap-2">
                    <button disabled={!u.previous} onClick={() => setPage((p) => p - 1)} className="rounded border border-gray-200 px-3 py-1 font-bold disabled:opacity-40">Previous</button>
                    <button disabled={!u.next} onClick={() => setPage((p) => p + 1)} className="rounded border border-gray-200 px-3 py-1 font-bold disabled:opacity-40">Next</button>
                  </span>
                </div>
              </>
            )
          }
        </QueryGate>
      </Card>

      {toDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" role="dialog" aria-modal="true" aria-labelledby="delete-title">
          <form
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onSubmit={(e) => { e.preventDefault(); remove.mutate() }}
          >
            <h2 id="delete-title" className="text-lg font-extrabold text-navy">Delete this user?</h2>
            <p className="mt-2 text-sm text-gray-600">
              <span className="font-bold">{`${toDelete.first_name} ${toDelete.last_name}`.trim() || toDelete.email}</span> ({toDelete.email}) will lose access and the account will be permanently removed. This cannot be undone.
            </p>
            <label className="mt-5 block">
              <span className="text-[11px] font-bold uppercase tracking-wider text-navy">Enter your password to confirm</span>
              <input type="password" autoFocus autoComplete="current-password" value={deletePw} onChange={(e) => setDeletePw(e.target.value)} className={inputClass} aria-label="Your password" />
            </label>
            {remove.isError && <p role="alert" className="mt-3 text-sm font-medium text-red-600">{remove.error instanceof ApiError ? remove.error.message : 'Could not delete the user.'}</p>}
            <div className="mt-6 flex justify-end gap-3">
              <button type="button" onClick={closeDelete} className="rounded-lg border border-gray-200 px-5 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50">Cancel</button>
              <button type="submit" disabled={!deletePw || remove.isPending} className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-red-700 disabled:opacity-50">
                {remove.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Delete user
              </button>
            </div>
          </form>
        </div>
      )}
    </DashboardLayout>
  )
}
