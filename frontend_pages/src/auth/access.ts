import type { UserRole } from '../types/api'

/**
 * Who can open which page. Single source of truth for the sidebar and the route guards.
 *
 * The four roles are completely separated:
 *   - admin: platform operations (uploads, users, settings)
 *   - labor_market_analyst: sector & workforce analysis
 *   - education_curriculum_planner: curriculum alignment & forecasting
 *   - career_training_advisor: student assessment & placement
 */
export const ALL_ROLES: UserRole[] = ['admin', 'career_training_advisor', 'education_curriculum_planner', 'labor_market_analyst']

const ADMIN_ONLY: UserRole[] = ['admin']
const ANALYST_ONLY: UserRole[] = ['labor_market_analyst']
const PLANNER_ONLY: UserRole[] = ['education_curriculum_planner']
const ADVISOR_ONLY: UserRole[] = ['career_training_advisor']
const ANALYST_OR_PLANNER: UserRole[] = ['labor_market_analyst', 'education_curriculum_planner']

export const ACCESS: Record<string, UserRole[]> = {
  // Admin pages
  '/dashboard':        ADMIN_ONLY,
  '/dashboard/uploads': ADMIN_ONLY,
  '/dashboard/users':   ADMIN_ONLY,

  // Labour market analyst pages
  '/dashboard/labor':    ANALYST_ONLY,
  '/dashboard/sectors':  ANALYST_ONLY,
  '/dashboard/geography': ANALYST_ONLY,
  '/dashboard/planning': ANALYST_ONLY,

  // Shared between analyst and education planner (content switches by role)
  '/dashboard/taxonomy': ANALYST_OR_PLANNER,
  '/dashboard/reports':  ANALYST_OR_PLANNER,

  // Education curriculum planner pages
  '/dashboard/education-home': PLANNER_ONLY,
  '/dashboard/forecast':       PLANNER_ONLY,
  '/dashboard/employability':  PLANNER_ONLY,
  '/dashboard/career':         PLANNER_ONLY,
  '/dashboard/education':      PLANNER_ONLY,

  // Career & training advisor pages
  '/dashboard/advisor':             ADVISOR_ONLY,
  '/dashboard/advisor/assessment':  ADVISOR_ONLY,
  '/dashboard/advisor/jobs':        ADVISOR_ONLY,
  '/dashboard/advisor/pathways':    ADVISOR_ONLY,
  '/dashboard/advisor/placements':  ADVISOR_ONLY,
  '/dashboard/advisor/reports':     ADVISOR_ONLY,

  // Shared
  '/dashboard/settings': ALL_ROLES,
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
      { to: '/dashboard/employability', label: 'Employability overview' },
      { to: '/dashboard/career', label: 'Training insights' },
      { to: '/dashboard/taxonomy', label: 'Role taxonomy' },
      { to: '/dashboard/reports', label: 'Planning reports' },
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
