import { useAuth } from '../../auth/AuthContext'
import EducationForecast from './EducationForecast'
import CareerForecast from './CareerForecast'

export default function RoleForecast() {
  const { user } = useAuth()

  switch (user?.role) {
    case 'education_curriculum_planner':
      return <EducationForecast />
    case 'career_training_advisor':
    default:
      return <CareerForecast />
  }
}
