import { ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function CallToAction() {
  return (
    <section className="py-20">
      <div className="container-1200">
        <div
          className="rounded-3xl py-16 px-8 text-center"
          style={{ background: 'linear-gradient(115deg, #0536B0 0%, #0642CF 100%)' }}
        >
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4 tracking-tight">
            Ready to strengthen Rwanda's workforce intelligence?
          </h2>
          <p className="text-base text-white/80 mb-8 max-w-2xl mx-auto">
            Join 15+ government institutions already using our platform for
            data-driven policy and planning.
          </p>
          <Link to="/signup" className="inline-flex items-center gap-2 bg-white text-primary font-semibold px-8 py-3.5 rounded-xl hover:bg-gray-50 transition-colors shadow-sm text-sm">
            Request Institutional Access
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  )
}
