/**
 * AUCA skills catalogue shared by the Career & Training Advisor pages: what employers require per role,
 * what each department teaches, what the Innovation Center offers, and the scoring / pathway helpers built
 * on them. `backend/advisory/skills_data.py` mirrors the role and course data; keep the two in step.
 */

import type { PrioritySkill } from '../types/advisory'

export type Sector = 'ict' | 'business'
export type DeptCode = 'se' | 'net' | 'fin' | 'ba'

export const DEPT_LABEL: Record<DeptCode, string> = {
  se: 'Software Engineering',
  net: 'Network & Info Management',
  fin: 'Finance',
  ba: 'Business Administration',
}

export interface RoleSpec {
  name: string
  sector: Sector
  dept: DeptCode
  skills: string[]
  /** Career ladder for the family this role belongs to (entry → senior). */
  ladder: string
}

/* ══════════ Employer requirements per role ══════════ */

export const ROLES: RoleSpec[] = [
  { name: 'Software Developer', sector: 'ict', dept: 'se', ladder: 'software', skills: ['Java', 'Python', 'JavaScript', 'React', 'Node.js', 'Git', 'REST APIs', 'Docker', 'CI/CD', 'Agile/Scrum', 'TypeScript', 'SQL'] },
  { name: 'Web Developer', sector: 'ict', dept: 'se', ladder: 'software', skills: ['HTML/CSS', 'JavaScript', 'React', 'Node.js', 'TypeScript', 'REST APIs', 'Responsive Design', 'Git', 'UI/UX', 'Tailwind/Bootstrap'] },
  { name: 'Mobile App Developer', sector: 'ict', dept: 'se', ladder: 'software', skills: ['React Native', 'Flutter', 'Swift/Kotlin', 'Mobile UI/UX', 'REST APIs', 'Git', 'App Store Deployment', 'Firebase'] },
  { name: 'Full-Stack Developer', sector: 'ict', dept: 'se', ladder: 'software', skills: ['JavaScript', 'React', 'Node.js', 'Python', 'SQL', 'REST APIs', 'Docker', 'Git', 'Cloud (AWS/Azure)', 'TypeScript'] },
  { name: 'Frontend Developer', sector: 'ict', dept: 'se', ladder: 'software', skills: ['JavaScript', 'TypeScript', 'React', 'HTML/CSS', 'Tailwind/Bootstrap', 'Git', 'Responsive Design', 'UI/UX', 'Testing (Jest)'] },
  { name: 'Backend Developer', sector: 'ict', dept: 'se', ladder: 'software', skills: ['Python', 'Java', 'Node.js', 'SQL', 'REST APIs', 'Docker', 'Cloud (AWS/Azure)', 'Git', 'Redis/Caching', 'Microservices'] },
  { name: 'Data Analyst', sector: 'ict', dept: 'se', ladder: 'data', skills: ['Python', 'SQL', 'Excel', 'Power BI/Tableau', 'Statistics', 'Data Visualization', 'R', 'ETL Processes'] },
  { name: 'Data Scientist', sector: 'ict', dept: 'se', ladder: 'data', skills: ['Python', 'Machine Learning', 'Statistics', 'SQL', 'TensorFlow/PyTorch', 'Data Visualization', 'Big Data', 'R'] },
  { name: 'Data Engineer', sector: 'ict', dept: 'se', ladder: 'data', skills: ['Python', 'SQL', 'Apache Spark', 'ETL Pipelines', 'Cloud (AWS/Azure)', 'Docker', 'Airflow', 'Data Warehousing'] },
  { name: 'Database Administrator', sector: 'ict', dept: 'se', ladder: 'data', skills: ['SQL', 'PL/SQL', 'Database Design', 'PostgreSQL/MySQL', 'MongoDB', 'Performance Tuning', 'Backup/Recovery', 'Cloud Databases'] },
  { name: 'Network Engineer', sector: 'ict', dept: 'net', ladder: 'infrastructure', skills: ['TCP/IP', 'Cisco/Juniper', 'Linux', 'Firewalls', 'Cloud Networking', 'VPN', 'Network Security', 'Wireless', 'CCNA/CCNP'] },
  { name: 'Systems Administrator', sector: 'ict', dept: 'net', ladder: 'infrastructure', skills: ['Linux', 'Windows Server', 'Cloud (AWS/Azure)', 'Docker/Kubernetes', 'Scripting (Bash/PowerShell)', 'Monitoring', 'Networking', 'Security'] },
  { name: 'DevOps Engineer', sector: 'ict', dept: 'net', ladder: 'infrastructure', skills: ['Docker', 'Kubernetes', 'CI/CD', 'Cloud (AWS/Azure)', 'Terraform', 'Linux', 'Git', 'Monitoring', 'Scripting'] },
  { name: 'Cybersecurity Analyst', sector: 'ict', dept: 'net', ladder: 'infrastructure', skills: ['Network Security', 'Penetration Testing', 'SIEM', 'Firewall Management', 'Incident Response', 'Compliance (ISO 27001)', 'Linux', 'Cryptography'] },
  { name: 'QA / Test Engineer', sector: 'ict', dept: 'se', ladder: 'software', skills: ['Test Automation', 'Selenium', 'Jest/Cypress', 'Manual Testing', 'API Testing', 'CI/CD', 'Agile/Scrum', 'Performance Testing'] },
  { name: 'IT Project Manager', sector: 'ict', dept: 'se', ladder: 'management', skills: ['Agile/Scrum', 'Jira', 'Risk Management', 'Stakeholder Communication', 'Budgeting', 'Team Leadership', 'MS Project', 'Documentation'] },
  { name: 'IT Business Analyst', sector: 'ict', dept: 'se', ladder: 'management', skills: ['Requirements Gathering', 'SQL', 'Excel', 'Data Analysis', 'Process Modeling', 'Stakeholder Management', 'Agile/Scrum', 'Documentation'] },
  { name: 'IT Officer', sector: 'ict', dept: 'net', ladder: 'infrastructure', skills: ['IT Support', 'Networking', 'Windows/Linux', 'Active Directory', 'Help Desk', 'Hardware Troubleshooting', 'Cloud Basics', 'Security Basics'] },
  { name: 'Machine Learning Engineer', sector: 'ict', dept: 'se', ladder: 'data', skills: ['Python', 'TensorFlow/PyTorch', 'Machine Learning', 'Deep Learning', 'NLP', 'Computer Vision', 'MLOps', 'Statistics'] },
  { name: 'Cloud Engineer', sector: 'ict', dept: 'net', ladder: 'infrastructure', skills: ['AWS/Azure/GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Linux', 'Networking', 'Security', 'Cost Optimization'] },
  { name: 'UI/UX Designer', sector: 'ict', dept: 'se', ladder: 'software', skills: ['Figma', 'Adobe XD', 'User Research', 'Wireframing', 'Prototyping', 'Design Systems', 'Accessibility', 'HTML/CSS'] },

  { name: 'Accountant', sector: 'business', dept: 'fin', ladder: 'finance', skills: ['IFRS', 'Financial Reporting', 'Tax Compliance', 'Excel (Advanced)', 'QuickBooks/Sage', 'Auditing Basics', 'ERP Systems', 'Regulatory Compliance'] },
  { name: 'Auditor', sector: 'business', dept: 'fin', ladder: 'finance', skills: ['Audit Standards (ISA)', 'Risk Assessment', 'Internal Controls', 'CAAT Tools', 'Excel', 'Financial Reporting', 'Compliance', 'Data Analytics'] },
  { name: 'Internal Auditor', sector: 'business', dept: 'fin', ladder: 'finance', skills: ['Internal Audit Standards (IIA)', 'Risk Assessment', 'Fraud Detection', 'CAAT Tools', 'Compliance Frameworks', 'Data Analytics', 'Report Writing', 'ERP Systems'] },
  { name: 'Financial Controller', sector: 'business', dept: 'fin', ladder: 'finance', skills: ['IFRS', 'Financial Planning', 'Budgeting', 'ERP Systems (SAP/Oracle)', 'Team Management', 'Treasury', 'Tax', 'Advanced Excel'] },
  { name: 'Bookkeeper', sector: 'business', dept: 'fin', ladder: 'finance', skills: ['Double-Entry Bookkeeping', 'QuickBooks/Sage', 'Bank Reconciliation', 'Payroll', 'Tax Filing', 'Excel', 'Accounts Payable/Receivable', 'Financial Records'] },
  { name: 'Finance Manager', sector: 'business', dept: 'fin', ladder: 'finance', skills: ['Financial Analysis', 'Budgeting & Forecasting', 'Risk Management', 'ERP Systems', 'Team Leadership', 'Strategic Planning', 'Cash Flow Management', 'Stakeholder Reporting'] },
  { name: 'Finance Officer', sector: 'business', dept: 'fin', ladder: 'finance', skills: ['Financial Reporting', 'Budget Monitoring', 'Grant Management', 'Excel', 'ERP Systems', 'Compliance', 'Payment Processing', 'Documentation'] },
  { name: 'Financial Analyst', sector: 'business', dept: 'fin', ladder: 'finance', skills: ['Financial Modeling', 'Excel (Advanced/VBA)', 'Power BI/Tableau', 'Valuation Techniques', 'Data Analysis', 'SQL', 'Presentation Skills', 'Industry Research'] },
  { name: 'Investment Manager', sector: 'business', dept: 'fin', ladder: 'finance', skills: ['Portfolio Management', 'Financial Modeling', 'Risk Analysis', 'Capital Markets', 'Due Diligence', 'Valuation', 'Regulatory Compliance', 'Bloomberg Terminal'] },
  { name: 'Credit Controller', sector: 'business', dept: 'fin', ladder: 'finance', skills: ['Credit Risk Assessment', 'Debt Collection', 'Negotiation', 'Financial Analysis', 'ERP Systems', 'Excel', 'Customer Relations', 'Regulatory Compliance'] },
  { name: 'Business Controller', sector: 'business', dept: 'fin', ladder: 'finance', skills: ['Management Accounting', 'Budgeting', 'Variance Analysis', 'ERP Systems', 'Financial Modeling', 'KPI Development', 'Cost Analysis', 'Business Intelligence'] },
  { name: 'CEO', sector: 'business', dept: 'ba', ladder: 'business', skills: ['Strategic Leadership', 'Corporate Governance', 'Financial Literacy', 'Stakeholder Management', 'Business Development', 'Change Management', 'Public Speaking', 'Board Relations'] },
  { name: 'Managing Director', sector: 'business', dept: 'ba', ladder: 'business', skills: ['Strategic Planning', 'P&L Management', 'Team Leadership', 'Business Development', 'Corporate Governance', 'Negotiation', 'Operations Management', 'Stakeholder Relations'] },
  { name: 'Project Manager', sector: 'business', dept: 'ba', ladder: 'business', skills: ['Agile/Scrum', 'MS Project/Jira', 'Risk Management', 'Stakeholder Communication', 'Budgeting', 'Team Leadership', 'Documentation', 'Problem Solving'] },
  { name: 'Marketing Manager', sector: 'business', dept: 'ba', ladder: 'business', skills: ['Digital Marketing', 'Market Research', 'Campaign Management', 'Google Analytics', 'Social Media Strategy', 'Brand Management', 'Content Strategy', 'Budget Management'] },
  { name: 'Sales Manager', sector: 'business', dept: 'ba', ladder: 'business', skills: ['Sales Strategy', 'CRM (Salesforce)', 'Negotiation', 'Team Leadership', 'Revenue Forecasting', 'Client Relations', 'Market Analysis', 'Presentation Skills'] },
  { name: 'Brand Manager', sector: 'business', dept: 'ba', ladder: 'business', skills: ['Brand Strategy', 'Market Research', 'Campaign Development', 'Budget Management', 'Consumer Insights', 'Design Thinking', 'Digital Marketing', 'Analytics'] },
  { name: 'Digital Marketer', sector: 'business', dept: 'ba', ladder: 'business', skills: ['SEO/SEM', 'Google Ads', 'Social Media Marketing', 'Content Creation', 'Analytics (GA4)', 'Email Marketing', 'A/B Testing', 'Marketing Automation'] },
  { name: 'Business Development', sector: 'business', dept: 'ba', ladder: 'business', skills: ['Market Analysis', 'Client Acquisition', 'Proposal Writing', 'Negotiation', 'CRM Tools', 'Strategic Partnerships', 'Networking', 'Financial Acumen'] },
]

export const ROLE_BY_NAME: Record<string, RoleSpec> = Object.fromEntries(ROLES.map((r) => [r.name, r]))
export const ROLE_NAMES = ROLES.map((r) => r.name)

/** Career ladders: entry → senior, with the skill that typically unlocks the next step. */
export const LADDERS: Record<string, { label: string; steps: { title: string; unlocks: string }[] }> = {
  software: {
    label: 'Software & product',
    steps: [
      { title: 'Junior Developer', unlocks: 'Core language + Git + SQL' },
      { title: 'Developer', unlocks: 'Frameworks, REST APIs, testing' },
      { title: 'Senior Developer', unlocks: 'System design, CI/CD, mentoring' },
      { title: 'Tech Lead', unlocks: 'Architecture, estimation, stakeholder communication' },
    ],
  },
  data: {
    label: 'Data & AI',
    steps: [
      { title: 'Data Analyst', unlocks: 'SQL, Excel, a BI tool' },
      { title: 'Data Engineer / Scientist', unlocks: 'Python, pipelines or ML fundamentals' },
      { title: 'Senior Data Professional', unlocks: 'Cloud data stack, MLOps, modelling at scale' },
      { title: 'Head of Data', unlocks: 'Data strategy, governance, team leadership' },
    ],
  },
  infrastructure: {
    label: 'Infrastructure & security',
    steps: [
      { title: 'IT Support / IT Officer', unlocks: 'Networking basics, Windows/Linux, help desk' },
      { title: 'Systems / Network Engineer', unlocks: 'CCNA, scripting, monitoring' },
      { title: 'Cloud / DevOps / Security Engineer', unlocks: 'Cloud certification, Terraform, SIEM' },
      { title: 'Infrastructure Lead', unlocks: 'Architecture, compliance, budgeting' },
    ],
  },
  management: {
    label: 'Delivery & analysis',
    steps: [
      { title: 'Business Analyst', unlocks: 'Requirements, process modelling' },
      { title: 'Project Coordinator', unlocks: 'Agile/Scrum, Jira, documentation' },
      { title: 'Project Manager', unlocks: 'Risk, budgeting, stakeholder management' },
      { title: 'Programme Manager', unlocks: 'Portfolio governance, PMP/PRINCE2' },
    ],
  },
  finance: {
    label: 'Finance & audit',
    steps: [
      { title: 'Bookkeeper / Finance Officer', unlocks: 'Double-entry, Excel, ERP basics' },
      { title: 'Accountant / Auditor', unlocks: 'IFRS, tax, audit standards' },
      { title: 'Finance Manager / Controller', unlocks: 'Budgeting, planning, team management' },
      { title: 'CFO / Finance Director', unlocks: 'Treasury, strategy, board reporting' },
    ],
  },
  business: {
    label: 'Business & marketing',
    steps: [
      { title: 'Officer / Executive', unlocks: 'Market research, CRM, communication' },
      { title: 'Manager', unlocks: 'Campaign or sales management, budgeting' },
      { title: 'Senior Manager', unlocks: 'Strategy, P&L ownership' },
      { title: 'Managing Director / CEO', unlocks: 'Governance, change management, board relations' },
    ],
  },
}

/** Certifications worth pursuing for a role family, and where in the pathway to take them. */
export const CERTIFICATIONS: Record<string, { name: string; when: string }[]> = {
  software: [{ name: 'AWS Certified Cloud Practitioner', when: 'After core development skills' }],
  data: [
    { name: 'Microsoft Power BI Data Analyst (PL-300)', when: 'Early — proves BI skills for analyst roles' },
    { name: 'Google Data Analytics Certificate', when: 'Early — good portfolio starter' },
  ],
  infrastructure: [
    { name: 'Cisco CCNA', when: 'Before applying for network roles' },
    { name: 'CompTIA Security+', when: 'Before security roles' },
    { name: 'AWS / Azure Associate', when: 'After Linux + networking basics' },
  ],
  management: [
    { name: 'Scrum Master (PSM I)', when: 'Early — cheap and widely asked for' },
    { name: 'PMP / PRINCE2', when: 'After 2+ years delivering projects' },
  ],
  finance: [
    { name: 'ACCA / CPA Rwanda', when: 'Start while studying; finish within 2–3 years' },
    { name: 'CIA (Certified Internal Auditor)', when: 'For internal-audit tracks' },
  ],
  business: [
    { name: 'Google Digital Marketing & E-commerce', when: 'Early — for marketing roles' },
    { name: 'CIM / HubSpot certifications', when: 'Mid-career, to move into management' },
  ],
}

/* ══════════ What each AUCA department teaches ══════════ */

export const DEPT_CURRICULA: Record<DeptCode, Set<string>> = {
  se: new Set([
    'Java', 'Python', '.NET', 'C#', 'PL/SQL', 'SQL', 'HTML/CSS', 'JavaScript', 'React',
    'Data Structures', 'Algorithms', 'Operating Systems', 'DBMS', 'Database Design',
    'Software Engineering', 'Design Patterns', 'Software Testing', 'Project Management',
    'Statistics', 'Probability', 'Computer Networks', 'Mathematics', 'Discrete Mathematics',
    'Git', 'Agile/Scrum', 'Java/SpringBoot', 'REST APIs',
  ]),
  net: new Set([
    'TCP/IP', 'Networking', 'LAN/WAN', 'Network Administration', 'Windows Server', 'Linux',
    'SQL', 'DBMS', 'Database Design', 'IT Support', 'Help Desk', 'Hardware Troubleshooting',
    'Operating Systems', 'System Administration', 'HTML/CSS', 'Visual Basic',
    'Information Systems', 'Computer Networks', 'Project Management', 'Statistics', 'Mathematics',
    'Network Security', 'Penetration Testing',
  ]),
  fin: new Set([
    'Financial Accounting', 'Principles of Accounting', 'Auditing', 'Tax', 'IFRS', 'Corporate Finance',
    'Investment', 'Banking', 'Financial Analysis', 'Budgeting', 'Economics', 'Business Law',
    'Business Ethics', 'Statistics', 'Mathematics', 'Communication', 'English', 'French',
    'Entrepreneurship', 'Project Management',
  ]),
  ba: new Set([
    'Principles of Management', 'Strategic Management', 'Operations', 'HR Management',
    'Organizational Behavior', 'Leadership', 'Marketing Principles', 'Market Research',
    'Principles of Accounting', 'Economics', 'Business Law', 'Business Ethics', 'Business Communication',
    'Statistics', 'Mathematics', 'Entrepreneurship', 'Project Management', 'Communication',
    'English', 'French', 'Negotiation',
  ]),
}

/** The same curricula keyed by department name, for pages that work with the labels. */
export const DEPT_CURRICULA_BY_LABEL: Record<string, Set<string>> = Object.fromEntries(
  (Object.keys(DEPT_LABEL) as DeptCode[]).map((c) => [DEPT_LABEL[c], DEPT_CURRICULA[c]]),
)

/* ══════════ AUCA Innovation Center courses ══════════ */

export interface InnovationCourse {
  skills: string[]
  desc: string
  duration_weeks: number
}

export const INNOVATION_COURSES: Record<string, InnovationCourse> = {
  'Cloud Computing': { skills: ['AWS/Azure/GCP', 'Docker', 'Kubernetes', 'Terraform', 'CI/CD', 'Cost Optimization'], desc: 'Cloud platforms, containerization, and infrastructure as code', duration_weeks: 8 },
  'Cybersecurity': { skills: ['SIEM', 'Firewall Management', 'Incident Response', 'Compliance (ISO 27001)', 'Cryptography', 'Ethical Hacking'], desc: 'Advanced security frameworks, SIEM tools, and incident response', duration_weeks: 6 },
  'UI/UX Design': { skills: ['Figma', 'Adobe XD', 'User Research', 'Wireframing', 'Prototyping', 'Design Systems', 'Accessibility'], desc: 'User-centered design, prototyping, and design systems', duration_weeks: 6 },
  'Data Science & AI': { skills: ['Machine Learning', 'TensorFlow/PyTorch', 'Deep Learning', 'NLP', 'Computer Vision', 'Data Visualization', 'MLOps'], desc: 'Machine learning, deep learning, and AI model deployment', duration_weeks: 10 },
  'Web Development': { skills: ['TypeScript', 'Node.js', 'Tailwind/Bootstrap', 'Responsive Design', 'Testing (Jest)', 'Microservices'], desc: 'Modern full-stack development with TypeScript and Node.js', duration_weeks: 8 },
  'Mobile Development': { skills: ['React Native', 'Flutter', 'Swift/Kotlin', 'Mobile UI/UX', 'Firebase', 'App Store Deployment'], desc: 'Cross-platform and native mobile app development', duration_weeks: 8 },
  'DevOps & CI/CD': { skills: ['Docker', 'Kubernetes', 'CI/CD', 'Terraform', 'Monitoring', 'Scripting (Bash/PowerShell)'], desc: 'Deployment pipelines, container orchestration, and monitoring', duration_weeks: 6 },
  'Entrepreneurship & Innovation': { skills: ['Business Development', 'Market Analysis', 'Proposal Writing', 'Strategic Partnerships', 'Financial Acumen', 'Design Thinking'], desc: 'Startup methodology, business model canvas, and venture building', duration_weeks: 6 },
  'Database & Data Engineering': { skills: ['PostgreSQL/MySQL', 'MongoDB', 'Performance Tuning', 'Cloud Databases', 'Data Warehousing', 'ETL Pipelines'], desc: 'Advanced database management, NoSQL, and data pipelines', duration_weeks: 8 },
  'Digital Marketing & Analytics': { skills: ['SEO/SEM', 'Google Analytics', 'Social Media Marketing', 'Content Creation', 'Email Marketing', 'Marketing Automation', 'A/B Testing'], desc: 'Data-driven marketing, SEO, and campaign analytics', duration_weeks: 6 },
  'Financial Technology': { skills: ['ERP Systems', 'Financial Modeling', 'Power BI/Tableau', 'Advanced Excel', 'CAAT Tools', 'Bloomberg Terminal'], desc: 'FinTech tools, ERP systems, and financial data analytics', duration_weeks: 6 },
  'Project Management (Advanced)': { skills: ['Jira', 'MS Project', 'Risk Management', 'Stakeholder Communication', 'Budgeting', 'Team Leadership'], desc: 'Agile certification prep, Jira mastery, and stakeholder management', duration_weeks: 6 },
}

/* ══════════ Matching ══════════ */

const escapeRe = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

/** Whole-word match, so "C" never matches "Cloud". Very short names only match exactly. */
export function isSkillTaught(skill: string, taughtSet: Set<string>): boolean {
  const lower = skill.toLowerCase()
  for (const t of taughtSet) {
    const tl = t.toLowerCase()
    if (tl === lower) return true
    if (tl.length <= 2 || lower.length <= 2) continue
    const wb = (hay: string, needle: string) => new RegExp(`\\b${escapeRe(needle)}\\b`, 'i').test(hay)
    if (wb(lower, tl) || wb(tl, lower)) return true
  }
  return false
}

export const hasSkill = (studentSkills: string[], required: string): boolean =>
  isSkillTaught(required, new Set(studentSkills))

/** Every distinct skill known to the catalogue, grouped for the skill-picker checkboxes. */
export const SKILL_CATEGORIES: { label: string; skills: string[] }[] = (() => {
  const all = new Set<string>()
  for (const r of ROLES) r.skills.forEach((s) => all.add(s))
  for (const set of Object.values(DEPT_CURRICULA)) set.forEach((s) => all.add(s))
  const pick = (re: RegExp) => [...all].filter((s) => re.test(s)).sort()
  const groups: { label: string; re: RegExp }[] = [
    { label: 'Programming & web', re: /^(Java|Python|JavaScript|TypeScript|React|Node\.js|HTML\/CSS|REST APIs|Git|C#|\.NET|R|SQL|PL\/SQL|Tailwind\/Bootstrap|Responsive Design|Testing \(Jest\)|Microservices|Java\/SpringBoot|Visual Basic)/ },
    { label: 'Data & AI', re: /(Machine Learning|Deep Learning|TensorFlow|NLP|Computer Vision|MLOps|Statistics|Data |Big Data|ETL|Spark|Airflow|Power BI|Excel|Database|PostgreSQL|MongoDB|DBMS|Probability)/ },
    { label: 'Cloud, DevOps & networking', re: /(AWS|Cloud|Docker|Kubernetes|Terraform|CI\/CD|Linux|Windows|Network|TCP|Cisco|VPN|Wireless|CCNA|Monitoring|Scripting|LAN|Firewall|Redis)/ },
    { label: 'Security', re: /(Security|SIEM|Incident|Penetration|Cryptography|Ethical|ISO 27001)/ },
    { label: 'Design & mobile', re: /(Figma|Adobe|UI\/UX|Wireframing|Prototyping|Design|Accessibility|User Research|React Native|Flutter|Swift|Mobile|Firebase|App Store)/ },
    { label: 'Finance & accounting', re: /(IFRS|Account|Audit|Tax|Financ|Budget|ERP|QuickBooks|Payroll|Treasury|Valuation|Portfolio|Capital|Credit|Fraud|CAAT|Bloomberg|Investment|Banking|Corporate Finance|Cash Flow|Variance|Bookkeeping|Bank|Cost)/ },
    { label: 'Business & marketing', re: /(Marketing|Market |Brand|Sales|SEO|Google|Social Media|Content|Campaign|CRM|Business|Client|Proposal|Consumer|Revenue|Entrepreneurship|Strategic|Operations|HR |Organizational)/ },
    { label: 'Management & soft skills', re: /(Agile|Jira|MS Project|Project|Risk|Stakeholder|Leadership|Team|Negotiation|Communication|Documentation|Presentation|Problem Solving|Governance|Change|Public Speaking|English|French|Ethics|Economics|Law|Mathematics|Management)/ },
  ]
  const used = new Set<string>()
  const out = groups.map((g) => {
    const skills = pick(g.re).filter((s) => !used.has(s))
    skills.forEach((s) => used.add(s))
    return { label: g.label, skills }
  })
  const rest = [...all].filter((s) => !used.has(s)).sort()
  if (rest.length) out.push({ label: 'Other', skills: rest })
  return out.filter((g) => g.skills.length)
})()

/* ══════════ Assessment ══════════ */

export interface ClientAssessment {
  target_role: string
  readiness_score: number
  matched_skills: string[]
  missing_skills: string[]
  /** Student skills the role does not ask for. */
  other_skills: string[]
  recommendations: string[]
  alternative_roles: { role: string; score: number }[]
  priority_skills: PrioritySkill[]
}

export function scoreRole(studentSkills: string[], roleName: string): { score: number; matched: string[]; missing: string[] } {
  const role = ROLE_BY_NAME[roleName]
  if (!role || !role.skills.length) return { score: 0, matched: [], missing: [] }
  const matched = role.skills.filter((s) => hasSkill(studentSkills, s))
  const missing = role.skills.filter((s) => !matched.includes(s))
  return { score: Math.round((matched.length / role.skills.length) * 1000) / 10, matched, missing }
}

/** The Innovation Center course that covers the most of `skills`, if any covers at least one. */
export function bestCourseFor(skills: string[]): { course: string; covers: string[] } | null {
  let best: { course: string; covers: string[] } | null = null
  for (const [course, c] of Object.entries(INNOVATION_COURSES)) {
    const covers = skills.filter((s) => c.skills.some((cs) => isSkillTaught(s, new Set([cs]))))
    if (covers.length && (!best || covers.length > best.covers.length)) best = { course, covers }
  }
  return best
}

const SELF_STUDY_WEEKS = 3

/** Where a skill is taught and about how many weeks it takes: the Innovation Center course, else self-study. */
export function skillLearning(skill: string): { source: string; weeks: number } {
  const found = Object.entries(INNOVATION_COURSES).find(([, c]) => c.skills.some((cs) => isSkillTaught(skill, new Set([cs]))))
  if (!found) return { source: 'Self-study / online certification', weeks: SELF_STUDY_WEEKS }
  return { source: `Innovation Center: ${found[0]}`, weeks: Math.max(1, Math.ceil(found[1].duration_weeks / found[1].skills.length)) }
}

/**
 * Offline stand-in for the server's ranking. The server orders gaps by how many postings ask for them per week of study;
 * without posting data the browser can only put the quickest-to-learn gaps first.
 */
export function priorityFallback(missing: string[], limit = 5): PrioritySkill[] {
  return missing
    .map((skill) => ({ skill, postings: null, ...skillLearning(skill) }))
    .sort((a, b) => a.weeks - b.weeks || a.skill.localeCompare(b.skill))
    .slice(0, limit)
}

export function assessStudent(studentSkills: string[], targetRole: string): ClientAssessment {
  const { score, matched, missing } = scoreRole(studentSkills, targetRole)
  const role = ROLE_BY_NAME[targetRole]
  const other = role ? studentSkills.filter((s) => !role.skills.some((rs) => isSkillTaught(rs, new Set([s])))) : studentSkills

  const alternatives = ROLES.filter((r) => r.name !== targetRole)
    .map((r) => ({ role: r.name, score: scoreRole(studentSkills, r.name).score }))
    .filter((a) => a.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)

  const recommendations: string[] = []
  if (!role) {
    recommendations.push('This role is not in the SkillSense catalogue yet, so it cannot be scored.')
  } else if (!missing.length) {
    recommendations.push(`Fully matched for ${targetRole}. Focus on projects, a portfolio and applications.`)
  } else {
    const next = priorityFallback(missing, 2).map((p) => p.skill)
    recommendations.push(
      `${Math.round(score)}% ready for ${targetRole}. To get past 90%, focus on ${next.join(' and ')}.`,
    )
    const course = bestCourseFor(missing)
    if (course) {
      recommendations.push(
        `The Innovation Center's ${course.course} course covers ${course.covers.slice(0, 4).join(', ')}${course.covers.length > 4 ? ' and more' : ''}.`,
      )
    }
    if (matched.length) {
      recommendations.push(`Build on what you already have: ${matched.slice(0, 3).join(', ')}.`)
    }
  }
  if (alternatives[0] && role && alternatives[0].score > score) {
    recommendations.push(`${alternatives[0].role} is a closer match today (${alternatives[0].score}%). Worth a conversation.`)
  }

  return {
    target_role: targetRole,
    readiness_score: score,
    matched_skills: matched,
    missing_skills: missing,
    other_skills: other,
    recommendations,
    alternative_roles: alternatives,
    priority_skills: priorityFallback(missing),
  }
}

/* ══════════ Pathways ══════════ */

export interface PathwayStepDraft {
  skill: string
  source: string
  duration_weeks: number
  completed: boolean
}

export type PathwayMode = 'balanced' | 'fast' | 'part-time'

export const PATHWAY_MODES: Record<PathwayMode, { label: string; blurb: string; factor: number }> = {
  fast: { label: 'Fast track', blurb: 'Full-time intensive training', factor: 0.6 },
  balanced: { label: 'Standard', blurb: 'Course schedule as published', factor: 1 },
  'part-time': { label: 'Part-time', blurb: 'Alongside studies or work', factor: 1.8 },
}

export function generatePathway(studentSkills: string[], targetRole: string, mode: PathwayMode = 'balanced'): PathwayStepDraft[] {
  const { missing } = scoreRole(studentSkills, targetRole)
  const factor = PATHWAY_MODES[mode].factor
  const weeks = (n: number) => Math.max(1, Math.round(n * factor))
  return missing.map((skill) => {
    const found = Object.entries(INNOVATION_COURSES).find(([, c]) => c.skills.some((cs) => isSkillTaught(skill, new Set([cs]))))
    return {
      skill,
      source: found ? `Innovation Center: ${found[0]}` : 'Self-study / online certification',
      duration_weeks: weeks(found ? Math.ceil(found[1].duration_weeks / found[1].skills.length) : 3),
      completed: false,
    }
  })
}

export const pathwayMonths = (steps: { duration_weeks: number }[]): number =>
  Math.max(1, Math.ceil(steps.reduce((n, s) => n + s.duration_weeks, 0) / 4.345))

export const pathwayProgress = (steps: { completed: boolean }[]): number =>
  steps.length ? Math.round((steps.filter((s) => s.completed).length / steps.length) * 1000) / 10 : 0

/* ══════════ Job-posting skill extraction ══════════ */

/** Catalogue skills whose names appear in free text (a posting's title/description). */
export function skillsInText(text: string): string[] {
  const hay = text.toLowerCase()
  const found = new Set<string>()
  for (const r of ROLES) {
    for (const s of r.skills) {
      // "Cloud (AWS/Azure)" -> test the parts people actually write: the whole name and each "/" alternative
      const variants = [s, ...s.replace(/[()]/g, '/').split('/').map((v) => v.trim())].filter((v) => v.length > 2)
      if (variants.some((v) => new RegExp(`(^|[^a-z0-9])${escapeRe(v.toLowerCase())}([^a-z0-9]|$)`).test(hay))) found.add(s)
    }
  }
  return [...found]
}

/** Best catalogue role for a posting title. */
export function roleForTitle(title: string): RoleSpec | null {
  const t = title.toLowerCase()
  let best: { role: RoleSpec; len: number } | null = null
  for (const r of ROLES) {
    const n = r.name.toLowerCase()
    const alias = n.replace(/-/g, ' ')
    if ((t.includes(n) || t.includes(alias)) && (!best || n.length > best.len)) best = { role: r, len: n.length }
  }
  return best?.role ?? null
}
