import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AtSign, Lock, Eye, EyeOff, ArrowRight, Shield, HelpCircle } from 'lucide-react'

export default function SignIn() {
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      {/* Left brand panel */}
      <aside className="relative flex flex-col overflow-hidden bg-gradient-to-br from-[#12277B] via-[#0E1F63] to-[#0B1A54] px-10 py-12 text-white lg:w-1/2 lg:px-16 lg:py-14">
        {/* Globe / dotted world backdrop */}
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
          <h2 className="text-4xl font-extrabold leading-tight tracking-tight text-navy">
            Secure Stakeholder Access Portal
          </h2>
          <p className="mt-4 text-lg text-gray-500">
            Please enter your institutional credentials to continue.
          </p>

          <form className="mt-10 space-y-6" onSubmit={(e) => e.preventDefault()}>
            {/* Email */}
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
                  placeholder="name@organization.gov"
                  className="w-full bg-transparent px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 outline-none"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-2 block text-sm font-bold text-gray-900">
                Password
              </label>
              <div className="flex items-center overflow-hidden rounded-lg border border-gray-300 bg-white transition-colors focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <span className="flex items-center self-stretch border-r border-gray-200 px-3.5 text-gray-400">
                  <Lock className="h-5 w-5" />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  className="w-full bg-transparent px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  className="px-3.5 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-[15px] text-gray-700">
                <input
                  type="checkbox"
                  className="h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary/30"
                />
                Remember Me
              </label>
              <Link to="/forgot-password" className="text-[15px] font-bold text-primary hover:underline">
                Forgot Password?
              </Link>
            </div>

            {/* Submit */}
            <Link
              to="/dashboard"
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy py-4 text-base font-bold text-white shadow-sm transition-colors hover:bg-dark-navy"
            >
              Sign In
              <ArrowRight className="h-5 w-5" />
            </Link>
          </form>

          {/* New user */}
          <div className="mt-8 border-t border-gray-200 pt-8">
            <p className="text-center text-xs font-semibold uppercase tracking-wider text-gray-500">
              New to the Intelligence Network?
            </p>
            <Link
              to="/signup"
              className="mt-5 flex w-full items-center justify-center rounded-full border border-gray-300 bg-white py-3.5 text-base font-bold text-navy transition-colors hover:bg-gray-50"
            >
              Create Institutional Account
            </Link>
          </div>

          {/* Bottom links */}
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
      </main>
    </div>
  )
}
