import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Link } from 'react-router-dom'

const navItems = [
  { label: 'Home', href: '#home', active: true },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Data', href: '#reports' },
  { label: 'Stakeholders', href: '#stakeholders' },
  { label: 'Contact', href: '#contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-100">
      <div className="container-1200 flex items-center justify-between min-h-[72px] py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo_icon.webp" alt="SkillSense logo" className="h-9 w-auto" />
          <span className="text-xl font-extrabold text-gray-900 tracking-tight">SkillSense</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`text-sm font-medium transition-colors ${
                item.active
                  ? 'text-primary'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link to="/signin" className="text-sm font-medium text-gray-700 hover:text-gray-900 px-4 py-2">
            Login
          </Link>
          <Link to="/signup" className="text-sm font-medium text-white bg-navy hover:bg-primary-dark px-5 py-2.5 rounded-lg transition-colors shadow-sm">
            Request Access
          </Link>
        </div>

        <button
          className="md:hidden p-2"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white px-6 pb-6 pt-4 space-y-4">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className={`block text-sm font-medium ${
                item.active ? 'text-primary' : 'text-gray-600'
              }`}
            >
              {item.label}
            </a>
          ))}
          <div className="pt-2 space-y-3">
            <Link to="/signin" className="block w-full text-center text-sm font-medium text-gray-700 border border-gray-300 rounded-lg px-4 py-2.5">
              Login
            </Link>
            <Link to="/signup" className="block w-full text-center text-sm font-medium text-white bg-navy rounded-lg px-4 py-2.5">
              Request Access
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}
