import { useAuth } from '../../auth/AuthContext'
import LaborReports from './LaborReports'
import EducationReports from './EducationReports'
import CareerReports from './CareerReports'

export default function Reports() {
  const { user } = useAuth()

  switch (user?.role) {
    case 'education_curriculum_planner':
      return <EducationReports />
    case 'career_training_advisor':
      return <CareerReports />
    case 'labor_market_analyst':
    case 'admin':
    default:
      return <LaborReports />
  }
}
