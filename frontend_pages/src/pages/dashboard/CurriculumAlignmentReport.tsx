import { GraduationCap, Sparkles, TrendingUp } from 'lucide-react'
import { Block, DataTable, Kpi, KpiRow } from '../../components/ui/reportKit'
import { HBarChart, GREEN, AMBER, RED } from '../../components/ui/reportCharts'
import { DEPT_CURRICULA, DEPT_LABEL, isSkillTaught, type DeptCode } from '../../data/auca-skills'

/** Skills employers ask for, per department (what the curriculum is compared against). */
const MARKET_SKILLS: Record<DeptCode, string[]> = {
  se: [
    'Java', 'Python', 'JavaScript', 'TypeScript', 'React', 'Node.js', 'Git', 'REST APIs',
    'Docker', 'CI/CD', 'Agile/Scrum', 'SQL', 'Cloud (AWS/Azure)', 'Microservices',
    'Machine Learning', 'TensorFlow/PyTorch', 'Data Visualization', 'Power BI/Tableau',
    'Figma', 'UI/UX', 'Testing (Jest)', 'Responsive Design', 'MongoDB',
  ],
  net: [
    'TCP/IP', 'Linux', 'Windows Server', 'Network Security', 'Penetration Testing',
    'Cloud (AWS/Azure)', 'Docker', 'Kubernetes', 'CI/CD', 'Terraform',
    'SIEM', 'Firewall Management', 'Incident Response', 'Compliance (ISO 27001)',
    'Monitoring', 'Scripting (Bash/PowerShell)', 'VPN', 'Cloud Networking',
  ],
  fin: [
    'IFRS', 'Financial Reporting', 'Tax', 'Auditing', 'ERP Systems',
    'Financial Modeling', 'Excel (Advanced/VBA)', 'Power BI/Tableau',
    'CAAT Tools', 'Fraud Detection', 'Risk Management', 'Budgeting',
    'Corporate Finance', 'Investment', 'Financial Analysis',
  ],
  ba: [
    'Strategic Management', 'HR Management', 'Project Management', 'Leadership',
    'Digital Marketing', 'SEO/SEM', 'Google Analytics', 'Social Media Marketing',
    'CRM (Salesforce)', 'Negotiation', 'Market Research',
    'Agile/Scrum', 'Jira', 'Team Leadership', 'Stakeholder Communication',
  ],
}

export const DEPTS: DeptCode[] = ['se', 'net', 'fin', 'ba']
const FACULTY: Record<DeptCode, string> = { se: 'IT', net: 'IT', fin: 'Business', ba: 'Business' }

const toneOf = (pct: number) => (pct >= 70 ? 'emerald' : pct >= 40 ? 'amber' : 'red')
const COLOR = { emerald: GREEN, amber: AMBER, red: RED } as const
const BADGE = { emerald: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-600' } as const

function analyse(dept: DeptCode) {
  const curriculum = DEPT_CURRICULA[dept]
  const market = MARKET_SKILLS[dept]
  const covered = market.filter((s) => isSkillTaught(s, curriculum))
  const gaps = market.filter((s) => !isSkillTaught(s, curriculum))
  const pct = market.length ? Math.round((covered.length / market.length) * 100) : 0
  return { market, covered, gaps, pct }
}

export const curriculumMeta = `4 departments · ${DEPTS.reduce((n, d) => n + MARKET_SKILLS[d].length, 0)} market-demanded skills analysed`

/** Body of the curriculum-alignment report (the banner comes from the report builder). */
export default function CurriculumAlignmentReport() {
  const rows = DEPTS.map((d) => ({ d, ...analyse(d) }))
  const overall = Math.round(rows.reduce((n, r) => n + r.pct, 0) / rows.length)
  const best = [...rows].sort((a, b) => b.pct - a.pct)[0]
  const worst = [...rows].sort((a, b) => a.pct - b.pct)[0]
  const totalGaps = rows.reduce((n, r) => n + r.gaps.length, 0)

  return (
    <div data-testid="report-curriculum" className="space-y-8">
      <KpiRow>
        <Kpi label="Average alignment" value={`${overall}%`} note="across the four departments" />
        <Kpi label="Best aligned" value={`${best.pct}%`} note={DEPT_LABEL[best.d]} tone="text-emerald-600" />
        <Kpi label="Needs most work" value={`${worst.pct}%`} note={DEPT_LABEL[worst.d]} tone="text-red-500" />
        <Kpi label="Skill gaps" value={totalGaps} note="demanded but not taught" />
      </KpiRow>

      <Block title="Alignment by department" hint="Share of employer-demanded skills the curriculum teaches." icon={TrendingUp}>
        <HBarChart
          nameWidth={190}
          format={(v) => `${v}%`}
          data={rows.map((r) => ({ name: DEPT_LABEL[r.d], value: r.pct, color: COLOR[toneOf(r.pct)] }))}
        />
      </Block>

      <Block title="Department overview">
        <DataTable head={['Department', 'Faculty', 'Market skills', 'Covered', 'Gaps', 'Alignment']} minWidth={620}>
          {rows.map((r) => (
            <tr key={r.d}>
              <td className="font-bold text-gray-900">{DEPT_LABEL[r.d]}</td>
              <td className="text-gray-600">{FACULTY[r.d]}</td>
              <td className="text-gray-700">{r.market.length}</td>
              <td className="font-bold text-emerald-600">{r.covered.length}</td>
              <td className="font-bold text-red-500">{r.gaps.length}</td>
              <td><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${BADGE[toneOf(r.pct)]}`}>{r.pct}%</span></td>
            </tr>
          ))}
        </DataTable>
      </Block>

      {rows.map(({ d, covered, gaps, pct }) => (
        <Block key={d} title={DEPT_LABEL[d]} icon={GraduationCap}>
          <div className="rounded-xl border border-gray-100 p-4">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700">Covered ({covered.length})</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {covered.map((s) => <span key={s} className="rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-medium text-emerald-700">{s}</span>)}
                  {covered.length === 0 && <span className="text-xs text-gray-400">None</span>}
                </div>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-red-600">Gaps: not in curriculum ({gaps.length})</span>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {gaps.map((s) => <span key={s} className="rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-medium text-red-600">{s}</span>)}
                  {gaps.length === 0 && <span className="text-xs text-gray-400">Fully covered</span>}
                </div>
              </div>
            </div>
            {gaps.length > 0 && (
              <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50/50 p-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-800">Recommendation · {pct}% aligned</span>
                </div>
                <p className="mt-1 text-sm text-amber-900">
                  {gaps.length <= 3
                    ? `Add ${gaps.join(', ')} to the ${DEPT_LABEL[d]} curriculum to reach full market alignment.`
                    : `Prioritise adding ${gaps.slice(0, 3).join(', ')} to the ${DEPT_LABEL[d]} curriculum. ${gaps.length - 3} more skills are still missing; consider covering them through Innovation Center training or electives.`}
                </p>
              </div>
            )}
          </div>
        </Block>
      ))}
    </div>
  )
}
