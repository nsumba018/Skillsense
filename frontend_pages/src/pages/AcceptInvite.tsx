import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Loader2, AlertCircle, ShieldCheck } from 'lucide-react'
import { authApi } from '../services/api'
import { tokenStore } from '../services/http'
import { ApiError } from '../services/http'
import { useAuth, ROLE_LABELS } from '../auth/AuthContext'
import type { InviteInfo } from '../types/api'

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20'

export default function AcceptInvite() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''

  const [invite, setInvite] = useState<InviteInfo | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!token) {
      setFetchError('No invitation token provided.')
      setLoading(false)
      return
    }
    authApi
      .inviteDetail(token)
      .then(setInvite)
      .catch((err) => {
        setFetchError(
          err instanceof ApiError ? err.message : 'Could not load invitation. The link may be invalid or expired.',
        )
      })
      .finally(() => setLoading(false))
  }, [token])

  if (!authLoading && user) return <Navigate to="/dashboard" replace />

  const mismatch = confirm.length > 0 && password !== confirm
  const canSubmit = password.length >= 8 && confirm && !mismatch

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      const res = await authApi.acceptInvite(token, password, confirm)
      tokenStore.set({ access: res.access, refresh: res.refresh }, true)
      navigate('/dashboard', { replace: true })
      window.location.reload()
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to set password. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex h-screen flex-col lg:flex-row">
      <aside className="relative flex flex-col overflow-hidden bg-gradient-to-br from-[#12277B] via-[#0E1F63] to-[#0B1A54] px-10 py-12 text-white lg:w-1/2 lg:px-16 lg:py-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1.4px)',
            backgroundSize: '15px 15px',
            WebkitMaskImage: 'radial-gradient(circle at 70% 42%, black 0%, black 34%, transparent 60%)',
            maskImage: 'radial-gradient(circle at 70% 42%, black 0%, black 34%, transparent 60%)',
          }}
        />
        <div className="pointer-events-none absolute right-[-6%] top-[18%] h-[520px] w-[520px] rounded-full border border-white/10 opacity-40" />

        <Link to="/" className="relative flex w-fit items-center gap-3">
          <img src="/logo_icon.webp" alt="SkillSense logo" className="h-9 w-auto" />
          <span className="text-xl font-bold tracking-tight text-white">SkillSense</span>
        </Link>

        <div className="relative mt-8 max-w-lg lg:mt-10">
          <h1 className="text-[42px] font-extrabold leading-[1.08] tracking-tight lg:text-[56px]">
            Welcome to <span className="text-[#5EEAD4]">SkillSense.</span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-blue-100/75">
            You've been invited to access Rwanda's ICT Workforce Intelligence platform.
            Set your password below to activate your account.
          </p>
        </div>

        <div className="relative mt-auto pt-6">
          <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/20">
              <ShieldCheck className="h-6 w-6 text-accent" strokeWidth={2} />
            </div>
            <div>
              <h4 className="text-base font-bold text-white">Secure invitation</h4>
              <p className="mt-1 text-sm leading-relaxed text-blue-100/70">
                Your password is set by you alone — no one else, including your administrator, will know it.
              </p>
            </div>
          </div>
          <p className="mt-6 text-sm text-blue-200/40">
            © 2026 SkillSense: ICT Workforce Intelligence for Rwanda
          </p>
        </div>
      </aside>

      <main className="flex flex-1 items-center justify-center bg-page px-6 py-12 lg:px-16">
        <div className="w-full max-w-md">
          {loading ? (
            <div className="flex flex-col items-center gap-4 py-20">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-gray-500">Loading your invitation…</p>
            </div>
          ) : fetchError ? (
            <div className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50">
                <AlertCircle className="h-8 w-8 text-red-500" />
              </div>
              <h2 className="text-2xl font-extrabold text-navy">Invalid invitation</h2>
              <p className="mt-3 text-gray-500">{fetchError}</p>
              <Link
                to="/signin"
                className="mt-8 inline-flex items-center gap-2 rounded-lg bg-navy px-6 py-3 text-sm font-bold text-white hover:bg-dark-navy"
              >
                Go to Sign In <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          ) : invite ? (
            <>
              <h2 className="text-3xl font-extrabold tracking-tight text-navy">
                Hello, {invite.user.first_name || invite.user.email}!
              </h2>
              <p className="mt-3 text-base text-gray-500">
                You've been invited as{' '}
                <span className="font-bold text-gray-700">
                  {ROLE_LABELS[invite.user.role] ?? invite.user.role}
                </span>
                {invite.user.institution ? ` at ${invite.user.institution.name}` : ''}.
                Set your password to get started.
              </p>

              <form className="mt-10 space-y-6" onSubmit={onSubmit} noValidate>
                {error && (
                  <div
                    role="alert"
                    className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                  >
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    {error}
                  </div>
                )}

                <div>
                  <label htmlFor="email-display" className="mb-2 block text-sm font-bold text-gray-900">
                    Email
                  </label>
                  <input
                    id="email-display"
                    type="email"
                    value={invite.user.email}
                    disabled
                    className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-[15px] text-gray-500"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="mb-2 block text-sm font-bold text-gray-900">
                    Create your password
                  </label>
                  <input
                    id="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="mb-2 block text-sm font-bold text-gray-900">
                    Confirm password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="Re-enter your password"
                    className={`${inputClass} ${mismatch ? 'border-red-400' : ''}`}
                  />
                  {mismatch && <p className="mt-2 text-xs font-medium text-red-600">Passwords do not match.</p>}
                </div>

                <button
                  type="submit"
                  disabled={!canSubmit || submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy py-4 text-base font-bold text-white shadow-sm transition-colors hover:bg-dark-navy disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : null}
                  {submitting ? 'Activating account…' : 'Set password & sign in'}
                  {!submitting && <ArrowRight className="h-5 w-5" />}
                </button>
              </form>
            </>
          ) : null}
        </div>
      </main>
    </div>
  )
}
