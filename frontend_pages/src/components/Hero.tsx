import { ArrowRight, BadgeCheck, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { SNAPSHOT } from '../lib/snapshot'

const proof = [
  `Trained on ${SNAPSHOT.historyYears} NISR Labour Force Survey`,
  `${SNAPSHOT.totalPostings} real job postings across ${SNAPSHOT.sectors} sectors`,
  `${SNAPSHOT.rankCorrelation.toFixed(2)} Spearman rank correlation`,
]

export default function Hero() {
  const { user } = useAuth()

  return (
    <section id="home" className="hero-bg relative isolate overflow-hidden scroll-mt-20">
      <div className="absolute inset-x-0 top-0 -z-10 h-full" aria-hidden>
        <div className="absolute inset-0 bg-gradient-to-b from-dark-navy/95 via-navy/85 to-navy/60" />
        <div className="hero-orb hero-orb-a" />
      </div>

      <div className="container-1200 relative pb-16 pt-14 sm:pb-20 sm:pt-20 lg:pb-24">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-14">

          {/* ── Left: copy ── */}
          <div className="max-w-xl">
            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-blue-100 backdrop-blur">
              <Sparkles className="h-3.5 w-3.5 shrink-0" />
              NISR 2026 Big Data Hackathon
            </div>

            <h1 className="text-[2.25rem] font-extrabold leading-[1.08] tracking-tight text-white sm:text-5xl lg:text-[3.5rem]">
              Rwanda's workforce is transforming.{' '}
              <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-sky-200 bg-clip-text text-transparent">
                Who's tracking where the demand is heading?
              </span>
            </h1>

            <p className="mt-5 max-w-lg text-base leading-relaxed text-blue-100/90 sm:text-lg">
              <strong className="text-white">SkillSense</strong> forecasts demand for roles across {SNAPSHOT.sectors} economic sectors using NISR Labour Force Survey data and {SNAPSHOT.totalPostings} real job postings — then turns those forecasts into plans for advisors, planners and analysts.
            </p>

            <ul className="mt-6 space-y-2">
              {proof.map((p) => (
                <li key={p} className="flex items-center gap-2 text-sm font-medium text-blue-100">
                  <BadgeCheck className="h-4 w-4 shrink-0 text-emerald-300" />
                  {p}
                </li>
              ))}
            </ul>

            <div className="mt-8 flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <Link
                to={user ? '/dashboard' : '/signin'}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-navy shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-blue-50"
              >
                {user ? 'Open dashboard' : 'Try the demo'}
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#challenge"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
              >
                See the problem
              </a>
            </div>
          </div>

          {/* ── Right: Rwanda map ── */}
          <div className="relative flex items-center justify-center">
            <div className="absolute -inset-4 rounded-3xl bg-white/5 blur-2xl" aria-hidden />
            <div className="relative w-full max-w-lg rounded-2xl border border-white/15 bg-white/10 p-5 shadow-2xl shadow-black/20 backdrop-blur-sm sm:p-6 lg:max-w-none">
              <div className="mb-3 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white">Skills Demand by District</h3>
                  <p className="text-[11px] text-blue-200/70">Workforce Demand Heatmap · Rwanda</p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-[10px] font-bold text-emerald-300">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live data
                </span>
              </div>
              <img
                src="/rwanda_map_clean.webp"
                alt="Rwanda district-level workforce demand heatmap showing concentration in Kigali and secondary cities"
                fetchPriority="high"
                decoding="async"
                className="w-full rounded-lg"
              />
              <div className="mt-3 flex items-center justify-between text-[10px] text-blue-200/60">
                <div className="flex items-center gap-3">
                  <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-sm bg-blue-200" /> Low</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-sm bg-blue-500" /> Medium</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-4 rounded-sm bg-blue-800" /> High</span>
                </div>
                <span>{SNAPSHOT.sectors} sectors · {SNAPSHOT.totalPostings} postings</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
