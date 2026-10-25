import { useAuth } from '../../auth/AuthContext'
import LaborTaxonomy from './LaborTaxonomy'
import EducationTaxonomy from './EducationTaxonomy'

export default function Taxonomy() {
  const { user } = useAuth()

  switch (user?.role) {
    case 'education_curriculum_planner':
      return <EducationTaxonomy />
    case 'labor_market_analyst':
    case 'admin':
    default:
      return <LaborTaxonomy />
  }
}
