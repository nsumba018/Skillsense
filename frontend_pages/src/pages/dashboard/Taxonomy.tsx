import { useAuth } from '../../auth/AuthContext'
import LaborTaxonomy from './LaborTaxonomy'
import EducationTaxonomy from './EducationTaxonomy'
import CareerTaxonomy from './CareerTaxonomy'

export default function Taxonomy() {
  const { user } = useAuth()

  switch (user?.role) {
    case 'education_curriculum_planner':
      return <EducationTaxonomy />
    case 'career_training_advisor':
      return <CareerTaxonomy />
    case 'labor_market_analyst':
    case 'admin':
    default:
      return <LaborTaxonomy />
  }
}
