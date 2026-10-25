import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Building2, ChevronRight, GraduationCap, MapPin, Search, Sparkles } from 'lucide-react'
import DashboardLayout, { Card } from './DashboardLayout'
import { useSectorParam } from '../../components/ui/SectorSelector'
import { useSectorList } from '../../services/queries'
import { RoleForecastChart, type RoleChartPoint } from './charts'
import { EmptyState, QueryGate } from '../../components/ui/State'
import { useEmergingRoles, useForecasts, useRoleDetail, useSectorRoleDetail, useSectorTaxonomy, useTaxonomy } from '../../services/queries'
import { taxonomyApi } from '../../services/api'
import { fmtNum, fmtPct, HORIZON_LABEL } from '../../lib/format'
import type { RoleBrief } from '../../types/api'
import { DEPT_CURRICULA_BY_LABEL as DEPT_CURRICULA, isSkillTaught } from '../../data/auca-skills'

/* ══════════════════════════════════════════════════
   AUCA curriculum data for alignment indicators
   ══════════════════════════════════════════════════ */

const AUCA_SECTORS = new Set(['ict-technology', 'finance-business'])

type Dept = 'Software Engineering' | 'Network & Info Management' | 'Finance' | 'Business Administration'

const ICT_ROLE_SKILLS: Record<string, { dept: Dept; skills: string[] }> = {
  'Software Developer': { dept: 'Software Engineering', skills: ['Java', 'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Git', 'REST APIs', 'SQL', 'Agile/Scrum', 'Docker', 'CI/CD', 'Testing (Jest)', 'Design Patterns'] },
  'Full-Stack Developer': { dept: 'Software Engineering', skills: ['JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'SQL', 'MongoDB', 'Git', 'REST APIs', 'Docker', 'CI/CD', 'Responsive Design', 'Agile/Scrum'] },
  'Frontend Developer': { dept: 'Software Engineering', skills: ['JavaScript', 'TypeScript', 'React', 'HTML/CSS', 'Tailwind/Bootstrap', 'Responsive Design', 'Figma', 'Git', 'Testing (Jest)', 'Accessibility'] },
  'Backend Developer': { dept: 'Software Engineering', skills: ['Python', 'Java', 'Node.js', 'SQL', 'REST APIs', 'Docker', 'Microservices', 'Redis/Caching', 'Git', 'CI/CD', 'Cloud (AWS/Azure)'] },
  'Mobile Developer': { dept: 'Software Engineering', skills: ['React Native', 'Flutter', 'Swift/Kotlin', 'Mobile UI/UX', 'Firebase', 'Git', 'REST APIs', 'App Store Deployment'] },
  'Data Analyst': { dept: 'Software Engineering', skills: ['Python', 'SQL', 'Power BI/Tableau', 'Excel (Advanced/VBA)', 'Statistics', 'Data Visualization', 'R', 'ETL'] },
  'Data Scientist': { dept: 'Software Engineering', skills: ['Python', 'Machine Learning', 'TensorFlow/PyTorch', 'SQL', 'Statistics', 'Deep Learning', 'NLP', 'Data Visualization'] },
  'DevOps Engineer': { dept: 'Software Engineering', skills: ['Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Linux', 'Cloud (AWS/Azure)', 'Monitoring', 'Scripting (Bash/PowerShell)', 'Git'] },
  'Cloud Engineer': { dept: 'Network & Info Management', skills: ['AWS/Azure/GCP', 'Docker', 'Kubernetes', 'Terraform', 'Networking', 'Linux', 'CI/CD', 'Cost Optimization', 'Security'] },
  'Network Engineer': { dept: 'Network & Info Management', skills: ['TCP/IP', 'Networking', 'LAN/WAN', 'Cisco/Juniper', 'Firewall Management', 'VPN', 'Cloud Networking', 'Linux', 'Monitoring'] },
  'System Administrator': { dept: 'Network & Info Management', skills: ['Linux', 'Windows Server', 'Active Directory', 'Networking', 'Scripting (Bash/PowerShell)', 'Monitoring', 'Backup/Recovery', 'Virtualization'] },
  'Cybersecurity Analyst': { dept: 'Network & Info Management', skills: ['SIEM', 'Firewall Management', 'Incident Response', 'Penetration Testing', 'Network Security', 'Compliance (ISO 27001)', 'Cryptography', 'Linux'] },
  'IT Support Specialist': { dept: 'Network & Info Management', skills: ['Help Desk', 'IT Support', 'Hardware Troubleshooting', 'Windows Server', 'Networking', 'Active Directory', 'Ticketing Systems'] },
  'Database Administrator': { dept: 'Software Engineering', skills: ['SQL', 'PostgreSQL/MySQL', 'Performance Tuning', 'Backup/Recovery', 'Cloud Databases', 'MongoDB', 'Data Warehousing', 'Linux'] },
  'QA / Test Engineer': { dept: 'Software Engineering', skills: ['Software Testing', 'Selenium/Cypress', 'Testing (Jest)', 'CI/CD', 'API Testing', 'Git', 'Agile/Scrum', 'Performance Testing'] },
  'UI/UX Designer': { dept: 'Software Engineering', skills: ['Figma', 'Adobe XD', 'User Research', 'Wireframing', 'Prototyping', 'Design Systems', 'HTML/CSS', 'Accessibility'] },
  'Project Manager (IT)': { dept: 'Software Engineering', skills: ['Agile/Scrum', 'Jira', 'MS Project', 'Risk Management', 'Stakeholder Communication', 'Budgeting', 'Team Leadership', 'Project Management'] },
  'Business Analyst (IT)': { dept: 'Software Engineering', skills: ['Requirements Gathering', 'SQL', 'Power BI/Tableau', 'Agile/Scrum', 'Jira', 'Stakeholder Communication', 'Process Mapping', 'Data Visualization'] },
  'AI/ML Engineer': { dept: 'Software Engineering', skills: ['Python', 'TensorFlow/PyTorch', 'Machine Learning', 'Deep Learning', 'MLOps', 'Docker', 'Cloud (AWS/Azure)', 'Data Engineering'] },
  'Product Manager': { dept: 'Software Engineering', skills: ['Agile/Scrum', 'Jira', 'User Research', 'Stakeholder Communication', 'Market Research', 'Data Visualization', 'Roadmapping', 'A/B Testing'] },
  'Solutions Architect': { dept: 'Software Engineering', skills: ['Cloud (AWS/Azure)', 'Microservices', 'Docker', 'Kubernetes', 'REST APIs', 'Design Patterns', 'Networking', 'Security'] },
}

const BIZ_ROLE_SKILLS: Record<string, { dept: Dept; skills: string[] }> = {
  'Accountant': { dept: 'Finance', skills: ['Financial Accounting', 'IFRS', 'Tax', 'Auditing', 'QuickBooks/Sage', 'Excel (Advanced/VBA)', 'Budgeting', 'Financial Analysis'] },
  'Financial Analyst': { dept: 'Finance', skills: ['Financial Modeling', 'Excel (Advanced/VBA)', 'Power BI/Tableau', 'Corporate Finance', 'Budgeting', 'Financial Analysis', 'Investment', 'Bloomberg Terminal'] },
  'Auditor': { dept: 'Finance', skills: ['Auditing', 'IFRS', 'CAAT Tools', 'Risk Management', 'Compliance', 'Financial Accounting', 'Tax', 'Fraud Detection'] },
  'Tax Consultant': { dept: 'Finance', skills: ['Tax', 'IFRS', 'Financial Accounting', 'Compliance', 'Business Law', 'Excel (Advanced/VBA)', 'Auditing'] },
  'Investment Analyst': { dept: 'Finance', skills: ['Investment', 'Financial Modeling', 'Bloomberg Terminal', 'Corporate Finance', 'Financial Analysis', 'Excel (Advanced/VBA)', 'Risk Management'] },
  'Banking Officer': { dept: 'Finance', skills: ['Banking', 'Financial Accounting', 'Compliance', 'Risk Management', 'Economics', 'Corporate Finance', 'Communication'] },
  'Budget Analyst': { dept: 'Finance', skills: ['Budgeting', 'Financial Analysis', 'Excel (Advanced/VBA)', 'Power BI/Tableau', 'Financial Accounting', 'Economics', 'Financial Modeling'] },
  'ERP Specialist': { dept: 'Finance', skills: ['ERP Systems', 'Financial Accounting', 'SQL', 'Process Mapping', 'Budgeting', 'Project Management', 'Excel (Advanced/VBA)'] },
  'Credit Analyst': { dept: 'Finance', skills: ['Financial Analysis', 'Risk Management', 'Banking', 'Financial Modeling', 'Economics', 'Compliance', 'Excel (Advanced/VBA)'] },
  'HR Manager': { dept: 'Business Administration', skills: ['HR Management', 'Organizational Behavior', 'Leadership', 'Negotiation', 'Strategic Management', 'Business Communication', 'Project Management'] },
  'Marketing Manager': { dept: 'Business Administration', skills: ['Marketing Principles', 'Market Research', 'Digital Marketing', 'SEO/SEM', 'Google Analytics', 'Content Creation', 'Social Media Marketing', 'A/B Testing'] },
  'Operations Manager': { dept: 'Business Administration', skills: ['Operations', 'Strategic Management', 'Project Management', 'Leadership', 'Budgeting', 'Negotiation', 'Team Leadership'] },
  'Business Development Manager': { dept: 'Business Administration', skills: ['Strategic Management', 'Negotiation', 'Market Research', 'Business Communication', 'Leadership', 'Stakeholder Communication', 'CRM (Salesforce)'] },
  'Supply Chain Manager': { dept: 'Business Administration', skills: ['Operations', 'Strategic Management', 'Negotiation', 'Project Management', 'Budgeting', 'ERP Systems', 'Leadership'] },
  'Project Manager (Business)': { dept: 'Business Administration', skills: ['Project Management', 'Agile/Scrum', 'Jira', 'Stakeholder Communication', 'Budgeting', 'Risk Management', 'Team Leadership', 'MS Project'] },
  'Sales Manager': { dept: 'Business Administration', skills: ['Negotiation', 'CRM (Salesforce)', 'Marketing Principles', 'Market Research', 'Business Communication', 'Leadership', 'Strategic Management'] },
  'Entrepreneur / Startup Founder': { dept: 'Business Administration', skills: ['Entrepreneurship', 'Business Development', 'Market Research', 'Financial Acumen', 'Leadership', 'Design Thinking', 'Negotiation'] },
  'Management Consultant': { dept: 'Business Administration', skills: ['Strategic Management', 'Market Research', 'Financial Analysis', 'Leadership', 'Stakeholder Communication', 'Project Management', 'Design Thinking'] },
  'Digital Marketing Specialist': { dept: 'Business Administration', skills: ['Digital Marketing', 'SEO/SEM', 'Google Analytics', 'Social Media Marketing', 'Content Creation', 'Email Marketing', 'Marketing Automation', 'A/B Testing'] },
}

function findClosestRole(roleName: string, isIct: boolean): { dept: Dept; skills: string[] } | null {
  const pool = isIct ? ICT_ROLE_SKILLS : BIZ_ROLE_SKILLS
  const lower = roleName.toLowerCase()
  if (pool[roleName]) return pool[roleName]
  for (const [key, val] of Object.entries(pool)) {
    if (key.toLowerCase() === lower) return val
  }
  for (const [key, val] of Object.entries(pool)) {
    const kl = key.toLowerCase()
    if (lower.includes(kl) || kl.includes(lower)) return val
  }
  for (const [key, val] of Object.entries(pool)) {
    const words = key.toLowerCase().split(/[\s/()]+/).filter(w => w.length > 3)
    if (words.some(w => lower.includes(w))) return val
  }
  return null
}

function AucaAlignmentCard({ roleName, isIct }: { roleName: string; isIct: boolean }) {
  const match = findClosestRole(roleName, isIct)
  if (!match) return (
    <div className="mt-6 rounded-xl border border-gray-200 bg-gray-50/60 p-5">
      <div className="flex items-center gap-2">
        <GraduationCap className="h-5 w-5 text-gray-400" />
        <h3 className="text-sm font-bold text-gray-500">AUCA Curriculum Alignment</h3>
      </div>
      <p className="mt-2 text-sm text-gray-400">No matching role profile found in AUCA's tracked departments for this position.</p>
    </div>
  )

  const curriculum = DEPT_CURRICULA[match.dept]
  const covered = match.skills.filter(s => isSkillTaught(s, curriculum))
  const missing = match.skills.filter(s => !isSkillTaught(s, curriculum))
  const pct = match.skills.length > 0 ? Math.round((covered.length / match.skills.length) * 100) : 0

  return (
    <div className="mt-6 rounded-xl border border-indigo-200 bg-indigo-50/40 p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-indigo-600" />
          <h3 className="text-sm font-bold text-navy">AUCA Curriculum Alignment</h3>
        </div>
        <span className="rounded-full bg-white px-3 py-1 text-sm font-extrabold text-navy shadow-sm">{pct}%</span>
      </div>
      <p className="mt-1 text-xs text-gray-500">
        AUCA {match.dept} department covers {covered.length} of {match.skills.length} employer-demanded skills for this role
      </p>

      <div className="mt-3 h-2.5 w-full rounded-full bg-white">
        <div
          className={`h-2.5 rounded-full transition-all ${pct >= 70 ? 'bg-emerald-500' : pct >= 40 ? 'bg-amber-500' : 'bg-red-400'}`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {covered.length > 0 && (
        <div className="mt-4">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Covered by AUCA</span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {covered.map(s => (
              <span key={s} className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">{s}</span>
            ))}
          </div>
        </div>
      )}

      {missing.length > 0 && (
        <div className="mt-3">
          <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">Gaps — not in curriculum</span>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {missing.map(s => (
              <span key={s} className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-600">{s}</span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

function IctTaxonomyView() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const [selected, setSelected] = useState<number | null>(null)

  const groups = useTaxonomy()
  const emerging = useEmergingRoles()
  const forecasts = useForecasts()
  const search = useQuery({
    queryKey: ['role-search', q],
    queryFn: () => taxonomyApi.roles(q),
    enabled: q.trim().length > 0,
  })
  const detail = useRoleDetail(selected)

  const chart: RoleChartPoint[] = useMemo(
    () =>
      (detail.data?.historical_demand ?? [])
        .filter((p) => p.year >= 2010)
        .map((p) => ({
          label: String(p.year),
          ...(p.synthetic_flag ? { estimated: p.role_demand_index } : { verified: p.role_demand_index }),
        })),
    [detail.data],
  )
  const roleForecasts = (forecasts.data?.forecasts ?? []).filter((f) => f.role_id === selected)
  const totalRoles = groups.data?.reduce((n, g) => n + g.families.reduce((m, f) => m + f.roles.length, 0), 0) ?? 0

  const RoleButton = ({ r }: { r: RoleBrief }) => (
    <button
      onClick={() => setSelected(r.id)}
      aria-pressed={selected === r.id}
      className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${selected === r.id ? 'bg-primary-light font-bold text-navy' : 'text-gray-700 hover:bg-gray-50'}`}
    >
      <span>{r.name}</span>
      <span className="flex items-center gap-2 text-xs text-gray-400">since {r.emergence_year}<ChevronRight className="h-3.5 w-3.5" /></span>
    </button>
  )

  return (
    <>
      <p className="mt-2 text-sm text-gray-500">
        The controlled vocabulary of ICT roles used across SkillSense: role group → role family → role
        {totalRoles ? ` (${totalRoles} roles)` : ''}.
      </p>

      <form onSubmit={(e) => e.preventDefault()} className="relative mt-6 max-w-md" role="search">
        <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          value={q}
          onChange={(e) => setParams(e.target.value ? { q: e.target.value } : {}, { replace: true })}
          placeholder="Search ICT roles…"
          aria-label="Search roles"
          className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
        />
      </form>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
        <Card className="max-h-[720px] overflow-y-auto p-4 lg:col-span-2" data-testid="taxonomy-tree">
          {q.trim() ? (
            <QueryGate query={search} className="py-8">
              {(roles) =>
                roles.length === 0 ? (
                  <EmptyState title={`No roles match "${q}"`} />
                ) : (
                  <div data-testid="search-results">
                    <p className="px-3 pb-2 text-xs font-bold uppercase tracking-wider text-gray-400">{roles.length} result{roles.length === 1 ? '' : 's'}</p>
                    {roles.map((r) => <RoleButton key={r.id} r={r} />)}
                  </div>
                )
              }
            </QueryGate>
          ) : (
            <QueryGate query={groups} className="py-8">
              {(gs) => (
                <div className="space-y-5">
                  {gs.map((g) => (
                    <section key={g.id}>
                      <h2 className="px-3 text-xs font-extrabold uppercase tracking-wider text-navy">{g.name}</h2>
                      {g.families.map((f) => (
                        <div key={f.id} className="mt-1">
                          <div className="px-3 pt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-400">{f.name}</div>
                          {f.roles.map((r) => <RoleButton key={r.id} r={r} />)}
                        </div>
                      ))}
                    </section>
                  ))}
                </div>
              )}
            </QueryGate>
          )}
        </Card>

        <Card className="p-6 lg:col-span-3" data-testid="role-detail">
          {selected === null ? (
            <EmptyState title="Select a role" hint="Choose a role on the left to see its history and forecast." className="my-16" />
          ) : (
            <QueryGate query={detail}>
              {(d) => (
                <>
                  <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{d.group_name} · {d.family_name}</div>
                  <h2 data-testid="detail-name" className="mt-1 text-2xl font-extrabold tracking-tight text-navy">{d.name}</h2>
                  <p className="mt-2 text-sm text-gray-500">First appeared in Rwanda's ICT market around <strong>{d.emergence_year}</strong>.{d.description ? ` ${d.description}` : ''}</p>

                  <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-gray-400">Demand index history</h3>
                  {chart.length > 0 ? (
                    <div className="mt-2" data-testid="detail-chart"><RoleForecastChart data={chart} height={260} /></div>
                  ) : (
                    <EmptyState title="No history for this role" hint="This role only existed before 2010, which the model doesn't use." className="mt-3" />
                  )}

                  <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-gray-400">Latest forecast</h3>
                  {roleForecasts.length === 0 ? (
                    <p className="mt-3 text-sm text-gray-500">This role has no forecast (it isn't part of the trained model).</p>
                  ) : (
                    <table className="mt-3 w-full text-left" data-testid="detail-forecast">
                      <thead><tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-400"><th className="pb-3 font-bold">Horizon</th><th className="pb-3 font-bold">Demand index</th><th className="pb-3 font-bold">ICT share</th></tr></thead>
                      <tbody className="divide-y divide-gray-100">
                        {roleForecasts.map((f) => (
                          <tr key={f.id} className="text-sm"><td className="py-3 font-bold text-gray-900">{HORIZON_LABEL[f.horizon]}</td><td className="py-3 font-bold text-navy">{fmtNum(f.demand_index)}</td><td className="py-3 text-gray-700">{fmtPct(f.share_pct, 2)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  )}

                  <AucaAlignmentCard roleName={d.name} isIct={true} />
                </>
              )}
            </QueryGate>
          )}
        </Card>
      </div>

      <Card className="mt-6 p-6">
        <h2 className="flex items-center gap-2 text-lg font-extrabold tracking-tight text-navy"><Sparkles className="h-5 w-5 text-primary" /> Emerging Roles</h2>
        <QueryGate query={emerging} className="mt-4">
          {(e) =>
            e.length === 0 ? (
              <EmptyState title="No emerging roles tracked yet" hint="AI/ML, MLOps and other roles with strong global demand but little local hiring will appear here once the emerging-skills layer is built." className="mt-4" />
            ) : (
              <ul className="mt-4 flex flex-wrap gap-2" data-testid="emerging-list">{e.map((r) => <li key={r.id} className="rounded-full bg-primary-light px-4 py-1.5 text-sm font-semibold text-navy">{r.name}</li>)}</ul>
            )
          }
        </QueryGate>
      </Card>
    </>
  )
}

function SectorTaxonomyView({ sectorSlug }: { sectorSlug: string }) {
  const taxonomy = useSectorTaxonomy(sectorSlug)
  const [search, setSearch] = useState('')
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null)
  const roleDetail = useSectorRoleDetail(sectorSlug, selectedTitle)

  useEffect(() => {
    setSelectedTitle(null)
    setSearch('')
  }, [sectorSlug])

  return (
    <QueryGate query={taxonomy} className="mt-6">
      {(data) => {
        const filtered = search.trim()
          ? data.groups
              .map((g) => ({
                ...g,
                roles: g.roles.filter((r) =>
                  r.title.toLowerCase().includes(search.toLowerCase()),
                ),
              }))
              .filter((g) => g.roles.length > 0)
          : data.groups

        const totalFiltered = filtered.reduce((s, g) => s + g.roles.length, 0)

        return (
          <>
            <p className="mt-2 text-sm text-gray-500">
              {data.sector_name} positions identified from {data.total} job postings, grouped alphabetically.
            </p>

            <form onSubmit={(e) => e.preventDefault()} className="relative mt-6 max-w-md" role="search">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={`Search ${data.sector_name} positions…`}
                aria-label="Search positions"
                className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </form>

            <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-5">
              <Card className="max-h-[720px] overflow-y-auto p-4 lg:col-span-2" data-testid="sector-taxonomy-tree">
                {totalFiltered === 0 ? (
                  <EmptyState title={search ? `No positions match "${search}"` : 'No positions found'} />
                ) : (
                  <div className="space-y-4">
                    {filtered.map((g) => (
                      <section key={g.letter}>
                        <h2 className="px-3 text-xs font-extrabold uppercase tracking-wider text-navy">{g.letter}</h2>
                        {g.roles.map((r) => (
                          <button
                            key={r.title}
                            onClick={() => setSelectedTitle(r.title)}
                            aria-pressed={selectedTitle === r.title}
                            className={`flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition-colors ${selectedTitle === r.title ? 'bg-primary-light font-bold text-navy' : 'text-gray-700 hover:bg-gray-50'}`}
                          >
                            <span className="truncate">{r.title}</span>
                            <span className="flex shrink-0 items-center gap-2 text-xs text-gray-400">
                              {r.count > 1 && <span className="rounded-full bg-gray-100 px-1.5 py-0.5 font-bold text-gray-600">{r.count}x</span>}
                              <ChevronRight className="h-3.5 w-3.5" />
                            </span>
                          </button>
                        ))}
                      </section>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-6 lg:col-span-3" data-testid="sector-role-detail">
                {selectedTitle === null ? (
                  <EmptyState title="Select a position" hint="Choose a position on the left to see its detail." className="my-16" />
                ) : (
                  <QueryGate query={roleDetail}>
                    {(d) => {
                      const maxLoc = Math.max(1, ...d.locations.map((l) => l.count))
                      return (
                        <>
                          <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{d.sector_name}</div>
                          <h2 className="mt-1 text-2xl font-extrabold tracking-tight text-navy">{d.title}</h2>

                          <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-3">
                            <div className="rounded-xl bg-gray-50 p-4">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Postings</div>
                              <div className="mt-2 text-3xl font-extrabold text-navy">{d.posting_count}</div>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-4">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Sector share</div>
                              <div className="mt-2 text-3xl font-extrabold text-navy">{d.sector_share_pct}%</div>
                              <div className="mt-1 text-xs text-gray-500">of {d.total_sector_postings} postings</div>
                            </div>
                            <div className="rounded-xl bg-gray-50 p-4">
                              <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Companies hiring</div>
                              <div className="mt-2 text-3xl font-extrabold text-navy">{d.companies.length}</div>
                            </div>
                          </div>

                          {d.companies.length > 0 && (
                            <>
                              <h3 className="mt-6 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-400">
                                <Building2 className="h-4 w-4" /> Employers
                              </h3>
                              <ul className="mt-3 space-y-2">
                                {d.companies.map((c) => (
                                  <li key={c.name} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-2.5 text-sm">
                                    <span className="font-medium text-gray-800">{c.name}</span>
                                    <span className="font-bold text-navy">{c.count} posting{c.count !== 1 ? 's' : ''}</span>
                                  </li>
                                ))}
                              </ul>
                            </>
                          )}

                          {d.locations.length > 0 && (
                            <>
                              <h3 className="mt-6 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-400">
                                <MapPin className="h-4 w-4" /> Locations
                              </h3>
                              <div className="mt-3 space-y-3">
                                {d.locations.map((l) => (
                                  <div key={l.location}>
                                    <div className="flex items-center justify-between text-sm">
                                      <span className="font-medium text-gray-800">{l.location}</span>
                                      <span className="font-bold text-navy">{l.count}</span>
                                    </div>
                                    <div className="mt-1 h-2 rounded-full bg-gray-100">
                                      <div className="h-2 rounded-full bg-primary" style={{ width: `${(l.count / maxLoc) * 100}%` }} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </>
                          )}

                          {d.by_year.length > 0 && (
                            <>
                              <h3 className="mt-6 text-sm font-bold uppercase tracking-wider text-gray-400">Posting timeline</h3>
                              <table className="mt-3 w-full text-left">
                                <thead>
                                  <tr className="border-b border-gray-200 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                                    <th className="pb-3 font-bold">Year</th>
                                    <th className="pb-3 font-bold">Postings</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                  {d.by_year.map((y) => (
                                    <tr key={y.year} className="text-sm">
                                      <td className="py-3 font-bold text-gray-900">{y.year}</td>
                                      <td className="py-3 font-bold text-navy">{y.count}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </>
                          )}

                          <AucaAlignmentCard roleName={d.title} isIct={sectorSlug === 'ict-technology'} />
                        </>
                      )
                    }}
                  </QueryGate>
                )}
              </Card>
            </div>
          </>
        )
      }}
    </QueryGate>
  )
}

export default function EducationTaxonomy() {
  const [sectorSlug, setSectorSlug] = useSectorParam()
  const { data: allSectors = [] } = useSectorList()
  const sectors = allSectors.filter(s => AUCA_SECTORS.has(s.slug))
  const active = sectorSlug ?? 'ict-technology'
  const isIct = active === 'ict-technology'

  return (
    <DashboardLayout>
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-navy">Role Taxonomy</h1>
        <p className="mt-2 text-sm text-gray-500">Explore roles across AUCA's tracked faculties — IT and Business — with curriculum alignment insights.</p>
      </div>

      <div className="mt-6 flex flex-wrap items-center gap-2" role="tablist" data-testid="taxonomy-sector-selector">
        <span className="mr-1 text-[11px] font-bold uppercase tracking-wider text-gray-400">Faculty</span>
        {sectors.map((s) => (
          <button
            key={s.slug}
            role="tab"
            aria-selected={active === s.slug}
            onClick={() => setSectorSlug(s.slug === 'ict-technology' ? null : s.slug)}
            className={`flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors ${
              active === s.slug
                ? 'text-white shadow-sm'
                : 'border border-gray-200 bg-white text-gray-600 hover:border-gray-300'
            }`}
            style={active === s.slug ? { backgroundColor: s.color } : undefined}
          >
            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: s.color }} />
            {s.name}
          </button>
        ))}
      </div>

      {isIct ? <IctTaxonomyView /> : <SectorTaxonomyView sectorSlug={active} />}
    </DashboardLayout>
  )
}
