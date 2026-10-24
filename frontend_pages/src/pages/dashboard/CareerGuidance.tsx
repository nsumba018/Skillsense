import { useAuth } from '../../auth/AuthContext'
import EducationCareerGuidance from './EducationCareerGuidance'
import CareerCareerGuidance from './CareerCareerGuidance'

export default function CareerGuidance() {
  const { user } = useAuth()

  switch (user?.role) {
    case 'education_curriculum_planner':
      return <EducationCareerGuidance />
    case 'career_training_advisor':
    default:
      return <CareerCareerGuidance />
  }
}
