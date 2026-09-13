export default function QuoteSection() {
  return (
    <section className="py-20">
      <div className="container-1200">
        <div className="bg-navy rounded-3xl py-16 px-8 max-w-4xl mx-auto text-center">
          <svg className="w-10 h-10 text-white/30 mx-auto mb-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
          </svg>
          <blockquote className="text-lg md:text-2xl text-white font-medium leading-relaxed mb-8">
            "The Intelligence Hub is not just a dashboard; it is the fundamental
            infrastructure for our Vision 2050. By understanding our skills gap today,
            we build the workforce for tomorrow."
          </blockquote>
          <div>
            <p className="text-white font-semibold">Director of Employment</p>
            <p className="text-white/70 text-sm">Ministry of Public Service and Labour (MIFOTRA)</p>
          </div>
        </div>
      </div>
    </section>
  )
}
