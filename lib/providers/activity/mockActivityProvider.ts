import type { Activity, ActivityCategory, ActivityProvider, ActivitySearchParams } from './types'

export const CATEGORY_ICON: Record<ActivityCategory, string> = {
  Adventure: '🧗',
  Culture: '🏛️',
  Food: '🍽️',
  Beach: '🏖️',
  Nature: '🌿',
  Nightlife: '🌃',
}

const GENERIC_TEMPLATES: {
  category: ActivityCategory
  name: (destination: string) => string
  basePrice: number
  duration: number
}[] = [
  { category: 'Food', name: (d) => `Tour gastronómico por ${d}`, basePrice: 45000, duration: 180 },
  { category: 'Nightlife', name: (d) => `Vida nocturna en ${d}`, basePrice: 35000, duration: 240 },
  { category: 'Nature', name: (d) => `Caminata y paisajes de ${d}`, basePrice: 30000, duration: 210 },
  { category: 'Adventure', name: (d) => `Aventura al aire libre en ${d}`, basePrice: 60000, duration: 300 },
  { category: 'Beach', name: (d) => `Día de playa cerca de ${d}`, basePrice: 25000, duration: 360 },
  { category: 'Culture', name: (d) => `Recorrido cultural por ${d}`, basePrice: 20000, duration: 150 },
]

const round1 = (n: number) => Math.round(n * 10) / 10
const slugify = (s: string) => s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-')

export class MockActivityProvider implements ActivityProvider {
  async searchActivities(params: ActivitySearchParams): Promise<Activity[]> {

    const destination = params.destination
    const slug = slugify(destination)
    const target = 5 + Math.floor(Math.random() * 3) // 5-7 total

    // Real landmarks (when known) become Culture activities named after them.
    const fromAttractions: Activity[] = (params.attractions ?? []).slice(0, 4).map((attraction, idx) => ({
      id: `activity-${slug}-attr-${idx}`,
      name: attraction,
      price: 15000 + Math.floor(Math.random() * 20000),
      duration: 90 + Math.floor(Math.random() * 150),
      category: 'Culture',
      rating: round1(4 + Math.random()),
      image: CATEGORY_ICON.Culture,
    }))

    const remainingSlots = Math.max(target - fromAttractions.length, 2)
    const genericPool = [...GENERIC_TEMPLATES].sort(() => Math.random() - 0.5)

    const fromGeneric: Activity[] = genericPool.slice(0, remainingSlots).map((template, idx) => ({
      id: `activity-${slug}-gen-${idx}`,
      name: template.name(destination),
      price: template.basePrice + Math.floor(Math.random() * 10000),
      duration: template.duration,
      category: template.category,
      rating: round1(4 + Math.random()),
      image: CATEGORY_ICON[template.category],
    }))

    return [...fromAttractions, ...fromGeneric]
  }
}
