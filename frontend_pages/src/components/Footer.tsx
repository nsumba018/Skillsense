import { Mail, MapPin } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer id="contact" className="bg-dark-navy text-white scroll-mt-24">
      <div className="container-1200 pt-16 pb-12">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3 w-fit">
              <img src="/logo_icon.webp" alt="" className="h-7 w-auto" />
              <span className="text-lg font-extrabold text-white tracking-tight">SkillSense</span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed mb-5">
              Rwanda Workforce Intelligence Platform — turning NISR labour data
              and job postings into actionable workforce forecasts.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Platform</h4>
            <ul className="space-y-2.5">
              <li><a href="#insights" className="text-xs text-gray-400 hover:text-white transition-colors">The Skills Gap</a></li>
              <li><a href="#how-it-works" className="text-xs text-gray-400 hover:text-white transition-colors">How It Works</a></li>
              <li><a href="#stakeholders" className="text-xs text-gray-400 hover:text-white transition-colors">Stakeholders</a></li>
              <li><Link to="/signin" className="text-xs text-gray-400 hover:text-white transition-colors">Sign In</Link></li>
              <li><a href="/api/docs/" target="_blank" rel="noopener noreferrer" className="text-xs text-gray-400 hover:text-white transition-colors">API Documentation</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Data Sources</h4>
            <ul className="space-y-2.5">
              <li><span className="text-xs text-gray-400">NISR Labour Force Surveys</span></li>
              <li><span className="text-xs text-gray-400">BrighterMonday Rwanda</span></li>
              <li><span className="text-xs text-gray-400">JobInRwanda</span></li>
              <li><span className="text-xs text-gray-400">RwandaJob / JobWebRwanda</span></li>
              <li><span className="text-xs text-gray-400">GreatRwandaJobs</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Contact</h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-xs text-gray-400">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                nsumbaherve11@gmail.com
              </li>
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
            &copy; 2026 SkillSense — Rwanda Workforce Intelligence
          </p>
          <p className="text-xs text-gray-500">
            Built for Rwanda's workforce future
          </p>
        </div>
      </div>
    </footer>
  )
}
