import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { BadgeCheck, ArrowRight, ChevronDown, Loader2, AlertCircle } from 'lucide-react'
import { useAuth } from '../auth/AuthContext'
import { ApiError } from '../services/http'
import { useInstitutions } from '../services/queries'
import type { RegisterPayload } from '../types/api'

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20'
const labelClass = 'mb-2 block text-sm font-bold text-gray-900'

const ROLES: { value: RegisterPayload['role']; label: string; hint: string }[] = [
  { value: 'career_training_advisor', label: 'Career & Training Advisor', hint: 'Guide learners and job seekers toward in-demand ICT roles' },
  { value: 'education_curriculum_planner', label: 'Education / Curriculum Planner', hint: 'Compare programmes against forecast ICT skill demand' },
  { value: 'labor_market_analyst', label: 'Labour Market Analyst', hint: 'Analyse ICT demand by role, industry and region' },
]

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-200 pb-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-primary">{children}</h3>
    </div>
  )
}

export default function SignUp() {
  const { user, loading, register } = useAuth()
  const navigate = useNavigate()

  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<RegisterPayload['role'] | ''>('')
  const [institutionId, setInstitutionId] = useState('')
  const institutions = useInstitutions()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [agree, setAgree] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!loading && user) return <Navigate to="/dashboard" replace />

  const mismatch = confirm.length > 0 && password !== confirm
  const canSubmit = firstName && lastName && email && role && password.length >= 8 && !mismatch && confirm && agree

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!role) return
    setError(null)
    setSubmitting(true)
    try {
      const cleanEmail = email.trim().toLowerCase()
      await register({
        email: cleanEmail,
        username: cleanEmail,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        password,
        password_confirm: confirm,
        role,
        institution_id: institutionId ? Number(institutionId) : null,
      })
      navigate('/dashboard', { replace: true })
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Registration failed. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-page">
      <div className="flex flex-1 flex-col lg:flex-row">
        <aside className="relative flex flex-col overflow-hidden bg-gradient-to-br from-navy to-dark-navy px-10 py-12 text-white lg:w-[42%] lg:px-16 lg:py-16">
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />

          <Link to="/" className="relative flex w-fit items-center gap-3">
            <img src="/logo_icon.webp" alt="SkillSense logo" className="h-9 w-auto" />
            <span className="text-xl font-bold tracking-tight text-white">SkillSense</span>
          </Link>

          <div className="relative mt-16 max-w-md lg:mt-20">
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight lg:text-5xl">
              ICT workforce intelligence for Rwanda.
            </h1>
            <p className="mt-6 text-base leading-relaxed text-blue-100/80">
              See which ICT roles will be in demand, where skills gaps are opening, and how to prepare, powered by
              a forecasting model validated against real job postings.
            </p>
          </div>

          <div className="relative mt-auto pt-16">
            <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/20">
                <BadgeCheck className="h-6 w-6 text-accent" strokeWidth={2} />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Role-based access</h4>
                <p className="mt-1 text-sm leading-relaxed text-blue-100/70">
                  Choose the role that matches how you'll use the platform. Administrator accounts are created by
                  the SkillSense team.
                </p>
              </div>
            </div>
          </div>
        </aside>

        <main className="flex flex-1 justify-center px-6 py-12 lg:px-16 lg:py-16">
          <div className="w-full max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">Create your account</h2>
            <p className="mt-2 text-base text-gray-500">Register to access the ICT demand forecasts and analytics.</p>

            <form className="mt-10 space-y-10" onSubmit={onSubmit} noValidate>
              {error && (
                <div
                  role="alert"
                  data-testid="signup-error"
                  className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {error}
                </div>
              )}

              <section className="space-y-6">
                <SectionHeading>1. Identity Details</SectionHeading>
                <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="firstName">First name</label>
                    <input id="firstName" autoComplete="given-name" value={firstName} onChange={(e) => setFirstName(e.target.value)} placeholder="Aline" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="lastName">Last name</label>
                    <input id="lastName" autoComplete="family-name" value={lastName} onChange={(e) => setLastName(e.target.value)} placeholder="Uwase" className={inputClass} />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={labelClass} htmlFor="email">Email address</label>
                    <input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@organization.rw" className={inputClass} />
                  </div>
                </div>
              </section>

              <section className="space-y-6">
                <SectionHeading>2. Your Role</SectionHeading>
                <div>
                  <label className={labelClass} htmlFor="role">How will you use SkillSense?</label>
                  <div className="relative">
                    <select id="role" value={role} onChange={(e) => setRole(e.target.value as RegisterPayload['role'])} className={`${inputClass} appearance-none pr-10 text-gray-900`}>
                      <option value="" disabled>Select role</option>
                      {ROLES.map((r) => (
                        <option key={r.value} value={r.value}>{r.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  </div>
                  {role && <p className="mt-2 text-xs text-gray-500">{ROLES.find((r) => r.value === role)?.hint}</p>}
                </div>
                <div>
                  <label className={labelClass} htmlFor="institution">Institution <span className="font-normal text-gray-400">(optional)</span></label>
                  <div className="relative">
                    <select id="institution" value={institutionId} onChange={(e) => setInstitutionId(e.target.value)} className={`${inputClass} appearance-none pr-10 text-gray-900`}>
                      <option value="">Not affiliated / not listed</option>
                      {(institutions.data ?? []).map((i) => (
                        <option key={i.id} value={i.id}>{i.name}</option>
                      ))}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">Education planners see curricula submitted by colleagues at the same institution.</p>
                </div>
              </section>

              <section className="space-y-6">
                <SectionHeading>3. Account Security</SectionHeading>
                <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="password">Password</label>
                    <input id="password" type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="At least 8 characters" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="confirmPassword">Confirm password</label>
                    <input id="confirmPassword" type="password" autoComplete="new-password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="••••••••" className={`${inputClass} ${mismatch ? 'border-red-400' : ''}`} />
                    {mismatch && <p className="mt-2 text-xs font-medium text-red-600">Passwords do not match.</p>}
                  </div>
                </div>
              </section>

              <label className="flex items-start gap-3 text-[15px] text-gray-700">
                <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 rounded border-gray-300 text-primary focus:ring-primary/30" />
                <span>I understand my account gives access to aggregated ICT labour-market analytics.</span>
              </label>

              <div>
                <button
                  type="submit"
                  disabled={!canSubmit || submitting}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy py-4 text-base font-bold text-white shadow-sm transition-colors hover:bg-dark-navy disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {submitting && <Loader2 className="h-5 w-5 animate-spin" />}
                  {submitting ? 'Creating account…' : 'Create account'}
                  {!submitting && <ArrowRight className="h-5 w-5" />}
                </button>
                <p className="mt-6 text-center text-[15px] text-gray-600">
                  Already have an account?{' '}
                  <Link to="/signin" className="font-bold text-primary hover:underline">Sign In</Link>
                </p>
              </div>
            </form>
          </div>
        </main>
      </div>

      <footer className="border-t border-gray-200 bg-page px-6 py-5 lg:px-10">
        <p className="text-center text-sm text-gray-500">© 2026 SkillSense: ICT Workforce Intelligence for Rwanda</p>
      </footer>
    </div>
  )
}
