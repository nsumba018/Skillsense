import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { authApi } from '../services/api'
import { LOGOUT_EVENT, tokenStore } from '../services/http'
import type { RegisterPayload, User, UserRole } from '../types/api'

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  career_training_advisor: 'Career & Training Advisor',
  education_curriculum_planner: 'Education / Curriculum Planner',
  labor_market_analyst: 'Labour Market Analyst',
}

interface AuthState {
  user: User | null
  loading: boolean
  isAdmin: boolean
  login: (email: string, password: string, remember: boolean) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
  setUser: (u: User) => void
}

const AuthContext = createContext<AuthState | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState<boolean>(() => tokenStore.access !== null || tokenStore.refresh !== null)

  useEffect(() => {
    if (!loading) return
    let cancelled = false
    authApi
      .me()
      .then((u) => !cancelled && setUser(u))
      .catch(() => tokenStore.clear())
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [loading])

  useEffect(() => {
    const onLogout = () => {
      setUser(null)
      queryClient.clear()
    }
    window.addEventListener(LOGOUT_EVENT, onLogout)
    return () => window.removeEventListener(LOGOUT_EVENT, onLogout)
  }, [queryClient])

  const login = useCallback(async (email: string, password: string, remember: boolean) => {
    const tokens = await authApi.login(email, password)
    tokenStore.set(tokens, remember)
    setUser(await authApi.me())
  }, [])

  const register = useCallback(
    async (payload: RegisterPayload) => {
      await authApi.register(payload)
      await login(payload.email, payload.password, false)
    },
    [login],
  )

  const logout = useCallback(async () => {
    const refresh = tokenStore.refresh
    try {
      if (refresh) await authApi.logout(refresh)
    } catch {
      /* token already invalid, still sign out locally */
    }
    tokenStore.clear()
    setUser(null)
    queryClient.clear()
  }, [queryClient])

  const value = useMemo<AuthState>(
    () => ({ user, loading, isAdmin: user?.role === 'admin', login, register, logout, setUser }),
    [user, loading, login, register, logout],
  )
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
