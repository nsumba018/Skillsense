import { ArrowRight, BadgeCheck, Eye, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import HeroDashboard from './HeroDashboard'
import nisrLogo from '../assets/logos/nisr.webp'
import rdbLogo from '../assets/logos/rdb.webp'
import mifotraLogo from '../assets/logos/mifotra.webp'
import minictLogo from '../assets/logos/minict.svg'
import risaLogo from '../assets/logos/risa.png'
import aucaLogo from '../assets/logos/auca.png'
import { useAuth } from '../auth/AuthContext'
import { SNAPSHOT } from '../lib/snapshot'
import { PHOTO_CREDITS } from './RootedInRwanda'

const stakeholders = [
  { name: 'MINICT', logo: minictLogo },
  { name: 'RDB', logo: rdbLogo },
  { name: 'RISA', logo: risaLogo },
  { name: 'AUCA Innovation Center', logo: aucaLogo },
  { name: 'MIFOTRA', logo: mifotraLogo },
  { name: 'NISR', logo: nisrLogo },
]

const proof = [
  `${SNAPSHOT.roles} ICT roles forecast`,
  `${SNAPSHOT.postings} real job postings`,
  `${SNAPSHOT.rankCorrelation.toFixed(2)} rank correlation`,
]

export default function Hero() {
  const { user } = useAuth()

  return (
    <section id="home" className="hero-bg relative isolate overflow-hidden scroll-mt-20">
      {/* banner photo: Kigali from above under a navy wash, fading into the page below the headline */}
      <div
        className="absolute inset-x-0 top-0 -z-10 h-[860px] sm:h-[800px] [mask-image:linear-gradient(to_bottom,black_72%,transparent)]"
        aria-hidden
      >
        <img
          src={PHOTO_CREDITS.skyline.src}
          alt=""
          fetchPriority="high"
          decoding="async"
          className="h-full w-full object-cover object-bottom"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-dark-navy/95 via-navy/80 to-navy/55" />
        <div className="hero-orb hero-orb-a" />
      </div>

      <div className="container-1200 relative pt-14 sm:pt-20">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-semibold text-blue-100 backdrop-blur">
            <Sparkles className="h-3.5 w-3.5 shrink-0" />
            AI-powered workforce intelligence for Rwanda
          </div>

          <h1 className="text-[2.5rem] font-extrabold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
            Know which skills Rwanda will need,{' '}
            <span className="bg-gradient-to-r from-sky-300 via-blue-200 to-white bg-clip-text text-transparent">before the gap opens.</span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-blue-100 sm:text-lg">
            SkillSense forecasts demand for ICT roles from labour-survey history and live job postings, then turns it into plans for advisors
            guiding students, planners shaping curricula and analysts steering investment.
          </p>

          <div className="mt-8 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              to={user ? '/dashboard' : '/signin'}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-7 py-3.5 text-sm font-bold text-navy shadow-lg shadow-black/20 transition-all hover:-translate-y-0.5 hover:bg-blue-50"
            >
              {user ? 'Open your dashboard' : 'Sign in to explore'}
              <ArrowRight className="h-4 w-4" />
            </Link>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/30 bg-white/10 px-7 py-3.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/20"
            >
              <Eye className="h-4 w-4" />
              See how it works
            </a>
          </div>

          <ul className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2">
            {proof.map((p) => (
              <li key={p} className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-100 sm:text-sm">
                <BadgeCheck className="h-4 w-4 text-emerald-300" />
                {p}
              </li>
            ))}
          </ul>
        </div>

        {/* product preview, fading into the next section */}
        <div className="relative mx-auto mt-12 max-w-6xl sm:mt-16">
          <HeroDashboard />
          <div className="pointer-events-none absolute inset-x-0 -bottom-px h-24 bg-gradient-to-t from-page to-transparent" aria-hidden />
        </div>

        <div className="pb-14 pt-14 text-center">
          <p className="mb-5 text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">Built with and for</p>
          <div className="overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_12%,black_88%,transparent)]">
            <div className="marquee inline-flex">
              {[...stakeholders, ...stakeholders].map((s, i) => (
                <span
                  key={`${s.name}-${i}`}
                  aria-hidden={i >= stakeholders.length}
                  className="mr-14 inline-flex items-center gap-2.5 whitespace-nowrap opacity-80 sm:mr-[88px]"
                >
                  <img src={s.logo} alt="" className="h-6 w-auto object-contain sm:h-7" />
                  <span className="text-sm font-bold tracking-wider text-gray-800">{s.name}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
