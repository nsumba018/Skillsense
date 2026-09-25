import { API_URL } from '../config'
import type { TokenPair } from '../types/api'

const ACCESS_KEY = 'ss_access'
const REFRESH_KEY = 'ss_refresh'
export const LOGOUT_EVENT = 'skillsense:logout'

/* Tokens live in localStorage when "remember me" is on, otherwise sessionStorage. */
export const tokenStore = {
  get access(): string | null {
    return localStorage.getItem(ACCESS_KEY) ?? sessionStorage.getItem(ACCESS_KEY)
  },
  get refresh(): string | null {
    return localStorage.getItem(REFRESH_KEY) ?? sessionStorage.getItem(REFRESH_KEY)
  },
  set(tokens: Partial<TokenPair>, remember: boolean) {
    const store = remember ? localStorage : sessionStorage
    const other = remember ? sessionStorage : localStorage
    if (tokens.access) {
      store.setItem(ACCESS_KEY, tokens.access)
      other.removeItem(ACCESS_KEY)
    }
    if (tokens.refresh) {
      store.setItem(REFRESH_KEY, tokens.refresh)
      other.removeItem(REFRESH_KEY)
    }
  },
  clear() {
    for (const s of [localStorage, sessionStorage]) {
      s.removeItem(ACCESS_KEY)
      s.removeItem(REFRESH_KEY)
    }
  },
  get remembered(): boolean {
    return localStorage.getItem(REFRESH_KEY) !== null
  },
}

export class ApiError extends Error {
  status: number
  data: unknown

  constructor(status: number, data: unknown) {
    super(extractMessage(status, data))
    this.name = 'ApiError'
    this.status = status
    this.data = data
  }
}

/** Flatten DRF error bodies ({field: ["msg"]} or {detail: "msg"}) into one readable string. */
function extractMessage(status: number, data: unknown): string {
  if (data && typeof data === 'object') {
    const obj = data as Record<string, unknown>
    if (typeof obj.detail === 'string') return obj.detail
    const parts = Object.entries(obj).map(([field, v]) => {
      const text = Array.isArray(v) ? v.join(' ') : String(v)
      return field === 'non_field_errors' ? text : `${field}: ${text}`
    })
    if (parts.length) return parts.join(' · ')
  }
  if (status === 0) return 'Cannot reach the server. Is the backend running?'
  return `Request failed (${status})`
}

let refreshing: Promise<boolean> | null = null

async function refreshAccessToken(): Promise<boolean> {
  const refresh = tokenStore.refresh
  if (!refresh) return false
  if (!refreshing) {
    refreshing = (async () => {
      try {
        const res = await fetch(`${API_URL}/api/auth/refresh/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh }),
        })
        if (!res.ok) return false
        const data = (await res.json()) as Partial<TokenPair>
        tokenStore.set(data, tokenStore.remembered)
        return true
      } catch {
        return false
      } finally {
        refreshing = null
      }
    })()
  }
  return refreshing
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  body?: unknown
  form?: FormData
  auth?: boolean
  headers?: Record<string, string>
  params?: Record<string, string | number | undefined | null>
}

function buildUrl(path: string, params?: RequestOptions['params']): string {
  const url = new URL(path, API_URL)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v))
    }
  }
  return url.toString()
}

async function send(path: string, opts: RequestOptions, retry: boolean): Promise<Response> {
  const headers: Record<string, string> = { ...opts.headers }
  if (opts.auth !== false && tokenStore.access) headers.Authorization = `Bearer ${tokenStore.access}`
  let body: BodyInit | undefined
  if (opts.form) {
    body = opts.form
  } else if (opts.body !== undefined) {
    headers['Content-Type'] = 'application/json'
    body = JSON.stringify(opts.body)
  }

  let res: Response
  try {
    res = await fetch(buildUrl(path, opts.params), { method: opts.method ?? 'GET', headers, body })
  } catch {
    throw new ApiError(0, null)
  }

  if (res.status === 401 && opts.auth !== false && retry && (await refreshAccessToken())) {
    return send(path, opts, false)
  }
  if (res.status === 401 && opts.auth !== false) {
    tokenStore.clear()
    window.dispatchEvent(new Event(LOGOUT_EVENT))
  }
  return res
}

export async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const res = await send(path, opts, true)
  if (res.status === 204 || res.status === 205) return undefined as T
  const text = await res.text()
  const data: unknown = text ? safeJson(text) : null
  if (!res.ok) throw new ApiError(res.status, data)
  return data as T
}

function safeJson(text: string): unknown {
  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

/** Fetch an authenticated file and trigger a browser download. */
export async function download(path: string, filename: string): Promise<void> {
  const res = await send(path, {}, true)
  if (!res.ok) throw new ApiError(res.status, safeJson(await res.text()))
  const url = URL.createObjectURL(await res.blob())
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  a.remove()
  URL.revokeObjectURL(url)
}
