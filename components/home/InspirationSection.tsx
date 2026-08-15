import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { ExperienceCard, getResolvedExperiences } from '@/components/home/TrendingExperiencesSection'
import { CATEGORIES, CategoryCardCompact } from '@/components/home/LifestyleCategoriesSection'

const SIDEBAR_CATEGORY_COUNT = 3

/**
 * 2-column home layout: trending experiences (2/3 width) + a compact preview
 * of lifestyle categories (1/3 width, sticky). Both "ver todas" CTAs go to
 * /explore rather than a dedicated categories tab — that tab doesn't exist,
 * and a card that promises "los 6 estilos" but 404s would be worse than
 * just landing on the general explore page.
 */
export function InspirationSection() {
  const experiences = getResolvedExperiences()
  const sidebarCategories = CATEGORIES.slice(0, SIDEBAR_CATEGORY_COUNT)

  return (
    <section id="trending-experiences" className="py-16 sm:py-20 bg-white dark:bg-slate-950 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-3 gap-8 lg:gap-12">
          {/* TRENDING (2/3) */}
          <div className="md:col-span-2">
            <div className="mb-8">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-3xl">🔥</span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white">Experiencias trending</h2>
              </div>
              <p className="text-slate-600 dark:text-slate-400">Ideas curadas por estilo de vida, no un buscador más</p>
            </div>

            <div className="grid gap-6 mb-8">
              {experiences.map(({ preview, destination }) => (
                <ExperienceCard key={preview.destinationId} preview={preview} destination={destination} />
              ))}
            </div>

            <Link href="/explore">
              <Button variant="outline" size="lg" className="w-full sm:w-auto border-2">
                Ver todas las experiencias <ArrowRight size={18} className="ml-2" />
              </Button>
            </Link>
          </div>

          {/* CATEGORIES (1/3) */}
          <div className="md:col-span-1">
            <div className="mb-8 md:sticky md:top-24">
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-3xl">🎯</span>
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">Por tu estilo</h2>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400">¿Yoga? ¿Adrenalina? ¿Cultura? Encuentra tu vibe</p>
              </div>

              <div className="space-y-4 mb-6">
                {sidebarCategories.map((category) => (
                  <CategoryCardCompact key={category.id} category={category} />
                ))}
              </div>

              <Link href="/explore">
                <Button variant="outline" size="lg" className="w-full border-2">
                  Ver los 6 estilos <ArrowRight size={18} className="ml-2" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

export default InspirationSection
