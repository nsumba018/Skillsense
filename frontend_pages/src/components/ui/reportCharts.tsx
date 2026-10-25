import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

/** Small chart set for the report previews. Fixed pixel heights so they never collapse inside flex or grid parents. */

const AXIS = { fontSize: 11, fill: '#94a3b8' }
const TIP = { borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 12 }
export const BLUE = '#1D4ED8'
export const GREEN = '#10b981'
export const RED = '#ef4444'
export const AMBER = '#f59e0b'
export const GRAY = '#94a3b8'

export interface Point {
  name: string
  value: number
  color?: string
}

/** Ranked horizontal bars (top roles, missing skills, departments…). */
export function HBarChart({
  data,
  color = BLUE,
  format = (v: number) => String(v),
  nameWidth = 150,
  rowHeight = 30,
}: {
  data: Point[]
  color?: string
  format?: (v: number) => string
  nameWidth?: number
  rowHeight?: number
}) {
  const height = Math.max(120, data.length * rowHeight + 20)
  return (
    <div role="img" aria-label="Bar chart" style={{ height }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} layout="vertical" margin={{ top: 0, right: 48, bottom: 0, left: 0 }} barCategoryGap="22%">
          <CartesianGrid horizontal={false} stroke="#f1f5f9" />
          <XAxis type="number" hide />
          <YAxis type="category" dataKey="name" width={nameWidth} tick={{ ...AXIS, fill: '#334155', fontWeight: 600 }} axisLine={false} tickLine={false} interval={0} />
          <Tooltip contentStyle={TIP} formatter={(v) => [format(Number(v)), '']} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="value" radius={[0, 6, 6, 0]} isAnimationActive={false}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color ?? color} />
            ))}
            <LabelList dataKey="value" position="right" formatter={(v: unknown) => format(Number(v))} style={{ fontSize: 11, fontWeight: 700, fill: '#334155' }} />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Vertical bars over time or categories. */
export function VBarChart({ data, color = BLUE, height = 220 }: { data: Point[]; color?: string; height?: number }) {
  return (
    <div role="img" aria-label="Column chart" style={{ height }}>
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={data} margin={{ top: 16, right: 8, bottom: 0, left: -18 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} interval="preserveStartEnd" />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} allowDecimals={false} />
          <Tooltip contentStyle={TIP} cursor={{ fill: '#f8fafc' }} />
          <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive={false} maxBarSize={44}>
            {data.map((d, i) => (
              <Cell key={i} fill={d.color ?? color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

/** Filled line over time. */
export function TrendArea({
  data,
  color = BLUE,
  height = 220,
  format = (v: number) => String(v),
}: {
  data: { name: string; value: number }[]
  color?: string
  height?: number
  format?: (v: number) => string
}) {
  const id = `fill-${color.replace('#', '')}`
  return (
    <div role="img" aria-label="Trend chart" style={{ height }}>
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 8, right: 8, bottom: 0, left: -10 }}>
          <defs>
            <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.25} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="#f1f5f9" />
          <XAxis dataKey="name" tick={AXIS} axisLine={false} tickLine={false} interval="preserveStartEnd" minTickGap={28} />
          <YAxis tick={AXIS} axisLine={false} tickLine={false} tickFormatter={(v) => format(Number(v))} />
          <Tooltip contentStyle={TIP} formatter={(v) => [format(Number(v)), '']} />
          <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.5} fill={`url(#${id})`} isAnimationActive={false} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
