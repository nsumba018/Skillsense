import { useEffect, useState } from 'react'
import { Menu, X } from 'lucide-react'
import { Link } from 'react-router-dom'

const navItems = [
  { label: 'The Problem', href: '#insights' },
  { label: 'How It Works', href: '#how-it-works' },
  { label: 'Stakeholders', href: '#stakeholders' },
  { label: 'Contact', href: '#contact' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav
      className={`sticky top-0 z-50 border-b bg-navy/95 backdrop-blur-md transition-shadow ${
        scrolled ? 'border-white/10 shadow-md shadow-black/10' : 'border-transparent'
      }`}
    >
      <div className="container-1200 flex items-center justify-between min-h-[68px] py-3">
        <Link to="/" className="flex items-center gap-2">
          <img src="/logo_icon.webp" alt="" className="h-9 w-auto" />
          <span className="text-xl font-extrabold text-white tracking-tight">SkillSense</span>
        </Link>

        <div className="hidden md:flex items-center gap-8">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-sm font-medium text-white/70 transition-colors hover:text-white"
            >
              {item.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <Link to="/signin" className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-navy shadow-sm transition-colors hover:bg-gray-100">
            Sign in
          </Link>
        </div>

        <button
          className="md:hidden p-2 text-white"
          onClick={() => setOpen(!open)}
          aria-label={open ? 'Close menu' : 'Open menu'}
          aria-expanded={open}
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-white/10 bg-navy px-6 pb-6 pt-4 space-y-4">
          {navItems.map((item) => (
            <a
              key={item.label}
              href={item.href}
              onClick={() => setOpen(false)}
              className="block text-sm font-medium text-white/80"
            >
              {item.label}
            </a>
          ))}
          <Link to="/signin" className="block w-full text-center text-sm font-semibold text-navy bg-white rounded-lg px-4 py-2.5">
            Sign in
          </Link>
        </div>
      )}
    </nav>
  )
}
