import { useAuth } from '../../auth/AuthContext'
import LaborDashboard from './LaborDashboard'
import EducationDashboard from './EducationDashboard'
import CareerDashboard from './CareerDashboard'

export default function Dashboard() {
  const { user } = useAuth()

  switch (user?.role) {
    case 'education_curriculum_planner':
      return <EducationDashboard />
    case 'career_training_advisor':
      return <CareerDashboard />
    case 'labor_market_analyst':
    case 'admin':
    default:
      return <LaborDashboard />
  }
}
