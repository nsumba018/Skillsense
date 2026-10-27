import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CallToAction() {
  return (
    <section className="py-20">
      <div className="container-1200">
        <div className="relative isolate overflow-hidden rounded-3xl bg-navy px-6 py-16 text-center shadow-2xl shadow-primary/20 sm:px-8 sm:py-20">
          <div className="pointer-events-none absolute -left-16 -top-16 -z-10 h-64 w-64 rounded-full bg-white/10 blur-2xl" aria-hidden />
          <div className="pointer-events-none absolute -bottom-20 -right-20 -z-10 h-72 w-72 rounded-full bg-accent/10 blur-3xl" aria-hidden />
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 tracking-tight">
            See the forecasts, assess students and explore Rwanda's workforce demand
          </h2>
          <p className="text-base text-blue-100/80 mb-9 max-w-2xl mx-auto sm:text-lg">
            Sign in to explore the full platform. Sample credentials are available on the sign-in page.
          </p>
          <Link
            to="/signin"
            className="inline-flex items-center gap-2 bg-white text-navy font-bold px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-colors shadow-lg text-sm"
          >
            Sign in
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
