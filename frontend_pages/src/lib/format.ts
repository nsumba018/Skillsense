const num = new Intl.NumberFormat('en-US')

export const fmtInt = (n: number | null | undefined): string => (n == null ? '-' : num.format(Math.round(n)))

export const fmtPct = (n: number | null | undefined, digits = 1): string =>
  n == null ? '-' : `${n.toFixed(digits)}%`

export const fmtNum = (n: number | null | undefined, digits = 1): string =>
  n == null ? '-' : n.toFixed(digits)

export const fmtCompact = (n: number): string =>
  n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}M` : n >= 1000 ? `${Math.round(n / 1000)}k` : String(n)

export const fmtDate = (iso: string | null | undefined): string =>
  iso ? new Date(iso).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '-'

export const fmtDateTime = (iso: string | null | undefined): string =>
  iso
    ? new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '-'

export const HORIZON_LABEL = { '6m': '6 months', '1y': '1 year', '2y': '2 years' } as const
export const HORIZON_YEAR_OFFSET = { '6m': 0.5, '1y': 1, '2y': 2 } as const

export const initials = (first: string, last: string, email: string): string =>
  ((first[0] ?? '') + (last[0] ?? '')).toUpperCase() || email.slice(0, 2).toUpperCase()
