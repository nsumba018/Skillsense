import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  AtSign,
  ArrowRight,
  ArrowLeft,
  MailCheck,
  CheckCircle2,
  Shield,
  HelpCircle,
} from 'lucide-react'

type Step = 'request' | 'code' | 'done'

const CODE_LENGTH = 6

export default function ForgotPassword() {
  const [step, setStep] = useState<Step>('request')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState<string[]>(Array(CODE_LENGTH).fill(''))
  const inputsRef = useRef<Array<HTMLInputElement | null>>([])

  const codeComplete = code.every((c) => c !== '')

  function handleCodeChange(index: number, value: string) {
    const digit = value.replace(/\D/g, '').slice(-1)
    const next = [...code]
    next[index] = digit
    setCode(next)
    if (digit && index < CODE_LENGTH - 1) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  function handleCodeKeyDown(index: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputsRef.current[index - 1]?.focus()
    }
  }

  function handleCodePaste(e: React.ClipboardEvent<HTMLInputElement>) {
    e.preventDefault()
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, CODE_LENGTH)
    if (!pasted) return
    const next = Array(CODE_LENGTH).fill('')
    pasted.split('').forEach((d, i) => (next[i] = d))
    setCode(next)
    inputsRef.current[Math.min(pasted.length, CODE_LENGTH - 1)]?.focus()
  }

  /* Success — centered confirmation card on the landing-style background */
  if (step === 'done') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-page px-6 py-12">
        <Link to="/" className="mb-10 flex items-center gap-2">
          <img src="/logo_icon.webp" alt="SkillSense logo" className="h-9 w-auto" />
          <span className="text-xl font-extrabold tracking-tight text-gray-900">SkillSense</span>
        </Link>

        <div className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-accent/10">
            <CheckCircle2 className="h-11 w-11 text-accent" strokeWidth={2} />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy">Verification Complete</h1>
          <p className="mt-4 text-base leading-relaxed text-gray-500">
            Your verification code has been confirmed successfully. Your identity is verified and
            your account is now secure.
          </p>
          <Link
            to="/signin"
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-lg bg-navy py-4 text-base font-bold text-white shadow-sm transition-colors hover:bg-dark-navy"
          >
            Continue to Sign In
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        <div className="mt-8 flex items-center justify-center gap-8 text-sm text-gray-500">
          <a href="#" className="flex items-center gap-2 hover:text-gray-900">
            <Shield className="h-4 w-4" />
            Privacy Policy
          </a>
          <a href="#" className="flex items-center gap-2 hover:text-gray-900">
            <HelpCircle className="h-4 w-4" />
            Contact Support
          </a>
        </div>
      </div>
    )
  }

  /* Request + code steps — split navy layout */
  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left brand panel */}
      <aside className="relative flex flex-col overflow-hidden bg-gradient-to-br from-[#12277B] via-[#0E1F63] to-[#0B1A54] px-10 py-12 text-white lg:w-1/2 lg:px-16 lg:py-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.9) 1px, transparent 1.4px)',
            backgroundSize: '15px 15px',
            WebkitMaskImage:
              'radial-gradient(circle at 70% 42%, black 0%, black 34%, transparent 60%)',
            maskImage:
              'radial-gradient(circle at 70% 42%, black 0%, black 34%, transparent 60%)',
          }}
        />
        <div className="pointer-events-none absolute right-[-6%] top-[18%] h-[520px] w-[520px] rounded-full border border-white/10 opacity-40" />

        <Link to="/" className="relative flex w-fit items-center gap-3">
          <img src="/logo_icon.webp" alt="SkillSense logo" className="h-9 w-auto" />
          <span className="text-xl font-bold tracking-tight text-white">SkillSense</span>
        </Link>

        <div className="relative mt-20 max-w-lg lg:mt-24">
          <h1 className="text-5xl font-extrabold leading-[1.05] tracking-tight lg:text-6xl">
            Predictive Intelligence for the{' '}
            <span className="text-[#5EEAD4]">Future Workforce.</span>
          </h1>
          <p className="mt-8 max-w-md text-lg leading-relaxed text-blue-100/75">
            Access real-time labor market analytics, skills demand forecasting, and regional
            employment shifts within our institutional ecosystem.
          </p>

          <div className="mt-16 flex gap-14">
            <div>
              <div className="text-4xl font-extrabold text-white">42M+</div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-blue-200/50">
                Data<br />Points
              </div>
            </div>
            <div>
              <div className="text-4xl font-extrabold text-white">98%</div>
              <div className="mt-2 text-xs font-semibold uppercase tracking-wider text-blue-200/50">
                Accur<br />acy Rate
              </div>
            </div>
          </div>
        </div>

        <p className="relative mt-auto pt-16 text-sm text-blue-200/40">
          © 2024 National Labor Intelligence. Advanced Research Division.
        </p>
      </aside>

      {/* Right form panel */}
      <main className="flex flex-1 items-center justify-center bg-page px-6 py-12 lg:px-16">
        <div className="w-full max-w-md">
          <button
            type="button"
            onClick={() => setStep((s) => (s === 'code' ? 'request' : s))}
            className="mb-8 flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            {step === 'request' ? 'Back to Sign In' : 'Back'}
          </button>

          {/* Step: request reset code */}
          {step === 'request' && (
            <>
              <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-navy">
                Reset your password
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                Enter your institutional email and we'll send you a verification code to reset your
                password.
              </p>

              <form
                className="mt-10 space-y-6"
                onSubmit={(e) => {
                  e.preventDefault()
                  setStep('code')
                }}
              >
                <div>
                  <label htmlFor="email" className="mb-2 block text-sm font-bold text-gray-900">
                    Institutional Email
                  </label>
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
                      placeholder="name@organization.gov"
                      className="w-full bg-transparent px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy py-4 text-base font-bold text-white shadow-sm transition-colors hover:bg-dark-navy"
                >
                  Send Reset Code
                  <ArrowRight className="h-5 w-5" />
                </button>
              </form>

              <p className="mt-8 text-center text-[15px] text-gray-600">
                Remember your password?{' '}
                <Link to="/signin" className="font-bold text-primary hover:underline">
                  Sign In
                </Link>
              </p>
            </>
          )}

          {/* Step: enter verification code */}
          {step === 'code' && (
            <>
              <div className="mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-light">
                <MailCheck className="h-7 w-7 text-primary" />
              </div>
              <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-navy">
                Enter verification code
              </h2>
              <p className="mt-4 text-lg text-gray-500">
                We sent a {CODE_LENGTH}-digit code to{' '}
                <span className="font-semibold text-gray-700">{email || 'your email'}</span>. Enter
                it below to continue.
              </p>

              <form
                className="mt-10 space-y-6"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (codeComplete) setStep('done')
                }}
              >
                <div className="flex justify-between gap-2 sm:gap-3">
                  {code.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        inputsRef.current[i] = el
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleCodeChange(i, e.target.value)}
                      onKeyDown={(e) => handleCodeKeyDown(i, e)}
                      onPaste={handleCodePaste}
                      className="h-14 w-full rounded-lg border border-gray-300 bg-white text-center text-2xl font-bold text-gray-900 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20 sm:h-16"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={!codeComplete}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy py-4 text-base font-bold text-white shadow-sm transition-colors hover:bg-dark-navy disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Verify Code
                  <ArrowRight className="h-5 w-5" />
                </button>
              </form>

              <p className="mt-8 text-center text-[15px] text-gray-600">
                Didn't receive it?{' '}
                <button
                  type="button"
                  onClick={() => setCode(Array(CODE_LENGTH).fill(''))}
                  className="font-bold text-primary hover:underline"
                >
                  Resend code
                </button>
              </p>
            </>
          )}

          {/* Bottom links */}
          <div className="mt-12 flex items-center justify-center gap-8 text-sm text-gray-500">
            <a href="#" className="flex items-center gap-2 hover:text-gray-900">
              <Shield className="h-4 w-4" />
              Privacy Policy
            </a>
            <a href="#" className="flex items-center gap-2 hover:text-gray-900">
              <HelpCircle className="h-4 w-4" />
              Contact Support
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
