import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { CheckCircle2, KeyRound, Loader2, TriangleAlert } from 'lucide-react'
import { authApi } from '../services/api'
import { ApiError } from '../services/http'

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20'

/** Landing page of the emailed link: /reset-password?uid=…&token=… */
export default function ResetPassword() {
  const [params] = useSearchParams()
  const uid = params.get('uid') ?? ''
  const token = params.get('token') ?? ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const reset = useMutation({ mutationFn: () => authApi.confirmReset(uid, token, password) })

  const mismatch = confirm.length > 0 && password !== confirm
  const linkMissing = !uid || !token

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-page px-6 py-12">
      <Link to="/" className="mb-10 flex items-center gap-2">
        <img src="/logo_icon.webp" alt="SkillSense logo" className="h-9 w-auto" />
        <span className="text-xl font-extrabold tracking-tight text-gray-900">SkillSense</span>
      </Link>

      <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-10 shadow-sm">
        {reset.isSuccess ? (
          <div className="text-center" data-testid="reset-done">
            <CheckCircle2 className="mx-auto h-12 w-12 text-accent" />
            <h1 className="mt-5 text-3xl font-extrabold tracking-tight text-navy">Password updated</h1>
            <p className="mt-3 text-base text-gray-500">You can now sign in with your new password.</p>
            <Link to="/signin" className="mt-8 flex w-full items-center justify-center rounded-lg bg-navy py-4 text-base font-bold text-white hover:bg-dark-navy">
              Continue to Sign In
            </Link>
          </div>
        ) : linkMissing ? (
          <div className="text-center">
            <TriangleAlert className="mx-auto h-12 w-12 text-amber-500" />
            <h1 className="mt-5 text-2xl font-extrabold text-navy">This reset link is incomplete</h1>
            <p className="mt-3 text-sm text-gray-500">Open the link from your email again, or request a new one.</p>
            <Link to="/forgot-password" className="mt-6 inline-block font-bold text-primary hover:underline">Request a new link</Link>
          </div>
        ) : (
          <>
            <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light">
              <KeyRound className="h-7 w-7 text-primary" />
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-navy">Choose a new password</h1>
            <form
              className="mt-8 space-y-6"
              onSubmit={(e) => {
                e.preventDefault()
                reset.mutate()
              }}
              noValidate
            >
              {reset.isError && (
                <div role="alert" data-testid="reset-error" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {reset.error instanceof ApiError ? reset.error.message : 'Could not reset the password.'}
                  {reset.error instanceof ApiError && reset.error.status === 400 && (
                    <div className="mt-2"><Link to="/forgot-password" className="font-bold underline">Request a new link</Link></div>
                  )}
                </div>
              )}
              <div>
                <label htmlFor="new-password" className="mb-2 block text-sm font-bold text-gray-900">New password</label>
                <input id="new-password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className={inputClass} />
              </div>
              <div>
                <label htmlFor="confirm-password" className="mb-2 block text-sm font-bold text-gray-900">Confirm new password</label>
                <input id="confirm-password" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} className={`${inputClass} ${mismatch ? 'border-red-400' : ''}`} />
                {mismatch && <p className="mt-2 text-xs font-medium text-red-600">Passwords do not match.</p>}
              </div>
              <button
                type="submit"
                disabled={password.length < 8 || password !== confirm || reset.isPending}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy py-4 text-base font-bold text-white shadow-sm hover:bg-dark-navy disabled:cursor-not-allowed disabled:opacity-60"
              >
                {reset.isPending && <Loader2 className="h-5 w-5 animate-spin" />}
                Set new password
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  )
}
