import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export default function CallToAction() {
  const { user } = useAuth()
  return (
    <section className="py-20">
      <div className="container-1200">
        <div className="relative isolate overflow-hidden rounded-3xl bg-navy px-6 py-16 text-center shadow-2xl shadow-primary/20 sm:px-8 sm:py-20">
          <div className="pointer-events-none absolute -left-16 -top-16 -z-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-20 -right-20 -z-10 h-72 w-72 rounded-full bg-emerald-400/10 blur-3xl" aria-hidden />
          <div className="relative">
            <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-white/50">Explore SkillSense</p>
            <h2 className="mx-auto mb-4 max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
              See the forecasts, assess students and explore Rwanda's workforce demand
            </h2>
            <p className="mx-auto mb-9 max-w-2xl text-base text-blue-100/80 sm:text-lg">
              Sign in to explore the full platform. Sample credentials are available on the sign-in page.
            </p>
            <Link to={user ? '/dashboard' : '/signin'} className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-navy shadow-lg transition-all hover:-translate-y-0.5 hover:bg-gray-50">
              {user ? 'Open your dashboard' : 'Try the demo'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
