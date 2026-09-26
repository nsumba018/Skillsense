import { Link, Navigate, useLocation } from 'react-router-dom'
import { ShieldAlert } from 'lucide-react'
import { ROLE_LABELS, useAuth } from './AuthContext'
import { ACCESS } from './access'
import { Loading } from '../components/ui/State'

/** Signed-in users only; when `path` is given, also restricted to the roles allowed for that page. */
export default function ProtectedRoute({ children, path }: { children: React.ReactNode; path?: string }) {
  const roles = path ? ACCESS[path] : undefined
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page">
        <Loading label="Checking your session…" />
      </div>
    )
  }
  if (!user) return <Navigate to="/signin" replace state={{ from: location.pathname }} />

  if (roles && !roles.includes(user.role)) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-page px-6 text-center">
        <ShieldAlert className="h-12 w-12 text-amber-500" />
        <h1 className="text-2xl font-extrabold text-navy">You don't have access to this page</h1>
        <p className="max-w-md text-sm text-gray-500">
          This page is available to: {roles.map((r) => ROLE_LABELS[r]).join(', ')}. Your account role is{' '}
          <span className="font-semibold">{ROLE_LABELS[user.role]}</span>.
        </p>
        <Link to="/dashboard" className="rounded-lg bg-navy px-5 py-3 text-sm font-bold text-white">
          Back to dashboard
        </Link>
      </div>
    )
  }
  return <>{children}</>
}
