import { useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  ArrowRight,
  BookOpen,
  Check,
  ChevronDown,
  ChevronUp,
  FileUp,
  GraduationCap,
  Lightbulb,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  TrendingUp,
  X,
  Zap,
} from 'lucide-react'
import DashboardLayout, { Card } from './DashboardLayout'
import { EmptyState, QueryGate } from '../../components/ui/State'
import { useAuth } from '../../auth/AuthContext'
import { useCurricula } from '../../services/queries'
import { analyticsApi } from '../../services/api'
import { ApiError } from '../../services/http'
import { fmtDate } from '../../lib/format'

/* ══════════════════════════════════════════════════
   Innovation Center course catalog with skill mappings
   ══════════════════════════════════════════════════ */

const INNOVATION_COURSES: Record<string, { skills: string[]; desc: string }> = {
  'Cloud Computing': { skills: ['AWS/Azure/GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Cost Optimization'], desc: 'Cloud platforms, containerization, and infrastructure as code' },
  'Cybersecurity': { skills: ['SIEM', 'Firewall Management', 'Incident Response', 'Compliance (ISO 27001)', 'Cryptography', 'Ethical Hacking'], desc: 'Advanced security frameworks, SIEM tools, and incident response' },
  'UI/UX Design': { skills: ['Figma', 'Adobe XD', 'User Research', 'Wireframing', 'Prototyping', 'Design Systems', 'Accessibility'], desc: 'User-centered design, prototyping, and design systems' },
  'Data Science & AI': { skills: ['Machine Learning', 'TensorFlow/PyTorch', 'Deep Learning', 'NLP', 'Computer Vision', 'Data Visualization', 'MLOps'], desc: 'Machine learning, deep learning, and AI model deployment' },
  'Web Development': { skills: ['TypeScript', 'Node.js', 'Tailwind/Bootstrap', 'Responsive Design', 'Testing (Jest)', 'Microservices'], desc: 'Modern full-stack development with TypeScript and Node.js' },
  'Mobile Development': { skills: ['React Native', 'Flutter', 'Swift/Kotlin', 'Mobile UI/UX', 'Firebase', 'App Store Deployment'], desc: 'Cross-platform and native mobile app development' },
  'DevOps & CI/CD': { skills: ['Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Monitoring', 'Scripting (Bash/PowerShell)'], desc: 'Deployment pipelines, container orchestration, and monitoring' },
  'Entrepreneurship & Innovation': { skills: ['Business Development', 'Market Analysis', 'Proposal Writing', 'Strategic Partnerships', 'Financial Acumen', 'Design Thinking'], desc: 'Startup methodology, business model canvas, and venture building' },
  'Database & Data Engineering': { skills: ['PostgreSQL/MySQL', 'MongoDB', 'Performance Tuning', 'Cloud Databases', 'Data Warehousing', 'ETL Pipelines'], desc: 'Advanced database management, NoSQL, and data pipelines' },
  'Digital Marketing & Analytics': { skills: ['SEO/SEM', 'Google Analytics', 'Social Media Marketing', 'Content Creation', 'Email Marketing', 'Marketing Automation', 'A/B Testing'], desc: 'Data-driven marketing, SEO, and campaign analytics' },
  'Financial Technology': { skills: ['ERP Systems', 'Financial Modeling', 'Power BI/Tableau', 'Advanced Excel', 'CAAT Tools', 'Bloomberg Terminal'], desc: 'FinTech tools, ERP systems, and financial data analytics' },
  'Project Management (Advanced)': { skills: ['Jira', 'MS Project', 'Risk Management', 'Stakeholder Communication', 'Budgeting', 'Team Leadership'], desc: 'Agile certification prep, Jira mastery, and stakeholder management' },
}

/* ── Department curricula (baseline — same as Employability page) ── */

type Dept = 'Software Engineering' | 'Network & Info Management' | 'Finance' | 'Business Administration'

const DEPT_CURRICULA: Record<Dept, Set<string>> = {
  'Software Engineering': new Set([
    'Java', 'Python', '.NET', 'C#', 'PL/SQL', 'SQL',
    'HTML/CSS', 'JavaScript', 'React',
    'Data Structures', 'Algorithms', 'Operating Systems',
    'DBMS', 'Database Design',
    'Software Engineering', 'Design Patterns', 'Software Testing', 'Project Management',
    'Statistics', 'Probability', 'Computer Networks',
    'Mathematics', 'Discrete Mathematics',
    'Git', 'Agile/Scrum', 'Java/SpringBoot', 'REST APIs',
  ]),
  'Network & Info Management': new Set([
    'TCP/IP', 'Networking', 'LAN/WAN', 'Network Administration',
    'Windows Server', 'Linux',
    'SQL', 'DBMS', 'Database Design',
    'IT Support', 'Help Desk', 'Hardware Troubleshooting',
    'Operating Systems', 'System Administration',
    'HTML/CSS', 'Visual Basic',
    'Information Systems', 'Computer Networks',
    'Project Management', 'Statistics', 'Mathematics',
    'Network Security', 'Penetration Testing',
  ]),
  'Finance': new Set([
    'Financial Accounting', 'Principles of Accounting', 'Auditing', 'Tax',
    'IFRS', 'Corporate Finance', 'Investment', 'Banking',
    'Financial Analysis', 'Budgeting',
    'Economics', 'Business Law', 'Business Ethics',
    'Statistics', 'Mathematics',
    'Communication', 'English', 'French',
    'Entrepreneurship', 'Project Management',
  ]),
  'Business Administration': new Set([
    'Principles of Management', 'Strategic Management', 'Operations',
    'HR Management', 'Organizational Behavior', 'Leadership',
    'Marketing Principles', 'Market Research',
    'Principles of Accounting', 'Economics',
    'Business Law', 'Business Ethics', 'Business Communication',
    'Statistics', 'Mathematics',
    'Entrepreneurship', 'Project Management',
    'Communication', 'English', 'French',
    'Negotiation',
  ]),
}

const MARKET_SKILLS: Record<Dept, string[]> = {
  'Software Engineering': [
    'Java', 'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Git', 'REST APIs',
    'Docker', 'CI/CD', 'Agile/Scrum', 'SQL', 'Cloud (AWS/Azure)', 'Microservices',
    'Machine Learning', 'TensorFlow/PyTorch', 'Data Visualization', 'Power BI/Tableau',
    'Figma', 'UI/UX', 'Testing (Jest)', 'Responsive Design', 'MongoDB',
    'React Native', 'Flutter', 'Mobile UI/UX',
  ],
  'Network & Info Management': [
    'TCP/IP', 'Linux', 'Windows Server', 'Network Security', 'Penetration Testing',
    'Cloud (AWS/Azure)', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform',
    'SIEM', 'Firewall Management', 'Incident Response', 'Compliance (ISO 27001)',
    'Monitoring', 'Scripting (Bash/PowerShell)', 'VPN', 'Cloud Networking',
    'Active Directory', 'Help Desk', 'Networking',
  ],
  'Finance': [
    'IFRS', 'Financial Reporting', 'Tax', 'Auditing', 'ERP Systems',
    'Financial Modeling', 'Excel (Advanced/VBA)', 'Power BI/Tableau',
    'CAAT Tools', 'Fraud Detection', 'Risk Management', 'Budgeting',
    'Corporate Finance', 'Investment', 'Financial Analysis',
    'Bloomberg Terminal', 'QuickBooks/Sage', 'Compliance',
  ],
  'Business Administration': [
    'Strategic Management', 'HR Management', 'Project Management', 'Leadership',
    'Digital Marketing', 'SEO/SEM', 'Google Analytics', 'Social Media Marketing',
    'CRM (Salesforce)', 'Negotiation', 'Market Research',
    'Agile/Scrum', 'Jira', 'Team Leadership', 'Stakeholder Communication',
    'Design Thinking', 'Content Creation', 'Marketing Automation',
  ],
}

const ALL_DEPTS: Dept[] = ['Software Engineering', 'Network & Info Management', 'Finance', 'Business Administration']
const IT_DEPTS: Dept[] = ['Software Engineering', 'Network & Info Management']
const BIZ_DEPTS: Dept[] = ['Finance', 'Business Administration']

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

/* ── Types ── */
interface CourseData { skills: string[]; desc: string }

interface Cohort {
  id: number
  name: string
  period: string
  department: Dept
  courses: string[]
  extraCourses: Record<string, CourseData>
}

const inputClass = 'mt-2 w-full rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm text-gray-800 outline-none focus:border-primary focus:ring-2 focus:ring-primary/20'

/* ══════════════════════════════════════════════════
   Transformation View — the main insight panel
   ══════════════════════════════════════════════════ */

function TransformationView({ cohort }: { cohort: Cohort }) {
  const dept = cohort.department
  const curriculum = DEPT_CURRICULA[dept]
  const marketSkills = MARKET_SKILLS[dept]

  const allCourses = { ...INNOVATION_COURSES, ...cohort.extraCourses }

  const trainingSkills = new Set(
    cohort.courses.flatMap(c => allCourses[c]?.skills ?? []),
  )

  const combined = new Set([...curriculum, ...trainingSkills])

  const beforeCoverage = marketSkills.filter(s => isSkillTaught(s, curriculum))
  const afterCoverage = marketSkills.filter(s => isSkillTaught(s, combined))
  const gapsClosed = afterCoverage.length - beforeCoverage.length
  const stillMissing = marketSkills.filter(s => !isSkillTaught(s, combined))

  const beforePct = marketSkills.length > 0 ? Math.round((beforeCoverage.length / marketSkills.length) * 100) : 0
  const afterPct = marketSkills.length > 0 ? Math.round((afterCoverage.length / marketSkills.length) * 100) : 0

  const newlyAdded = marketSkills.filter(
    s => isSkillTaught(s, combined) && !isSkillTaught(s, curriculum),
  )

  const recommendations: string[] = []
  if (stillMissing.length > 0) {
    recommendations.push(`Next cohort should prioritize: ${stillMissing.slice(0, 5).join(', ')}${stillMissing.length > 5 ? ` and ${stillMissing.length - 5} more skills` : ''}`)
  }
  if (afterPct >= 90) {
    recommendations.push(`${dept} graduates with Innovation Center training are highly market-ready at ${afterPct}% coverage — focus on depth and certifications`)
  } else if (afterPct >= 70) {
    recommendations.push(`Good progress — ${afterPct}% market alignment. ${stillMissing.length} skills still needed for full coverage`)
  } else {
    recommendations.push(`Coverage at ${afterPct}% — consider adding more courses targeting ${dept} market gaps in the next cohort`)
  }
  if (gapsClosed > 0) {
    recommendations.push(`This cohort bridges ${gapsClosed} skill gap${gapsClosed > 1 ? 's' : ''} from the formal curriculum, improving graduate readiness by ${afterPct - beforePct} percentage points`)
  }

  return (
    <div className="space-y-6">
      {/* Before vs After KPIs */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <Card className="p-6 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Curriculum only</div>
          <div className="mt-2 text-4xl font-extrabold text-gray-400">{beforePct}%</div>
          <div className="mt-1 text-xs text-gray-400">{beforeCoverage.length} of {marketSkills.length} skills</div>
          <div className="mx-auto mt-3 h-2 w-full rounded-full bg-gray-100">
            <div className="h-2 rounded-full bg-gray-300" style={{ width: `${beforePct}%` }} />
          </div>
        </Card>
        <Card className="relative overflow-hidden border-emerald-200 p-6 text-center ring-1 ring-emerald-100">
          <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Curriculum + Training</div>
          <div className="mt-2 text-4xl font-extrabold text-emerald-700">{afterPct}%</div>
          <div className="mt-1 text-xs text-emerald-600">{afterCoverage.length} of {marketSkills.length} skills</div>
          <div className="mx-auto mt-3 h-2 w-full rounded-full bg-gray-100">
            <div className="h-2 rounded-full bg-emerald-500" style={{ width: `${afterPct}%` }} />
          </div>
        </Card>
        <Card className="flex flex-col items-center justify-center p-6 text-center">
          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Gaps closed</div>
          <div className="mt-2 flex items-baseline gap-1">
            <span className="text-4xl font-extrabold text-navy">+{gapsClosed}</span>
            <span className="text-sm font-bold text-gray-400">skills</span>
          </div>
          <div className="mt-1 text-xs text-gray-500">+{afterPct - beforePct}pp improvement</div>
        </Card>
      </div>

      {/* Skills added by training */}
      {newlyAdded.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-emerald-600" />
            <h3 className="text-lg font-bold text-gray-900">Skills added by Innovation Center training</h3>
          </div>
          <p className="mt-1 text-sm text-gray-500">Market-demanded skills that {dept} curriculum doesn't cover but this cohort's training does</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {newlyAdded.map(s => (
              <span key={s} className="rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-medium text-emerald-700">+ {s}</span>
            ))}
          </div>
        </Card>
      )}

      {/* Still missing */}
      {stillMissing.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-amber-600" />
            <h3 className="text-lg font-bold text-gray-900">Still missing from market requirements</h3>
          </div>
          <p className="mt-1 text-sm text-gray-500">Skills employers demand for {dept} roles that neither the curriculum nor this training covers yet</p>
          <div className="mt-4 flex flex-wrap gap-2">
            {stillMissing.map(s => (
              <span key={s} className="rounded-full bg-red-50 px-3 py-1.5 text-sm font-medium text-red-600">{s}</span>
            ))}
          </div>
        </Card>
      )}

      {/* AI Recommendations */}
      <Card className="border-primary/30 p-6 ring-1 ring-primary/10">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-50">
            <Sparkles className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-navy">AI Recommendations</h3>
            <p className="text-sm text-gray-500">Based on {dept} market demand analysis</p>
          </div>
        </div>
        <ul className="mt-4 space-y-3">
          {recommendations.map(r => (
            <li key={r} className="flex items-start gap-2 text-sm font-semibold text-gray-900">
              <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
              {r}
            </li>
          ))}
        </ul>
      </Card>

      {/* Per-course skill breakdown */}
      <Card className="p-6">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-indigo-600" />
          <h3 className="text-lg font-bold text-gray-900">Training courses in this cohort</h3>
        </div>
        <div className="mt-4 space-y-3">
          {cohort.courses.map(courseName => {
            const course = allCourses[courseName]
            if (!course) return null
            return (
              <div key={courseName} className="rounded-xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-gray-900">{courseName}</h4>
                  <span className="text-[10px] font-bold text-gray-400">{course.skills.length} skills</span>
                </div>
                <p className="mt-1 text-xs text-gray-500">{course.desc}</p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {course.skills.map(s => {
                    const alreadyInCurriculum = isSkillTaught(s, curriculum)
                    return (
                      <span key={s} className={`rounded-full px-2.5 py-1 text-[11px] font-medium ${alreadyInCurriculum ? 'bg-gray-100 text-gray-500' : 'bg-emerald-50 text-emerald-700'}`}>
                        {alreadyInCurriculum ? '○' : '★'} {s}
                      </span>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        <p className="mt-3 text-[11px] text-gray-400">★ New skill not in formal curriculum · ○ Already covered by curriculum</p>
      </Card>
    </div>
  )
}

/* ══════════════════════════════════════════════════
   Main Page
   ══════════════════════════════════════════════════ */

export default function Education() {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const list = useCurricula()

  /* ── Cohort state ── */
  const [cohorts, setCohorts] = useState<Cohort[]>([])
  const [activeCohortId, setActiveCohortId] = useState<number | null>(null)
  const [nextId, setNextId] = useState(1)

  /* ── Add cohort form ── */
  const [cohortName, setCohortName] = useState('')
  const [cohortPeriod, setCohortPeriod] = useState('')
  const [cohortDept, setCohortDept] = useState<Dept>('Software Engineering')
  const [selectedCourses, setSelectedCourses] = useState<Set<string>>(new Set())
  const [customCourseName, setCustomCourseName] = useState('')
  const [customCourseSkills, setCustomCourseSkills] = useState('')
  const [customCourses, setCustomCourses] = useState<Record<string, { skills: string[]; desc: string }>>({})

  const toggleCourse = (c: string) =>
    setSelectedCourses(prev => {
      const n = new Set(prev)
      if (n.has(c)) n.delete(c)
      else n.add(c)
      return n
    })

  const addCustomCourse = () => {
    const name = customCourseName.trim()
    const skills = customCourseSkills.split(',').map(s => s.trim()).filter(Boolean)
    if (!name || skills.length === 0) return
    setCustomCourses(prev => ({ ...prev, [name]: { skills, desc: 'Custom course added by planner' } }))
    setSelectedCourses(prev => new Set([...prev, name]))
    setCustomCourseName('')
    setCustomCourseSkills('')
  }

  const addCohort = () => {
    if (!cohortName.trim() || !cohortPeriod.trim() || selectedCourses.size === 0) return
    const cohort: Cohort = {
      id: nextId,
      name: cohortName.trim(),
      period: cohortPeriod.trim(),
      department: cohortDept,
      courses: [...selectedCourses],
      extraCourses: { ...customCourses },
    }
    setCohorts(prev => [cohort, ...prev])
    setActiveCohortId(nextId)
    setNextId(n => n + 1)
    setCohortName('')
    setCohortPeriod('')
    setSelectedCourses(new Set())
    setCustomCourses({})
  }

  const removeCohort = (id: number) => {
    setCohorts(prev => prev.filter(c => c.id !== id))
    if (activeCohortId === id) setActiveCohortId(null)
  }

  const activeCohort = cohorts.find(c => c.id === activeCohortId) ?? null

  /* ── Curriculum update state ── */
  const [showCurrUpdate, setShowCurrUpdate] = useState(false)
  const [currDept, setCurrDept] = useState<Dept>('Software Engineering')
  const [currName, setCurrName] = useState('')
  const [currLevel, setCurrLevel] = useState('bachelor')
  const [currFile, setCurrFile] = useState<File | null>(null)
  const [currText, setCurrText] = useState('')

  const submitCurr = useMutation({
    mutationFn: () => {
      const form = new FormData()
      form.append('name', `${currDept} — ${currName.trim()}`)
      form.append('level', currLevel)
      if (currFile) form.append('file', currFile)
      if (currText.trim()) form.append('text', currText)
      return analyticsApi.submitCurriculum(form)
    },
    onSuccess: () => {
      setCurrName('')
      setCurrFile(null)
      setCurrText('')
      queryClient.invalidateQueries({ queryKey: ['curricula'] })
    },
  })

  const removeCurr = useMutation({
    mutationFn: (id: number) => analyticsApi.deleteCurriculum(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['curricula'] }),
  })

  /* ── Suggested courses based on department ── */
  const suggestedCourses = useMemo(() => {
    const isIT = IT_DEPTS.includes(cohortDept)
    const all = Object.keys(INNOVATION_COURSES)
    if (isIT) return all.filter(c => !['Digital Marketing & Analytics', 'Financial Technology'].includes(c))
    return all.filter(c => !['Cybersecurity', 'DevOps & CI/CD', 'Database & Data Engineering'].includes(c))
  }, [cohortDept])

  return (
    <DashboardLayout>
      {/* ── Header ── */}
      <div className="max-w-3xl">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
            <GraduationCap className="h-5 w-5 text-indigo-700" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-navy">Education Alignment</h1>
        </div>
        <p className="mt-3 text-sm leading-relaxed text-gray-500">
          Track how AUCA Innovation Center training transforms graduates from formal curriculum to market-ready professionals.
          Add training cohorts, see real-time transformation insights, and get AI recommendations.
        </p>
      </div>

      {/* ══════ Innovation Center Banner ══════ */}
      <Card className="mt-8 flex flex-col gap-4 border-primary/30 p-6 ring-1 ring-primary/10 md:flex-row md:items-center">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-navy text-white">
          <Sparkles className="h-7 w-7" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-extrabold text-navy">AUCA Innovation Center</h2>
          <p className="mt-1 text-sm text-gray-500">Mastercard Foundation partnership</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-600">
            Bridging the gap between AUCA's formal curriculum and real-world employer demands. Each year, ~50 top-performing students
            (70% female) receive hands-on training in cloud computing, cybersecurity, UI/UX, data science, and more —
            transforming classroom theory into market-ready skills aligned with Rwanda's Vision 2050.
          </p>
        </div>
      </Card>

      {/* ══════ Add Training Cohort ══════ */}
      <Card className="mt-8 p-6">
        <div className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-navy" />
          <h2 className="text-lg font-extrabold tracking-tight text-navy">Add Training Cohort</h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">Enter the cohort details and select the courses being offered this year</p>

        <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-3">
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-navy">Cohort name</span>
            <input value={cohortName} onChange={e => setCohortName(e.target.value)} placeholder="Cohort 3 — 2026/2027" className={inputClass} />
          </label>
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-navy">Period</span>
            <input value={cohortPeriod} onChange={e => setCohortPeriod(e.target.value)} placeholder="Sep 2026 — Jun 2027" className={inputClass} />
          </label>
          <label className="block">
            <span className="text-[11px] font-bold uppercase tracking-wider text-navy">Target department</span>
            <select value={cohortDept} onChange={e => setCohortDept(e.target.value as Dept)} className={inputClass}>
              {ALL_DEPTS.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
          </label>
        </div>

        <div className="mt-6">
          <span className="text-[11px] font-bold uppercase tracking-wider text-navy">Courses offered this cohort</span>
          <p className="mt-1 text-xs text-gray-400">Select all courses being taught — skills are mapped automatically</p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {suggestedCourses.map(name => {
              const on = selectedCourses.has(name)
              const course = INNOVATION_COURSES[name]
              return (
                <button
                  key={name}
                  onClick={() => toggleCourse(name)}
                  className={`flex flex-col items-start rounded-xl border p-4 text-left transition-colors ${on ? 'border-navy bg-navy/5 ring-1 ring-navy/20' : 'border-gray-200 hover:border-gray-300'}`}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className={`text-sm font-bold ${on ? 'text-navy' : 'text-gray-800'}`}>{name}</span>
                    {on && <Check className="h-4 w-4 text-navy" />}
                  </div>
                  <span className="mt-1 text-[11px] text-gray-500">{course.desc}</span>
                  <span className="mt-2 text-[10px] font-medium text-gray-400">{course.skills.length} skills</span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Custom courses added by planner */}
        {Object.keys(customCourses).length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(customCourses).map(([name, data]) => (
              <span key={name} className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${selectedCourses.has(name) ? 'bg-navy/10 text-navy' : 'bg-gray-100 text-gray-600'}`}>
                <button onClick={() => toggleCourse(name)} className="hover:underline">{name}</button>
                <span className="text-[10px] text-gray-400">({data.skills.length})</span>
                <button onClick={() => { setCustomCourses(prev => { const n = { ...prev }; delete n[name]; return n }); setSelectedCourses(prev => { const n = new Set(prev); n.delete(name); return n }) }} className="ml-0.5 text-gray-300 hover:text-red-500"><X className="h-3 w-3" /></button>
              </span>
            ))}
          </div>
        )}

        {/* Add custom course */}
        <div className="mt-5 rounded-xl border border-dashed border-gray-300 p-4">
          <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Add a custom course</span>
          <p className="mt-1 text-xs text-gray-400">For courses not in the catalog above (e.g. IoT, Blockchain, etc.)</p>
          <div className="mt-3 flex flex-wrap gap-3">
            <input value={customCourseName} onChange={e => setCustomCourseName(e.target.value)} placeholder="Course name (e.g. IoT & Embedded Systems)" className="flex-1 min-w-[200px] rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            <input value={customCourseSkills} onChange={e => setCustomCourseSkills(e.target.value)} placeholder="Skills (comma-separated): IoT, Arduino, MQTT, Edge Computing" className="flex-[2] min-w-[280px] rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20" />
            <button
              onClick={addCustomCourse}
              disabled={!customCourseName.trim() || !customCourseSkills.trim()}
              className="flex items-center gap-1.5 rounded-lg bg-gray-100 px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-200 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-4">
          <button
            onClick={addCohort}
            disabled={!cohortName.trim() || !cohortPeriod.trim() || selectedCourses.size === 0}
            className="flex items-center gap-2 rounded-lg bg-navy px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-dark-navy disabled:cursor-not-allowed disabled:opacity-50"
          >
            <Zap className="h-4 w-4" />
            Generate insights
          </button>
          <span className="text-sm text-gray-500">{selectedCourses.size} course{selectedCourses.size === 1 ? '' : 's'} selected</span>
        </div>
      </Card>

      {/* ══════ Cohort List ══════ */}
      {cohorts.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-extrabold tracking-tight text-navy">Training Cohorts</h2>
          <div className="mt-4 space-y-3">
            {cohorts.map(c => {
              const isActive = c.id === activeCohortId
              const curriculum = DEPT_CURRICULA[c.department]
              const market = MARKET_SKILLS[c.department]
              const cAllCourses = { ...INNOVATION_COURSES, ...c.extraCourses }
              const trainingSkills = new Set(c.courses.flatMap(cn => cAllCourses[cn]?.skills ?? []))
              const combined = new Set([...curriculum, ...trainingSkills])
              const coverage = market.length > 0 ? Math.round((market.filter(s => isSkillTaught(s, combined)).length / market.length) * 100) : 0
              return (
                <Card
                  key={c.id}
                  onClick={() => setActiveCohortId(isActive ? null : c.id)}
                  className={`flex cursor-pointer items-center gap-4 p-5 transition-colors ${isActive ? 'border-navy/30 ring-1 ring-navy/10' : 'hover:bg-gray-50'}`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-gray-900">{c.name}</span>
                      <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold text-gray-600">{c.department}</span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span>{c.period}</span>
                      <span>{c.courses.length} courses</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-extrabold text-navy">{coverage}%</div>
                      <div className="text-[10px] font-bold text-gray-400">ALIGNMENT</div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); removeCohort(c.id) }} className="text-gray-300 hover:text-red-500">
                      <Trash2 className="h-4 w-4" />
                    </button>
                    {isActive ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
                  </div>
                </Card>
              )
            })}
          </div>
        </div>
      )}

      {/* ══════ Transformation View ══════ */}
      {activeCohort && (
        <div className="mt-8">
          <div className="flex items-center gap-2">
            <ArrowRight className="h-5 w-5 text-emerald-600" />
            <h2 className="text-xl font-extrabold tracking-tight text-navy">
              Transformation: {activeCohort.name}
            </h2>
          </div>
          <p className="mt-1 text-sm text-gray-500">
            How this cohort transforms {activeCohort.department} graduates from formal curriculum to market-ready professionals
          </p>
          <div className="mt-6">
            <TransformationView cohort={activeCohort} />
          </div>
        </div>
      )}

      {/* ══════ Department Curriculum Update (collapsible) ══════ */}
      <div className="mt-12">
        <button
          onClick={() => setShowCurrUpdate(!showCurrUpdate)}
          className="flex w-full items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-6 py-4 text-left transition-colors hover:bg-gray-100"
        >
          <div className="flex items-center gap-3">
            <FileUp className="h-5 w-5 text-gray-500" />
            <div>
              <h2 className="text-lg font-bold text-gray-900">Update Department Curriculum</h2>
              <p className="text-sm text-gray-500">Upload a new curriculum when the university updates course offerings</p>
            </div>
          </div>
          {showCurrUpdate ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
        </button>

        {showCurrUpdate && (
          <Card className="mt-4 p-6">
            {/* Department selector */}
            <div className="flex flex-wrap gap-2">
              {ALL_DEPTS.map(d => (
                <button
                  key={d}
                  onClick={() => setCurrDept(d)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${currDept === d ? 'bg-navy text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {d}
                </button>
              ))}
            </div>

            {/* Current curriculum display */}
            <div className="mt-6">
              <h3 className="text-sm font-bold text-gray-700">Current {currDept} curriculum skills</h3>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {[...DEPT_CURRICULA[currDept]].map(s => (
                  <span key={s} className="rounded-full bg-indigo-50 px-2.5 py-1 text-[11px] font-medium text-indigo-700">{s}</span>
                ))}
              </div>
            </div>

            {/* Upload form */}
            <form className="mt-6 space-y-5" onSubmit={e => { e.preventDefault(); submitCurr.mutate() }}>
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-navy">Programme name</span>
                  <input value={currName} onChange={e => setCurrName(e.target.value)} placeholder={`${currDept} (Updated)`} className={inputClass} />
                </label>
                <label className="block">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-navy">Level</span>
                  <select value={currLevel} onChange={e => setCurrLevel(e.target.value)} className={inputClass}>
                    <option value="bachelor">Bachelor's degree</option>
                    <option value="master">Master's degree</option>
                    <option value="diploma">Diploma</option>
                    <option value="certificate">Certificate</option>
                    <option value="short_course">Short course</option>
                  </select>
                </label>
              </div>

              <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                <div>
                  <span className="text-[11px] font-bold uppercase tracking-wider text-navy">Option A: CSV file</span>
                  <label htmlFor="curr-file" className="mt-2 flex cursor-pointer items-center gap-3 rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/60 px-4 py-6 text-sm text-gray-600 hover:border-primary/40">
                    <FileUp className="h-5 w-5 text-primary" />
                    <span>{currFile ? currFile.name : 'Choose a .csv with a "course" column'}</span>
                  </label>
                  <input id="curr-file" type="file" accept=".csv,text/csv" className="sr-only" onChange={e => setCurrFile(e.target.files?.[0] ?? null)} />
                </div>
                <label className="block">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-navy">Option B: paste courses (one per line)</span>
                  <textarea value={currText} onChange={e => setCurrText(e.target.value)} rows={4} placeholder="Cloud Computing Fundamentals&#10;Advanced Cybersecurity&#10;Docker & Kubernetes" className={`${inputClass} font-mono text-xs`} />
                </label>
              </div>

              {submitCurr.isError && (
                <p className="text-sm font-medium text-red-600">
                  {submitCurr.error instanceof ApiError ? submitCurr.error.message : 'Could not submit the curriculum.'}
                </p>
              )}
              <button
                type="submit"
                disabled={!currName.trim() || (!currFile && !currText.trim()) || submitCurr.isPending}
                className="flex items-center gap-2 rounded-lg bg-navy px-6 py-3.5 text-sm font-bold text-white shadow-sm hover:bg-dark-navy disabled:cursor-not-allowed disabled:opacity-50"
              >
                {submitCurr.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <GraduationCap className="h-4 w-4" />}
                Update curriculum
              </button>
            </form>

            {/* Previously uploaded curricula */}
            <div className="mt-8">
              <h3 className="text-sm font-bold text-gray-700">Previously uploaded curricula</h3>
              <QueryGate query={list} className="mt-3">
                {l =>
                  l.results.length === 0 ? (
                    <EmptyState title="No curricula uploaded yet" hint="Upload a curriculum above to track changes over time." className="py-6" />
                  ) : (
                    <div className="mt-3 space-y-2">
                      {l.results.map(c => (
                        <div key={c.id} className="flex items-center justify-between rounded-lg border border-gray-200 px-4 py-3">
                          <div>
                            <span className="text-sm font-bold text-gray-900">{c.name}</span>
                            <span className="ml-3 text-xs text-gray-500">{c.level_label} · {c.course_count} courses · {fmtDate(c.created_at)}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-bold text-navy">{Math.round(c.alignment_score)}%</span>
                            <button onClick={() => removeCurr.mutate(c.id)} className="text-gray-300 hover:text-red-500">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )
                }
              </QueryGate>
            </div>
          </Card>
        )}
      </div>
    </DashboardLayout>
  )
}
