import { AlertTriangle, Inbox, Loader2, FlaskConical } from 'lucide-react'
import { ApiError } from '../../services/http'

export function Loading({ label = 'Loading…', className = '' }: { label?: string; className?: string }) {
  return (
    <div
      role="status"
      data-testid="loading"
      className={`flex items-center justify-center gap-3 py-12 text-sm font-medium text-gray-500 ${className}`}
    >
      <Loader2 className="h-5 w-5 animate-spin text-primary" />
      {label}
    </div>
  )
}

export function ErrorState({
  error,
  onRetry,
  className = '',
}: {
  error: unknown
  onRetry?: () => void
  className?: string
}) {
  const message = error instanceof ApiError ? error.message : 'Something went wrong loading this data.'
  return (
    <div
      role="alert"
      data-testid="error-state"
      className={`flex flex-col items-center gap-3 rounded-xl border border-red-100 bg-red-50/60 px-6 py-10 text-center ${className}`}
    >
      <AlertTriangle className="h-6 w-6 text-red-500" />
      <p className="max-w-md text-sm font-medium text-red-700">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="rounded-lg border border-red-200 bg-white px-4 py-2 text-xs font-bold text-red-600 hover:bg-red-50"
        >
          Try again
        </button>
      )}
    </div>
  )
}

export function EmptyState({
  title,
  hint,
  className = '',
}: {
  title: string
  hint?: string
  className?: string
}) {
  return (
    <div
      data-testid="empty-state"
      className={`flex flex-col items-center gap-2 rounded-xl border border-dashed border-gray-200 px-6 py-10 text-center ${className}`}
    >
      <Inbox className="h-6 w-6 text-gray-300" />
      <p className="text-sm font-bold text-gray-600">{title}</p>
      {hint && <p className="max-w-md text-xs text-gray-400">{hint}</p>}
    </div>
  )
}

/** Renders a query's loading / error state, or its data. */
export function QueryGate<T>({
  query,
  children,
  className,
}: {
  query: { isLoading: boolean; isError: boolean; error: unknown; data: T | undefined; refetch: () => void }
  children: (data: T) => React.ReactNode
  className?: string
}) {
  if (query.isLoading) return <Loading className={className} />
  if (query.isError || query.data === undefined)
    return <ErrorState error={query.error} onRetry={query.refetch} className={className} />
  return <>{children(query.data)}</>
}

/**
 * Marks content that is NOT backed by real data yet.
 * Everything wearing this badge is illustrative; `data-mock` lets tests enumerate it.
 */
export function MockBadge({ note, className = '' }: { note?: string; className?: string }) {
  return (
    <span
      data-mock="true"
      title={note ?? 'Illustrative sample data, not from the backend yet'}
      className={`inline-flex items-center gap-1 rounded-full border border-amber-300 bg-amber-50 px-2.5 py-0.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-700 ${className}`}
    >
      <FlaskConical className="h-3 w-3" />
      Sample data
    </span>
  )
}

export function MockBanner({ children }: { children: React.ReactNode }) {
  return (
    <div
      data-mock="true"
      className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900"
    >
      <FlaskConical className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
      <div>
        <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-700">Sample data</div>
        <div className="mt-1 leading-relaxed">{children}</div>
      </div>
    </div>
  )
}
