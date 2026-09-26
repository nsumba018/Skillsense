import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { SNAPSHOT } from '../lib/snapshot'

export default function SkillDemandChart() {
  return (
    <div className="h-full flex flex-col">
      <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">ICT Share of Employment</h4>
      <div className="flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={[...SNAPSHOT.ictShareByYear]} margin={{ top: 5, right: 5, bottom: 0, left: -20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="year" tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval={2} />
            <YAxis tick={{ fontSize: 9, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
            <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11 }} formatter={(value) => [`${value}%`, 'ICT share']} />
            <Line type="monotone" dataKey="share" stroke="#1E4ED8" strokeWidth={2} dot={{ fill: '#1E4ED8', r: 2.5 }} activeDot={{ r: 4 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
