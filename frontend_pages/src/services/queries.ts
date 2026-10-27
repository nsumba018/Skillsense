import { useQuery, keepPreviousData } from '@tanstack/react-query'
import {
  advisoryApi,
  analyticsApi,
  authApi,
  dashboardApi,
  predictionsApi,
  reportsApi,
  sectorPredictionsApi,
  taxonomyApi,
  uploadsApi,
  bulletinApi,
} from './api'
import type { Horizon } from '../types/api'
import type { AdvisorReportType, JobFilters, ReportFilters } from '../types/advisory'

const STALE = 60_000

export const useKpis = () => useQuery({ queryKey: ['kpis'], queryFn: dashboardApi.kpis, staleTime: STALE })
export const useOverview = () =>
  useQuery({ queryKey: ['overview'], queryFn: dashboardApi.overview, staleTime: STALE })
export const useAdminStats = () =>
  useQuery({ queryKey: ['admin-stats'], queryFn: dashboardApi.adminStats, staleTime: STALE })

export const useForecasts = (horizon?: Horizon) =>
  useQuery({
    queryKey: ['forecasts', horizon ?? 'all'],
    queryFn: () => predictionsApi.forecasts(horizon),
    staleTime: STALE,
  })
export const useTrends = () => useQuery({ queryKey: ['trends'], queryFn: predictionsApi.trends, staleTime: STALE })
export const useMacro = () => useQuery({ queryKey: ['macro'], queryFn: predictionsApi.macro, staleTime: STALE })
export const useHistorical = (roleId?: number, enabled = true) =>
  useQuery({
    queryKey: ['historical', roleId ?? 'all'],
    queryFn: () => predictionsApi.historical(roleId ? { role_id: roleId } : undefined),
    enabled,
    staleTime: STALE,
    placeholderData: keepPreviousData,
  })

/** Every role's history from `year` onward (used to get each role's current employment). */
export const useHistoricalSince = (year: number) =>
  useQuery({
    queryKey: ['historical-since', year],
    queryFn: () => predictionsApi.historical({ year_from: year }),
    staleTime: STALE,
  })

export const useTaxonomy = () =>
  useQuery({ queryKey: ['taxonomy'], queryFn: taxonomyApi.groups, staleTime: 5 * STALE })
export const useRoleDetail = (id: number | null) =>
  useQuery({
    queryKey: ['role', id],
    queryFn: () => taxonomyApi.role(id as number),
    enabled: id !== null,
    staleTime: STALE,
  })
export const useEmergingRoles = () =>
  useQuery({ queryKey: ['emerging'], queryFn: taxonomyApi.emerging, staleTime: STALE })

export const useSectors = () => useQuery({ queryKey: ['sector'], queryFn: analyticsApi.sector, staleTime: STALE })

export const useSectorList = () =>
  useQuery({ queryKey: ['sector-list'], queryFn: taxonomyApi.sectorList, staleTime: 5 * STALE })
export const useSectorEmployment = (sectorSlug?: string) =>
  useQuery({
    queryKey: ['sector-employment', sectorSlug ?? 'all'],
    queryFn: () => taxonomyApi.sectorEmployment(sectorSlug ? { sector__slug: sectorSlug } : undefined),
    staleTime: STALE,
  })
export const useSectorForecasts = (horizon?: Horizon, sectorSlug?: string) =>
  useQuery({
    queryKey: ['sector-forecasts', horizon ?? 'all', sectorSlug ?? 'all'],
    queryFn: () => sectorPredictionsApi.forecasts({ horizon, sector: sectorSlug }),
    staleTime: STALE,
  })
export const useGeographic = () =>
  useQuery({ queryKey: ['geographic'], queryFn: analyticsApi.geographic, staleTime: STALE })
export const useSectorPositions = (sector?: string | null) =>
  useQuery({
    queryKey: ['sector-positions', sector ?? 'all'],
    queryFn: () => analyticsApi.sectorPositions(sector ?? undefined),
    staleTime: STALE,
  })
export const usePolicyInsights = (sector?: string | null) =>
  useQuery({
    queryKey: ['policy-insights', sector ?? 'all'],
    queryFn: () => analyticsApi.policyInsights(sector ?? undefined),
    staleTime: STALE,
  })
export const useSectorTaxonomy = (sector: string | null) =>
  useQuery({
    queryKey: ['sector-taxonomy', sector],
    queryFn: () => analyticsApi.sectorTaxonomy(sector!),
    enabled: !!sector,
    staleTime: STALE,
  })
export const useSectorRoleDetail = (sector: string | null, title: string | null) =>
  useQuery({
    queryKey: ['sector-role-detail', sector, title],
    queryFn: () => analyticsApi.sectorRoleDetail(sector!, title!),
    enabled: !!sector && !!title,
    staleTime: STALE,
  })
export const useEmployabilityOverview = () =>
  useQuery({ queryKey: ['employability'], queryFn: analyticsApi.employability, staleTime: STALE })
export const useCareer = () => useQuery({ queryKey: ['career'], queryFn: analyticsApi.career, staleTime: STALE })
export const useEducation = () =>
  useQuery({ queryKey: ['education'], queryFn: analyticsApi.education, staleTime: STALE })
export const useGeographicSummary = (sector?: string | null) =>
  useQuery({
    queryKey: ['geo-summary', sector ?? 'all'],
    queryFn: () => analyticsApi.geographicSummary(sector ?? undefined),
    staleTime: STALE,
  })
export const useInstitutions = () =>
  useQuery({ queryKey: ['institutions'], queryFn: authApi.institutions, staleTime: 5 * STALE })
export const useCurricula = (enabled = true) =>
  useQuery({ queryKey: ['curricula'], queryFn: analyticsApi.curricula, enabled })
export const useCurriculum = (id: number | null) =>
  useQuery({ queryKey: ['curriculum', id], queryFn: () => analyticsApi.curriculum(id as number), enabled: id !== null })

export const useReportList = () => useQuery({ queryKey: ['reports'], queryFn: reportsApi.list })
export const useDemandOutlook = (enabled = true) =>
  useQuery({ queryKey: ['demand-outlook'], queryFn: reportsApi.demandOutlook, enabled, staleTime: STALE })
export const useSectorOutlook = (enabled = true) =>
  useQuery({ queryKey: ['sector-outlook'], queryFn: reportsApi.sectorOutlook, enabled, staleTime: STALE })
export const useSectorDetail = (sector: string | null, enabled = true) =>
  useQuery({
    queryKey: ['sector-detail', sector],
    queryFn: () => reportsApi.sectorDetail(sector!),
    enabled: enabled && !!sector,
    staleTime: STALE,
  })

/** Polls while any upload is still pending/processing. */
export const useUploads = (enabled = true) =>
  useQuery({
    queryKey: ['uploads'],
    queryFn: uploadsApi.list,
    enabled,
    refetchInterval: (q) =>
      q.state.data?.results.some((u) => u.status === 'pending' || u.status === 'processing') ? 2000 : false,
  })
export const useUploadPostings = (id: number | null) =>
  useQuery({
    queryKey: ['upload-postings', id],
    queryFn: () => uploadsApi.postings(id as number),
    enabled: id !== null,
  })

/* ---------- advisory (Career & Training Advisor) ---------- */
export const useAdvisorDashboard = () =>
  useQuery({ queryKey: ['advisor-dashboard'], queryFn: advisoryApi.dashboard, staleTime: STALE })

export const useStudents = (params?: Parameters<typeof advisoryApi.students>[0]) =>
  useQuery({
    queryKey: ['students', params ?? {}],
    queryFn: () => advisoryApi.students({ page_size: 200, ...params }),
    placeholderData: keepPreviousData,
  })
export const useStudent = (id: number | null) =>
  useQuery({ queryKey: ['student', id], queryFn: () => advisoryApi.student(id as number), enabled: id !== null })
export const useAssessments = (studentId?: number) =>
  useQuery({
    queryKey: ['assessments', studentId ?? 'all'],
    queryFn: () => advisoryApi.assessments({ student_id: studentId }),
  })
export const usePathways = (studentId?: number) =>
  useQuery({
    queryKey: ['pathways', studentId ?? 'all'],
    queryFn: () => advisoryApi.pathways({ student_id: studentId }),
  })
export const usePlacements = (search?: string) =>
  useQuery({
    queryKey: ['placements', search ?? ''],
    queryFn: () => advisoryApi.placements({ search: search || undefined, page_size: 200 }),
    placeholderData: keepPreviousData,
  })
export const usePlacementStats = (params?: Parameters<typeof advisoryApi.placementStats>[0]) =>
  useQuery({ queryKey: ['placement-stats', params ?? {}], queryFn: () => advisoryApi.placementStats(params) })
export const useAdvisorJobs = (filters: JobFilters) =>
  useQuery({
    queryKey: ['advisor-jobs', filters],
    queryFn: () => advisoryApi.jobs(filters),
    staleTime: STALE,
    placeholderData: keepPreviousData,
  })
export const useJobInsights = (filters: Omit<JobFilters, 'page'>) =>
  useQuery({
    queryKey: ['advisor-job-insights', filters],
    queryFn: () => advisoryApi.jobInsights(filters),
    staleTime: STALE,
    placeholderData: keepPreviousData,
  })
export const useAdvisorReport = (type: AdvisorReportType | null, filters: ReportFilters, enabled = true) =>
  useQuery({
    queryKey: ['advisor-report', type, filters],
    queryFn: () => advisoryApi.report(type as AdvisorReportType, filters),
    enabled: enabled && type !== null,
  })

export const useBulletinAll = () =>
  useQuery({ queryKey: ['bulletin-all'], queryFn: bulletinApi.all, staleTime: STALE })
export const useBulletinList = () =>
  useQuery({ queryKey: ['bulletins'], queryFn: bulletinApi.list, staleTime: STALE })
export const useBulletinDetail = (deptCode: string | null) =>
  useQuery({
    queryKey: ['bulletin', deptCode],
    queryFn: () => bulletinApi.detail(deptCode!),
    enabled: !!deptCode,
    staleTime: STALE,
  })
