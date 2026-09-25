import { useQuery, keepPreviousData } from '@tanstack/react-query'
import {
  analyticsApi,
  authApi,
  dashboardApi,
  predictionsApi,
  reportsApi,
  taxonomyApi,
  uploadsApi,
} from './api'
import type { Horizon } from '../types/api'

const STALE = 60_000

export const useKpis = () => useQuery({ queryKey: ['kpis'], queryFn: dashboardApi.kpis, staleTime: STALE })
export const useOverview = () =>
  useQuery({ queryKey: ['overview'], queryFn: dashboardApi.overview, staleTime: STALE })

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
export const useGeographic = () =>
  useQuery({ queryKey: ['geographic'], queryFn: analyticsApi.geographic, staleTime: STALE })
export const useEmployabilityOverview = () =>
  useQuery({ queryKey: ['employability'], queryFn: analyticsApi.employability, staleTime: STALE })
export const useCareer = () => useQuery({ queryKey: ['career'], queryFn: analyticsApi.career, staleTime: STALE })
export const useEducation = () =>
  useQuery({ queryKey: ['education'], queryFn: analyticsApi.education, staleTime: STALE })
export const useGeographicSummary = () =>
  useQuery({ queryKey: ['geo-summary'], queryFn: analyticsApi.geographicSummary, staleTime: STALE })
export const useInstitutions = () =>
  useQuery({ queryKey: ['institutions'], queryFn: authApi.institutions, staleTime: 5 * STALE })
export const useCurricula = (enabled = true) =>
  useQuery({ queryKey: ['curricula'], queryFn: analyticsApi.curricula, enabled })
export const useCurriculum = (id: number | null) =>
  useQuery({ queryKey: ['curriculum', id], queryFn: () => analyticsApi.curriculum(id as number), enabled: id !== null })

export const useReportList = () => useQuery({ queryKey: ['reports'], queryFn: reportsApi.list })
export const useDemandOutlook = (enabled = true) =>
  useQuery({ queryKey: ['demand-outlook'], queryFn: reportsApi.demandOutlook, enabled, staleTime: STALE })

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
