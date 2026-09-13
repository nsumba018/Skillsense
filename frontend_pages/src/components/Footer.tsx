import { Share2, Mail, MapPin, Phone, ArrowRight } from 'lucide-react'
import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer id="contact" className="bg-dark-navy text-white scroll-mt-24">
      <div className="container-1200 pt-20 pb-16">
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-3 w-fit">
              <img src="/logo_icon.webp" alt="SkillSense logo" className="h-7 w-auto" />
              <span className="text-lg font-extrabold text-white tracking-tight">SkillSense</span>
            </Link>
            <p className="text-xs text-gray-400 leading-relaxed mb-5">
              National Skills Intelligence Platform providing authoritative labour
              market intelligence.
            </p>
            <div className="flex items-center gap-3">
              <a href="#" aria-label="SkillSense on LinkedIn" className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/></svg>
              </a>
              <a href="#" aria-label="SkillSense on GitHub" className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>
              </a>
              <a href="#" aria-label="Share SkillSense" className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors">
                <Share2 className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Resources</h4>
            <ul className="space-y-2.5">
              <li><a href="#" className="text-xs text-gray-400 hover:text-white transition-colors">Methodology</a></li>
              <li><a href="#" className="text-xs text-gray-400 hover:text-white transition-colors">Data Governance</a></li>
              <li><a href="#" className="text-xs text-gray-400 hover:text-white transition-colors">API Documentation</a></li>
              <li><a href="#" className="text-xs text-gray-400 hover:text-white transition-colors">Help Center</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Institutional</h4>
            <ul className="space-y-2.5">
              <li><a href="#" className="text-xs text-gray-400 hover:text-white transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="text-xs text-gray-400 hover:text-white transition-colors">MIFOTRA Portal</a></li>
              <li><a href="#" className="text-xs text-gray-400 hover:text-white transition-colors">RDB Services</a></li>
              <li><a href="#" className="text-xs text-gray-400 hover:text-white transition-colors">NISR Data Portal</a></li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Contact</h4>
            <ul className="space-y-2.5">
              <li className="flex items-center gap-2 text-xs text-gray-400">
                <Mail className="w-3.5 h-3.5 shrink-0" />
                info@skillsense.gov.rw
              </li>
              <li className="flex items-center gap-2 text-xs text-gray-400">
                <Phone className="w-3.5 h-3.5 shrink-0" />
                +250 788 123 456
              </li>
              <li className="flex items-center gap-2 text-xs text-gray-400">
                <MapPin className="w-3.5 h-3.5 shrink-0" />
                Kigali, Rwanda
              </li>
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-4">Newsletter</h4>
            <p className="text-xs text-gray-400 mb-3">
              Stay updated with labor market insights.
            </p>
            <div className="flex">
              <input
                type="email"
                placeholder="Email"
                aria-label="Email address for newsletter"
                className="bg-white/10 rounded-l-lg px-3 py-2.5 text-xs text-white placeholder:text-gray-400 outline-none border border-white/10 focus:border-primary/50 w-full"
              />
              <button aria-label="Subscribe to newsletter" className="bg-primary px-3 rounded-r-lg flex items-center justify-center hover:bg-primary-dark transition-colors">
                <ArrowRight className="w-4 h-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-1200 flex flex-col md:flex-row items-center justify-between py-5 gap-4">
          <p className="text-xs text-gray-500">
            &copy; 2025 SkillSense National Intelligence Platform — Government of Rwanda
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="hover:text-white cursor-pointer transition-colors">English</span>
            <span className="hover:text-white cursor-pointer transition-colors">Kinyarwanda</span>
            <span className="hover:text-white cursor-pointer transition-colors">Français</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
