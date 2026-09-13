import { BadgeCheck, ArrowRight, ChevronDown, Headphones, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'

const inputClass =
  'w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-[15px] text-gray-900 placeholder-gray-400 outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20'

const labelClass = 'mb-2 block text-sm font-bold text-gray-900'

function SectionHeading({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-b border-gray-200 pb-3">
      <h3 className="text-xs font-bold uppercase tracking-wider text-primary">{children}</h3>
    </div>
  )
}

export default function SignUp() {
  return (
    <div className="flex min-h-screen flex-col bg-page">
      <div className="flex flex-1 flex-col lg:flex-row">
        {/* Left brand panel */}
        <aside className="relative flex flex-col overflow-hidden bg-gradient-to-br from-navy to-dark-navy px-10 py-12 text-white lg:w-[42%] lg:px-16 lg:py-16">
          {/* Ambient glow */}
          <div className="pointer-events-none absolute -bottom-24 -left-24 h-96 w-96 rounded-full bg-primary/30 blur-3xl" />

          <Link to="/" className="relative flex w-fit items-center gap-3">
            <img src="/logo_icon.webp" alt="SkillSense logo" className="h-9 w-auto" />
            <span className="text-xl font-bold tracking-tight text-white">SkillSense</span>
          </Link>

          <div className="relative mt-16 max-w-md lg:mt-20">
            <h1 className="text-4xl font-extrabold leading-[1.1] tracking-tight lg:text-5xl">
              Empowering National Labor Intelligence.
            </h1>
            <p className="mt-6 text-base leading-relaxed text-blue-100/80">
              Join a network of institutional stakeholders dedicated to shaping the future of
              workforce development through data-driven insights.
            </p>
          </div>

          <div className="relative mt-auto pt-16">
            <div className="flex items-start gap-4 rounded-xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent/20">
                <BadgeCheck className="h-6 w-6 text-accent" strokeWidth={2} />
              </div>
              <div>
                <h4 className="text-base font-bold text-white">Institutional Access</h4>
                <p className="mt-1 text-sm leading-relaxed text-blue-100/70">
                  Gain priority access to regional skills forecasting and labor demand analytics.
                </p>
              </div>
            </div>
          </div>
        </aside>

        {/* Right form panel */}
        <main className="flex flex-1 justify-center px-6 py-12 lg:px-16 lg:py-16">
          <div className="w-full max-w-2xl">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900">
              Create Institutional Account
            </h2>
            <p className="mt-2 text-base text-gray-500">
              Register your organization to access the analytics portal.
            </p>

            <form className="mt-10 space-y-10" onSubmit={(e) => e.preventDefault()}>
              {/* 1. Identity details */}
              <section className="space-y-6">
                <SectionHeading>1. Identity Details</SectionHeading>
                <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="fullName">Full Name</label>
                    <input id="fullName" type="text" placeholder="Johnathan Doe" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="email">Email Address</label>
                    <input id="email" type="email" placeholder="j.doe@institution.gov" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="phone">Phone Number</label>
                    <input id="phone" type="tel" placeholder="+1 (555) 000-0000" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="organization">Organization</label>
                    <input id="organization" type="text" placeholder="Department of Labor" className={inputClass} />
                  </div>
                </div>
              </section>

              {/* 2. Institutional affiliation */}
              <section className="space-y-6">
                <SectionHeading>2. Institutional Affiliation</SectionHeading>
                <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="institutionType">Institution Type</label>
                    <div className="relative">
                      <select id="institutionType" defaultValue="" className={`${inputClass} appearance-none pr-10 text-gray-900`}>
                        <option value="" disabled>Select type</option>
                        <option>Government Agency</option>
                        <option>University</option>
                        <option>Research Institute</option>
                        <option>Private Sector</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="role">Role</label>
                    <div className="relative">
                      <select id="role" defaultValue="" className={`${inputClass} appearance-none pr-10 text-gray-900`}>
                        <option value="" disabled>Select role</option>
                        <option>Administrator</option>
                        <option>Analyst</option>
                        <option>Researcher</option>
                        <option>Policy Maker</option>
                      </select>
                      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                </div>
              </section>

              {/* 3. Account security */}
              <section className="space-y-6">
                <SectionHeading>3. Account Security</SectionHeading>
                <div className="grid grid-cols-1 gap-x-6 gap-y-6 sm:grid-cols-2">
                  <div>
                    <label className={labelClass} htmlFor="password">Password</label>
                    <input id="password" type="password" placeholder="••••••••" className={inputClass} />
                  </div>
                  <div>
                    <label className={labelClass} htmlFor="confirmPassword">Confirm Password</label>
                    <input id="confirmPassword" type="password" placeholder="••••••••" className={inputClass} />
                  </div>
                </div>
              </section>

              {/* Terms */}
              <label className="flex items-start gap-3 text-[15px] text-gray-700">
                <input
                  type="checkbox"
                  className="mt-0.5 h-5 w-5 shrink-0 rounded border-gray-300 text-primary focus:ring-primary/30"
                />
                <span>
                  I agree to the <a href="#" className="font-medium text-primary hover:underline">Terms of Service</a> and{' '}
                  <a href="#" className="font-medium text-primary hover:underline">Privacy Policy</a> regarding institutional data usage.
                </span>
              </label>

              {/* Submit */}
              <div>
                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-navy py-4 text-base font-bold text-white shadow-sm transition-colors hover:bg-dark-navy"
                >
                  Create Institutional Account
                  <ArrowRight className="h-5 w-5" />
                </button>
                <p className="mt-6 text-center text-[15px] text-gray-600">
                  Already have an account?{' '}
                  <Link to="/signin" className="font-bold text-primary hover:underline">Sign In</Link>
                </p>
              </div>
            </form>

            {/* Bottom info */}
            <div className="mt-10 border-t border-gray-200 pt-8">
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                    <Headphones className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-900">Help Desk</p>
                    <p className="text-sm text-gray-500">support@nskp.gov</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100">
                    <ShieldCheck className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-900">Encryption</p>
                    <p className="text-sm text-gray-500">AES-256 Compliant</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Footer bar */}
      <footer className="border-t border-gray-200 bg-page px-6 py-5 lg:px-10">
        <div className="flex flex-col items-center justify-between gap-3 text-sm text-gray-500 sm:flex-row">
          <p>© 2024 National Labor Intelligence. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-gray-900">Privacy Policy</a>
            <a href="#" className="hover:text-gray-900">Accessibility Statement</a>
            <a href="#" className="hover:text-gray-900">Contact Support</a>
          </div>
        </div>
      </footer>
    </div>
  )
}
