import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { AlertCircle, Loader2 } from 'lucide-react'
import { authApi } from '../services/api'
import { ApiError, tokenStore } from '../services/http'

/** Landing page for the emailed link: signs the invited user in, then sends them to choose a password. */
export default function InviteLogin() {
  const [params] = useSearchParams()
  const token = params.get('token') ?? ''
  const [error, setError] = useState<string | null>(token ? null : 'This sign-in link is missing its token.')
  const started = useRef(false)

  useEffect(() => {
    if (!token || started.current) return
    started.current = true
    authApi
      .inviteLogin(token)
      .then((res) => {
        tokenStore.set({ access: res.access, refresh: res.refresh }, false)
        try { sessionStorage.setItem('ss_invite_link', '1') } catch { /* storage blocked: the form just asks for the temporary password */ }
        window.location.replace('/change-password') // full load so the session is picked up
      })
      .catch((e) => setError(e instanceof ApiError ? e.message : 'Could not sign you in. Please try again.'))
  }, [token])

  return (
    <div className="flex min-h-screen items-center justify-center bg-page px-6">
      {error ? (
        <div className="max-w-md text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-50"><AlertCircle className="h-8 w-8 text-red-500" /></div>
          <h1 className="text-2xl font-extrabold text-navy">Link not valid</h1>
          <p className="mt-3 text-gray-500">{error}</p>
          <Link to="/signin" className="mt-8 inline-block rounded-lg bg-navy px-6 py-3 text-sm font-bold text-white hover:bg-dark-navy">Go to Sign In</Link>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-4"><Loader2 className="h-8 w-8 animate-spin text-primary" /><p className="text-gray-500">Signing you in…</p></div>
      )}
    </div>
  )
}
