/**
 * STATIC SNAPSHOT of the SkillSense datasets (as of the Sep-2026 forecast run).
 *
 * The public landing page can't call the authenticated API, so it shows these
 * verified figures instead. They are NOT live; the dashboard (after sign-in)
 * always shows live values from the backend.
 */
export const SNAPSHOT = {
  asOf: 'Sep 2026',
  roles: 22,
  roleGroups: 12,
  forecastHorizons: 3,
  postings: 92,
  companies: 40,
  jobBoards: ['RwandaJob', 'JobWebRwanda', 'GreatRwandaJobs', 'JobInRwanda'],
  historyYears: '2005–2026',
  rankCorrelation: 0.9898,
  ictShareByYear: [
    { year: '2017', share: 1.45 },
    { year: '2018', share: 2.16 },
    { year: '2019', share: 2.96 },
    { year: '2020', share: 2.63 },
    { year: '2021', share: 1.65 },
    { year: '2022', share: 2.4 },
    { year: '2023', share: 3.42 },
    { year: '2024', share: 4.01 },
    { year: '2025', share: 4.4 },
    { year: '2026', share: 4.8 },
  ],
  topRoles1y: [
    { name: 'IT Officer / ICT Administrator', index: 100 },
    { name: 'Backend Developer', index: 90.07 },
    { name: 'DevOps / Cloud Engineer', index: 75.59 },
  ],
} as const
