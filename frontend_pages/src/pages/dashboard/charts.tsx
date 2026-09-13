import {
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
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

/* ---------- Sparkline (tiny stat-card trend line) ---------- */
export function Sparkline({ points, color }: { points: number[]; color: string }) {
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
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className="h-9 w-full">
      <path d={d} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

/* ---------- National Skills Demand Trend ---------- */
const trendData = [
  { label: 'JAN 2023', band: [38, 48], historical: 43, forecast: null as number | null },
  { label: '', band: [40, 50], historical: 45, forecast: null },
  { label: 'JUN 2023', band: [41, 52], historical: 46, forecast: null },
  { label: '', band: [44, 55], historical: 49, forecast: null },
  { label: 'JAN 2024', band: [48, 60], historical: 54, forecast: null },
  { label: '', band: [58, 72], historical: 65, forecast: null },
  { label: 'JUN 2024 (TODAY)', band: [64, 78], historical: 71, forecast: 71 },
  { label: '', band: [68, 84], historical: null, forecast: 76 },
  { label: 'JAN 2025', band: [72, 90], historical: null, forecast: 81 },
]

const trendTicks = ['JAN 2023', 'JUN 2023', 'JAN 2024', 'JUN 2024 (TODAY)', 'JAN 2025']

export function DemandTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart data={trendData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
        <defs>
          <linearGradient id="bandFill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E3A8A" stopOpacity={0.14} />
            <stop offset="100%" stopColor="#1E3A8A" stopOpacity={0.04} />
          </linearGradient>
        </defs>
        {/* Confidence band drawn as a low→high range area */}
        <Area type="monotone" dataKey="band" stroke="none" fill="url(#bandFill)" isAnimationActive={false} />
        <Line type="monotone" dataKey="historical" stroke="#0B2373" strokeWidth={2.5} dot={false} isAnimationActive={false} />
        <Line
          type="monotone"
          dataKey="forecast"
          stroke="#0B2373"
          strokeWidth={2.5}
          strokeDasharray="6 5"
          dot={false}
          isAnimationActive={false}
        />
        <XAxis
          dataKey="label"
          ticks={trendTicks}
          interval={0}
          tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
          tickMargin={12}
        />
        <YAxis hide domain={[30, 95]} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

/* ---------- Aggregate Skill Demand Index (Skills Forecast) ---------- */
const demandIndexData = [
  { label: 'Q1 2024', band: [32, 32], tech: 32, green: 18, manufacturing: 26 },
  { label: 'Q2 2024', band: [32, 36], tech: 34, green: 20, manufacturing: 27 },
  { label: 'Q3 2024', band: [32, 40], tech: 36, green: 23, manufacturing: 28 },
  { label: 'Q4 2024', band: [31, 43], tech: 37, green: 26, manufacturing: 28 },
  { label: 'Q1 2025', band: [33, 47], tech: 40, green: 30, manufacturing: 29 },
  { label: 'Q2 2025', band: [36, 53], tech: 45, green: 35, manufacturing: 30 },
  { label: 'Q3 2025', band: [41, 60], tech: 51, green: 40, manufacturing: 31 },
  { label: 'Q4 2025', band: [47, 69], tech: 58, green: 46, manufacturing: 32 },
  { label: 'Q1 2026', band: [53, 77], tech: 65, green: 52, manufacturing: 33 },
  { label: 'Q2 2026', band: [59, 85], tech: 72, green: 58, manufacturing: 34 },
  { label: 'Q3 2026', band: [64, 92], tech: 78, green: 63, manufacturing: 35 },
  { label: 'Q4 2026', band: [68, 98], tech: 83, green: 68, manufacturing: 36 },
]

export function SkillDemandIndexChart() {
  return (
    <ResponsiveContainer width="100%" height={340}>
      <ComposedChart data={demandIndexData} margin={{ top: 10, right: 16, left: -8, bottom: 0 }}>
        <defs>
          <linearGradient id="forecastBand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1E3A8A" stopOpacity={0.16} />
            <stop offset="100%" stopColor="#1E3A8A" stopOpacity={0.04} />
          </linearGradient>
        </defs>
        <CartesianGrid vertical={false} stroke="#f1f5f9" />
        {/* Confidence band drawn as a low→high range area, so it never occludes the grid */}
        <Area type="monotone" dataKey="band" stroke="none" fill="url(#forecastBand)" isAnimationActive={false} />
        <Line type="monotone" dataKey="tech" stroke="#0B2373" strokeWidth={2.5} dot={false} isAnimationActive={false} />
        <Line
          type="monotone"
          dataKey="green"
          stroke="#10b981"
          strokeWidth={2.5}
          strokeDasharray="7 5"
          dot={false}
          isAnimationActive={false}
        />
        <Line
          type="monotone"
          dataKey="manufacturing"
          stroke="#F59E0B"
          strokeWidth={2}
          strokeDasharray="2 4"
          dot={false}
          isAnimationActive={false}
        />
        <ReferenceLine x="Q1 2025" stroke="#cbd5e1" strokeDasharray="4 4" />
        <XAxis
          dataKey="label"
          ticks={['Q1 2024', 'Q1 2025', 'Q4 2026']}
          interval={0}
          tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 700 }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={false}
          tickMargin={12}
        />
        <YAxis
          domain={[0, 100]}
          ticks={[0, 25, 50, 75, 100]}
          tickFormatter={(v) => `${v}%`}
          tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
          width={44}
        />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

/* ---------- Skills Alignment Radar (Employability) ---------- */
const radarData = [
  { skill: 'Cloud Architecture', curriculum: 92, market: 78 },
  { skill: 'Python/R', curriculum: 78, market: 84 },
  { skill: 'Soft Skills', curriculum: 54, market: 72 },
  { skill: 'UI/UX Design', curriculum: 70, market: 58 },
  { skill: 'Agile Ops', curriculum: 46, market: 66 },
  { skill: 'Data Viz', curriculum: 62, market: 74 },
]

export function SkillsAlignmentRadar() {
  return (
    <ResponsiveContainer width="100%" height={380}>
      <RadarChart data={radarData} outerRadius="72%">
        <PolarGrid stroke="#e2e8f0" />
        <PolarAngleAxis
          dataKey="skill"
          tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }}
          tickFormatter={(v: string) => v.toUpperCase()}
        />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Radar
          name="Market"
          dataKey="market"
          stroke="#10b981"
          strokeWidth={1.5}
          strokeDasharray="3 3"
          fill="#10b981"
          fillOpacity={0.07}
          isAnimationActive={false}
        />
        <Radar
          name="Curriculum"
          dataKey="curriculum"
          stroke="#0B2373"
          strokeWidth={2}
          fill="#1E3A8A"
          fillOpacity={0.22}
          isAnimationActive={false}
        />
      </RadarChart>
    </ResponsiveContainer>
  )
}

/* ---------- Sector Growth Trend bars (Sectors) ---------- */
const sectorGrowthData = [
  { year: '2021', workforce: 32000, forecast: false },
  { year: '2022', workforce: 36000, forecast: false },
  { year: '2023', workforce: 41000, forecast: false },
  { year: '2024', workforce: 48000, forecast: false },
  { year: '2025 (F)', workforce: 54000, forecast: true },
]

const kFormat = (v: number) => `${Math.round(v / 1000)}k`

export function SectorGrowthChart() {
  return (
    <ResponsiveContainer width="100%" height={340}>
      <BarChart data={sectorGrowthData} margin={{ top: 28, right: 16, left: -8, bottom: 0 }} barCategoryGap="35%">
        <CartesianGrid vertical={false} stroke="#f1f5f9" />
        <Bar dataKey="workforce" radius={[6, 6, 0, 0]} isAnimationActive={false}>
          {sectorGrowthData.map((d) => (
            <Cell
              key={d.year}
              fill={d.forecast ? 'transparent' : '#0B2373'}
              stroke={d.forecast ? '#0B2373' : undefined}
              strokeWidth={d.forecast ? 1.5 : 0}
              strokeDasharray={d.forecast ? '4 4' : undefined}
            />
          ))}
          <LabelList
            dataKey="workforce"
            position="top"
            formatter={(v) => kFormat(Number(v))}
            style={{ fill: '#0B2373', fontSize: 12, fontWeight: 800 }}
          />
        </Bar>
        <XAxis
          dataKey="year"
          tick={{ fontSize: 11, fill: '#94a3b8', fontWeight: 600 }}
          axisLine={{ stroke: '#e2e8f0' }}
          tickLine={false}
          tickMargin={12}
        />
        <YAxis
          domain={[0, 60000]}
          ticks={[0, 15000, 30000, 45000, 60000]}
          tickFormatter={kFormat}
          tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
          width={48}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

/* ---------- Rwanda skills-demand tile heatmap (Geography) ---------- */
export const demandScale = [
  { label: '90-100', color: '#115E4A', min: 90 },
  { label: '70-89', color: '#0D9488', min: 70 },
  { label: '55-69', color: '#2DD4BF', min: 55 },
  { label: '40-54', color: '#5EEAD4', min: 40 },
  { label: '<40', color: '#CCFBF1', min: 0 },
]

const demandColor = (v: number) => demandScale.find((s) => v >= s.min)!.color

/* Districts laid out on a coarse grid that echoes Rwanda's outline. */
const districtTiles: { col: number; row: number; value: number; name?: string }[] = [
  { col: 3, row: 0, value: 34 },
  { col: 4, row: 0, value: 46 },
  { col: 5, row: 0, value: 58, name: 'Nyagatare' },
  { col: 1, row: 1, value: 68, name: 'Rubavu' },
  { col: 2, row: 1, value: 38 },
  { col: 3, row: 1, value: 72, name: 'Musanze' },
  { col: 4, row: 1, value: 52 },
  { col: 5, row: 1, value: 61 },
  { col: 0, row: 2, value: 61 },
  { col: 1, row: 2, value: 44 },
  { col: 2, row: 2, value: 57 },
  { col: 3, row: 2, value: 94, name: 'Gasabo' },
  { col: 4, row: 2, value: 87 },
  { col: 5, row: 2, value: 57 },
  { col: 0, row: 3, value: 42 },
  { col: 1, row: 3, value: 55 },
  { col: 2, row: 3, value: 48 },
  { col: 3, row: 3, value: 66 },
  { col: 4, row: 3, value: 73 },
  { col: 5, row: 3, value: 39 },
  { col: 1, row: 4, value: 36 },
  { col: 2, row: 4, value: 65, name: 'Huye' },
  { col: 3, row: 4, value: 55 },
  { col: 4, row: 4, value: 43 },
  { col: 2, row: 5, value: 33 },
  { col: 3, row: 5, value: 41 },
]

export function RwandaDemandHeatmap() {
  const size = 46
  const gap = 5
  const step = size + gap

  return (
    <svg viewBox="0 0 400 340" className="h-full w-full" role="img" aria-label="Skills demand heatmap of Rwanda by district">
      <g transform="translate(78 30) rotate(-8 130 130)">
        {districtTiles.map((t) => {
          const x = t.col * step
          const y = t.row * step
          return (
            <g key={`${t.col}-${t.row}`}>
              <rect
                x={x}
                y={y}
                width={size}
                height={size}
                rx={3}
                fill={demandColor(t.value)}
              />
              {t.name && (
                <text
                  x={x + size / 2}
                  y={y + size / 2 + 3}
                  textAnchor="middle"
                  fontSize={8}
                  fontWeight={700}
                  fill={t.value >= 70 ? '#ffffff' : '#134E4A'}
                >
                  {t.name}
                </text>
              )}
            </g>
          )
        })}
      </g>

      {/* Compass + scale bar */}
      <g transform="translate(24 286)" fill="none" stroke="#94a3b8" strokeWidth={1.2}>
        <circle cx="8" cy="8" r="7.5" />
        <path d="M8 3.5 L10 8 L8 12.5 L6 8 Z" fill="#94a3b8" stroke="none" />
        <path d="M0 30 H72" />
        <path d="M0 26 V34 M72 26 V34" />
      </g>
      <text x="80" y="320" fontSize={9} fill="#94a3b8" fontWeight={600}>
        60km
      </text>
    </svg>
  )
}

/* ---------- Urban vs Rural employment trend (Geography) ---------- */
const urbanRuralData = [
  { year: '2019', urban: 44, rural: 38 },
  { year: '2020', urban: 46, rural: 39 },
  { year: '2021', urban: 50, rural: 40 },
  { year: '2022', urban: 62, rural: 42 },
  { year: '2023', urban: 71, rural: 44 },
  { year: 'Q4 2024', urban: 82, rural: 47 },
]

export function UrbanRuralTrendChart() {
  return (
    <ResponsiveContainer width="100%" height={230}>
      <ComposedChart data={urbanRuralData} margin={{ top: 10, right: 12, left: 0, bottom: 0 }}>
        <Line type="monotone" dataKey="urban" stroke="#0B2373" strokeWidth={3} dot={false} isAnimationActive={false} />
        <Line type="monotone" dataKey="rural" stroke="#2DD4BF" strokeWidth={3} dot={false} isAnimationActive={false} />
        <XAxis
          dataKey="year"
          ticks={['2019', '2021', '2023', 'Q4 2024']}
          interval={0}
          tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 600 }}
          axisLine={false}
          tickLine={false}
          tickMargin={10}
        />
        <YAxis hide domain={[30, 90]} />
      </ComposedChart>
    </ResponsiveContainer>
  )
}

/* ---------- Sector Demand Share donut ---------- */
export const sectorShare = [
  { name: 'ICT', value: 28, color: '#1E3A8A' },
  { name: 'Agriculture', value: 22, color: '#10b981' },
  { name: 'Tourism', value: 15, color: '#F59E0B' },
  { name: 'Manufacturing', value: 14, color: '#5B8DEF' },
  { name: 'Financial Services', value: 11, color: '#93C5FD' },
  { name: 'Others', value: 10, color: '#cbd5e1' },
]

export function SectorDonut() {
  return (
    <div className="relative h-[220px] w-[220px]">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={sectorShare}
            dataKey="value"
            nameKey="name"
            innerRadius={72}
            outerRadius={100}
            paddingAngle={2}
            startAngle={90}
            endAngle={-270}
            stroke="none"
            isAnimationActive={false}
          >
            {sectorShare.map((s) => (
              <Cell key={s.name} fill={s.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-extrabold text-navy">100%</span>
        <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          Total Market
        </span>
      </div>
    </div>
  )
}
