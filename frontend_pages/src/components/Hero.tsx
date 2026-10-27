import { ArrowRight, BadgeCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import HeroDashboard from './HeroDashboard'
import { SNAPSHOT } from '../lib/snapshot'
import coatOfArmsLogo from '../assets/logos/coat-of-arms.webp'
import mifotraLogo from '../assets/logos/mifotra.webp'
import rdbLogo from '../assets/logos/rdb.webp'
import nisrLogo from '../assets/logos/nisr.webp'
import hecLogo from '../assets/logos/hec.webp'

const institutions = [
  { name: 'MIFOTRA', logo: mifotraLogo },
  { name: 'RDB', logo: rdbLogo },
  { name: 'NISR', logo: nisrLogo },
  { name: 'MINEDUC', logo: coatOfArmsLogo },
  { name: 'HEC', logo: hecLogo },
]
const logos = [...institutions, ...institutions]

const proof = [
  `${SNAPSHOT.historyYears} of NISR Labour Force Survey data`,
  `Job postings from ${SNAPSHOT.jobBoards.length} Rwandan job boards`,
  `${SNAPSHOT.sectors} economic sectors tracked`,
]

export default function Hero() {
  return (
    <section id="home" className="relative min-h-[calc(100vh-110px)] flex items-center pt-1 pb-11 md:pb-14 scroll-mt-24 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <div className="absolute -right-32 -top-32 h-[500px] w-[500px] rounded-full bg-primary/[0.04] blur-3xl" />
        <div className="absolute -left-24 bottom-0 h-[400px] w-[400px] rounded-full bg-accent/[0.04] blur-3xl" />
      </div>

      <div className="container-1200 w-full">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          <div className="lg:col-span-5 pt-4 lg:pt-8">
            <h1 className="text-4xl md:text-5xl lg:text-[54px] font-extrabold text-gray-900 leading-[1.1] mb-5 tracking-tight">
              Forecast which roles Rwanda will need
              <span className="text-primary"> — before the skills gap opens</span>
            </h1>

            <p className="text-base text-gray-600 mb-2 leading-relaxed">
              <strong className="text-gray-900">SkillSense</strong> turns NISR labour data and real job postings
              into sector-level demand forecasts, curriculum alignment reports, and student placement plans.
            </p>

            <ul className="mt-5 space-y-2">
              {proof.map((p) => (
                <li key={p} className="flex items-center gap-2 text-sm text-gray-500">
                  <BadgeCheck className="h-4 w-4 shrink-0 text-accent" />
                  {p}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center justify-start gap-4 mt-8 mb-8">
              <Link
                to="/signin"
                className="inline-flex items-center gap-2 bg-navy hover:bg-primary-dark text-white font-semibold px-7 py-3.5 rounded-xl transition-colors shadow-lg shadow-navy/20 text-sm"
              >
                Sign in
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#insights"
                className="inline-flex items-center gap-2 border border-gray-200 hover:border-gray-300 text-gray-700 font-medium px-7 py-3.5 rounded-xl transition-colors text-sm"
              >
                See the problem
              </a>
            </div>
          </div>

          <div className="lg:col-span-7 pt-4 lg:pt-8">
            <HeroDashboard />
          </div>
        </div>

        <div className="text-center pt-14">
          <p className="text-xs text-gray-400 mb-4 font-medium uppercase tracking-wider">
            Built for Rwanda's key institutions
          </p>
          <div className="overflow-hidden">
            <div className="marquee inline-flex">
              {logos.map((inst, i) => (
                <span key={i} className="inline-flex items-center gap-2 whitespace-nowrap mr-24">
                  <img src={inst.logo} alt={inst.name} className="h-7 w-auto object-contain" />
                  <span className="text-sm font-bold text-gray-700 tracking-wide">{inst.name}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
