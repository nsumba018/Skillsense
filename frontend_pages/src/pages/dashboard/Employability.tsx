import { useAuth } from '../../auth/AuthContext'
import EducationEmployability from './EducationEmployability'
import CareerEmployability from './CareerEmployability'

export default function Employability() {
  const { user } = useAuth()

  switch (user?.role) {
    case 'education_curriculum_planner':
      return <EducationEmployability />
    case 'career_training_advisor':
    default:
      return <CareerEmployability />
  }
}
