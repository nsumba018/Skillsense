import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BookOpen,
  GraduationCap,
  Lightbulb,
  Sparkles,
  TrendingUp,
  TrendingDown,
  Minus,
  Zap,
  Target,
} from 'lucide-react'
import DashboardLayout, { Card, PageHeader } from './DashboardLayout'
import { QueryGate } from '../../components/ui/State'
import { useCareer, useTrends, useSectorPositions } from '../../services/queries'
import { fmtNum } from '../../lib/format'

const AUCA_SE_COURSES = {
  'Semester 1': ['Applied Mathematics', 'Intro to Computer Applications', 'Principles of Accounting I'],
  'Semester 2': ['Calculus & ODE', 'Digital Computer Fundamentals', 'Intro to Computer Programming', 'Computer Maintenance', 'Descriptive Statistics', 'Computer Networks'],
  'Semester 3': ['Programming with C', 'DBMS', 'English for Academics'],
  'Semester 4': ['Probability & Statistics', 'Object-Oriented Programming', 'Software Engineering', 'Operating Systems', 'Theory of Computation'],
  'Semester 5': ['Java Programming', 'MIS', 'Requirements Engineering', 'Database Development (PL/SQL)', 'Software Project Management', 'Web Design'],
  'Semester 6': ['Software Testing Techniques', 'Software Modeling & Design', 'Data Structures & Algorithms', 'Web Technology & Internet (React)', 'Introduction to Linux'],
  'Semester 7': ['Software Quality Assurance', '.NET', 'Introduction to Big Data (Python)', 'Software Security', 'Mobile Programming'],
  'Semester 8': ['Best Programming Practice & Design Patterns', 'Internship', 'Final Year Project'],
}


const SE_SKILLS_MISSING = [
  'Cloud Computing (AWS/Azure/GCP)',
  'DevOps & CI/CD',
  'Containerization (Docker/Kubernetes)',
  'Angular / Vue.js',
  'Node.js / Express',
  'TypeScript',
  'AI / Machine Learning',
  'Cybersecurity Frameworks (ISO 27001, NIST)',
  'Microservices Architecture',
  'Redis / Caching',
]

const AUCA_PROGRAMS: Record<string, string[]> = {
  'Software Engineering': ['Java', 'Java/SpringBoot', 'Python', '.NET/C#', 'React', 'SQL/PL/SQL', 'HTML/CSS', 'JavaScript', 'Git', 'Agile/Scrum', 'REST APIs', 'Software Testing', 'Design Patterns', 'Data Structures', 'Algorithms', 'DBMS', 'Project Management'],
  'Network & Info Management': ['TCP/IP', 'Networking', 'LAN/WAN', 'Linux', 'Windows Server', 'Network Security', 'Penetration Testing', 'System Administration', 'IT Support', 'SQL', 'DBMS', 'Hardware Troubleshooting', 'Information Systems'],
  'Finance': ['Financial Accounting', 'Auditing', 'Tax', 'IFRS', 'Corporate Finance', 'Investment', 'Banking', 'Financial Analysis', 'Budgeting', 'Economics', 'Business Law'],
  'Business Administration': ['Strategic Management', 'HR Management', 'Operations', 'Marketing Principles', 'Market Research', 'Negotiation', 'Leadership', 'Project Management', 'Entrepreneurship', 'Business Communication'],
}

interface CourseRecommendation {
  course: string
  reason: string
  priority: 'high' | 'medium' | 'low'
  targetRoles: string[]
  faculty: string
}

function generateRecommendations(
  _growingRoles: { role_name: string; demand_index: number; share_pct: number }[],
  ictPositions: { title: string; count: number }[],
  bizPositions: { title: string; count: number }[],
): CourseRecommendation[] {
  const recs: CourseRecommendation[] = []

  const topIctRoles = ictPositions.slice(0, 10).map(p => p.title.toLowerCase())
  const topBizRoles = bizPositions.slice(0, 10).map(p => p.title.toLowerCase())

  const hasRole = (keywords: string[], list: string[]) => list.some(r => keywords.some(k => r.includes(k)))

  if (hasRole(['data', 'analyst', 'scientist', 'machine learning', 'ai'], topIctRoles)) {
    recs.push({
      course: 'Applied Data Science & AI/ML',
      reason: 'AUCA introduces Big Data and Python in semester 7 but lacks dedicated AI/ML courses. The market demands pandas, scikit-learn, TensorFlow, and data pipeline skills at undergraduate level.',
      priority: 'high',
      targetRoles: ictPositions.filter(p => ['data', 'analyst', 'scientist', 'ai', 'machine'].some(k => p.title.toLowerCase().includes(k))).map(p => p.title).slice(0, 4),
      faculty: 'IT',
    })
  }

  if (hasRole(['cloud', 'devops', 'aws', 'azure', 'infrastructure'], topIctRoles)) {
    recs.push({
      course: 'Cloud Computing & DevOps',
      reason: 'The SE bulletin has no cloud or DevOps courses. Employers increasingly require AWS/Azure/GCP and CI/CD pipeline skills. This is the biggest curriculum gap.',
      priority: 'high',
      targetRoles: ictPositions.filter(p => ['cloud', 'devops', 'infrastructure', 'aws', 'platform'].some(k => p.title.toLowerCase().includes(k))).map(p => p.title).slice(0, 4),
      faculty: 'IT',
    })
  }

  if (hasRole(['security', 'cyber', 'information security'], topIctRoles)) {
    recs.push({
      course: 'Advanced Cybersecurity & Ethical Hacking',
      reason: 'AUCA Network & Info Management teaches Network Security and Penetration Testing fundamentals, but employers want SIEM tools, incident response, compliance frameworks (ISO 27001, NIST), and advanced threat analysis. Extend the existing foundation with hands-on labs.',
      priority: 'high',
      targetRoles: ictPositions.filter(p => ['security', 'cyber'].some(k => p.title.toLowerCase().includes(k))).map(p => p.title).slice(0, 4),
      faculty: 'IT',
    })
  }

  if (hasRole(['developer', 'software', 'engineer', 'full stack', 'web'], topIctRoles)) {
    recs.push({
      course: 'Advanced Full-Stack Development (Node.js, TypeScript)',
      reason: 'AUCA SE covers Java/SpringBoot, React, REST APIs, and Git. The market also demands Node.js, TypeScript, Docker, and cloud deployment — adding these would complete the modern full-stack picture.',
      priority: 'high',
      targetRoles: ictPositions.filter(p => ['developer', 'software', 'engineer', 'full stack', 'web', 'mobile'].some(k => p.title.toLowerCase().includes(k))).map(p => p.title).slice(0, 4),
      faculty: 'IT',
    })
  }

  if (hasRole(['project', 'manager', 'product', 'scrum', 'agile'], topIctRoles)) {
    recs.push({
      course: 'Advanced IT Project & Product Management',
      reason: 'AUCA teaches Agile/Scrum and Project Management fundamentals. Employers also want Jira proficiency, product ownership skills, stakeholder management, and PMP/CSM certification readiness.',
      priority: 'medium',
      targetRoles: ictPositions.filter(p => ['project', 'manager', 'product', 'scrum'].some(k => p.title.toLowerCase().includes(k))).map(p => p.title).slice(0, 4),
      faculty: 'IT',
    })
  }

  if (hasRole(['accountant', 'auditor', 'finance', 'tax', 'financial'], topBizRoles)) {
    recs.push({
      course: 'Digital Accounting & FinTech',
      reason: 'Finance roles are evolving with digital payment systems and mobile money. Graduates need ERP and fintech skills alongside traditional accounting.',
      priority: 'high',
      targetRoles: bizPositions.filter(p => ['accountant', 'finance', 'auditor', 'tax', 'financial'].some(k => p.title.toLowerCase().includes(k))).map(p => p.title).slice(0, 4),
      faculty: 'Business',
    })
  }

  if (hasRole(['marketing', 'digital', 'social media', 'brand', 'communications'], topBizRoles)) {
    recs.push({
      course: 'Digital Marketing & Analytics',
      reason: 'Growing demand for data-driven marketing. Social media management, SEO, and marketing analytics are key skills.',
      priority: 'medium',
      targetRoles: bizPositions.filter(p => ['marketing', 'digital', 'social', 'brand', 'communication'].some(k => p.title.toLowerCase().includes(k))).map(p => p.title).slice(0, 4),
      faculty: 'Business',
    })
  }

  if (hasRole(['business analyst', 'consultant', 'strategy', 'operations'], topBizRoles)) {
    recs.push({
      course: 'Business Analytics & Strategy',
      reason: 'Companies need graduates who can bridge business and data. Excel modeling, Power BI, and strategic thinking are in demand.',
      priority: 'medium',
      targetRoles: bizPositions.filter(p => ['business', 'analyst', 'consultant', 'strategy', 'operations'].some(k => p.title.toLowerCase().includes(k))).map(p => p.title).slice(0, 4),
      faculty: 'Business',
    })
  }

  if (recs.length === 0) {
    recs.push({
      course: 'Applied Data Science & AI',
      reason: 'Data skills are consistently in demand across all sectors. A safe bet for the Innovation Center.',
      priority: 'high',
      targetRoles: ['Data Analyst', 'Data Scientist'],
      faculty: 'IT',
    })
  }

  return recs.sort((a, b) => {
    const p = { high: 0, medium: 1, low: 2 }
    return p[a.priority] - p[b.priority]
  })
}

const PRIORITY_STYLE = {
  high: 'bg-red-50 text-red-700 border-red-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  low: 'bg-gray-50 text-gray-600 border-gray-200',
}

export default function EducationCareerGuidance() {
  const career = useCareer()
  const trends = useTrends()
  const ictPositions = useSectorPositions('ict-technology')
  const bizPositions = useSectorPositions('finance-business')

  const recommendations = useMemo(() => {
    const growing = career.data?.growing_roles ?? []
    const ict = ictPositions.data?.positions ?? []
    const biz = bizPositions.data?.positions ?? []
    return generateRecommendations(growing, ict, biz)
  }, [career.data, ictPositions.data, bizPositions.data])

  const growingRoles = career.data?.growing_roles ?? []
  const trendData = trends.data

  return (
    <DashboardLayout>
      <PageHeader
        icon={Lightbulb}
        title="Training Recommendations"
        subtitle="AI-generated course recommendations based on real market data to help the Innovation Center plan its next programmes."
        actions={
          <Link to="/dashboard/forecast" className="flex shrink-0 items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition-colors hover:bg-gray-50">
            <TrendingUp className="h-4 w-4" />
            View full forecast
          </Link>
        }
      />

      {/* AI Insight banner */}
      <QueryGate query={career} className="mt-8">
        {(c) => (
          <Card className="flex flex-col gap-4 border-primary/30 p-6 ring-1 ring-primary/10 md:flex-row md:items-center">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-navy text-white"><Sparkles className="h-6 w-6" /></div>
            <div className="flex-1">
              <div className="text-[11px] font-bold uppercase tracking-wider text-gray-400">Market Intelligence</div>
              <p className="mt-1.5 text-base font-bold leading-relaxed text-gray-900">{c.advice}</p>
            </div>
          </Card>
        )}
      </QueryGate>

      {/* Course Recommendations */}
      <div className="mt-8">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-amber-600" />
          <h2 className="text-xl font-extrabold tracking-tight text-navy">Recommended Courses for Innovation Center</h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">Based on analysis of {(ictPositions.data?.positions.length ?? 0) + (bizPositions.data?.positions.length ?? 0)} tracked job titles across ICT &amp; Business sectors</p>

        <div className="mt-6 space-y-4">
          {recommendations.map((rec, i) => (
            <Card key={rec.course} className="p-5">
              <div className="flex flex-col gap-4 md:flex-row md:items-start">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy/10 text-navy font-extrabold text-lg">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg font-bold text-gray-900">{rec.course}</h3>
                    <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${PRIORITY_STYLE[rec.priority]}`}>
                      {rec.priority} priority
                    </span>
                    <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-[10px] font-bold text-gray-600">
                      {rec.faculty} Faculty
                    </span>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-gray-600">{rec.reason}</p>
                  {rec.targetRoles.length > 0 && (
                    <div className="mt-3">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">Prepares for:</span>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {rec.targetRoles.map(r => (
                          <span key={r} className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700">{r}</span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>

      {/* SE Curriculum vs Market Gaps */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <h2 className="text-lg font-bold text-gray-900">SE Curriculum Skills (from Bulletin)</h2>
          <p className="mt-1 text-xs text-gray-500">Software Engineering · 4-year programme · 8 semesters</p>
          <div className="mt-4 space-y-3">
            {Object.entries(AUCA_SE_COURSES).map(([sem, courses]) => (
              <div key={sem}>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-gray-400">{sem}</h3>
                <div className="mt-1 flex flex-wrap gap-1">
                  {courses.map(c => (
                    <span key={c} className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700">{c}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="p-6">
          <h2 className="text-lg font-bold text-red-700">Skills Gap: Not in SE Curriculum</h2>
          <p className="mt-1 text-xs text-gray-500">Market-demanded skills missing from the current bulletin</p>
          <div className="mt-4 space-y-2.5">
            {SE_SKILLS_MISSING.map(skill => (
              <div key={skill} className="flex items-center gap-2.5 rounded-lg bg-red-50 px-3 py-2">
                <span className="h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />
                <span className="text-sm font-medium text-red-800">{skill}</span>
              </div>
            ))}
          </div>
          <div className="mt-5 rounded-lg bg-amber-50 border border-amber-200 p-4">
            <p className="text-sm font-semibold text-amber-800">Innovation Center Opportunity</p>
            <p className="mt-1 text-xs text-amber-700">These gaps are what the AUCA Innovation Center short courses should target — bridging the difference between what the formal curriculum teaches and what employers actually hire for.</p>
          </div>
        </Card>
      </div>

      {/* Market signals: growing roles */}
      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card className="p-6">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-gray-900">Roles Driving These Recommendations</h2>
          </div>
          <p className="mt-1 text-xs text-gray-500">Top growing ICT roles by forecast demand</p>
          <div className="mt-5 space-y-3">
            {growingRoles.slice(0, 8).map((r, i) => {
              const maxDemand = growingRoles[0]?.demand_index ?? 1
              return (
                <div key={r.role_name}>
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-50 text-[10px] font-bold text-emerald-700">{i + 1}</span>
                      <span className="font-medium text-gray-800">{r.role_name}</span>
                    </span>
                    <span className="shrink-0 font-bold text-navy">{fmtNum(r.demand_index, 0)}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full rounded-full bg-gray-100">
                    <div className="h-1.5 rounded-full bg-emerald-500" style={{ width: `${(r.demand_index / maxDemand) * 100}%` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-indigo-600" />
            <h2 className="text-lg font-bold text-gray-900">Current AUCA Programme Skills</h2>
          </div>
          <p className="mt-1 text-xs text-gray-500">Skills taught across IT &amp; Business faculties</p>
          <div className="mt-5 space-y-4">
            {Object.entries(AUCA_PROGRAMS).map(([program, skills]) => (
              <div key={program}>
                <h3 className="text-sm font-bold text-gray-800">{program}</h3>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  {skills.map(s => (
                    <span key={s} className="rounded-full bg-indigo-50 px-2 py-0.5 text-[11px] font-medium text-indigo-700">{s}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Role trend summary */}
      {trendData && (
        <Card className="mt-6 p-6">
          <h2 className="text-lg font-bold text-gray-900">Full ICT Trend Summary</h2>
          <p className="mt-1 text-xs text-gray-500">All tracked ICT roles grouped by trend direction</p>
          <div className="mt-5 grid grid-cols-1 gap-6 sm:grid-cols-3">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-emerald-600" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Growing ({trendData.growing.length})</span>
              </div>
              <ul className="mt-3 space-y-2">
                {trendData.growing.slice(0, 6).map(r => (
                  <li key={r.role_id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-medium text-gray-800">{r.role_name}</span>
                    <span className="shrink-0 font-bold text-emerald-600">{fmtNum(r.demand_index, 0)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Minus className="h-4 w-4 text-gray-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-gray-500">Stable ({trendData.stable.length})</span>
              </div>
              <ul className="mt-3 space-y-2">
                {trendData.stable.slice(0, 6).map(r => (
                  <li key={r.role_id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-medium text-gray-800">{r.role_name}</span>
                    <span className="shrink-0 font-bold text-gray-500">{fmtNum(r.demand_index, 0)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-red-500" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-600">Declining ({trendData.declining.length})</span>
              </div>
              <ul className="mt-3 space-y-2">
                {trendData.declining.slice(0, 6).map(r => (
                  <li key={r.role_id} className="flex items-center justify-between gap-2 text-sm">
                    <span className="truncate font-medium text-gray-800">{r.role_name}</span>
                    <span className="shrink-0 font-bold text-red-500">{fmtNum(r.demand_index, 0)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      )}

      {/* CTA */}
      <Card className="mt-6 p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Want to dig deeper?</h2>
            <p className="mt-1 text-sm text-gray-500">Explore full role forecasts or score a programme's employability</p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link to="/dashboard/forecast" className="flex items-center gap-2 rounded-lg bg-navy px-5 py-3 text-sm font-bold text-white hover:bg-dark-navy">
              <TrendingUp className="h-4 w-4" /> Role Forecast <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/dashboard/employability" className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50">
              <GraduationCap className="h-4 w-4" /> Employability Score <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </Card>
    </DashboardLayout>
  )
}
