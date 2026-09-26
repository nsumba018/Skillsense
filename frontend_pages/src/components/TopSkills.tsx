import { SNAPSHOT } from '../lib/snapshot'

const colors = ['#1E4ED8', '#3B82F6', '#60A5FA']

export default function TopSkills() {
  return (
    <div>
      <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Top ICT Roles · 1-Year Forecast</h4>
      <div className="space-y-2.5">
        {SNAPSHOT.topRoles1y.map((r, i) => (
          <div key={r.name}>
            <div className="flex justify-between items-center text-[11px] mb-0.5 gap-2">
              <span className="text-gray-700 truncate">{r.name}</span>
              <span className="text-gray-500 shrink-0">{r.index.toFixed(0)}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${r.index}%`, backgroundColor: colors[i] }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
