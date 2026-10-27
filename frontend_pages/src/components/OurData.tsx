import nisrLogo from '../assets/logos/nisr.webp'
import aucaLogo from '../assets/logos/auca.png'
import { Database, FileText, GraduationCap, Globe2 } from 'lucide-react'
import { SNAPSHOT } from '../lib/snapshot'

const sources = [
  {
    icon: Database,
    color: 'text-blue-400',
    name: 'NISR Labour Force Survey',
    description: `${SNAPSHOT.historyYears} of employment microdata across all sectors — the official statistical foundation for all forecasts.`,
    tag: 'Primary dataset',
  },
  {
    icon: Globe2,
    color: 'text-violet-400',
    name: '4 Rwandan Job Boards',
    description: `${SNAPSHOT.totalPostings} real job postings scraped from RwandaJob, JobWebRwanda, GreatRwandaJobs and JobInRwanda — spanning all ${SNAPSHOT.sectors} sectors.`,
    tag: 'Validation + skills',
  },
  {
    icon: GraduationCap,
    color: 'text-emerald-400',
    name: 'University Curricula',
    description: "Course catalogues from AUCA's four departments — parsed to extract the skills each programme teaches and compare with market demand.",
    tag: 'Education alignment',
  },
  {
    icon: FileText,
    color: 'text-amber-400',
    name: 'Role & Sector Taxonomy',
    description: `${SNAPSHOT.roles} normalised roles across ${SNAPSHOT.sectors} economic sectors. Every job posting and forecast maps to this controlled vocabulary.`,
    tag: 'Built by us',
  },
]

export default function OurData() {
  return (
    <section id="data" className="scroll-mt-20 bg-dark-navy py-20 sm:py-28">
      <div className="container-1200">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Built on official statistics, validated with real postings
          </h2>
          <p className="mt-4 text-base leading-relaxed text-blue-200/60 sm:text-lg">
            We combine NISR's Labour Force Survey microdata with live job-market signals from {SNAPSHOT.sectors} sectors
            and university curriculum data to produce forecasts grounded in evidence.
          </p>
        </div>

        {/* Partner logos */}
        <div className="mx-auto mb-14 flex flex-wrap items-center justify-center gap-6">
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white p-1.5">
              <img src={nisrLogo} alt="NISR" className="h-full w-auto object-contain" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">NISR</div>
              <div className="text-[11px] text-blue-200/50">Labour Force Survey data</div>
            </div>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-6 py-4">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white p-1.5">
              <img src={aucaLogo} alt="AUCA" className="h-full w-auto object-contain" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">AUCA</div>
              <div className="text-[11px] text-blue-200/50">Curriculum & Innovation Center</div>
            </div>
          </div>
        </div>

        <div className="grid gap-px overflow-hidden rounded-2xl border border-white/10 sm:grid-cols-2">
          {sources.map((s, i) => (
            <div
              key={s.name}
              className={`bg-white/[0.03] p-6 sm:p-8 ${
                i < 2 ? 'border-b border-white/[0.06]' : ''
              } ${i % 2 === 0 ? 'sm:border-r sm:border-white/[0.06]' : ''}`}
            >
              <div className="flex items-start gap-4">
                <s.icon className={`h-6 w-6 shrink-0 ${s.color}`} />
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-base font-bold text-white">{s.name}</h3>
                    <span className="rounded-full border border-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-blue-200/50">
                      {s.tag}
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-blue-200/50">{s.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
