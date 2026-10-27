import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LabelList } from 'recharts'

const data = [
  { sector: 'Agriculture', gap: -24, color: '#5B8DEF' },
  { sector: 'ICT', gap: 38, color: '#8FCB9B' },
  { sector: 'Tourism', gap: -12, color: '#FBC783' },
  { sector: 'Healthcare', gap: 28, color: '#8FCB9B' },
  { sector: 'Logistics', gap: -18, color: '#5B8DEF' },
]

export default function SupplyDemandChart() {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-base font-semibold text-gray-900">Supply vs Demand Gap (Skills)</h3>
        <span className="text-[11px] text-gray-400 whitespace-nowrap">Updated: 14 Apr 2025</span>
      </div>
      <p className="text-xs text-gray-500 mb-5">Skill supply vs market demand across key sectors</p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} barCategoryGap="30%" margin={{ top: 20, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="sector" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
            formatter={(value) => [`${value}%`, 'Gap']}
          />
          <Bar dataKey="gap" radius={[4, 4, 0, 0]} maxBarSize={48}>
            {data.map((entry) => (
              <Cell key={entry.sector} fill={entry.color} />
            ))}
            <LabelList
              dataKey="gap"
              position="top"
              formatter={(value: unknown) => `${value}%`}
              style={{ fontSize: 11, fontWeight: 600, fill: '#334155' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-gray-400 mt-3 tracking-wide">
        SOURCE: NISR, RDB, MIFOTRA LABOR MARKET DATA
      </p>
    </div>
  )
}
