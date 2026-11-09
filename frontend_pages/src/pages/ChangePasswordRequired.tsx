import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { AlertCircle, KeyRound, Loader2 } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { authApi } from '../services/api'
import { ApiError, tokenStore } from '../services/http'

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20'

/** Shown on first sign-in: the account still has an admin-issued temporary password that must be replaced. */
export default function ChangePasswordRequired() {
  const { user, loading, logout, setUser } = useAuth()
  const navigate = useNavigate()
  const [oldPw, setOldPw] = useState('')
  const viaLink = sessionStorage.getItem('ss_invite_link') === '1'
  const [newPw, setNewPw] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (loading) return null
  if (!user) return <Navigate to="/signin" replace />
  if (!user.must_change_password) return <Navigate to="/dashboard" replace />

  const mismatch = confirm.length > 0 && newPw !== confirm
  const canSubmit = (viaLink || oldPw.length > 0) && newPw.length >= 8 && confirm.length > 0 && !mismatch

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      await authApi.changePassword(viaLink ? undefined : oldPw, newPw, tokenStore.refresh)
      sessionStorage.removeItem('ss_invite_link')
      setUser({ ...user!, must_change_password: false })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not change your password. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-6 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-md">
        <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
          <KeyRound className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-2xl font-extrabold tracking-tight text-navy">Choose a new password</h1>
        <p className="mt-2 text-sm leading-relaxed text-gray-500">
          Welcome, {user.first_name || user.email}. Set your own password to continue.
        </p>

        <form className="mt-8 space-y-5" onSubmit={onSubmit} noValidate>
          {error && (
            <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
              {error}
            </div>
          )}
          {!viaLink && <div>
            <label htmlFor="old-pw" className="mb-2 block text-sm font-bold text-gray-900">Temporary password</label>
            <input id="old-pw" type="password" autoComplete="current-password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} placeholder="The password from your email" className={inputClass} />
          </div>}
          <div>
            <label htmlFor="new-pw" className="mb-2 block text-sm font-bold text-gray-900">New password</label>
            <input id="new-pw" type="password" autoComplete="new-password" value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="At least 8 characters" className={inputClass} />
          </div>
          <div>
            <label htmlFor="confirm-pw" className="mb-2 block text-sm font-bold text-gray-900">Confirm new password</label>
            <input id="confirm-pw" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Re-enter your new password" className={`${inputClass} ${mismatch ? 'border-red-400' : ''}`} />
            {mismatch && <p className="mt-2 text-xs font-medium text-red-600">Passwords do not match.</p>}
          </div>
          <button type="submit" disabled={!canSubmit || submitting} className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy px-6 py-3.5 text-sm font-bold text-white hover:bg-dark-navy disabled:opacity-50">
            {submitting && <Loader2 className="h-4 w-4 animate-spin" />} Save and continue
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-gray-500">
          Not you?{' '}
          <Link to="/signin" onClick={() => void logout()} className="font-bold text-primary hover:underline">
            Sign out
          </Link>
        </p>
      </div>
    </div>
  )
}
