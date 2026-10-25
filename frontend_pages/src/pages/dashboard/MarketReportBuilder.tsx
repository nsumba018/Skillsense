import { useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { BookOpen, Briefcase, Building2, FileText, Layers, MapPin, PieChart, Printer, Table2, TrendingUp } from 'lucide-react'
import DashboardLayout from './DashboardLayout'
import CurriculumAlignmentReport, { curriculumMeta } from './CurriculumAlignmentReport'
import { QueryGate, Loading, ErrorState } from '../../components/ui/State'
import {
  Block,
  DataTable,
  ExportBar,
  Growth,
  HorizonTabs,
  Kpi,
  KpiRow,
  RankList,
  ReportBanner,
  ReportDocument,
  ReportPageHeader,
  ReportWorkspace,
  TrendPill,
  type ReportTemplate,
} from '../../components/ui/reportKit'
import { BLUE, GRAY, GREEN, HBarChart, RED, TrendArea } from '../../components/ui/reportCharts'
import { useDemandOutlook, useForecasts, useSectorDetail, useSectorList, useSectorOutlook } from '../../services/queries'
import { reportsApi } from '../../services/api'
import { fmtCompact, fmtDate, fmtInt, fmtNum, fmtPct, HORIZON_LABEL } from '../../lib/format'
import type { Horizon, Trend } from '../../types/api'

type ReportType = 'demand_outlook' | 'role_deep_dive' | 'sector_outlook' | 'sector_detail' | 'curriculum_alignment'

const selectClass =
  'w-full cursor-pointer rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'
const TREND_COLOR: Record<Trend, string> = { growing: GREEN, stable: GRAY, declining: RED }

interface Props {
  icon: React.ComponentType<{ className?: string }>
  title: string
  subtitle: string
  chip?: string
  /** Wording for what "cross-sector" covers, e.g. "all nine sectors". */
  scope: string
  /** Limit the sectors offered (the education planner only sees AUCA's two). */
  sectorFilter?: (slug: string) => boolean
  defaultSector?: string
  /** Adds the AUCA curriculum-alignment report (education planner). */
  curriculum?: boolean
}

function OptionRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-wrap items-center gap-3 text-xs font-bold uppercase tracking-wider text-navy">
      {label}
      <span className="min-w-[200px] normal-case tracking-normal">{children}</span>
    </label>
  )
}

/** The market-intelligence report builder shared by the analyst and the education planner. */
export default function MarketReportBuilder({ icon, title, subtitle, chip, scope, sectorFilter, defaultSector, curriculum }: Props) {
  const forecasts = useForecasts('1y')
  const sectorListQ = useSectorList()
  const [type, setType] = useState<ReportType>('demand_outlook')
  const [roleId, setRoleId] = useState<number | null>(null)
  const [sectorSlug, setSectorSlug] = useState<string | null>(defaultSector ?? null)
  const [horizon, setHorizon] = useState<Horizon>('1y')
  const [exportError, setExportError] = useState<string | null>(null)

  const sectorList = (sectorListQ.data ?? []).filter((s) => !sectorFilter || sectorFilter(s.slug))
  const roles = [...(forecasts.data?.forecasts ?? [])].sort((a, b) => a.role_name.localeCompare(b.role_name))
  const activeRole = roleId ?? roles[0]?.role_id ?? null
  const activeSector = sectorSlug ?? sectorList[0]?.slug ?? null

  // Every report builds live as soon as it is opened; only the open one is fetched.
  const outlook = useDemandOutlook(type === 'demand_outlook')
  const sectorOutlook = useSectorOutlook(type === 'sector_outlook')
  const sectorDetail = useSectorDetail(activeSector, type === 'sector_detail')
  const deepDive = useQuery({
    queryKey: ['role-deep-dive', activeRole],
    queryFn: () => reportsApi.roleDeepDive(activeRole as number),
    enabled: type === 'role_deep_dive' && activeRole !== null,
  })

  const csvMut = useMutation({
    mutationFn: () => {
      if (type === 'sector_detail' && activeSector) return reportsApi.downloadSectorDetailCsv(activeSector)
      if (type === 'sector_outlook') return reportsApi.downloadSectorOutlookCsv()
      return reportsApi.downloadDemandOutlookCsv()
    },
    onError: () => setExportError('CSV export failed'),
  })
  const pdfMut = useMutation({
    mutationFn: () => {
      if (type === 'sector_detail' && activeSector) return reportsApi.downloadSectorDetailPdf(activeSector)
      if (type === 'sector_outlook') return reportsApi.downloadSectorOutlookPdf()
      if (type === 'role_deep_dive' && activeRole !== null) return reportsApi.downloadRoleDeepDivePdf(activeRole)
      return reportsApi.downloadDemandOutlookPdf()
    },
    onError: () => setExportError('PDF export failed'),
  })

  const exports = (csv = true) => (
    <ExportBar
      onCsv={csv ? () => { setExportError(null); csvMut.mutate() } : undefined}
      onPdf={() => { setExportError(null); pdfMut.mutate() }}
      csvPending={csvMut.isPending}
      pdfPending={pdfMut.isPending}
      error={exportError}
    />
  )

  const templates: ReportTemplate<ReportType>[] = [
    { id: 'demand_outlook', title: 'ICT Role Demand', desc: 'Forecast demand for every ICT role, with confidence ranges.', icon: FileText, tone: 'bg-red-50 text-red-500', formats: ['CSV', 'PDF'] },
    { id: 'role_deep_dive', title: 'ICT Role Deep Dive', desc: 'Full history and forecast for one ICT role.', icon: Table2, tone: 'bg-emerald-50 text-emerald-600', formats: ['PDF'] },
    { id: 'sector_outlook', title: 'Cross-Sector Outlook', desc: `Employment, growth and hiring across ${scope}.`, icon: Layers, tone: 'bg-primary-light text-primary', formats: ['CSV', 'PDF'] },
    { id: 'sector_detail', title: 'Sector Detail', desc: 'One sector in depth: forecasts, history, top employers.', icon: PieChart, tone: 'bg-violet-50 text-violet-600', formats: ['CSV', 'PDF'] },
    ...(curriculum
      ? [{ id: 'curriculum_alignment' as const, title: 'Curriculum Alignment', desc: 'AUCA curriculum against employer-demanded skills.', icon: BookOpen, tone: 'bg-amber-50 text-amber-600', formats: ['Print'] }]
      : []),
  ]

  const sectorRows = (sectorOutlook.data?.forecasts[horizon] ?? []).filter((x) => !sectorFilter || sectorFilter(x.sector_slug))
  const demandRows = outlook.data?.forecasts[horizon] ?? []

  return (
    <DashboardLayout>
      <ReportPageHeader icon={icon} title={title} subtitle={subtitle} chip={chip} />

      <ReportWorkspace templates={templates} value={type} onChange={(t) => { setType(t); setExportError(null) }}>
        {type === 'demand_outlook' && (
          <div data-testid="report-outlook">
            <QueryGate query={outlook}>
              {(r) => {
                const growing = demandRows.filter((x) => x.trend === 'growing').length
                const declining = demandRows.filter((x) => x.trend === 'declining').length
                const top = demandRows[0]
                return (
                  <ReportDocument
                    banner={<ReportBanner kind="Role forecast" title={r.title} meta={`Model ${r.model_version} · run ${fmtDate(r.generated_at)} · rank correlation ${fmtNum(r.accuracy.spearman, 4)} · R² ${fmtNum(r.accuracy.r2, 4)}`} exports={exports()} />}
                    options={<HorizonTabs value={horizon} onChange={setHorizon} />}
                  >
                    <KpiRow>
                      <Kpi label="Roles forecast" value={demandRows.length} note={HORIZON_LABEL[horizon]} />
                      <Kpi label="Growing" value={growing} tone="text-emerald-600" note="roles trending up" />
                      <Kpi label="Declining" value={declining} tone="text-red-500" note="roles trending down" />
                      <Kpi label="Highest demand" value={top ? fmtNum(top.demand_index, 0) : '–'} note={top?.role} />
                    </KpiRow>
                    <Block title="Demand index, top 10 roles" hint="Green is growing, grey is stable, red is declining.">
                      <HBarChart
                        nameWidth={210}
                        format={(v) => fmtNum(v, 1)}
                        data={demandRows.slice(0, 10).map((x) => ({ name: x.role, value: Number(x.demand_index.toFixed(1)), color: TREND_COLOR[x.trend] }))}
                      />
                    </Block>
                    <Block title="All roles">
                      <DataTable head={['Role', 'Demand index', 'Share', 'Range', 'Trend']} minWidth={640} testId="outlook-table">
                        {demandRows.map((x) => (
                          <tr key={x.role}>
                            <td className="font-bold text-gray-900">{x.role}</td>
                            <td className="font-bold text-navy">{fmtNum(x.demand_index)}</td>
                            <td className="text-gray-700">{fmtPct(x.share_pct, 2)}</td>
                            <td className="text-xs text-gray-500">{fmtNum(x.confidence_lower)} – {fmtNum(x.confidence_upper)}</td>
                            <td><TrendPill trend={x.trend} /></td>
                          </tr>
                        ))}
                      </DataTable>
                    </Block>
                  </ReportDocument>
                )
              }}
            </QueryGate>
          </div>
        )}

        {type === 'role_deep_dive' && (
          <div data-testid="report-deepdive">
            {deepDive.isLoading ? <Loading label="Building report…" /> : deepDive.isError || !deepDive.data ? (
              <ErrorState error={deepDive.error} onRetry={() => deepDive.refetch()} />
            ) : (
              (() => {
                const d = deepDive.data
                const roleName = roles.find((r) => r.role_id === activeRole)?.role_name ?? 'Role'
                const latest = d.historical.at(-1)
                const oneYear = d.forecasts.find((f) => f.horizon === '1y')
                return (
                  <ReportDocument
                    banner={<ReportBanner kind="Role deep dive" title={`${roleName}: deep dive`} meta={`${d.historical.length} years of history`} exports={exports(false)} />}
                    options={
                      <OptionRow label="Role">
                        <select value={activeRole ?? ''} onChange={(e) => setRoleId(Number(e.target.value))} aria-label="ICT role" className={selectClass}>
                          {roles.map((r) => <option key={r.role_id} value={r.role_id}>{r.role_name}</option>)}
                        </select>
                      </OptionRow>
                    }
                  >
                    <KpiRow>
                      <Kpi label="Latest demand index" value={latest ? fmtNum(latest.role_demand_index) : '–'} note={latest ? String(latest.year) : undefined} />
                      <Kpi label="Share of ICT" value={latest ? fmtPct(latest.role_share_within_ict_pct, 1) : '–'} note="of ICT employment" />
                      <Kpi label="People employed" value={latest ? fmtCompact(Math.round(latest.role_employment_proxy)) : '–'} note="estimate" />
                      <Kpi label="1-year outlook" value={oneYear ? <TrendPill trend={oneYear.trend_direction} /> : '–'} />
                    </KpiRow>
                    <Block title="Demand index over time">
                      <TrendArea data={d.historical.map((h) => ({ name: String(h.year), value: Number(h.role_demand_index.toFixed(1)) }))} />
                    </Block>
                    <Block title="Forecast">
                      <DataTable head={['Horizon', 'Demand index', 'Share', 'Range', 'Trend']} testId="deepdive-forecast">
                        {d.forecasts.map((f) => (
                          <tr key={f.horizon}>
                            <td className="font-bold text-gray-900">{HORIZON_LABEL[f.horizon]}</td>
                            <td className="font-bold text-navy">{fmtNum(f.demand_index)}</td>
                            <td className="text-gray-700">{fmtPct(f.share_pct, 2)}</td>
                            <td className="text-xs text-gray-500">{fmtNum(f.confidence_lower)} – {fmtNum(f.confidence_upper)}</td>
                            <td><TrendPill trend={f.trend_direction} /></td>
                          </tr>
                        ))}
                      </DataTable>
                    </Block>
                    <Block title={`History (${d.historical.length} years)`}>
                      <DataTable head={['Year', 'Demand index', 'Share', 'People employed']} testId="deepdive-history" scroll="max-h-72 overflow-y-auto">
                        {d.historical.map((h) => (
                          <tr key={h.year}>
                            <td className="font-bold text-gray-900">{h.year}</td>
                            <td className="text-gray-700">{fmtNum(h.role_demand_index)}</td>
                            <td className="text-gray-700">{fmtPct(h.role_share_within_ict_pct, 2)}</td>
                            <td className="text-gray-700">{Math.round(h.role_employment_proxy).toLocaleString('en-US')}</td>
                          </tr>
                        ))}
                      </DataTable>
                    </Block>
                  </ReportDocument>
                )
              })()
            )}
          </div>
        )}

        {type === 'sector_outlook' && (
          <div data-testid="report-sector-outlook">
            <QueryGate query={sectorOutlook}>
              {(r) => {
                const total = sectorRows.reduce((n, x) => n + x.employment_count, 0)
                const fastest = [...sectorRows].sort((a, b) => b.growth_pct - a.growth_pct)[0]
                const postings = sectorRows.reduce((n, x) => n + x.posting_count, 0)
                return (
                  <ReportDocument
                    banner={<ReportBanner kind="Sector forecast" title={r.title} meta={`Model ${r.model_version} · run ${fmtDate(r.generated_at)} · R² ${fmtNum(r.accuracy.r2, 4)}`} exports={exports()} />}
                    options={<HorizonTabs value={horizon} onChange={setHorizon} />}
                  >
                    <KpiRow>
                      <Kpi label="Sectors" value={sectorRows.length} />
                      <Kpi label="Employment" value={fmtCompact(total)} note={`forecast, ${HORIZON_LABEL[horizon]}`} />
                      <Kpi label="Fastest growing" value={fastest ? `${fastest.growth_pct >= 0 ? '+' : ''}${fastest.growth_pct}%` : '–'} note={fastest?.sector} tone="text-emerald-600" />
                      <Kpi label="Job postings" value={fmtInt(postings)} />
                    </KpiRow>
                    <Block title="Forecast employment by sector">
                      <HBarChart
                        nameWidth={190}
                        format={(v) => fmtCompact(v)}
                        data={[...sectorRows].sort((a, b) => b.employment_count - a.employment_count).map((x) => ({ name: x.sector, value: x.employment_count, color: TREND_COLOR[x.employment_trend] }))}
                      />
                    </Block>
                    <Block title="All sectors">
                      <DataTable head={['Sector', 'Employment', 'Share', 'Growth', 'Postings', 'Trend']} minWidth={700} testId="sector-outlook-table">
                        {sectorRows.map((x) => (
                          <tr key={x.sector_slug}>
                            <td className="font-bold text-gray-900">{x.sector}</td>
                            <td className="font-bold text-navy">{fmtInt(x.employment_count)}</td>
                            <td className="text-gray-700">{fmtPct(x.employment_share_pct)}</td>
                            <td><Growth pct={x.growth_pct} /></td>
                            <td className="text-gray-700">{x.posting_count}</td>
                            <td><TrendPill trend={x.employment_trend} /></td>
                          </tr>
                        ))}
                      </DataTable>
                    </Block>
                  </ReportDocument>
                )
              }}
            </QueryGate>
          </div>
        )}

        {type === 'sector_detail' && (
          <div data-testid="report-sector-detail">
            <QueryGate query={sectorDetail}>
              {(r) => {
                const fc = r.forecasts[horizon]
                return (
                  <ReportDocument
                    banner={<ReportBanner kind="Sector report" title={r.title} meta={`Model ${r.model_version} · run ${fmtDate(r.generated_at)} · R² ${fmtNum(r.accuracy.r2, 4)}`} exports={exports()} />}
                    options={
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <OptionRow label="Sector">
                          <select value={activeSector ?? ''} onChange={(e) => setSectorSlug(e.target.value)} aria-label="Sector" className={selectClass}>
                            {sectorList.map((s) => <option key={s.slug} value={s.slug}>{s.name}</option>)}
                          </select>
                        </OptionRow>
                        <HorizonTabs value={horizon} onChange={setHorizon} />
                      </div>
                    }
                  >
                    <KpiRow>
                      <Kpi label="Current employment" value={fmtCompact(r.current_employment)} />
                      <Kpi label="Job postings" value={r.total_postings} />
                      <Kpi label={`Growth (${HORIZON_LABEL[horizon]})`} value={fc ? `${fc.growth_pct >= 0 ? '+' : ''}${fc.growth_pct}%` : '–'} tone={fc && fc.growth_pct < 0 ? 'text-red-500' : 'text-emerald-600'} />
                      <Kpi label="Trend" value={fc ? <TrendPill trend={fc.employment_trend} /> : '–'} />
                    </KpiRow>
                    {r.employment_history.length > 0 && (
                      <Block title="Employment over time" icon={TrendingUp}>
                        <TrendArea data={r.employment_history.map((h) => ({ name: String(h.year), value: h.employment_count }))} format={fmtCompact} color={BLUE} />
                      </Block>
                    )}
                    <Block title="Forecasts">
                      <DataTable head={['Horizon', 'Employment', 'Share', 'Growth', 'Range', 'Trend']}>
                        {(['6m', '1y', '2y'] as Horizon[]).map((h) => {
                          const f = r.forecasts[h]
                          if (!f) return null
                          return (
                            <tr key={h}>
                              <td className="font-bold text-gray-900">{HORIZON_LABEL[h]}</td>
                              <td className="font-bold text-navy">{fmtInt(f.employment_count)}</td>
                              <td className="text-gray-700">{fmtPct(f.employment_share_pct)}</td>
                              <td><Growth pct={f.growth_pct} /></td>
                              <td className="text-xs text-gray-500">{fmtNum(f.confidence_lower)} – {fmtNum(f.confidence_upper)}</td>
                              <td><TrendPill trend={f.employment_trend} /></td>
                            </tr>
                          )
                        })}
                      </DataTable>
                    </Block>
                    <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
                      <Block title="Top positions" icon={Briefcase}><RankList items={r.top_positions.map((p) => ({ name: p.title, count: p.count }))} badge="bg-primary-light text-primary" empty="No postings" /></Block>
                      <Block title="Top companies" icon={Building2}><RankList items={r.top_companies} badge="bg-violet-50 text-violet-600" empty="No data" /></Block>
                      <Block title="Top locations" icon={MapPin}><RankList items={r.top_locations.map((l) => ({ name: l.location, count: l.count }))} badge="bg-emerald-50 text-emerald-600" empty="No data" /></Block>
                    </div>
                  </ReportDocument>
                )
              }}
            </QueryGate>
          </div>
        )}

        {type === 'curriculum_alignment' && (
          <ReportDocument
            banner={
              <ReportBanner
                kind="Curriculum report"
                title="AUCA Curriculum Alignment"
                meta={curriculumMeta}
                exports={
                  <button type="button" onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-navy hover:bg-gray-100">
                    <Printer className="h-4 w-4" /> Print
                  </button>
                }
              />
            }
          >
            <CurriculumAlignmentReport />
          </ReportDocument>
        )}
      </ReportWorkspace>
    </DashboardLayout>
  )
}
