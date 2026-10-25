import type { UserRole } from '../types/api'

/**
 * Who can open which page. Single source of truth for the sidebar and the route guards.
 * Write and admin operations are additionally enforced by the API (uploads, users, forecast runs, curricula).
 */
export const ALL_ROLES: UserRole[] = ['admin', 'career_training_advisor', 'education_curriculum_planner', 'labor_market_analyst']

const NOT_ADVISOR: UserRole[] = ['admin', 'education_curriculum_planner', 'labor_market_analyst']
const ADVISOR_ONLY: UserRole[] = ['admin', 'career_training_advisor']

export const ACCESS: Record<string, UserRole[]> = {
  // The Career & Training Advisor has its own pages (/dashboard/advisor/*); only Settings is shared with them.
  '/dashboard': NOT_ADVISOR,
  '/dashboard/forecast': ['admin', 'education_curriculum_planner'],
  '/dashboard/taxonomy': NOT_ADVISOR,
  '/dashboard/reports': NOT_ADVISOR,
  '/dashboard/settings': ALL_ROLES,
  '/dashboard/employability': ['admin', 'education_curriculum_planner'],
  '/dashboard/career': ['admin', 'education_curriculum_planner'],
  '/dashboard/education': ['admin', 'education_curriculum_planner'],
  '/dashboard/sectors': ['admin', 'labor_market_analyst'],
  '/dashboard/geography': ['admin', 'labor_market_analyst'],
  '/dashboard/planning': ['admin', 'labor_market_analyst'],
  '/dashboard/advisor': ADVISOR_ONLY,
  '/dashboard/advisor/assessment': ADVISOR_ONLY,
  '/dashboard/advisor/jobs': ADVISOR_ONLY,
  '/dashboard/advisor/pathways': ADVISOR_ONLY,
  '/dashboard/advisor/placements': ADVISOR_ONLY,
  '/dashboard/advisor/reports': ADVISOR_ONLY,
  '/dashboard/uploads': ['admin'],
  '/dashboard/users': ['admin'],
}

export const canAccess = (role: UserRole | undefined, path: string): boolean =>
  !!role && (ACCESS[path] ?? []).includes(role)

/** What each role is here to do (shown on the dashboard). */
export const ROLE_FOCUS: Record<UserRole, { tagline: string; links: { to: string; label: string }[] }> = {
  admin: {
    tagline: 'Operate the platform: upload job data, manage users and keep forecasts current.',
    links: [
      { to: '/dashboard/uploads', label: 'Upload job postings' },
      { to: '/dashboard/users', label: 'Manage users' },
      { to: '/dashboard/taxonomy', label: 'Browse ICT role taxonomy' },
      { to: '/dashboard/reports', label: 'Reports & exports' },
    ],
  },
  career_training_advisor: {
    tagline: 'Assess student readiness, match them to jobs, and track placement outcomes.',
    links: [
      { to: '/dashboard/advisor', label: 'Advisor dashboard' },
      { to: '/dashboard/advisor/assessment', label: 'Assess a student' },
      { to: '/dashboard/advisor/jobs', label: 'Browse job market' },
      { to: '/dashboard/advisor/placements', label: 'Track placements' },
    ],
  },
  education_curriculum_planner: {
    tagline: 'Align programmes with the ICT skills employers will need.',
    links: [
      { to: '/dashboard/education', label: 'Analyse a curriculum' },
      { to: '/dashboard/forecast', label: 'See role demand forecasts' },
      { to: '/dashboard/taxonomy', label: 'Browse ICT role taxonomy' },
      { to: '/dashboard/reports', label: 'Reports & exports' },
    ],
  },
  labor_market_analyst: {
    tagline: 'Analyse workforce demand across all sectors, track trends, and plan investment.',
    links: [
      { to: '/dashboard/sectors', label: 'Sector overview' },
      { to: '/dashboard/planning', label: 'Policy & planning brief' },
      { to: '/dashboard/geography', label: 'Regional demand' },
      { to: '/dashboard/reports', label: 'Reports & exports' },
    ],
  },
}
