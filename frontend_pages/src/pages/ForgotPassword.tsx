import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useMutation } from '@tanstack/react-query'
import { AtSign, ArrowLeft, KeyRound, Loader2, MailCheck } from 'lucide-react'
import { authApi } from '../services/api'
import { ApiError } from '../services/http'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const request = useMutation({ mutationFn: () => authApi.requestReset(email.trim()) })

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <aside className="relative flex flex-col overflow-hidden bg-gradient-to-br from-[#12277B] via-[#0E1F63] to-[#0B1A54] px-10 py-12 text-white lg:w-1/2 lg:px-16 lg:py-14">
        <Link to="/" className="relative flex w-fit items-center gap-3">
          <img src="/logo_icon.webp" alt="SkillSense logo" className="h-9 w-auto" />
          <span className="text-xl font-bold tracking-tight text-white">SkillSense</span>
        </Link>
        <div className="relative mt-20 max-w-lg lg:mt-24">
          <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight lg:text-6xl">
            Predictive Intelligence for Rwanda's <span className="text-[#5EEAD4]">ICT Workforce.</span>
          </h1>
        </div>
        <p className="relative mt-auto pt-16 text-sm text-blue-200/40">
          © 2026 SkillSense: ICT Workforce Intelligence for Rwanda
        </p>
      </aside>

      <main className="flex flex-1 items-center justify-center bg-page px-6 py-12 lg:px-16">
        <div className="w-full max-w-md">
          <Link to="/signin" className="mb-8 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900">
            <ArrowLeft className="h-4 w-4" />
            Back to Sign In
          </Link>

          {request.isSuccess ? (
            <div data-testid="reset-sent">
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-50">
                <MailCheck className="h-7 w-7 text-emerald-600" />
              </div>
              <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-navy">Check your email</h2>
              <p className="mt-4 text-lg text-gray-500">
                If an account exists for <span className="font-semibold text-gray-700">{email}</span>, we've sent a link to
                choose a new password. The link expires in one hour.
              </p>
              <p className="mt-6 text-sm text-gray-500">
                Didn't get it? Check your spam folder, or{' '}
                <button onClick={() => request.reset()} className="font-bold text-primary hover:underline">try again</button>.
              </p>
            </div>
          ) : (
            <>
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light">
                <KeyRound className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-navy">Reset your password</h2>
              <p className="mt-4 text-lg text-gray-500">Enter your account email and we'll send you a reset link.</p>

              <form
                className="mt-8 space-y-6"
                onSubmit={(e) => {
                  e.preventDefault()
                  request.mutate()
                }}
              >
                {request.isError && (
                  <p role="alert" data-testid="reset-error" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {request.error instanceof ApiError && request.error.status === 429
                      ? 'Too many requests. Please wait a while and try again.'
                      : request.error instanceof ApiError
                        ? request.error.message
                        : 'Could not send the reset email.'}
                  </p>
                )}
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-bold text-gray-900">Email</label>
                  <div className="flex items-center overflow-hidden rounded-lg border border-gray-300 bg-white transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                    <span className="flex items-center self-stretch border-r border-gray-200 px-3.5 text-gray-400">
                      <AtSign className="h-5 w-5" />
                    </span>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@organization.rw"
                      className="w-full bg-transparent px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 outline-none"
                    />
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={!email || request.isPending}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy py-4 text-base font-bold text-white shadow-sm transition-colors hover:bg-dark-navy disabled:opacity-60"
                >
                  {request.isPending && <Loader2 className="h-5 w-5 animate-spin" />}
                  Send reset link
                </button>
              </form>
            </>
          )}
        </div>
      </main>
    </div>
  )
}
