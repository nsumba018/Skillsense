import type { ForecastsResponse, Horizon, MacroIndicator, RoleForecast } from '../types/api'
import { HORIZON_LABEL } from './format'
import type { EmploymentPoint } from '../pages/dashboard/charts'

/** ICT employment per year (macro history), oldest → newest. */
export function employmentSeries(macro: MacroIndicator[], fromYear = 2015): MacroIndicator[] {
  return [...macro].filter((m) => m.year >= fromYear).sort((a, b) => a.year - b.year)
}

/** Total forecast ICT employment per horizon = sum of every role's employment_proxy. */
export function forecastEmployment(forecasts: RoleForecast[]): Record<Horizon, number> {
  const totals: Record<Horizon, number> = { '6m': 0, '1y': 0, '2y': 0 }
  for (const f of forecasts) totals[f.horizon] += f.employment_proxy
  return totals
}

/** Historical ICT employment + forecast points, ready for EmploymentTrendChart. */
export function employmentChartData(macro: MacroIndicator[], fc: ForecastsResponse | undefined): EmploymentPoint[] {
  const series = employmentSeries(macro)
  const data: EmploymentPoint[] = series.map((m) => ({ label: String(m.year), historical: m.ict_employment }))
  if (fc && data.length) {
    const totals = forecastEmployment(fc.forecasts)
    data[data.length - 1].forecast = data[data.length - 1].historical
    ;(['6m', '1y', '2y'] as Horizon[]).forEach((h) => data.push({ label: `+${HORIZON_LABEL[h]}`, forecast: Math.round(totals[h]) }))
  }
  return data
}

/** Group a forecast list by role group using the role's group name. */
export function byGroup(forecasts: RoleForecast[], roleToGroup: Map<number, string>) {
  const groups = new Map<string, RoleForecast[]>()
  for (const f of forecasts) {
    const g = roleToGroup.get(f.role_id)
    if (!g) continue
    groups.set(g, [...(groups.get(g) ?? []), f])
  }
  return groups
}

export const TREND_TONE = {
  growing: 'bg-emerald-50 text-emerald-700',
  stable: 'bg-gray-100 text-gray-600',
  declining: 'bg-red-50 text-red-600',
} as const

export const TREND_LABEL = { growing: 'Growing', stable: 'Stable', declining: 'Declining' } as const
