import type { UserRole } from '../types/api'

/**
 * Who can open which page. Single source of truth for the sidebar and the route guards.
 * Write and admin operations are additionally enforced by the API (uploads, users, forecast runs, curricula).
 */
export const ALL_ROLES: UserRole[] = ['admin', 'career_training_advisor', 'education_curriculum_planner', 'labor_market_analyst']

export const ACCESS: Record<string, UserRole[]> = {
  '/dashboard': ALL_ROLES,
  '/dashboard/forecast': ALL_ROLES,
  '/dashboard/taxonomy': ALL_ROLES,
  '/dashboard/reports': ALL_ROLES,
  '/dashboard/settings': ALL_ROLES,
  '/dashboard/employability': ['admin', 'career_training_advisor', 'labor_market_analyst'],
  '/dashboard/career': ['admin', 'career_training_advisor'],
  '/dashboard/education': ['admin', 'education_curriculum_planner'],
  '/dashboard/sectors': ['admin', 'labor_market_analyst'],
  '/dashboard/geography': ['admin', 'labor_market_analyst'],
  '/dashboard/planning': ['admin', 'labor_market_analyst'],
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
    tagline: 'Help learners and job seekers choose ICT roles with strong forecast demand.',
    links: [
      { to: '/dashboard/career', label: 'Career guidance' },
      { to: '/dashboard/employability', label: 'Score a skill profile' },
      { to: '/dashboard/forecast', label: 'Compare role forecasts' },
      { to: '/dashboard/taxonomy', label: 'Browse ICT role taxonomy' },
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
    tagline: 'Analyse ICT demand by role, industry and region, and plan workforce investment.',
    links: [
      { to: '/dashboard/planning', label: 'Policy & planning brief' },
      { to: '/dashboard/geography', label: 'Regional demand' },
      { to: '/dashboard/sectors', label: 'ICT sector intelligence' },
      { to: '/dashboard/reports', label: 'Reports & exports' },
    ],
  },
}
