const skills = [
  { name: 'Data Analysis', percentage: 82, count: '8.2K', color: '#1E4ED8' },
  { name: 'Python', percentage: 67, count: '6.7K', color: '#3B82F6' },
  { name: 'Digital Marketing', percentage: 51, count: '5.1K', color: '#60A5FA' },
]

export default function TopSkills() {
  return (
    <div>
      <h4 className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-3">Top In-Demand Skills</h4>
      <div className="space-y-2.5">
        {skills.map((skill) => (
          <div key={skill.name}>
            <div className="flex justify-between items-center text-[11px] mb-0.5">
              <span className="text-gray-700">{skill.name}</span>
              <span className="text-gray-500">{skill.count}</span>
            </div>
            <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${skill.percentage}%`, backgroundColor: skill.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
