import { ArrowRight, Play, Shield } from 'lucide-react'
import HeroDashboard from './HeroDashboard'
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

export default function Hero() {
  return (
    <section id="home" className="min-h-[calc(100vh-110px)] flex items-center pt-[3px] pb-11 md:pb-[59px] scroll-mt-24">
      <div className="container-1200 w-full">
        <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 items-start">
          <div className="lg:col-span-5 pt-4 lg:pt-8">
            <div className="inline-flex items-center gap-1.5 bg-primary-light text-primary text-xs font-semibold px-3 py-1.5 rounded-full mb-5">
              <Shield className="w-3 h-3" />
              AI-POWERED · NATIONAL INTELLIGENCE PLATFORM
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-[58px] font-extrabold text-gray-900 leading-tight mb-5 tracking-tight">
              Workforce Intelligence for Rwanda's{' '}
              <span className="text-primary">Next Decade</span>
            </h1>

            <p className="text-base text-gray-500 mb-2 font-medium">
              Real-time data. Predictive insights. Smarter decisions.
            </p>
            <p className="text-sm text-gray-500 mb-[30px] leading-loose">
              Bridging the gap between education, skills, and market demand. SkillSense unifies
              labor market and training signals into one intelligence layer, giving policymakers
              the clarity to act before skill gaps become national bottlenecks.
            </p>

            <div className="flex flex-wrap items-center justify-start gap-4 mb-8">
              <a href="#insights" className="inline-flex items-center gap-2 bg-navy hover:bg-primary-dark text-white font-medium px-6 py-3 rounded-xl transition-colors shadow-sm text-sm">
                Explore Insights
                <ArrowRight className="w-4 h-4" />
              </a>
              <a href="#how-it-works" className="inline-flex items-center gap-2 border border-gray-200 hover:border-gray-300 text-primary font-medium px-6 py-3 rounded-xl transition-colors text-sm">
                <Play className="w-4 h-4" />
                See How It Works
              </a>
            </div>

          </div>

          <div className="lg:col-span-7 pt-4 lg:pt-8">
            <HeroDashboard />
          </div>
        </div>

        <div className="text-center pt-12">
          <p className="text-xs text-gray-500 mb-4 font-medium uppercase tracking-wider">
            Trusted by over 15 Government Institutions
          </p>
          <div className="overflow-hidden">
            <div className="marquee inline-flex">
              {logos.map((inst, i) => (
                <span key={i} className="inline-flex items-center gap-2 whitespace-nowrap mr-[100px]">
                  <img src={inst.logo} alt={inst.name} className="h-6 w-auto object-contain" />
                  <span className="text-sm font-bold text-gray-900 tracking-wider">{inst.name}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
