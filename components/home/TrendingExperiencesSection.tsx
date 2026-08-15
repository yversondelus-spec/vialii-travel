import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { FEATURED_DESTINATIONS } from '@/constants/destinations'

const COST_LABEL: Record<string, string> = {
  cheap: 'Presupuesto bajo',
  moderate: 'Presupuesto medio',
  expensive: 'Presupuesto alto',
}

interface ExperiencePreview {
  destinationId: string
  category: string
  icon: string
  title: string
  description: string
  hashtags: string[]
  /** Overrides the destination's generic hero photo with one more specific to this experience. HTTP-verified before adding — see constants/destinations.ts for why that matters. */
  image?: string
}

// Curated by VIALII, not user-submitted — real destinations (see
// constants/destinations.ts, images individually verified there), framed as
// editorial experience ideas rather than live bookable listings. No
// enrollment counts / reviews / named testimonials here: there's no backing
// system for any of that yet, and inventing them would just be fake social
// proof. See lib/types/experience.ts territory for when that becomes real.
export const EXPERIENCE_PREVIEWS: ExperiencePreview[] = [
  {
    destinationId: 'bali',
    category: 'Wellness',
    icon: '🧘',
    title: 'Semana de bienestar en Bali',
    description: 'Yoga al amanecer, templos espirituales y arrozales verdes. Ideal para desconectar de verdad.',
    hashtags: ['#Bali', '#Wellness'],
  },
  {
    destinationId: 'nueva-zelanda',
    category: 'Adventure',
    icon: '🏔️',
    title: 'Adrenalina en Queenstown',
    description: 'La capital mundial del deporte de aventura: bungee, trekking y paisajes que no se olvidan.',
    hashtags: ['#Queenstown', '#Adventure'],
  },
  {
    destinationId: 'marrakech',
    category: 'Culture',
    icon: '🎨',
    title: 'Inmersión cultural en Marrakech',
    description: 'Zocos, colores y una medina que parece sacada de otro tiempo.',
    hashtags: ['#Marrakech', '#Culture'],
  },
]

/** Resolves each preview against FEATURED_DESTINATIONS, dropping any whose destinationId doesn't match (shouldn't happen, but keeps this from crashing if the constants ever drift). */
export function getResolvedExperiences() {
  return EXPERIENCE_PREVIEWS.map((preview) => {
    const destination = FEATURED_DESTINATIONS.find((d) => d.id === preview.destinationId)
    return destination ? { preview, destination } : null
  }).filter((x): x is { preview: ExperiencePreview; destination: (typeof FEATURED_DESTINATIONS)[number] } => x !== null)
}

type ResolvedExperience = ReturnType<typeof getResolvedExperiences>[number]

export function ExperienceCard({ preview, destination }: ResolvedExperience) {
  return (
    <div className="group bg-white dark:bg-slate-900 rounded-2xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 hover:shadow-xl transition-all duration-300">
      <div className="relative h-56 overflow-hidden bg-slate-200 dark:bg-slate-800">
        <Image
          src={preview.image ?? destination.images.hero}
          alt={destination.name}
          fill
          sizes="(min-width: 768px) 33vw, 100vw"
          className="object-cover group-hover:scale-105 transition-transform duration-300"
        />
        <div className="absolute top-4 left-4 bg-white/90 dark:bg-slate-900/90 rounded-full px-3 py-1.5 text-sm font-semibold flex items-center gap-1.5">
          <span>{preview.icon}</span> {preview.category}
        </div>
        <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full text-white text-xs font-semibold">
          Score VIALII: {destination.travelScore}/100
        </div>
      </div>

      <div className="p-6">
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">
          📍 {destination.name}, {destination.country}
        </p>
        <h3 className="text-xl font-bold mb-2 text-slate-900 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors">
          {preview.title}
        </h3>
        <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">{preview.description}</p>

        <div className="flex flex-wrap gap-2 mb-5">
          {preview.hashtags.map((tag) => (
            <span key={tag} className="text-xs bg-cyan-50 dark:bg-cyan-950/40 text-cyan-600 dark:text-cyan-400 px-2 py-1 rounded-full">
              {tag}
            </span>
          ))}
        </div>

        <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
          <span className="text-xs text-slate-500 dark:text-slate-400">{COST_LABEL[destination.costOfLiving]}</span>
          <Link href="/explore">
            <Button size="sm" className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:opacity-90">
              Explorar
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}

/** Standalone full-width version — not used on the home page anymore (see InspirationSection.tsx for the 2-column layout that replaced it), kept in case a future /explore-style page wants the same block. */
export function TrendingExperiencesSection() {
  const experiences = getResolvedExperiences()

  return (
    <section id="trending-experiences" className="py-20 bg-gradient-to-b from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 rounded-full text-sm font-semibold mb-4">
            Curado por VIALII
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-slate-900 dark:text-white">Experiencias que están en fuego</h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg">Ideas curadas por estilo de vida, no un buscador más</p>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {experiences.map(({ preview, destination }) => (
            <ExperienceCard key={preview.destinationId} preview={preview} destination={destination} />
          ))}
        </div>

        <div className="text-center mt-12">
          <Link href="/explore">
            <Button variant="outline" size="lg">
              Ver todas las experiencias <ArrowRight size={16} className="ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  )
}

export default TrendingExperiencesSection
