import { MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'
import { PHOTO_CREDITS } from './RootedInRwanda'

const link = 'text-sm text-gray-400 transition-colors hover:text-white'

export default function Footer() {
  return (
    <footer id="contact" className="scroll-mt-24 bg-dark-navy text-white">
      <div className="container-1200 pb-14 pt-16">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 lg:grid-cols-4">
          <div className="col-span-2 lg:col-span-1">
            <Link to="/" className="mb-4 flex w-fit items-center gap-2">
              <img src="/logo_icon.webp" alt="" className="h-8 w-auto" />
              <span className="text-lg font-extrabold tracking-tight">SkillSense</span>
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-gray-400">
              AI-powered workforce intelligence for Rwanda: role-level demand forecasts built on labour survey data and real job postings.
            </p>
            <p className="mt-4 flex items-center gap-2 text-sm text-gray-400">
              <MapPin className="h-4 w-4 shrink-0" /> Kigali, Rwanda
            </p>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold">Product</h4>
            <ul className="space-y-2.5">
              <li><a href="#features" className={link}>Features</a></li>
              <li><a href="#how-it-works" className={link}>How it works</a></li>
              <li><a href="#insights" className={link}>Why it matters</a></li>
              <li><Link to="/signin" className={link}>Sign in</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold">Who it&apos;s for</h4>
            <ul className="space-y-2.5">
              <li><a href="#stakeholders" className={link}>Career &amp; Training Advisors</a></li>
              <li><a href="#stakeholders" className={link}>Curriculum Planners</a></li>
              <li><a href="#stakeholders" className={link}>Labour Market Analysts</a></li>
              <li><a href="#stakeholders" className={link}>Administrators</a></li>
            </ul>
          </div>

          <div>
            <h4 className="mb-4 text-sm font-semibold">Data sources</h4>
            <ul className="space-y-2.5 text-sm text-gray-400">
              <li>NISR Labour Force Survey</li>
              <li>RwandaJob · JobWebRwanda</li>
              <li>GreatRwandaJobs · JobInRwanda</li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-1200 flex flex-col items-center justify-between gap-3 py-5 md:flex-row">
          <p className="text-xs text-gray-500">&copy; 2026 SkillSense: workforce intelligence for Rwanda</p>
          <p className="text-xs text-gray-500">A final-year project of the Department of Software Engineering, AUCA</p>
        </div>
        <p className="container-1200 pb-6 text-center text-[11px] leading-relaxed text-gray-600 md:text-left">
          Photos via Wikimedia Commons:{' '}
          {Object.values(PHOTO_CREDITS).map((p, i) => (
            <span key={p.src}>
              {i > 0 && ' · '}
              <a href={p.href} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-gray-300 hover:underline">{p.author}</a>
              {' '}(<a href={p.licenseHref} target="_blank" rel="noopener noreferrer" className="underline-offset-2 hover:text-gray-300 hover:underline">{p.license}</a>)
            </span>
          ))}
        </p>
      </div>
    </footer>
  )
}
