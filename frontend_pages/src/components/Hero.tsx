import { ArrowRight, Eye, Shield } from 'lucide-react'
import { Link } from 'react-router-dom'
import HeroDashboard from './HeroDashboard'
import nisrLogo from '../assets/logos/nisr.webp'
import rdbLogo from '../assets/logos/rdb.webp'
import mifotraLogo from '../assets/logos/mifotra.webp'
import minictLogo from '../assets/logos/minict.svg'
import risaLogo from '../assets/logos/risa.png'
import aucaLogo from '../assets/logos/auca.png'
import { useAuth } from '../auth/AuthContext'

const stakeholders = [
  { name: 'MINICT', logo: minictLogo },
  { name: 'RDB', logo: rdbLogo },
  { name: 'RISA', logo: risaLogo },
  { name: 'AUCA Innovation Center', logo: aucaLogo },
  { name: 'Training Programs', logo: '' },
  { name: 'MIFOTRA', logo: mifotraLogo },
  { name: 'NISR', logo: nisrLogo },
]

export default function Hero() {
  const { user } = useAuth()

  return (
    <section id="home" className="min-h-[calc(100vh-110px)] flex items-center pt-[3px] pb-11 md:pb-[59px] scroll-mt-24">
      <div className="container-1200 w-full">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          <div className="lg:col-span-5 pt-4 lg:pt-8">
            <div className="inline-flex items-center gap-1.5 bg-primary-light text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              <Shield className="w-3 h-3" />
              AI-POWERED · ICT WORKFORCE INTELLIGENCE
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-[58px] font-extrabold text-gray-900 leading-tight mb-5 tracking-tight">
              The Intelligence Behind Rwanda's Next ICT <span className="text-primary">Workforce</span>
            </h1>

            <p className="text-sm text-gray-500 mb-[30px] leading-loose">
              AI-powered labour market intelligence that tracks demand trends, forecasts emerging roles,
              and closes skill gaps — helping policy makers, educators, and career advisors make decisions
              before gaps become bottlenecks.
            </p>

            <div className="flex flex-wrap items-center justify-start gap-4 mb-8">
              <Link to={user ? '/dashboard' : '/signup'} className="inline-flex items-center gap-2 bg-navy hover:bg-primary-dark text-white font-medium px-6 py-3 rounded-xl transition-colors shadow-sm text-sm">
                {user ? 'Open Dashboard' : 'Explore the Forecasts'}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a href="#how-it-works" className="inline-flex items-center gap-2 border border-gray-200 hover:border-gray-300 text-primary font-medium px-6 py-3 rounded-xl transition-colors text-sm">
                <Eye className="w-4 h-4" />
                See How It Works
              </a>
            </div>
          </div>

          <div className="lg:col-span-7 pt-4 lg:pt-8">
            <HeroDashboard />
          </div>
        </div>

        <div className="text-center pt-12">
          <p className="text-xs text-gray-500 mb-4 font-medium uppercase tracking-wider">Built for</p>
          <div className="overflow-hidden">
            <div className="marquee inline-flex">
              {stakeholders.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-2 whitespace-nowrap mr-[100px]">
                  {s.logo && <img src={s.logo} alt="" className="h-6 w-auto object-contain" />}
                  <span className="text-sm font-bold text-gray-900 tracking-wider">{s.name}</span>
                </span>
              ))}
              {/* Duplicate set for seamless loop — hidden from screen readers */}
              {stakeholders.map((s, i) => (
                <span key={`dup-${i}`} aria-hidden="true" className="inline-flex items-center gap-2 whitespace-nowrap mr-[100px]">
                  {s.logo && <img src={s.logo} alt="" className="h-6 w-auto object-contain" />}
                  <span className="text-sm font-bold text-gray-900 tracking-wider">{s.name}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
