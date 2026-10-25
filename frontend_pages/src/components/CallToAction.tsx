import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { PHOTO_CREDITS } from './RootedInRwanda'

export default function CallToAction() {
  const { user } = useAuth()
  return (
    <section className="py-20">
      <div className="container-1200">
        <div className="relative isolate overflow-hidden rounded-3xl px-6 py-16 text-center shadow-2xl shadow-primary/20 sm:px-8 sm:py-20">
          <img src={PHOTO_CREDITS.skyline.src} alt="" loading="lazy" decoding="async" className="absolute inset-0 -z-20 h-full w-full object-cover" />
          <div className="absolute inset-0 -z-10 bg-gradient-to-br from-navy/95 via-primary-dark/90 to-navy/95" aria-hidden />
          <div className="pointer-events-none absolute -left-16 -top-16 -z-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" aria-hidden />
          <div className="relative">
            <h2 className="mx-auto mb-4 max-w-3xl text-3xl font-extrabold tracking-tight text-white sm:text-4xl md:text-5xl">
              Ready to see where Rwanda&apos;s ICT demand is heading?
            </h2>
            <p className="mx-auto mb-9 max-w-2xl text-base text-blue-100 sm:text-lg">
              Sign in to explore role forecasts, assess students against the market, align curricula and export reports.
            </p>
            <Link to={user ? '/dashboard' : '/signin'} className="inline-flex items-center gap-2 rounded-xl bg-white px-8 py-3.5 text-sm font-bold text-primary shadow-lg transition-all hover:-translate-y-0.5 hover:bg-gray-50">
              {user ? 'Open your dashboard' : 'Sign in'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
