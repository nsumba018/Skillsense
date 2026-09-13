import { useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Pencil,
  Lock,
  Smartphone,
  Mail,
  Bell,
  AlertTriangle,
  Laptop,
  Check,
} from 'lucide-react'
import DashboardLayout, { Card } from './DashboardLayout'

const profileFields = [
  { label: 'Full Name', name: 'fullName', type: 'text', defaultValue: 'Jean Uwimana' },
  { label: 'Email Address', name: 'email', type: 'email', defaultValue: 'j.uwimana@mifotra.gov.rw' },
  {
    label: 'Organization',
    name: 'organization',
    type: 'text',
    defaultValue: 'Ministry of Public Service and Labour (MIFOTRA)',
  },
]

const notificationOptions = [
  { id: 'email', label: 'Email Notifications', icon: Mail, tone: 'text-navy', labelTone: 'text-gray-900' },
  { id: 'dashboard', label: 'Dashboard Updates', icon: Bell, tone: 'text-navy', labelTone: 'text-gray-900' },
  { id: 'critical', label: 'Critical Alerts', icon: AlertTriangle, tone: 'text-red-500', labelTone: 'text-red-600' },
] as const

const sessions = [
  { device: 'MacBook Pro 16"', icon: Laptop, location: 'Kigali, Rwanda', lastActive: 'Now', current: true },
  { device: 'iPhone 15 Pro', icon: Smartphone, location: 'Kigali, Rwanda', lastActive: '2 hours ago', current: false },
]

function SectionHeading({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="lg:pt-2">
      <h2 className="text-xl font-extrabold tracking-tight text-navy">{title}</h2>
      <p className="mt-2 text-sm leading-relaxed text-gray-500">{desc}</p>
    </div>
  )
}

export default function Settings() {
  const [twoFactor, setTwoFactor] = useState(true)
  const [notifications, setNotifications] = useState<Record<string, boolean>>({
    email: true,
    dashboard: true,
    critical: false,
  })

  return (
    <DashboardLayout>
      {/* Page header */}
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-navy">Account Settings</h1>
        <p className="mt-2 text-sm text-gray-500">
          Manage your administrative profile and institutional security preferences within the
          SkillSense network.
        </p>
      </div>

      {/* ---------- Personal profile ---------- */}
      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr]">
        <SectionHeading
          title="Personal Profile"
          desc="Your professional identity within the national workforce intelligence network."
        />

        <Card className="p-8">
          <div className="flex items-center gap-5 border-b border-gray-100 pb-6">
            <div className="relative">
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-navy text-xl font-bold text-white">
                JU
              </div>
              <button
                className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 shadow-sm transition-colors hover:text-navy"
                aria-label="Change profile photo"
              >
                <Pencil className="h-3 w-3" />
              </button>
            </div>
            <div>
              <div className="text-lg font-bold text-gray-900">Dr. Jean Uwimana</div>
              <div className="mt-0.5 text-sm text-gray-500">Lead Policy Analyst</div>
            </div>
          </div>

          <div className="mt-6 space-y-6">
            {profileFields.map((f) => (
              <label key={f.name} className="block">
                <span className="text-[11px] font-bold uppercase tracking-wider text-navy">
                  {f.label}
                </span>
                <input
                  type={f.type}
                  name={f.name}
                  defaultValue={f.defaultValue}
                  className="mt-2 w-full rounded-lg border border-transparent bg-gray-50 px-4 py-3.5 text-sm text-gray-800 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                />
              </label>
            ))}
          </div>
        </Card>
      </div>

      {/* ---------- Account security ---------- */}
      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr]">
        <SectionHeading
          title="Account Security"
          desc="Maintain the integrity of your institutional data access."
        />

        <div className="space-y-6">
          <Card className="p-8">
            <div className="flex items-center gap-2.5">
              <Lock className="h-5 w-5 text-navy" />
              <h3 className="text-lg font-bold text-gray-900">Update Password</h3>
            </div>

            <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2">
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wider text-navy">
                  Current Password
                </span>
                <input
                  type="password"
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="mt-2 w-full rounded-lg border border-transparent bg-gray-50 px-4 py-3.5 text-sm text-gray-800 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-bold uppercase tracking-wider text-navy">
                  New Password
                </span>
                <input
                  type="password"
                  autoComplete="new-password"
                  placeholder="••••••••"
                  className="mt-2 w-full rounded-lg border border-transparent bg-gray-50 px-4 py-3.5 text-sm text-gray-800 outline-none transition-colors focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                />
              </label>
            </div>

            <div className="mt-5 text-right">
              <Link
                to="/forgot-password"
                className="text-sm font-bold text-navy hover:underline"
              >
                Forgot password?
              </Link>
            </div>
          </Card>

          <Card className="flex items-center justify-between gap-6 border-l-4 border-l-emerald-600 p-6">
            <div className="flex items-start gap-4">
              <Smartphone className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
              <div>
                <h3 className="text-lg font-bold text-gray-900">Two-Factor Authentication</h3>
                <p className="mt-0.5 text-sm text-gray-500">
                  Add an extra layer of security to your account.
                </p>
              </div>
            </div>

            <button
              role="switch"
              aria-checked={twoFactor}
              aria-label="Two-factor authentication"
              onClick={() => setTwoFactor((v) => !v)}
              className={`relative h-7 w-13 shrink-0 rounded-full transition-colors ${
                twoFactor ? 'bg-emerald-600' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  twoFactor ? 'left-7' : 'left-1'
                }`}
              />
            </button>
          </Card>
        </div>
      </div>

      {/* ---------- Notification preferences ---------- */}
      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr]">
        <SectionHeading
          title="Notification Preferences"
          desc="Choose how you receive labor market updates and system alerts."
        />

        <Card className="divide-y divide-gray-100">
          {notificationOptions.map((o) => {
            const checked = notifications[o.id]
            return (
              <label
                key={o.id}
                className="flex cursor-pointer items-center justify-between gap-4 px-6 py-6"
              >
                <span className="flex items-center gap-4">
                  <o.icon className={`h-5 w-5 ${o.tone}`} />
                  <span className={`text-base font-bold ${o.labelTone}`}>{o.label}</span>
                </span>

                <span className="relative flex h-5 w-5 items-center justify-center">
                  <input
                    type="checkbox"
                    checked={checked}
                    onChange={() =>
                      setNotifications((n) => ({ ...n, [o.id]: !n[o.id] }))
                    }
                    className="peer sr-only"
                  />
                  <span
                    className={`flex h-5 w-5 items-center justify-center rounded border-2 transition-colors peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40 ${
                      checked ? 'border-navy bg-navy text-white' : 'border-gray-300 bg-white'
                    }`}
                  >
                    {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
                  </span>
                </span>
              </label>
            )
          })}
        </Card>
      </div>

      {/* ---------- Session management ---------- */}
      <div className="mt-12 grid grid-cols-1 gap-8 lg:grid-cols-[300px_1fr]">
        <SectionHeading
          title="Session Management"
          desc="Manage your active sessions and connected devices."
        />

        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left">
            <thead>
              <tr className="text-[11px] font-bold uppercase tracking-wider text-gray-500">
                <th className="px-6 pb-4 font-bold">Device</th>
                <th className="px-6 pb-4 font-bold">Location</th>
                <th className="px-6 pb-4 font-bold">Last Active</th>
                <th className="px-6 pb-4 text-right font-bold">Action</th>
              </tr>
            </thead>
            <tbody>
              {sessions.map((s, i) => (
                <tr
                  key={s.device}
                  className={`bg-white text-sm shadow-sm ${
                    i === 0 ? '[&>td:first-child]:rounded-tl-2xl [&>td:last-child]:rounded-tr-2xl' : ''
                  } ${
                    i === sessions.length - 1
                      ? '[&>td:first-child]:rounded-bl-2xl [&>td:last-child]:rounded-br-2xl'
                      : ''
                  }`}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <s.icon className="h-5 w-5 text-gray-500" />
                      <span className="font-medium text-gray-900">{s.device}</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-gray-600">{s.location}</td>
                  <td className={`px-6 py-5 font-medium ${s.current ? 'text-emerald-600' : 'text-gray-600'}`}>
                    {s.lastActive}
                  </td>
                  <td className="px-6 py-5 text-right">
                    {s.current ? (
                      <span className="text-sm font-semibold text-gray-400">Current</span>
                    ) : (
                      <button className="text-sm font-bold text-red-500 hover:underline">
                        Revoke
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ---------- Actions ---------- */}
      <div className="mt-12 flex flex-wrap items-center justify-end gap-4">
        <button className="rounded-lg px-6 py-3.5 text-sm font-bold text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900">
          Discard Changes
        </button>
        <button className="rounded-lg bg-navy px-8 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-dark-navy">
          Save All Changes
        </button>
      </div>
    </DashboardLayout>
  )
}
