import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, LabelList } from 'recharts'

const data = [
  { sector: 'Services', postings: 378, color: '#3B82F6' },
  { sector: 'ICT', postings: 198, color: '#1E3A8A' },
  { sector: 'Finance', postings: 117, color: '#6366F1' },
  { sector: 'Engineering', postings: 68, color: '#10B981' },
  { sector: 'Healthcare', postings: 42, color: '#F59E0B' },
  { sector: 'Agriculture', postings: 41, color: '#8B5CF6' },
  { sector: 'Dev & NGO', postings: 33, color: '#EC4899' },
  { sector: 'Education', postings: 31, color: '#14B8A6' },
  { sector: 'Government', postings: 11, color: '#64748B' },
]

export default function SupplyDemandChart() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-start justify-between mb-1">
        <h3 className="text-base font-semibold text-gray-900">Job Postings by Sector</h3>
        <span className="text-[11px] text-gray-400 whitespace-nowrap">Sep 2026 snapshot</span>
      </div>
      <p className="text-xs text-gray-500 mb-5">Distribution of 919 scraped postings across 9 economic sectors</p>
      <ResponsiveContainer width="100%" height={280}>
        <BarChart data={data} barCategoryGap="20%" margin={{ top: 20, right: 5, left: 5, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis dataKey="sector" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
          <Tooltip
            contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }}
            formatter={(value) => [`${value} postings`, 'Count']}
          />
          <Bar dataKey="postings" radius={[4, 4, 0, 0]} maxBarSize={40}>
            {data.map((entry) => (
              <Cell key={entry.sector} fill={entry.color} />
            ))}
            <LabelList
              dataKey="postings"
              position="top"
              style={{ fontSize: 10, fontWeight: 600, fill: '#334155' }}
            />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <p className="text-[10px] text-gray-400 mt-3 tracking-wide">
        SOURCE: BRIGHTERMONDAY, JOBINRWANDA, RWANDAJOB, JOBWEBRWANDA, GREATRWANDAJOBS
      </p>
    </div>
  )
}
