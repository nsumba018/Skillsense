import { MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer id="contact" className="bg-dark-navy text-white scroll-mt-24">
      <div className="container-1200 pt-20 pb-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3 w-fit">
              <img src="/logo_icon.webp" alt="SkillSense logo" className="h-7 w-auto" />
              <span className="text-lg font-extrabold text-white tracking-tight">SkillSense</span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed mb-2">
              AI-powered ICT workforce intelligence for Rwanda: role-level demand
              forecasts built on labour survey data and real job postings.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Explore</h4>
            <ul className="space-y-2.5">
              <li><Link to="/signin" className="text-xs text-gray-400 hover:text-white transition-colors">Sign in</Link></li>
              <li><Link to="/signup" className="text-xs text-gray-400 hover:text-white transition-colors">Create an account</Link></li>
              <li><a href="#how-it-works" className="text-xs text-gray-400 hover:text-white transition-colors">How it works</a></li>
              <li><a href="#stakeholders" className="text-xs text-gray-400 hover:text-white transition-colors">Who it's for</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Data Sources</h4>
            <ul className="space-y-2.5 text-xs text-gray-400">
              <li>NISR Labour Force Survey</li>
              <li>RwandaJob · JobWebRwanda</li>
              <li>GreatRwandaJobs · JobInRwanda</li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Based in</h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-xs text-gray-400">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                Kigali, Rwanda
              </li>
            </ul>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-1200 flex flex-col md:flex-row items-center justify-between py-5 gap-4">
          <p className="text-xs text-gray-500">
            &copy; 2026 SkillSense: ICT Workforce Intelligence for Rwanda
          </p>
        </div>
      </div>
    </footer>
  )
}
