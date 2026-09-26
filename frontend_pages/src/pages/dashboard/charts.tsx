import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  BarChart,
  Bar,
  LabelList,
} from 'recharts'
import { fmtCompact, fmtInt } from '../../lib/format'

const NAVY = '#0B2373'
const tick = { fontSize: 10, fill: '#94a3b8', fontWeight: 600 }

/* ---------- Sparkline (tiny stat-card trend line) ---------- */
export function Sparkline({ points, color }: { points: number[]; color: string }) {
  if (points.length < 2) return <div className="h-9" />
  const w = 100
  const h = 36
  const min = Math.min(...points)
  const max = Math.max(...points)
  const range = max - min || 1
  const step = w / (points.length - 1)
  const d = points
    .map((p, i) => {
      const x = i * step
      const y = h - ((p - min) / range) * (h - 6) - 3
      return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
    })
    .join(' ')
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-9 w-full" aria-hidden>
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ---------- ICT employment: history + forecast ---------- */
export interface EmploymentPoint {
  label: string
  historical?: number
  forecast?: number
}

export function EmploymentTrendChart({ data, height = 300 }: { data: EmploymentPoint[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <CartesianGrid vertical={false} stroke="#f1f5f9" />
        <Line type="monotone" dataKey="historical" name="Historical" stroke={NAVY} strokeWidth={2.5} dot={{ r: 2.5 }} isAnimationActive={false} connectNulls />
        <Line type="monotone" dataKey="forecast" name="Forecast" stroke={NAVY} strokeWidth={2.5} strokeDasharray="6 5" dot={{ r: 3, fill: '#fff' }} isAnimationActive={false} connectNulls />
        <XAxis dataKey="label" tick={tick} axisLine={false} tickLine={false} tickMargin={10} interval="preserveStartEnd" />
        <YAxis tickFormatter={fmtCompact} tick={tick} axisLine={false} tickLine={false} width={48} domain={['auto', 'auto']} />
        <Tooltip formatter={(v) => fmtInt(Number(v))} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

/* ---------- One role: demand index history + forecast with confidence band ---------- */
export interface RoleChartPoint {
  label: string
  verified?: number
  estimated?: number
  forecast?: number
  band?: [number, number]
}

export function RoleForecastChart({ data, height = 340 }: { data: RoleChartPoint[]; height?: number }) {
  const firstForecast = data.find((d) => d.forecast !== undefined)?.label
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart data={data} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E3A8A" stopOpacity={0.18} />
            <stop offset="100%" stopColor="#1E3A8A" stopOpacity={0.05} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#f1f5f9" />
        <Area type="monotone" dataKey="band" name="Confidence band" stroke="none" fill="url(#forecastBand)" isAnimationActive={false} />
        <Line type="monotone" dataKey="estimated" name="Estimated (back-extrapolated)" stroke="#94a3b8" strokeWidth={2} strokeDasharray="2 4" dot={false} isAnimationActive={false} connectNulls />
        <Line type="monotone" dataKey="verified" name="Survey-verified" stroke={NAVY} strokeWidth={2.5} dot={false} isAnimationActive={false} connectNulls />
        <Line type="monotone" dataKey="forecast" name="Forecast" stroke="#10b981" strokeWidth={2.5} strokeDasharray="6 5" dot={{ r: 4, fill: '#fff' }} isAnimationActive={false} connectNulls />
        {firstForecast && <ReferenceLine x={firstForecast} stroke="#cbd5e1" strokeDasharray="4 4" />}
        <XAxis dataKey="label" tick={tick} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} tickMargin={12} interval="preserveStartEnd" />
        <YAxis domain={[0, 100]} ticks={[0, 25, 50, 75, 100]} tick={tick} axisLine={false} tickLine={false} width={40} />
        <Tooltip formatter={(v) => (Array.isArray(v) ? `${v[0]} – ${v[1]}` : Number(v).toFixed(1))} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

/* ---------- Profile vs market radar (Employability) ---------- */
export function ProfileRadar({ data }: { data: { role: string; market: number; profile: number }[] }) {
  return (
    <ResponsiveContainer width="100%" height={380}>
      <RadarChart data={data} outerRadius="68%">
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis dataKey="role" tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar name="Market demand" dataKey="market" stroke="#10b981" strokeWidth={1.5} strokeDasharray="3 3" fill="#10b981" fillOpacity={0.1} isAnimationActive={false} />
        <Radar name="Your profile" dataKey="profile" stroke={NAVY} strokeWidth={2} fill="#1E3A8A" fillOpacity={0.25} isAnimationActive={false} />
        <Tooltip />
      </RadarChart>
    </ResponsiveContainer>
  )
}

/* ---------- Bars with dashed forecast columns ---------- */
export interface BarPoint {
  label: string
  value: number
  forecast: boolean
}

export function EmploymentBars({ data, height = 340 }: { data: BarPoint[]; height?: number }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 28, right: 16, left: -8, bottom: 0 }} barCategoryGap="30%">
        <CartesianGrid vertical={false} stroke="#f1f5f9" />
        <Bar dataKey="value" radius={[6, 6, 0, 0]} isAnimationActive={false}>
          {data.map((d) => (
            <Cell
              key={d.label}
              fill={d.forecast ? 'transparent' : NAVY}
              stroke={d.forecast ? NAVY : undefined}
              strokeWidth={d.forecast ? 1.5 : 0}
              strokeDasharray={d.forecast ? '4 4' : undefined}
            />
          ))}
          <LabelList dataKey="value" position="top" formatter={(v) => fmtCompact(Number(v))} style={{ fill: NAVY, fontSize: 11, fontWeight: 800 }} />
        </Bar>
        <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }} axisLine={{ stroke: '#e2e8f0' }} tickLine={false} tickMargin={12} />
        <YAxis tickFormatter={fmtCompact} tick={tick} axisLine={false} tickLine={false} width={48} />
        <Tooltip formatter={(v) => fmtInt(Number(v))} />
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ---------- Donut ---------- */
export interface DonutSlice {
  name: string
  value: number
  color: string
}

export function Donut({ data, centerValue, centerLabel }: { data: DonutSlice[]; centerValue: string; centerLabel: string }) {
  return (
    <div className="relative h-[220px] w-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={72} outerRadius={100} paddingAngle={2} startAngle={90} endAngle={-270} stroke="none" isAnimationActive={false}>
            {data.map((s) => (
              <Cell key={s.name} fill={s.color} />
            ))}
          </Pie>
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-navy">{centerValue}</span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">{centerLabel}</span>
      </div>
    </div>
  )
}

export const DONUT_COLORS = ['#1E3A8A', '#10b981', '#F59E0B', '#5B8DEF', '#93C5FD', '#cbd5e1']

/* ---------- SAMPLE DATA: Rwanda district tile heatmap (Geography) ---------- */
export const demandScale = [
  { label: '90-100', color: '#115E4A', min: 90 },
  { label: '70-89', color: '#0D9488', min: 70 },
  { label: '55-69', color: '#2DD4BF', min: 55 },
  { label: '40-54', color: '#5EEAD4', min: 40 },
  { label: '<40', color: '#CCFBF1', min: 0 },
]

const demandColor = (v: number) => demandScale.find((s) => v >= s.min)!.color

/* Illustrative only: no district-level demand data exists in the backend yet. */
const districtTiles: { col: number; row: number; value: number; name?: string }[] = [
  { col: 3, row: 0, value: 34 }, { col: 4, row: 0, value: 46 }, { col: 5, row: 0, value: 58, name: 'Nyagatare' },
  { col: 1, row: 1, value: 68, name: 'Rubavu' }, { col: 2, row: 1, value: 38 }, { col: 3, row: 1, value: 72, name: 'Musanze' },
  { col: 4, row: 1, value: 52 }, { col: 5, row: 1, value: 61 }, { col: 0, row: 2, value: 61 }, { col: 1, row: 2, value: 44 },
  { col: 2, row: 2, value: 57 }, { col: 3, row: 2, value: 94, name: 'Gasabo' }, { col: 4, row: 2, value: 87 },
  { col: 5, row: 2, value: 57 }, { col: 0, row: 3, value: 42 }, { col: 1, row: 3, value: 55 }, { col: 2, row: 3, value: 48 },
  { col: 3, row: 3, value: 66 }, { col: 4, row: 3, value: 73 }, { col: 5, row: 3, value: 39 }, { col: 1, row: 4, value: 36 },
  { col: 2, row: 4, value: 65, name: 'Huye' }, { col: 3, row: 4, value: 55 }, { col: 4, row: 4, value: 43 },
  { col: 2, row: 5, value: 33 }, { col: 3, row: 5, value: 41 },
]

export function RwandaDemandHeatmap() {
  const size = 46
  const gap = 5
  const step = size + gap
  return (
    <svg viewBox="0 0 400 340" className="h-full w-full" role="img" aria-label="Sample ICT demand heatmap of Rwanda by district">
      <g transform="translate(78 30) rotate(-8 130 130)">
        {districtTiles.map((t) => {
          const x = t.col * step
          const y = t.row * step
          return (
            <g key={`${t.col}-${t.row}`}>
              <rect x={x} y={y} width={size} height={size} rx={3} fill={demandColor(t.value)} />
              {t.name && (
                <text x={x + size / 2} y={y + size / 2 + 3} textAnchor="middle" fontSize={8} fontWeight={700} fill={t.value >= 70 ? '#ffffff' : '#134E4A'}>
                  {t.name}
                </text>
              )}
            </g>
          )
        })}
      </g>
    </svg>
  )
}
