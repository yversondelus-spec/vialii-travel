import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export interface LifestyleCategory {
  id: string
  name: string
  icon: string
  description: string
  color: string
  examples: string[]
}

// No per-category inventory counts here on purpose — there's no real catalog
// behind these yet (see TrendingExperiencesSection's comment), and a fake
// "45+" would be exactly the kind of invented number worth avoiding.
export const CATEGORIES: LifestyleCategory[] = [
  {
    id: 'wellness',
    name: 'Wellness & Self-Care',
    icon: '🧘',
    description: 'Yoga, pilates, meditación, retiros para desconectar de verdad.',
    color: 'from-pink-500 to-rose-500',
    examples: ['Yoga retreats', 'Pilates camps', 'Meditación', 'Spa days'],
  },
  {
    id: 'adventure',
    name: 'Adventure & Adrenaline',
    icon: '🏄',
    description: 'Surf, trekking, escalada: experiencias que suben el pulso.',
    color: 'from-orange-500 to-red-500',
    examples: ['Surf', 'Trekking', 'Escalada', 'Deportes acuáticos'],
  },
  {
    id: 'culinary',
    name: 'Culinary & Gastronomía',
    icon: '🍽️',
    description: 'Clases de cocina, food tours y mercados locales.',
    color: 'from-amber-500 to-yellow-500',
    examples: ['Cooking class', 'Food tours', 'Mercados', 'Cata de vinos'],
  },
  {
    id: 'culture',
    name: 'Culture & Creativity',
    icon: '🎨',
    description: 'Arte, fotografía, música y experiencias creativas locales.',
    color: 'from-purple-500 to-indigo-500',
    examples: ['Arte', 'Fotografía', 'Música', 'Danza'],
  },
  {
    id: 'impact',
    name: 'Social Impact',
    icon: '🌍',
    description: 'Voluntariado, sustentabilidad y viajes con propósito.',
    color: 'from-green-500 to-emerald-500',
    examples: ['Voluntariado', 'Conservación', 'Comunidad local'],
  },
  {
    id: 'nomad',
    name: 'Digital Nomad',
    icon: '💻',
    description: 'Co-working, co-living y comunidades para trabajar remoto.',
    color: 'from-blue-500 to-cyan-500',
    examples: ['Co-working', 'Co-living', 'Retiros nómades'],
  },
]

/** Sidebar-sized variant used by InspirationSection.tsx's 2-column home layout — no examples list, just name + description. */
export function CategoryCardCompact({ category }: { category: LifestyleCategory }) {
  return (
    <Link href="/explore" className="block">
      <div
        className={`group bg-gradient-to-br ${category.color} rounded-xl p-5 text-white cursor-pointer hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5`}
      >
        <div className="flex items-start justify-between mb-2">
          <span className="text-3xl">{category.icon}</span>
        </div>
        <h3 className="text-base font-bold mb-1">{category.name}</h3>
        <p className="text-white/90 text-xs mb-3 line-clamp-2">{category.description}</p>
        <div className="flex items-center gap-1.5 text-white/90 group-hover:text-white transition-colors text-xs font-semibold">
          Explorar <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
        </div>
      </div>
    </Link>
  )
}

/** Standalone full-width version — not used on the home page anymore (see InspirationSection.tsx for the 2-column layout that replaced it), kept in case a future /explore-style page wants the full 6-card spread. */
export function LifestyleCategoriesSection() {
  return (
    <section className="py-20 bg-white dark:bg-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4 text-slate-900 dark:text-white">
            Explora por tu estilo de vida
          </h2>
          <p className="text-slate-600 dark:text-slate-400 text-lg max-w-2xl mx-auto">
            Encuentra experiencias que se alinean con quién eres y cómo quieres vivir
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {CATEGORIES.map((category) => (
            <Link key={category.id} href="/explore" className="block">
              <div
                className={`group h-full bg-gradient-to-br ${category.color} rounded-2xl p-8 text-white cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1`}
              >
                <span className="text-4xl block mb-5">{category.icon}</span>
                <h3 className="text-xl font-bold mb-2">{category.name}</h3>
                <p className="text-white/90 text-sm mb-5">{category.description}</p>

                <div className="space-y-1.5 mb-6">
                  {category.examples.map((example) => (
                    <div key={example} className="flex items-center gap-2 text-sm text-white/90">
                      <span className="w-1.5 h-1.5 bg-white rounded-full shrink-0" />
                      {example}
                    </div>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-white/90 group-hover:text-white transition-colors text-sm font-semibold">
                  Explorar <ArrowRight size={15} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}

export default LifestyleCategoriesSection
