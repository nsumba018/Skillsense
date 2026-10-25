import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { SNAPSHOT } from '../lib/snapshot'

/** Fixed pixel height: a percentage height collapsed inside the hero's grid on wide screens. */
export default function SkillDemandChart({ height = 190 }: { height?: number }) {
  return (
    <div>
      <h4 className="mb-3 text-[10px] font-semibold uppercase tracking-wider text-gray-500">ICT Share of Employment</h4>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={[...SNAPSHOT.ictShareByYear]} margin={{ top: 5, right: 8, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
          <XAxis dataKey="year" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={24} />
          <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}%`} />
          <Tooltip contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 11 }} formatter={(value) => [`${value}%`, 'ICT share']} />
          <Line type="monotone" dataKey="share" stroke="#1E4ED8" strokeWidth={2} dot={{ fill: '#1E4ED8', r: 2.5 }} activeDot={{ r: 4 }} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
