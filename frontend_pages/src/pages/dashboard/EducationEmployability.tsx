import { useMemo, useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { BookOpen, Briefcase, Calculator, Check, GraduationCap, Lightbulb, Loader2, ShieldCheck, Sparkles, TrendingUp } from 'lucide-react'
import DashboardLayout, { Card } from './DashboardLayout'
import { ProfileRadar } from './charts'
import { QueryGate } from '../../components/ui/State'
import { useEmployabilityOverview, useForecasts, useSectorPositions } from '../../services/queries'
import { analyticsApi } from '../../services/api'
import { ApiError } from '../../services/http'
import { fmtInt } from '../../lib/format'

type Faculty = 'it' | 'business'

/* ══════════════════════════════════════════════════
   Skills data: what employers require for each role
   ══════════════════════════════════════════════════ */

const ICT_ROLE_SKILLS: Record<string, string[]> = {
  'software': ['Java', 'Python', 'JavaScript', 'React', 'Node.js', 'Git', 'REST APIs', 'Docker', 'CI/CD', 'Agile/Scrum', 'TypeScript', 'SQL'],
  'web': ['HTML/CSS', 'JavaScript', 'React', 'Node.js', 'TypeScript', 'REST APIs', 'Responsive Design', 'Git', 'UI/UX', 'Tailwind/Bootstrap'],
  'mobile': ['React Native', 'Flutter', 'Swift/Kotlin', 'Mobile UI/UX', 'REST APIs', 'Git', 'App Store Deployment', 'Firebase'],
  'full stack': ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'REST APIs', 'Docker', 'Git', 'Cloud (AWS/Azure)', 'TypeScript'],
  'frontend': ['JavaScript', 'TypeScript', 'React', 'HTML/CSS', 'Tailwind/Bootstrap', 'Git', 'Responsive Design', 'UI/UX', 'Testing (Jest)'],
  'backend': ['Python', 'Java', 'Node.js', 'SQL', 'REST APIs', 'Docker', 'Cloud (AWS/Azure)', 'Git', 'Redis/Caching', 'Microservices'],
  'data analyst': ['Python', 'SQL', 'Excel', 'Power BI/Tableau', 'Statistics', 'Data Visualization', 'R', 'ETL Processes'],
  'data scientist': ['Python', 'Machine Learning', 'Statistics', 'SQL', 'TensorFlow/PyTorch', 'Data Visualization', 'Big Data', 'R'],
  'data engineer': ['Python', 'SQL', 'Apache Spark', 'ETL Pipelines', 'Cloud (AWS/Azure)', 'Docker', 'Airflow', 'Data Warehousing'],
  'database': ['SQL', 'PL/SQL', 'Database Design', 'PostgreSQL/MySQL', 'MongoDB', 'Performance Tuning', 'Backup/Recovery', 'Cloud Databases'],
  'network': ['TCP/IP', 'Cisco/Juniper', 'Linux', 'Firewalls', 'Cloud Networking', 'VPN', 'Network Security', 'Wireless', 'CCNA/CCNP'],
  'system': ['Linux', 'Windows Server', 'Cloud (AWS/Azure)', 'Docker/Kubernetes', 'Scripting (Bash/PowerShell)', 'Monitoring', 'Networking', 'Security'],
  'devops': ['Docker', 'Kubernetes', 'CI/CD', 'Cloud (AWS/Azure)', 'Terraform', 'Linux', 'Git', 'Monitoring', 'Scripting'],
  'security': ['Network Security', 'Penetration Testing', 'SIEM', 'Firewall Management', 'Incident Response', 'Compliance (ISO 27001)', 'Linux', 'Cryptography'],
  'qa': ['Test Automation', 'Selenium', 'Jest/Cypress', 'Manual Testing', 'API Testing', 'CI/CD', 'Agile/Scrum', 'Performance Testing'],
  'project': ['Agile/Scrum', 'Jira', 'Risk Management', 'Stakeholder Communication', 'Budgeting', 'Team Leadership', 'MS Project', 'Documentation'],
  'business analyst': ['Requirements Gathering', 'SQL', 'Excel', 'Data Analysis', 'Process Modeling', 'Stakeholder Management', 'Agile/Scrum', 'Documentation'],
  'it officer': ['IT Support', 'Networking', 'Windows/Linux', 'Active Directory', 'Help Desk', 'Hardware Troubleshooting', 'Cloud Basics', 'Security Basics'],
  'ml': ['Python', 'TensorFlow/PyTorch', 'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'MLOps', 'Statistics'],
  'cloud': ['AWS/Azure/GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux', 'Networking', 'Security', 'Cost Optimization'],
  'ui': ['Figma', 'Adobe XD', 'User Research', 'Wireframing', 'Prototyping', 'Design Systems', 'Accessibility', 'HTML/CSS'],
}

/* ── AUCA IT Faculty department curricula ── */

const AUCA_SE_SKILLS = new Set([
  'Java', 'Python', '.NET', 'C#', 'PL/SQL', 'SQL',
  'HTML/CSS', 'JavaScript', 'React',
  'Data Structures', 'Algorithms', 'Operating Systems',
  'DBMS', 'Database Design',
  'Software Engineering', 'Design Patterns', 'Software Testing', 'Project Management',
  'Statistics', 'Probability',
  'Computer Networks',
  'Mathematics', 'Discrete Mathematics',
  'Git', 'Agile/Scrum', 'Java/SpringBoot', 'REST APIs',
])

const AUCA_NET_SKILLS = new Set([
  'TCP/IP', 'Networking', 'LAN/WAN', 'Network Administration',
  'Windows Server', 'Linux',
  'SQL', 'DBMS', 'Database Design',
  'IT Support', 'Help Desk', 'Hardware Troubleshooting',
  'Operating Systems', 'System Administration',
  'HTML/CSS', 'Visual Basic',
  'Information Systems', 'Computer Networks',
  'Project Management', 'Statistics', 'Mathematics',
  'Network Security', 'Penetration Testing',
])

type IctDept = 'Software Engineering' | 'Network & Info Management'

const ICT_ROLE_DEPT: Record<string, IctDept> = {
  'software': 'Software Engineering',
  'web': 'Software Engineering',
  'mobile': 'Software Engineering',
  'full stack': 'Software Engineering',
  'frontend': 'Software Engineering',
  'backend': 'Software Engineering',
  'data analyst': 'Software Engineering',
  'data scientist': 'Software Engineering',
  'data engineer': 'Software Engineering',
  'database': 'Software Engineering',
  'qa': 'Software Engineering',
  'ml': 'Software Engineering',
  'ui': 'Software Engineering',
  'business analyst': 'Software Engineering',
  'network': 'Network & Info Management',
  'system': 'Network & Info Management',
  'devops': 'Network & Info Management',
  'security': 'Network & Info Management',
  'cloud': 'Network & Info Management',
  'it officer': 'Network & Info Management',
  'project': 'Software Engineering',
}

function getIctDeptForRole(roleName: string): { dept: IctDept; skills: Set<string> } {
  const lower = roleName.toLowerCase()
  for (const [key, dept] of Object.entries(ICT_ROLE_DEPT)) {
    if (lower.includes(key)) {
      return { dept, skills: dept === 'Software Engineering' ? AUCA_SE_SKILLS : AUCA_NET_SKILLS }
    }
  }
  return { dept: 'Software Engineering', skills: AUCA_SE_SKILLS }
}

function getIctSkillsForRole(roleName: string): string[] {
  const lower = roleName.toLowerCase()
  for (const [key, skills] of Object.entries(ICT_ROLE_SKILLS)) {
    if (lower.includes(key)) return skills
  }
  return ['Problem Solving', 'Communication', 'Technical Documentation', 'Teamwork', 'English Proficiency']
}

function isSkillTaught(skill: string, taughtSet: Set<string>): boolean {
  const lower = skill.toLowerCase()
  for (const t of taughtSet) {
    const tl = t.toLowerCase()
    if (tl === lower) return true
    if (tl.length <= 2 || lower.length <= 2) continue
    const wb = (hay: string, needle: string) =>
      new RegExp(`\\b${needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i').test(hay)
    if (wb(lower, tl) || wb(tl, lower)) return true
  }
  return false
}

/* ── Business role skills (employer requirements) ── */
const BIZ_ROLE_SKILLS: Record<string, string[]> = {
  'Accountant': ['IFRS', 'Financial Reporting', 'Tax Compliance', 'Excel (Advanced)', 'QuickBooks/Sage', 'Auditing Basics', 'ERP Systems', 'Regulatory Compliance'],
  'Auditor': ['Audit Standards (ISA)', 'Risk Assessment', 'Internal Controls', 'CAAT Tools', 'Excel', 'Financial Reporting', 'Compliance', 'Data Analytics'],
  'Internal Auditor': ['Internal Audit Standards (IIA)', 'Risk Assessment', 'Fraud Detection', 'CAAT Tools', 'Compliance Frameworks', 'Data Analytics', 'Report Writing', 'ERP Systems'],
  'Financial Controller': ['IFRS', 'Financial Planning', 'Budgeting', 'ERP Systems (SAP/Oracle)', 'Team Management', 'Treasury', 'Tax', 'Advanced Excel'],
  'Bookkeeper': ['Double-Entry Bookkeeping', 'QuickBooks/Sage', 'Bank Reconciliation', 'Payroll', 'Tax Filing', 'Excel', 'Accounts Payable/Receivable', 'Financial Records'],
  'Finance Manager': ['Financial Analysis', 'Budgeting & Forecasting', 'Risk Management', 'ERP Systems', 'Team Leadership', 'Strategic Planning', 'Cash Flow Management', 'Stakeholder Reporting'],
  'Finance Officer': ['Financial Reporting', 'Budget Monitoring', 'Grant Management', 'Excel', 'ERP Systems', 'Compliance', 'Payment Processing', 'Documentation'],
  'Financial Analyst': ['Financial Modeling', 'Excel (Advanced/VBA)', 'Power BI/Tableau', 'Valuation Techniques', 'Data Analysis', 'SQL', 'Presentation Skills', 'Industry Research'],
  'Investment Manager': ['Portfolio Management', 'Financial Modeling', 'Risk Analysis', 'Capital Markets', 'Due Diligence', 'Valuation', 'Regulatory Compliance', 'Bloomberg Terminal'],
  'Credit Controller': ['Credit Risk Assessment', 'Debt Collection', 'Negotiation', 'Financial Analysis', 'ERP Systems', 'Excel', 'Customer Relations', 'Regulatory Compliance'],
  'CEO': ['Strategic Leadership', 'Corporate Governance', 'Financial Literacy', 'Stakeholder Management', 'Business Development', 'Change Management', 'Public Speaking', 'Board Relations'],
  'Managing Director': ['Strategic Planning', 'P&L Management', 'Team Leadership', 'Business Development', 'Corporate Governance', 'Negotiation', 'Operations Management', 'Stakeholder Relations'],
  'Business Controller': ['Management Accounting', 'Budgeting', 'Variance Analysis', 'ERP Systems', 'Financial Modeling', 'KPI Development', 'Cost Analysis', 'Business Intelligence'],
  'Project Manager': ['Agile/Scrum', 'MS Project/Jira', 'Risk Management', 'Stakeholder Communication', 'Budgeting', 'Team Leadership', 'Documentation', 'Problem Solving'],
  'Marketing Manager': ['Digital Marketing', 'Market Research', 'Campaign Management', 'Google Analytics', 'Social Media Strategy', 'Brand Management', 'Content Strategy', 'Budget Management'],
  'Sales Manager': ['Sales Strategy', 'CRM (Salesforce)', 'Negotiation', 'Team Leadership', 'Revenue Forecasting', 'Client Relations', 'Market Analysis', 'Presentation Skills'],
  'Brand Manager': ['Brand Strategy', 'Market Research', 'Campaign Development', 'Budget Management', 'Consumer Insights', 'Design Thinking', 'Digital Marketing', 'Analytics'],
  'Digital Marketer': ['SEO/SEM', 'Google Ads', 'Social Media Marketing', 'Content Creation', 'Analytics (GA4)', 'Email Marketing', 'A/B Testing', 'Marketing Automation'],
  'Business Development': ['Market Analysis', 'Client Acquisition', 'Proposal Writing', 'Negotiation', 'CRM Tools', 'Strategic Partnerships', 'Networking', 'Financial Acumen'],
}

/* ── AUCA Business Faculty department curricula ── */

const AUCA_FIN_SKILLS = new Set([
  'Financial Accounting', 'Principles of Accounting', 'Auditing', 'Tax',
  'IFRS', 'Corporate Finance', 'Investment', 'Banking',
  'Financial Analysis', 'Budgeting',
  'Economics', 'Business Law', 'Business Ethics',
  'Statistics', 'Mathematics',
  'Communication', 'English', 'French',
  'Entrepreneurship', 'Project Management',
])

const AUCA_BA_SKILLS = new Set([
  'Principles of Management', 'Strategic Management', 'Operations',
  'HR Management', 'Organizational Behavior', 'Leadership',
  'Marketing Principles', 'Market Research',
  'Principles of Accounting', 'Economics',
  'Business Law', 'Business Ethics', 'Business Communication',
  'Statistics', 'Mathematics',
  'Entrepreneurship', 'Project Management',
  'Communication', 'English', 'French',
  'Negotiation',
])

type BizDept = 'Finance' | 'Business Administration'

const BIZ_ROLE_DEPT: Record<string, BizDept> = {
  'Accountant': 'Finance',
  'Auditor': 'Finance',
  'Internal Auditor': 'Finance',
  'Financial Controller': 'Finance',
  'Bookkeeper': 'Finance',
  'Finance Manager': 'Finance',
  'Finance Officer': 'Finance',
  'Financial Analyst': 'Finance',
  'Investment Manager': 'Finance',
  'Credit Controller': 'Finance',
  'CEO': 'Business Administration',
  'Managing Director': 'Business Administration',
  'Business Controller': 'Finance',
  'Project Manager': 'Business Administration',
  'Marketing Manager': 'Business Administration',
  'Sales Manager': 'Business Administration',
  'Brand Manager': 'Business Administration',
  'Digital Marketer': 'Business Administration',
  'Business Development': 'Business Administration',
}

function getBizDeptForRole(roleName: string): { dept: BizDept; skills: Set<string> } {
  const dept = BIZ_ROLE_DEPT[roleName] ?? 'Business Administration'
  return { dept, skills: dept === 'Finance' ? AUCA_FIN_SKILLS : AUCA_BA_SKILLS }
}

/* ── Shared components ── */
function SkillsAnalysisCard({ roleSkills, taughtSet, deptName }: {
  roleSkills: { role: string; skills: string[] }[]
  taughtSet: Set<string>
  deptName: string
}) {
  const allRequired = new Set(roleSkills.flatMap(r => r.skills))
  const taught = [...allRequired].filter(s => isSkillTaught(s, taughtSet))
  const missing = [...allRequired].filter(s => !isSkillTaught(s, taughtSet))

  const missingFreq = new Map<string, number>()
  for (const { skills } of roleSkills) {
    for (const s of skills) {
      if (!isSkillTaught(s, taughtSet)) missingFreq.set(s, (missingFreq.get(s) ?? 0) + 1)
    }
  }
  const prioritySkills = [...missingFreq.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8)

  return (
    <Card className="p-6">
      <div className="flex items-center gap-2">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
          <Sparkles className="h-5 w-5 text-amber-600" />
        </div>
        <div>
          <h2 className="text-xl font-extrabold tracking-tight text-navy">AI Curriculum Recommendations</h2>
          <p className="mt-0.5 text-sm text-gray-500">Skills employers require vs what AUCA <span className="font-semibold text-gray-700">{deptName}</span> department currently teaches</p>
        </div>
      </div>

      {/* Summary bar */}
      <div className="mt-5 flex items-center gap-4 rounded-xl bg-gray-50 px-5 py-4">
        <div className="text-center">
          <div className="text-2xl font-extrabold text-navy">{taught.length}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Covered</div>
        </div>
        <div className="h-8 w-px bg-gray-200" />
        <div className="text-center">
          <div className="text-2xl font-extrabold text-amber-600">{missing.length}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Missing</div>
        </div>
        <div className="h-8 w-px bg-gray-200" />
        <div className="text-center">
          <div className="text-2xl font-extrabold text-gray-900">{allRequired.size}</div>
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Total required</div>
        </div>
        <div className="flex-1">
          <div className="h-2 w-full rounded-full bg-gray-200">
            <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${allRequired.size > 0 ? (taught.length / allRequired.size) * 100 : 0}%` }} />
          </div>
          <div className="mt-1 text-[10px] font-bold text-gray-400">{allRequired.size > 0 ? Math.round((taught.length / allRequired.size) * 100) : 0}% skill coverage</div>
        </div>
      </div>

      {/* Priority skills to add */}
      {prioritySkills.length > 0 && (
        <div className="mt-6">
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-amber-700">
            <Lightbulb className="h-4 w-4" />
            Priority skills to add to curriculum
          </div>
          <div className="mt-3 space-y-2">
            {prioritySkills.map(([skill, count]) => (
              <div key={skill} className="flex items-center justify-between rounded-lg bg-amber-50 px-4 py-2.5">
                <span className="text-sm font-bold text-gray-900">{skill}</span>
                <span className="text-[11px] font-medium text-amber-700">Required by {count} of {roleSkills.length} selected role{roleSkills.length > 1 ? 's' : ''}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Per-role breakdown */}
      <div className="mt-6">
        <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-navy">
          <BookOpen className="h-4 w-4" />
          Skills required per selected role
        </div>
        <div className="mt-3 space-y-4">
          {roleSkills.map(({ role, skills }) => {
            const roleTaught = skills.filter(s => isSkillTaught(s, taughtSet))
            const roleMissing = skills.filter(s => !isSkillTaught(s, taughtSet))
            return (
              <div key={role} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-900">{role}</h4>
                  <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold ${roleMissing.length === 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
                    {roleTaught.length}/{skills.length} covered
                  </span>
                </div>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {skills.map(s => (
                    <span key={s} className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${isSkillTaught(s, taughtSet) ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                      {isSkillTaught(s, taughtSet) ? '✓' : '✗'} {s}
                    </span>
                  ))}
                </div>
                {roleMissing.length > 0 && (
                  <p className="mt-2 text-[11px] text-gray-500">
                    To produce <span className="font-bold">{role}</span> graduates, add: {roleMissing.join(', ')}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </Card>
  )
}

/* ── Business roles for the picker ── */
const BUSINESS_ROLES: { id: number; name: string; group: string }[] = [
  { id: 1, name: 'Accountant', group: 'Accounting & Auditing' },
  { id: 2, name: 'Auditor', group: 'Accounting & Auditing' },
  { id: 3, name: 'Internal Auditor', group: 'Accounting & Auditing' },
  { id: 4, name: 'Financial Controller', group: 'Accounting & Auditing' },
  { id: 5, name: 'Bookkeeper', group: 'Accounting & Auditing' },
  { id: 6, name: 'Finance Manager', group: 'Finance & Banking' },
  { id: 7, name: 'Finance Officer', group: 'Finance & Banking' },
  { id: 8, name: 'Financial Analyst', group: 'Finance & Banking' },
  { id: 9, name: 'Investment Manager', group: 'Finance & Banking' },
  { id: 10, name: 'Credit Controller', group: 'Finance & Banking' },
  { id: 11, name: 'CEO', group: 'Management & Strategy' },
  { id: 12, name: 'Managing Director', group: 'Management & Strategy' },
  { id: 13, name: 'Business Controller', group: 'Management & Strategy' },
  { id: 14, name: 'Project Manager', group: 'Management & Strategy' },
  { id: 15, name: 'Marketing Manager', group: 'Marketing & Sales' },
  { id: 16, name: 'Sales Manager', group: 'Marketing & Sales' },
  { id: 17, name: 'Brand Manager', group: 'Marketing & Sales' },
  { id: 18, name: 'Digital Marketer', group: 'Marketing & Sales' },
  { id: 19, name: 'Business Development', group: 'Marketing & Sales' },
]

function matchesRole(positionTitle: string, roleName: string): boolean {
  return positionTitle.toLowerCase().includes(roleName.toLowerCase().split(' ')[0])
}

/* ═══════════════ IT Faculty Tab ═══════════════ */
function ITEmployabilityTab() {
  const overview = useEmployabilityOverview()
  const forecasts = useForecasts('1y')
  const [selected, setSelected] = useState<number | null>(null)

  const score = useMutation({ mutationFn: (ids: number[]) => analyticsApi.score(ids) })

  const roles = useMemo(() => {
    const forecastIds = new Set(forecasts.data?.forecasts.map((f) => f.role_id))
    return (overview.data?.available_roles ?? []).filter((r) => forecastIds.has(r.id))
  }, [overview.data, forecasts.data])

  const selectedRoleName = useMemo(
    () => roles.find(r => r.id === selected)?.name ?? null,
    [roles, selected],
  )

  const roleDept = useMemo(
    () => selectedRoleName ? getIctDeptForRole(selectedRoleName) : null,
    [selectedRoleName],
  )

  const skillsAnalysis = useMemo(() => {
    if (!selectedRoleName) return []
    return [{ role: selectedRoleName, skills: getIctSkillsForRole(selectedRoleName) }]
  }, [selectedRoleName])

  const radarData = useMemo(() => {
    const top = [...(forecasts.data?.forecasts ?? [])].sort((a, b) => b.demand_index - a.demand_index).slice(0, 6)
    return top.map((f) => ({ role: f.role_name.split(' / ')[0], market: f.demand_index, profile: f.role_id === selected ? 100 : 0 }))
  }, [forecasts.data, selected])

  const pick = (id: number) => setSelected(prev => prev === id ? null : id)

  const result = score.data

  return (
    <>
      <Card className="mt-8 p-6">
        <h2 className="text-lg font-extrabold tracking-tight text-navy">1. Select programme skills</h2>
        <QueryGate query={overview} className="mt-4">
          {() => (
            <>
              <div className="mt-4 flex flex-wrap gap-2.5" data-testid="role-picker">
                {roles.map((r) => {
                  const on = r.id === selected
                  return (
                    <button
                      key={r.id}
                      onClick={() => pick(r.id)}
                      aria-pressed={on}
                      className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${on ? 'border-navy bg-navy text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}
                    >
                      {on && <Check className="h-3.5 w-3.5" />}
                      {r.name}
                    </button>
                  )
                })}
              </div>
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => selected !== null && score.mutate([selected])}
                  disabled={selected === null || score.isPending}
                  className="flex items-center gap-2 rounded-lg bg-navy px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-dark-navy disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {score.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Calculator className="h-4 w-4" />}
                  Calculate employability
                </button>
                <span className="text-sm text-gray-500">{selected !== null ? '1 role selected' : 'No role selected'}</span>
                {overview.data && <span className="text-xs text-gray-400">Method: {overview.data.scoring_method}</span>}
              </div>
              {score.isError && (
                <p role="alert" className="mt-4 text-sm font-medium text-red-600">
                  {score.error instanceof ApiError ? score.error.message : 'Could not calculate the score.'}
                </p>
              )}
            </>
          )}
        </QueryGate>
      </Card>

      {result && (
        <div className="mt-6 space-y-6" data-testid="score-result">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="relative overflow-hidden p-6">
              <ShieldCheck className="absolute right-6 top-6 h-14 w-14 text-gray-100" strokeWidth={1.5} />
              <div className="relative">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Employability score</div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span data-testid="score-value" className="text-5xl font-extrabold tracking-tight text-navy">{result.overall_score}%</span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-gray-500">
                  Share of forecast 1-year ICT demand covered by the roles you selected.
                </p>
              </div>
            </Card>
            <Card className="flex flex-col border-primary/30 p-6 ring-1 ring-primary/10 lg:col-span-2">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-navy">
                <Lightbulb className="h-4 w-4" />
                AI Recommendations
              </div>
              {(() => {
                const recs: string[] = []
                if (selectedRoleName && roleDept) {
                  const required = getIctSkillsForRole(selectedRoleName)
                  const missing = required.filter(s => !isSkillTaught(s, roleDept.skills))
                  const taught = required.filter(s => isSkillTaught(s, roleDept.skills))
                  if (missing.length > 0) {
                    recs.push(`To produce market-ready "${selectedRoleName}" graduates, add these skills to the AUCA ${roleDept.dept} curriculum: ${missing.join(', ')}`)
                  }
                  if (taught.length > 0 && missing.length > 0) {
                    recs.push(`AUCA ${roleDept.dept} currently covers ${taught.length} of ${required.length} required skills (${Math.round((taught.length / required.length) * 100)}% alignment) — focus on the ${missing.length} gap${missing.length > 1 ? 's' : ''} to reach full coverage`)
                  }
                  if (missing.length === 0) {
                    recs.push(`AUCA ${roleDept.dept} curriculum fully covers all ${required.length} employer-required skills for "${selectedRoleName}" — graduates are well-prepared for this role`)
                  }
                }
                return recs.length === 0 ? (
                  <p className="mt-4 text-sm text-gray-500">No further recommendations.</p>
                ) : (
                  <ul className="mt-4 space-y-3" data-testid="recommendations">
                    {recs.map((r) => (
                      <li key={r} className="flex items-start gap-2 text-base font-semibold text-gray-900">
                        <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                        {r}
                      </li>
                    ))}
                  </ul>
                )
              })()}
            </Card>
          </div>

          {/* AI Curriculum Recommendations */}
          {skillsAnalysis.length > 0 && roleDept && (
            <SkillsAnalysisCard roleSkills={skillsAnalysis} taughtSet={roleDept.skills} deptName={roleDept.dept} />
          )}
        </div>
      )}

      <Card className="mt-6 p-6">
        <h2 className="text-xl font-extrabold tracking-tight text-navy">Programme skills vs market demand</h2>
        <p className="mt-1 text-sm text-gray-500">Top 6 roles by 1-year forecast demand index · selected programme roles show at 100</p>
        <QueryGate query={forecasts} className="mt-4">
          {() => (
            <div className="mt-4" data-testid="radar">
              <ProfileRadar data={radarData} />
            </div>
          )}
        </QueryGate>
      </Card>
    </>
  )
}

/* ═══════════════ Business Faculty Tab ═══════════════ */
function BusinessEmployabilityTab() {
  const positions = useSectorPositions('finance-business')
  const [selected, setSelected] = useState<number | null>(null)
  const [scored, setScored] = useState(false)

  const allPositions = positions.data?.positions ?? []
  const totalPostings = allPositions.reduce((s, p) => s + p.count, 0)
  const maxCount = allPositions[0]?.count ?? 1

  const pick = (id: number) => {
    setSelected(prev => prev === id ? null : id)
    setScored(false)
  }

  const selectedRole = BUSINESS_ROLES.find(r => r.id === selected) ?? null
  const selectedRoles = selectedRole ? [selectedRole] : []

  const skillsAnalysis = useMemo(() => {
    if (selectedRoles.length === 0) return []
    return selectedRoles.map(r => ({
      role: r.name,
      skills: BIZ_ROLE_SKILLS[r.name] ?? [],
    }))
  }, [selectedRoles])

  const result = useMemo(() => {
    if (!scored || selectedRoles.length === 0 || allPositions.length === 0) return null

    const matched: { title: string; count: number }[] = []
    const unmatched: { title: string; count: number }[] = []

    for (const p of allPositions) {
      if (selectedRoles.some(r => matchesRole(p.title, r.name))) {
        matched.push(p)
      } else {
        unmatched.push(p)
      }
    }

    const matchedCount = matched.reduce((s, p) => s + p.count, 0)
    const overallScore = totalPostings > 0 ? Math.round((matchedCount / totalPostings) * 100) : 0

    const bizDept = selectedRole ? getBizDeptForRole(selectedRole.name) : { dept: 'Business Administration' as BizDept, skills: AUCA_BA_SKILLS }
    const allRequired = new Set(selectedRoles.flatMap(r => BIZ_ROLE_SKILLS[r.name] ?? []))
    const missingSkills = [...allRequired].filter(s => !isSkillTaught(s, bizDept.skills))
    const taughtSkills = [...allRequired].filter(s => isSkillTaught(s, bizDept.skills))

    const recommendations: string[] = []
    if (selectedRole && missingSkills.length > 0) {
      recommendations.push(`To produce market-ready "${selectedRole.name}" graduates, add these skills to the AUCA ${bizDept.dept} curriculum: ${missingSkills.join(', ')}`)
    }
    if (taughtSkills.length > 0 && missingSkills.length > 0) {
      recommendations.push(`AUCA ${bizDept.dept} currently covers ${taughtSkills.length} of ${allRequired.size} required skills (${Math.round((taughtSkills.length / allRequired.size) * 100)}% alignment) — focus on the ${missingSkills.length} gap${missingSkills.length > 1 ? 's' : ''} to reach full coverage`)
    }
    if (missingSkills.length === 0 && selectedRole) {
      recommendations.push(`AUCA ${bizDept.dept} curriculum fully covers all ${allRequired.size} employer-required skills for "${selectedRole.name}" — graduates are well-prepared for this role`)
    }

    return { overallScore, recommendations, matchedCount, totalPostings, bizDept }
  }, [scored, selectedRoles, allPositions, totalPostings, maxCount])

  const radarData = useMemo(() => {
    const top = allPositions.slice(0, 6)
    return top.map(p => ({
      role: p.title.length > 20 ? p.title.slice(0, 18) + '…' : p.title,
      market: maxCount > 0 ? Math.round((p.count / maxCount) * 100) : 0,
      profile: selectedRoles.some(r => matchesRole(p.title, r.name)) ? 100 : 0,
    }))
  }, [allPositions, maxCount, selectedRoles])

  const groups = [...new Set(BUSINESS_ROLES.map(r => r.group))]

  return (
    <>
      <Card className="mt-8 p-6">
        <h2 className="text-lg font-extrabold tracking-tight text-navy">1. Select business roles your programme covers</h2>
        <QueryGate query={positions} className="mt-4">
          {() => (
            <>
              {groups.map(group => (
                <div key={group} className="mt-4">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{group}</span>
                  <div className="mt-2 flex flex-wrap gap-2.5">
                    {BUSINESS_ROLES.filter(r => r.group === group).map((r) => {
                      const on = r.id === selected
                      const posMatch = allPositions.filter(p => matchesRole(p.title, r.name))
                      const postCount = posMatch.reduce((s, p) => s + p.count, 0)
                      return (
                        <button
                          key={r.id}
                          onClick={() => pick(r.id)}
                          aria-pressed={on}
                          className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${on ? 'border-navy bg-navy text-white' : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'}`}
                        >
                          {on && <Check className="h-3.5 w-3.5" />}
                          {r.name}
                          {postCount > 0 && (
                            <span className={`ml-1 text-[10px] ${on ? 'text-white/70' : 'text-gray-400'}`}>({postCount})</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
              <div className="mt-6 flex flex-wrap items-center gap-4">
                <button
                  onClick={() => setScored(true)}
                  disabled={selected === null}
                  className="flex items-center gap-2 rounded-lg bg-navy px-6 py-3.5 text-sm font-bold text-white shadow-sm transition-colors hover:bg-dark-navy disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <Calculator className="h-4 w-4" />
                  Calculate employability
                </button>
                <span className="text-sm text-gray-500">{selected !== null ? '1 role selected' : 'No role selected'}</span>
                <span className="text-xs text-gray-400">Method: posting-share scoring</span>
              </div>
            </>
          )}
        </QueryGate>
      </Card>

      {result && (
        <div className="mt-6 space-y-6">
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <Card className="relative overflow-hidden p-6">
              <ShieldCheck className="absolute right-6 top-6 h-14 w-14 text-gray-100" strokeWidth={1.5} />
              <div className="relative">
                <div className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Employability score</div>
                <div className="mt-3 flex items-baseline gap-2">
                  <span className="text-5xl font-extrabold tracking-tight text-navy">{result.overallScore}%</span>
                </div>
                <p className="mt-4 text-sm leading-relaxed text-gray-500">
                  Share of Finance &amp; Business sector demand covered by the roles you selected
                  ({fmtInt(result.matchedCount)} of {fmtInt(result.totalPostings)} postings).
                </p>
              </div>
            </Card>
            <Card className="flex flex-col border-primary/30 p-6 ring-1 ring-primary/10 lg:col-span-2">
              <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-navy">
                <Lightbulb className="h-4 w-4" />
                Recommendations
              </div>
              {result.recommendations.length === 0 ? (
                <p className="mt-4 text-sm text-gray-500">No further high-demand roles to recommend.</p>
              ) : (
                <ul className="mt-4 space-y-3">
                  {result.recommendations.map((r) => (
                    <li key={r} className="flex items-start gap-2 text-base font-semibold text-gray-900">
                      <Check className="mt-1 h-4 w-4 shrink-0 text-emerald-600" />
                      {r}
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>

          {/* AI Curriculum Recommendations */}
          {skillsAnalysis.length > 0 && result.bizDept && (
            <SkillsAnalysisCard roleSkills={skillsAnalysis} taughtSet={result.bizDept.skills} deptName={result.bizDept.dept} />
          )}
        </div>
      )}

      <Card className="mt-6 p-6">
        <h2 className="text-xl font-extrabold tracking-tight text-navy">Programme skills vs market demand</h2>
        <p className="mt-1 text-sm text-gray-500">Top 6 business roles by posting demand · selected programme roles show at 100</p>
        <QueryGate query={positions} className="mt-4">
          {() => (
            <div className="mt-4">
              <ProfileRadar data={radarData} />
            </div>
          )}
        </QueryGate>
      </Card>
    </>
  )
}

/* ═══════════════ Main Page ═══════════════ */
export default function EducationEmployability() {
  const [faculty, setFaculty] = useState<Faculty>('it')

  return (
    <DashboardLayout>
      <div className="max-w-3xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
            <GraduationCap className="h-5 w-5 text-indigo-700" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy">Graduate Employability</h1>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          {faculty === 'it'
            ? 'Assess how well AUCA IT graduates\' skills align with market demand. Select the roles an AUCA programme covers, then see how employable those graduates are and where skill gaps exist.'
            : 'Assess how well AUCA Business graduates\' skills align with Finance & Business sector demand. Select the roles a programme covers, then see employer alignment and skill gaps.'}
        </p>
      </div>

      {/* Faculty tabs */}
      <div className="mt-8 flex rounded-xl border border-gray-200 bg-gray-50 p-1.5" role="tablist">
        <button
          role="tab"
          aria-selected={faculty === 'it'}
          onClick={() => setFaculty('it')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-bold transition-colors ${
            faculty === 'it' ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <TrendingUp className="h-4 w-4" />
          IT Faculty
        </button>
        <button
          role="tab"
          aria-selected={faculty === 'business'}
          onClick={() => setFaculty('business')}
          className={`flex flex-1 items-center justify-center gap-2 rounded-lg px-6 py-3 text-sm font-bold transition-colors ${
            faculty === 'business' ? 'bg-white text-navy shadow-sm' : 'text-gray-500 hover:text-gray-800'
          }`}
        >
          <Briefcase className="h-4 w-4" />
          Business Faculty
        </button>
      </div>

      {faculty === 'it' ? <ITEmployabilityTab /> : <BusinessEmployabilityTab />}
    </DashboardLayout>
  )
}
