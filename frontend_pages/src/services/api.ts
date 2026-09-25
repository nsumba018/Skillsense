import { request, download } from './http'
import type {
  CareerGuidance,
  AdminUser,
  CurriculumDetail,
  CurriculumSummary,
  DataUpload,
  GeographicSummary,
  Institution,
  Session,
  DemandOutlookReport,
  RoleDeepDiveReport,
  EducationAlignment,
  EmployabilityOverview,
  EmployabilityScore,
  ForecastRunSummary,
  ForecastsResponse,
  GeneratedReport,
  GeographicRow,
  Horizon,
  HistoricalResponse,
  JobPosting,
  Kpis,
  MacroIndicator,
  Overview,
  Paginated,
  RegisterPayload,
  RoleBrief,
  RoleDetail,
  RoleGroup,
  SectorRow,
  TokenPair,
  TrendsResponse,
  User,
} from '../types/api'

export const authApi = {
  login: (email: string, password: string) =>
    request<TokenPair>('/api/auth/login/', { method: 'POST', body: { email, password }, auth: false }),
  register: (payload: RegisterPayload) =>
    request<User>('/api/auth/register/', { method: 'POST', body: payload, auth: false }),
  logout: (refresh: string) => request<void>('/api/auth/logout/', { method: 'POST', body: { refresh } }),
  me: () => request<User>('/api/auth/me/'),
  institutions: () => request<Institution[]>('/api/auth/institutions/', { auth: false }),
  changePassword: (old_password: string, new_password: string, refresh: string | null) =>
    request<{ detail: string; other_sessions_signed_out: number }>('/api/auth/change-password/', {
      method: 'POST',
      body: { old_password, new_password, refresh: refresh ?? undefined },
    }),
  requestReset: (email: string) =>
    request<{ detail: string }>('/api/auth/password-reset/', { method: 'POST', body: { email }, auth: false }),
  confirmReset: (uid: string, token: string, new_password: string) =>
    request<{ detail: string }>('/api/auth/password-reset/confirm/', {
      method: 'POST',
      body: { uid, token, new_password },
      auth: false,
    }),
  sessions: (refresh: string | null) =>
    request<Session[]>('/api/auth/sessions/', { headers: refresh ? { 'X-Refresh-Token': refresh } : undefined }),
  revokeSession: (id: number) => request<void>(`/api/auth/sessions/${id}/`, { method: 'DELETE' }),
  users: (params?: { search?: string; role?: string; page?: number }) =>
    request<Paginated<AdminUser>>('/api/auth/users/', { params }),
  updateUser: (id: number, data: { role?: string; is_active?: boolean; institution_id?: number | null }) =>
    request<AdminUser>(`/api/auth/users/${id}/`, { method: 'PATCH', body: data }),
  createUser: (data: {
    email: string
    first_name: string
    last_name: string
    role: string
    password: string
    institution_id?: number | null
  }) => request<AdminUser>('/api/auth/users/', { method: 'POST', body: data }),
  updateMe: (data: Pick<User, 'email' | 'username' | 'first_name' | 'last_name'>) =>
    request<User>('/api/auth/me/', { method: 'PUT', body: data }),
}

export const taxonomyApi = {
  groups: () => request<RoleGroup[]>('/api/taxonomy/groups/'),
  roles: (search?: string) => request<RoleBrief[]>('/api/taxonomy/roles/', { params: { search } }),
  role: (id: number) => request<RoleDetail>(`/api/taxonomy/roles/${id}/`),
  emerging: () => request<RoleBrief[]>('/api/taxonomy/emerging/'),
}

export const predictionsApi = {
  forecasts: (horizon?: Horizon) =>
    request<ForecastsResponse>('/api/predictions/forecasts/', { params: { horizon } }),
  trends: () => request<TrendsResponse>('/api/predictions/trends/'),
  historical: (params?: { role_id?: number; year_from?: number; year_to?: number }) =>
    request<HistoricalResponse>('/api/predictions/historical/', { params }),
  macro: () => request<MacroIndicator[]>('/api/predictions/macro/'),
  run: () => request<ForecastRunSummary>('/api/predictions/run/', { method: 'POST' }),
}

export const dashboardApi = {
  kpis: () => request<Kpis>('/api/dashboard/kpis/'),
  overview: () => request<Overview>('/api/dashboard/overview/'),
}

export const analyticsApi = {
  sector: () => request<SectorRow[]>('/api/analytics/sector/'),
  geographic: () => request<Paginated<GeographicRow>>('/api/analytics/geographic/'),
  employability: () => request<EmployabilityOverview>('/api/analytics/employability/'),
  score: (skills: number[]) =>
    request<EmployabilityScore>('/api/analytics/employability/score/', { method: 'POST', body: { skills } }),
  career: () => request<CareerGuidance>('/api/analytics/career/'),
  education: () => request<EducationAlignment>('/api/analytics/education/'),
  geographicSummary: () => request<GeographicSummary>('/api/analytics/geographic/summary/'),
  curricula: () => request<Paginated<CurriculumSummary>>('/api/analytics/education/curricula/'),
  curriculum: (id: number) => request<CurriculumDetail>(`/api/analytics/education/curricula/${id}/`),
  submitCurriculum: (form: FormData) =>
    request<CurriculumDetail>('/api/analytics/education/curricula/', { method: 'POST', form }),
  deleteCurriculum: (id: number) => request<void>(`/api/analytics/education/curricula/${id}/`, { method: 'DELETE' }),
}

export const reportsApi = {
  list: () => request<Paginated<GeneratedReport>>('/api/reports/'),
  demandOutlook: () => request<DemandOutlookReport>('/api/reports/demand_outlook/'),
  roleDeepDive: (roleId: number) =>
    request<RoleDeepDiveReport>('/api/reports/role_deep_dive/', { params: { role_id: roleId } }),
  downloadDemandOutlookCsv: () => download('/api/reports/demand_outlook/csv/', 'demand_outlook.csv'),
}

export const uploadsApi = {
  list: () => request<Paginated<DataUpload>>('/api/uploads/list/'),
  get: (id: number) => request<DataUpload>(`/api/uploads/${id}/`),
  postings: (id: number) => request<Paginated<JobPosting>>(`/api/uploads/${id}/postings/`),
  upload: (file: File) => {
    const form = new FormData()
    form.append('file', file)
    return request<{ file: string }>('/api/uploads/', { method: 'POST', form })
  },
}
