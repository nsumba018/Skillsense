import { BarChart3 } from 'lucide-react'
import MarketReportBuilder from './MarketReportBuilder'

/** Labour Market Analyst (and admin): reports across every sector. */
export default function LaborReports() {
  return (
    <MarketReportBuilder
      icon={BarChart3}
      title="Labour Market Reports"
      subtitle="Sector outlooks, role demand and deep dives for analysis and planning briefs. Built live from the latest forecast run."
      chip="All sectors"
      scope="all nine sectors"
    />
  )
}
