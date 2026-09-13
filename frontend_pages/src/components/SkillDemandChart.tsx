import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

const data = [
  { month: 'Jan', demand: 62 },
  { month: 'Feb', demand: 68 },
  { month: 'Mar', demand: 65 },
  { month: 'Apr', demand: 74 },
  { month: 'May', demand: 80 },
  { month: 'Jun', demand: 86 },
]

export default function SkillDemandChart() {
  return (
    <div className="h-full flex flex-col">
      <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Skills Demand Trend</h4>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="month" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11 }}
              formatter={(value) => [`${value}%`, 'Demand']}
            />
            <Line type="monotone" dataKey="demand" stroke="#1E4ED8" strokeWidth={2} dot={{ fill: '#1E4ED8', r: 2.5 }} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
