import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

const navItems = [
  { label: 'Features', href: '#features' },
  { label: 'Roles', href: '#stakeholders' },
  { label: 'Why it matters', href: '#insights' },
  { label: 'How it works', href: '#how-it-works' },
  { label: 'Contact', href: '#contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const { user } = useAuth()
  const cta = user ? { to: '/dashboard', label: 'Open dashboard' } : { to: '/signin', label: 'Sign in' }

  return (
    <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
      <div className="container-1200 flex min-h-[68px] items-center justify-between py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo_icon.webp" alt="" className="h-9 w-auto" />
          <span className="text-xl font-extrabold tracking-tight text-gray-900">SkillSense</span>
        </Link>

        <div className="hidden items-center gap-8 md:flex">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} className="text-sm font-medium text-gray-600 transition-colors hover:text-primary">
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden items-center gap-4 md:flex">
          <Link to={cta.to} className="rounded-lg bg-navy px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary-dark">
            {cta.label}
          </Link>
        </div>

        <button className="p-2 md:hidden" onClick={() => setOpen(!open)} aria-label={open ? 'Close menu' : 'Open menu'} aria-expanded={open}>
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="space-y-4 border-t border-gray-100 bg-white px-6 pb-6 pt-4 md:hidden">
          {navItems.map((item) => (
            <a key={item.label} href={item.href} onClick={() => setOpen(false)} className="block text-sm font-medium text-gray-700">
              {item.label}
            </a>
          ))}
          <Link to={cta.to} className="block w-full rounded-lg bg-navy px-4 py-2.5 text-center text-sm font-semibold text-white">
            {cta.label}
          </Link>
        </div>
      )}
    </nav>
  )
}
