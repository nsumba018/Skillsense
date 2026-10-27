import nisrLogo from '../assets/logos/nisr.webp'
import aucaLogo from '../assets/logos/auca.png'
import { Database, FileText, GraduationCap, Globe2 } from 'lucide-react'
import { SNAPSHOT } from '../lib/snapshot'

const sources = [
  {
    icon: Database,
    color: 'bg-blue-600 text-white',
    name: 'NISR Labour Force Survey',
    description: `${SNAPSHOT.historyYears} of employment microdata across all sectors — the official statistical foundation for all forecasts.`,
    tag: 'Primary dataset',
    tagColor: 'bg-blue-50 text-blue-700',
  },
  {
    icon: Globe2,
    color: 'bg-violet-600 text-white',
    name: '4 Rwandan Job Boards',
    description: `${SNAPSHOT.totalPostings} real job postings scraped from RwandaJob, JobWebRwanda, GreatRwandaJobs and JobInRwanda — spanning all ${SNAPSHOT.sectors} sectors.`,
    tag: 'Validation + skills',
    tagColor: 'bg-violet-50 text-violet-700',
  },
  {
    icon: GraduationCap,
    color: 'bg-emerald-600 text-white',
    name: 'University Curricula',
    description: 'Course catalogues from AUCA\'s four departments — parsed to extract the skills each programme teaches and compare with market demand.',
    tag: 'Education alignment',
    tagColor: 'bg-emerald-50 text-emerald-700',
  },
  {
    icon: FileText,
    color: 'bg-amber-600 text-white',
    name: 'Role & Sector Taxonomy',
    description: `${SNAPSHOT.roles} normalised roles across ${SNAPSHOT.sectors} economic sectors. Every job posting and forecast maps to this controlled vocabulary.`,
    tag: 'Built by us',
    tagColor: 'bg-amber-50 text-amber-700',
  },
]

export default function OurData() {
  return (
    <section id="data" className="scroll-mt-20 py-20 sm:py-28">
      <div className="container-1200">
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">Our data</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">
            Built on official statistics, validated with real postings
          </h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500 sm:text-lg">
            We combine NISR's Labour Force Survey microdata with live job-market signals from {SNAPSHOT.sectors} sectors
            and university curriculum data to produce forecasts grounded in evidence.
          </p>
        </div>

        {/* Partner logos */}
        <div className="mx-auto mb-12 flex flex-wrap items-center justify-center gap-8">
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
            <img src={nisrLogo} alt="NISR" className="h-10 w-auto object-contain" />
            <div>
              <div className="text-sm font-bold text-gray-900">NISR</div>
              <div className="text-[11px] text-gray-500">Labour Force Survey data</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white px-5 py-3 shadow-sm">
            <img src={aucaLogo} alt="AUCA" className="h-10 w-auto object-contain" />
            <div>
              <div className="text-sm font-bold text-gray-900">AUCA</div>
              <div className="text-[11px] text-gray-500">Curriculum & Innovation Center</div>
            </div>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {sources.map((s) => (
            <div key={s.name} className="group rounded-2xl border border-gray-200/80 bg-white p-6 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-lg hover:shadow-primary/5">
              <div className="flex items-start gap-4">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${s.color}`}>
                  <s.icon className="h-5 w-5" />
                </span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900">{s.name}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${s.tagColor}`}>{s.tag}</span>
                  </div>
                  <p className="mt-1.5 text-sm leading-relaxed text-gray-500">{s.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
