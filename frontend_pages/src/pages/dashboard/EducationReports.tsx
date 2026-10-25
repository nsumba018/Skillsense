import { GraduationCap } from 'lucide-react'
import MarketReportBuilder from './MarketReportBuilder'

const AUCA_SECTORS = new Set(['ict-technology', 'finance-business'])

/** Education / Curriculum Planner: AUCA's two sectors, plus the curriculum-alignment report. */
export default function EducationReports() {
  return (
    <MarketReportBuilder
      icon={GraduationCap}
      title="AUCA Planning Reports"
      subtitle="Market demand for the ICT and Business faculties, and how well each department's curriculum lines up with it."
      chip="ICT & Business"
      scope="AUCA's two tracked sectors"
      sectorFilter={(slug) => AUCA_SECTORS.has(slug)}
      defaultSector="ict-technology"
      curriculum
    />
  )
}
