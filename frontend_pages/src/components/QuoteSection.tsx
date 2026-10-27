export default function QuoteSection() {
  return (
    <section className="py-20">
      <div className="container-1200">
        <div className="relative isolate overflow-hidden bg-navy rounded-3xl py-16 px-8 max-w-4xl mx-auto text-center">
          <div className="pointer-events-none absolute -left-12 -top-12 -z-10 h-48 w-48 rounded-full bg-white/5 blur-2xl" aria-hidden />
          <div className="pointer-events-none absolute -right-16 -bottom-16 -z-10 h-56 w-56 rounded-full bg-accent/10 blur-3xl" aria-hidden />
          <svg className="w-10 h-10 text-white/20 mx-auto mb-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
          <blockquote className="text-lg md:text-2xl text-white font-medium leading-relaxed mb-8">
            "Understanding Rwanda's skills gap today is how we build the workforce
            for Vision 2050. SkillSense gives us the evidence to act — not guess."
          </blockquote>
          <div>
            <p className="text-white font-semibold">Directorate of Employment</p>
            <p className="text-white/60 text-sm">Ministry of Public Service and Labour (MIFOTRA)</p>
          </div>
        </div>
      </div>
    </section>
  )
}
