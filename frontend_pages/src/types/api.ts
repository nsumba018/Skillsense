// Shapes returned by the SkillSense Django API (see backend serializers/views).

export type Horizon = '6m' | '1y' | '2y'
export type Trend = 'growing' | 'stable' | 'declining'
export type UserRole = 'admin' | 'career_training_advisor' | 'education_curriculum_planner' | 'labor_market_analyst'

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

export interface Institution {
  id: number
  name: string
  type: string
  description: string
  created_at: string
}

export interface User {
  id: number
  email: string
  username: string
  first_name: string
  last_name: string
  role: UserRole
  institution: Institution | null
  is_active: boolean
  date_joined: string
}

export interface TokenPair {
  access: string
  refresh: string
}

export interface RegisterPayload {
  email: string
  username: string
  first_name: string
  last_name: string
  password: string
  password_confirm: string
  role: Exclude<UserRole, 'admin'>
  institution_id?: number | null
}

export interface Session {
  id: number
  created_at: string
  expires_at: string
  current: boolean
}

export interface AdminUser extends User {
  last_login: string | null
}

/* ---------- taxonomy ---------- */
export interface RoleBrief {
  id: number
  name: string
  emergence_year: number
  is_emerging: boolean
  group_name: string
  family_name: string
  global_trend_signal: number | null
}

export interface RoleFamily {
  id: number
  name: string
  group_name: string
  roles: RoleBrief[]
}

export interface RoleGroup {
  id: number
  name: string
  description: string
  sort_order: number
  families: RoleFamily[]
}

export interface HistoricalPoint {
  year: number
  role_demand_index: number
  role_share_within_ict_pct: number
  role_employment_proxy: number
  data_basis: string
  synthetic_flag: boolean
}

export interface RoleDetail extends RoleBrief {
  description: string
  historical_demand: HistoricalPoint[]
}

/* ---------- predictions ---------- */
export interface ForecastRunSummary {
  id: number
  created_at: string
  model_version: string
  accuracy_spearman: number | null
  accuracy_pearson: number | null
  accuracy_r2: number | null
}

export interface RoleForecast {
  id: number
  role_id: number
  role_name: string
  horizon: Horizon
  demand_index: number
  share_pct: number
  employment_proxy: number
  confidence_lower: number | null
  confidence_upper: number | null
  trend_direction: Trend
}

export interface ForecastsResponse {
  forecast_run: ForecastRunSummary
  forecasts: RoleForecast[]
}

export interface TrendEntry {
  role_id: number
  role_name: string
  demand_index: number
  share_pct: number
  trend_direction: Trend
}

export type TrendsResponse = Record<Trend, TrendEntry[]>

export interface HistoricalRolePoint {
  year: number
  demand_index: number
  share_pct: number
  employment_proxy: number
  synthetic: boolean
}

export type HistoricalResponse = Record<string, HistoricalRolePoint[]>

export interface MacroIndicator {
  id: number
  year: number
  total_employment: number
  ict_employment: number
  ict_employment_share_pct: number
  labour_force_participation_rate_pct: number
  unemployment_rate_pct: number
  employment_to_population_ratio_pct: number
  tertiary_employment_count: number
  data_source: string
}

/* ---------- dashboard ---------- */
export interface Kpis {
  total_ict_employment: number
  ict_share_pct: number
  total_roles_tracked: number
  total_postings: number
  latest_year: number | null
  top_growing_roles: { name: string; demand_index: number }[]
  model_accuracy: { spearman: number | null; r2: number | null }
}

export interface Overview {
  latest_year: number | null
  role_distribution: { role_id: number; role_name: string; demand_index: number; share_pct: number }[]
  forecast_summary: Partial<
    Record<Horizon, { role_name: string; demand_index: number; share_pct: number; trend: Trend }[]>
  >
  model_info: { version: string | null; last_run: string | null; spearman: number | null }
}

/* ---------- analytics ---------- */
export interface SectorRow {
  industry_raw: string
  posting_count: number
}

export interface GeographicRow {
  id: number
  province: string
  district: string
  role_name: string
  year: number
  posting_count: number
  demand_score: number
}

export interface EmployabilityOverview {
  description: string
  available_roles: { id: number; name: string }[]
  scoring_method: string
}

export interface EmployabilityRole {
  role_id: number
  role_name: string
  demand_index: number
  trend: Trend
}

export interface EmployabilityScore {
  overall_score: number
  matched_roles: EmployabilityRole[]
  skill_gaps: EmployabilityRole[]
  recommendations: string[]
}

export interface CareerGuidance {
  growing_roles: { role_name: string; demand_index: number; share_pct: number }[]
  advice: string
}

export interface EducationAlignment {
  status: string
  message: string
  method: string
  curricula_count: number
  skills_in_lexicon: number
}

export interface CurriculumSummary {
  id: number
  name: string
  level: string
  level_label: string
  institution: number | null
  institution_name: string | null
  uploaded_by_email: string | null
  source_filename: string
  course_count: number
  alignment_score: number
  created_at: string
}

export interface CurriculumRoleFit {
  role_id: number
  role_name: string
  demand_index: number
  trend: Trend
  coverage_pct: number
  covered_skills: string[]
  missing_skills: string[]
}

export interface CurriculumAnalysis {
  alignment_score: number
  skills_taught: string[]
  courses: { id: number; title: string; description: string; skills: string[] }[]
  unmatched_courses: string[]
  roles: CurriculumRoleFit[]
  top_gaps: CurriculumRoleFit[]
  strengths: CurriculumRoleFit[]
}

export interface CurriculumDetail extends CurriculumSummary {
  analysis: CurriculumAnalysis
}

export interface GeographicSummary {
  total_ict_postings: number
  located_postings: number
  unlocated_postings: number
  by_province: { province: string; postings: number; share_pct: number; districts_in_province: number }[]
  by_district: {
    district: string
    province: string
    postings: number
    top_role: string
    roles: { name: string; count: number }[]
  }[]
}

/* ---------- reports ---------- */
export interface GeneratedReport {
  id: number
  report_type: string
  format: string
  title: string
  generated_by_email: string | null
  file: string | null
  parameters: Record<string, unknown>
  created_at: string
}

export interface DemandOutlookReport {
  title: string
  model_version: string
  generated_at: string
  accuracy: { spearman: number | null; pearson: number | null; r2: number | null }
  forecasts: Partial<
    Record<
      Horizon,
      {
        role: string
        demand_index: number
        share_pct: number
        trend: Trend
        confidence_lower: number | null
        confidence_upper: number | null
      }[]
    >
  >
}

/* ---------- uploads ---------- */
export type UploadStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface DataUpload {
  id: number
  uploaded_by_email: string | null
  original_filename: string
  status: UploadStatus
  total_records: number
  ict_records: number
  error_count: number
  processing_log: string
  created_at: string
}

export interface JobPosting {
  id: number
  source: string
  title: string
  company: string
  location_raw: string
  industry_raw: string
  is_ict: boolean
  ict_role_confidence: number
  normalized_role: number | null
  normalized_role_name: string | null
  needs_manual_review: boolean
  posted_date: string | null
}

export interface RoleDeepDiveReport {
  title: string
  role_id: string
  historical: {
    year: number
    role_demand_index: number
    role_share_within_ict_pct: number
    role_employment_proxy: number
  }[]
  forecasts: {
    horizon: Horizon
    demand_index: number
    share_pct: number
    trend_direction: Trend
    confidence_lower: number | null
    confidence_upper: number | null
  }[]
}
