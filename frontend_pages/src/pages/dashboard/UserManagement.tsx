import { useState } from 'react'
import { keepPreviousData, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Search, UserPlus } from 'lucide-react'
import DashboardLayout, { Card } from './DashboardLayout'
import { EmptyState, QueryGate } from '../../components/ui/State'
import { ROLE_LABELS, useAuth } from '../../auth/AuthContext'
import { ALL_ROLES } from '../../auth/access'
import { authApi } from '../../services/api'
import { ApiError } from '../../services/http'
import { useInstitutions } from '../../services/queries'
import { fmtDate } from '../../lib/format'
import type { UserRole } from '../../types/api'

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
  const [form, setForm] = useState({ first_name: '', last_name: '', email: '', role: 'career_training_advisor', password: '', institution: '' })
  const create = useMutation({
    mutationFn: () => authApi.createUser({
      first_name: form.first_name.trim(), last_name: form.last_name.trim(), email: form.email.trim().toLowerCase(),
      role: form.role, password: form.password, institution_id: form.institution ? Number(form.institution) : null,
    }),
    onSuccess: () => {
      setForm({ first_name: '', last_name: '', email: '', role: 'career_training_advisor', password: '', institution: '' })
      setShowCreate(false)
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => setForm({ ...form, [k]: e.target.value })

  return (
    <DashboardLayout>
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy">User Management</h1>
          <p className="mt-2 text-sm text-gray-500">Manage who can use SkillSense and what they can access.</p>
        </div>
        <button onClick={() => setShowCreate((v) => !v)} className="flex items-center gap-2 rounded-lg bg-navy px-5 py-3 text-sm font-bold text-white shadow-sm hover:bg-dark-navy">
          <UserPlus className="h-4 w-4" /> {showCreate ? 'Cancel' : 'Add user'}
        </button>
      </div>

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
            <label className="block"><span className="text-[11px] font-bold uppercase tracking-wider text-navy">Temporary password</span><input type="password" autoComplete="new-password" value={form.password} onChange={set('password')} placeholder="At least 8 characters" className={inputClass} aria-label="Temporary password" /></label>
            <div className="md:col-span-3 flex flex-wrap items-center justify-end gap-4">
              {create.isError && <span role="alert" data-testid="create-error" className="text-sm font-medium text-red-600">{create.error instanceof ApiError ? create.error.message : 'Could not create the user.'}</span>}
              <button type="submit" disabled={!form.first_name || !form.email || form.password.length < 8 || create.isPending} className="flex items-center gap-2 rounded-lg bg-navy px-6 py-3 text-sm font-bold text-white hover:bg-dark-navy disabled:opacity-50">
                {create.isPending && <Loader2 className="h-4 w-4 animate-spin" />} Create user
              </button>
            </div>
          </form>
        </Card>
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
                      <th className="px-6 py-4 font-bold">User</th><th className="px-6 py-4 font-bold">Role</th><th className="px-6 py-4 font-bold">Institution</th><th className="px-6 py-4 font-bold">Joined</th><th className="px-6 py-4 font-bold">Last sign-in</th><th className="px-6 py-4 font-bold">Status</th>
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
                          <td className="px-6 py-4 text-gray-600">{fmtDate(row.date_joined)}</td>
                          <td className="px-6 py-4 text-gray-600">{fmtDate(row.last_login)}</td>
                          <td className="px-6 py-4">
                            <button disabled={update.isPending} onClick={() => update.mutate({ id: row.id, data: { is_active: !row.is_active } })} aria-label={`${row.is_active ? 'Deactivate' : 'Activate'} ${row.email}`} className={`rounded-full px-3 py-1 text-[11px] font-bold uppercase tracking-wide ${row.is_active ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                              {row.is_active ? 'Active' : 'Inactive'}
                            </button>
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
    </DashboardLayout>
  )
}
