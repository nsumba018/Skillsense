import { ArrowUpRight } from 'lucide-react'

/**
 * Photos are from Wikimedia Commons; each carries its author and licence in the corner and in the footer.
 * Files live in /public/images/landing (see credits.json there).
 */
export const PHOTO_CREDITS = {
  dome: {
    src: '/images/landing/convention-centre.jpg',
    author: 'Igiraneza Divine',
    license: 'CC0',
    href: 'https://commons.wikimedia.org/wiki/File:Kigali_Convention_Centre.jpg',
    licenseHref: 'https://creativecommons.org/publicdomain/zero/1.0/',
    alt: 'The Kigali Convention Centre dome rising above gardens',
  },
  students: {
    src: '/images/landing/students-research.jpg',
    author: 'Claude Nizeyimana',
    license: 'CC BY-SA 4.0',
    href: 'https://commons.wikimedia.org/wiki/File:Final_year_students_defending_their_research_projects_in_Rwanda.jpg',
    licenseHref: 'https://creativecommons.org/licenses/by-sa/4.0/',
    alt: 'Final-year students presenting their research project to a panel in a Rwandan classroom',
  },
  skyline: {
    src: '/images/landing/kigali-skyline.jpg',
    author: 'Honeybarger',
    license: 'CC BY-SA 4.0',
    href: 'https://commons.wikimedia.org/wiki/File:Kigali_skyline.jpg',
    licenseHref: 'https://creativecommons.org/licenses/by-sa/4.0/',
    alt: 'Kigali rolling hills and city seen from above',
  },
} as const

type Photo = (typeof PHOTO_CREDITS)[keyof typeof PHOTO_CREDITS]

function Figure({ photo, kicker, title, text, className = '', imgClass = '' }: {
  photo: Photo
  kicker: string
  title: string
  text: string
  className?: string
  imgClass?: string
}) {
  return (
    <figure className={`group relative isolate overflow-hidden rounded-3xl bg-navy ${className}`}>
      <img
        src={photo.src}
        alt={photo.alt}
        loading="lazy"
        decoding="async"
        className={`absolute inset-0 -z-10 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${imgClass}`}
      />
      <div className="absolute inset-0 -z-10 bg-gradient-to-t from-dark-navy/95 via-navy/70 to-navy/25" aria-hidden />
      <figcaption className="flex h-full flex-col justify-end p-6 text-white sm:p-8">
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-blue-200">{kicker}</p>
        <h3 className="mt-2 text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">{title}</h3>
        <p className="mt-2 max-w-md text-sm leading-relaxed text-blue-50/90">{text}</p>
        <a
          href={photo.href}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-4 inline-flex w-fit items-center gap-1 text-[10px] font-medium text-white/60 hover:text-white"
        >
          Photo: {photo.author} · {photo.license} <ArrowUpRight className="h-3 w-3" />
        </a>
      </figcaption>
    </figure>
  )
}

export default function RootedInRwanda() {
  const { dome, students, skyline } = PHOTO_CREDITS
  return (
    <section id="rwanda" className="scroll-mt-20 py-20 sm:py-28">
      <div className="container-1200">
        <div className="mx-auto mb-12 max-w-2xl text-center sm:mb-16">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">Rooted in Rwanda</p>
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-5xl">Built for the people shaping the workforce</h2>
          <p className="mt-4 text-base leading-relaxed text-gray-500 sm:text-lg">
            From the classroom to the labour market, SkillSense keeps education and employment looking at the same picture.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-5 lg:grid-cols-3 lg:grid-rows-2">
          <Figure
            photo={dome}
            kicker="Built in Kigali"
            title="Forecasts for the sectors driving Rwanda's economy"
            text="Twenty-two ICT roles and nine sectors, forecast from labour-survey history and live job postings."
            className="min-h-[360px] lg:col-span-2 lg:row-span-2 lg:min-h-[560px]"
          />
          <Figure
            photo={students}
            kicker="For advisors and planners"
            title="Plans that start with the student in front of you"
            text="Assess skills, close gaps and track who gets placed."
            className="min-h-[300px] lg:min-h-0"
            imgClass="object-[30%_50%]"
          />
          <Figure
            photo={skyline}
            kicker="Evidence, not guesswork"
            title="Checked against real postings"
            text="Every forecast is validated against live job ads from Rwandan job boards."
            className="min-h-[300px] lg:min-h-0"
          />
        </div>
      </div>
    </section>
  )
}
