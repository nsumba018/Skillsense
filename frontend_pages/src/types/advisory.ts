/* Career & Training Advisor API types (backend/advisory). */

export type DeptCode = 'se' | 'net' | 'fin' | 'ba'
export type StudentStatus = 'active' | 'graduated' | 'placed' | 'inactive'
export type ContractType = 'full_time' | 'internship' | 'freelance' | 'contract'

export interface StudentProfile {
  id: number
  first_name: string
  last_name: string
  name: string
  email: string
  department: DeptCode
  graduation_year: number | null
  graduated_on: string | null
  status: StudentStatus
  skills: string[]
  target_roles: string[]
  gender: 'M' | 'F' | ''
  innovation_center_cohort: string
  notes: string
  created_at: string
}

export interface StudentProfileDetail extends StudentProfile {
  latest_assessment: AssessmentResult | null
  placements: PlacementRecord[]
  pathways: SavedPathway[]
}

export interface CreateStudentPayload {
  first_name: string
  last_name: string
  email?: string
  department: DeptCode
  graduation_year?: number | null
  graduated_on?: string | null
  status?: StudentStatus
  skills: string[]
  target_roles: string[]
  gender?: 'M' | 'F' | ''
  innovation_center_cohort?: string
  notes?: string
}

export interface PrioritySkill {
  skill: string
  /** Postings in the tracked sectors that mention it; null when the browser scored offline. */
  postings: number | null
  weeks: number
  source: string
}

export interface AssessmentResult {
  id: number
  student: { id: number; name: string; department: DeptCode }
  target_role: string
  readiness_score: number
  matched_skills: string[]
  missing_skills: string[]
  recommendations: string[]
  alternative_roles: { role: string; score: number }[]
  priority_skills: PrioritySkill[]
  created_at: string
}

export interface PathwayStep {
  skill: string
  source: string
  duration_weeks: number
  completed: boolean
}

export interface SavedPathway {
  id: number
  student: { id: number; name: string }
  target_role: string
  steps: PathwayStep[]
  estimated_months: number
  progress_pct: number
  created_at: string
}

export interface CreatePathwayPayload {
  student_id: number
  target_role: string
  steps: PathwayStep[]
  estimated_months?: number
}

export interface PlacementRecord {
  id: number
  student: { id: number; name: string; department: DeptCode }
  role_title: string
  company: string
  location: string
  start_date: string
  contract_type: ContractType
  salary_range: string
  placement_method: string
  created_at: string
}

export interface CreatePlacementPayload {
  student_id: number
  role_title: string
  company: string
  location?: string
  start_date: string
  contract_type: ContractType
  salary_range?: string
  placement_method?: string
}

export interface PlacementStats {
  total_placed: number
  total_graduated: number
  placement_rate: number
  avg_days_to_placement: number | null
  by_department: { department: DeptCode; placed: number; total: number; rate: number; avg_days: number | null }[]
  by_gender: Record<string, { placed: number; total: number }>
  female_share_of_placed: number
  top_employers: { company: string; count: number }[]
  by_role: { role: string; count: number }[]
  by_month: { month: string; count: number }[]
  /** Share of graduates so far who had started a job, at the end of each of the last 12 months. */
  rate_series: { month: string; graduates: number; placed: number; rate: number }[]
  this_month: number
  by_contract: { contract: ContractType; count: number }[]
  by_method: { method: string; count: number }[]
}

export type DemandTrend = 'rising' | 'stable' | 'falling' | 'declining'

export interface AdvisorDashboardData {
  active_students: number
  average_readiness: number | null
  assessed_students: number
  placement_rate: number
  open_positions: number
  students_by_department: Record<DeptCode, number>
  attention_total: number
  students_needing_attention: {
    id: number
    name: string
    department: DeptCode
    readiness: number | null
    last_assessed: string | null
    reasons: string[]
  }[]
  hot_roles: { role: string; postings: number; trend: DemandTrend }[]
  recent_placements: { student: string; role: string; company: string; date: string }[]
  top_demanded_skills: { skill: string; count: number }[]
}

export interface AdvisorJob {
  id: number
  title: string
  company: string
  location: string
  posted_date: string | null
  source: string
  source_url: string
  sector: string | null
  role: string | null
  skills: string[]
  skills_source: 'posting' | 'role'
  /** How many of this posting's skills the linked student has (null when no student is linked). */
  matched: number | null
  required: number
}

export interface JobFilters {
  sector?: string
  role?: string
  q?: string
  location?: string
  days?: number
  page?: number
  student_id?: number
  only_matches?: boolean
  sort?: 'match'
}

export interface JobInsights {
  total: number
  months: string[]
  top_companies: { company: string; count: number }[]
  top_locations: { location: string; count: number }[]
  monthly: { month: string; count: number }[]
  roles: { role: string; postings: number; series: number[]; trend: DemandTrend }[]
}

export interface ReportFilters {
  student_id?: number
  graduation_year?: number
  cohort?: string
  department?: string
  sector?: string
}

export interface StudentReadinessReport {
  type: 'student_readiness'
  title: string
  generated_at: string
  student: {
    id: number
    name: string
    email: string
    department: DeptCode
    department_label: string
    graduation_year: number | null
    status: StudentStatus
    cohort: string
    skills: string[]
    target_roles: string[]
  }
  targets_inferred: boolean
  assessments: Omit<AssessmentResult, 'id' | 'student' | 'created_at'>[]
  pathways: { target_role: string; progress_pct: number; estimated_months: number; steps: PathwayStep[] }[]
  placements: { role_title: string; company: string; start_date: string; contract_type: ContractType }[]
}

export interface CohortOutcomesReport extends PlacementStats {
  type: 'cohort_outcomes'
  title: string
  generated_at: string
  scope: string
  filters: Record<string, string | number>
  average_readiness: number | null
  assessed_students: number
}

export interface EmployerDemandReport {
  type: 'employer_demand'
  title: string
  generated_at: string
  sector: string
  total_postings: number
  top_roles: AdvisorDashboardData['hot_roles']
  top_skills: { skill: string; count: number }[]
  top_companies: { company: string; count: number }[]
  top_locations: { location: string; count: number }[]
  monthly: { month: string; count: number }[]
}

export interface SkillsGapReport {
  type: 'skills_gap'
  title: string
  generated_at: string
  assessed_students: number
  most_missing_skills: { skill: string; count: number; pct: number }[]
  lowest_readiness_roles: { role: string; students: number; avg_readiness: number }[]
  by_department: { department: DeptCode; students: number; avg_readiness: number | null }[]
}

export type AdvisorReportType = 'student_readiness' | 'cohort_outcomes' | 'employer_demand' | 'skills_gap'
export type AdvisorReport = StudentReadinessReport | CohortOutcomesReport | EmployerDemandReport | SkillsGapReport
