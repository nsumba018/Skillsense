export default function QuoteSection() {
  return (
    <section className="py-20">
      <div className="container-1200">
        <div className="bg-navy rounded-3xl py-16 px-8 max-w-4xl mx-auto text-center">
          <p className="text-[11px] font-bold uppercase tracking-wider text-white/60 mb-6">Our method</p>
          <blockquote className="text-lg md:text-2xl text-white font-medium leading-relaxed mb-8">
            Historical data trains the model. Current job postings validate it. Only then do both
            produce a forecast, so every projection is checked against today's real market.
          </blockquote>
          <p className="text-white/70 text-sm">
            22 years of labour data · 92 real ICT postings · rank correlation 0.99 on validation
          </p>
        </div>
      </div>
    </section>
  )
}
