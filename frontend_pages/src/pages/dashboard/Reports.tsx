import { useAuth } from '../../auth/AuthContext'
import LaborReports from './LaborReports'
import EducationReports from './EducationReports'

export default function Reports() {
  const { user } = useAuth()

  switch (user?.role) {
    case 'education_curriculum_planner':
      return <EducationReports />
    case 'labor_market_analyst':
    case 'admin':
    default:
      return <LaborReports />
  }
}
