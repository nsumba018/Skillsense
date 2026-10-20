import { useSearchParams } from 'react-router-dom'
import { useSectorList } from '../../services/queries'

export function useSectorParam() {
  const [searchParams, setSearchParams] = useSearchParams()
  const slug = searchParams.get('sector') || null
  const set = (s: string | null) => {
    const next = new URLSearchParams(searchParams)
    if (s) next.set('sector', s)
    else next.delete('sector')
    setSearchParams(next, { replace: true })
  }
  return [slug, set] as const
}

export default function SectorSelector({ selected, onSelect }: {
  selected: string | null
  onSelect: (slug: string | null) => void
}) {
  const { data: sectors = [] } = useSectorList()

  return (
    <div className="flex flex-wrap items-center gap-2" role="tablist" data-testid="sector-selector">
      <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">Sector</span>
      <button
        role="tab"
        aria-selected={!selected}
        onClick={() => onSelect(null)}
        className={`rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
          !selected
            ? 'bg-navy text-white shadow-sm'
            : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300'
        }`}
      >
        All Sectors
      </button>
      {sectors.map((s) => (
        <button
          key={s.slug}
          role="tab"
          aria-selected={selected === s.slug}
          onClick={() => onSelect(s.slug)}
          className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            selected === s.slug
              ? 'text-white shadow-sm'
              : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300'
          }`}
          style={selected === s.slug ? { backgroundColor: s.color } : undefined}
        >
          <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
          {s.name}
        </button>
      ))}
    </div>
  )
}
