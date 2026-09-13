const sparklinePoints = [35, 30, 38, 34, 44, 40, 50, 46, 58, 54, 64, 70]

function Sparkline() {
  const w = 100
  const h = 28
  const max = Math.max(...sparklinePoints)
  const min = Math.min(...sparklinePoints)
  const step = w / (sparklinePoints.length - 1)
  const points = sparklinePoints
    .map((v, i) => `${i * step},${h - ((v - min) / (max - min)) * h}`)
    .join(' ')

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-7" preserveAspectRatio="none">
      <polyline points={points} fill="none" stroke="#10b981" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

export default function AiInsightCard() {
  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-2.5">
      <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Emerging Skill</span>
      <p className="text-sm font-semibold text-gray-900 mt-2 mb-3">AI/ML Engineering</p>
      <div className="flex items-end justify-between">
        <span className="text-[11px] text-gray-500 leading-tight">
          Expected growth
          <br />
          in next 12 months
        </span>
        <span className="text-lg font-bold text-green-600">18%</span>
      </div>
      <div className="mt-3">
        <Sparkline />
      </div>
    </div>
  )
}
