import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList } from 'recharts'
import { SNAPSHOT } from '../lib/snapshot'

export default function SupplyDemandChart() {
  return (
    <div className="bg-white rounded-2xl border border-[#E5E7EB] shadow-sm p-6">
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-base font-semibold text-gray-900">ICT's Share of Rwandan Employment</h3>
        <span className="text-[11px] text-gray-400 whitespace-nowrap">Snapshot: {SNAPSHOT.asOf}</span>
      </div>
      <p className="text-xs text-gray-500 mb-5">Percentage of all employed people working in ICT, 2017–2026</p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={[...SNAPSHOT.ictShareByYear]} barCategoryGap="25%" margin={{ top: 20, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="year" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }} formatter={(value) => [`${value}%`, 'ICT share']} />
          <Bar dataKey="share" fill="#1E4ED8" radius={[4, 4, 0, 0]} maxBarSize={40}>
            <LabelList dataKey="share" position="top" formatter={(value: unknown) => `${value}%`} style={{ fontSize: 10, fontWeight: 600, fill: '#334155' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-gray-400 mt-3 tracking-wide">
        SOURCE: NISR LABOUR FORCE SURVEY MICRODATA · STATIC SNAPSHOT
      </p>
    </div>
  )
}
