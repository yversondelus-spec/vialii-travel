import type { HotelOption } from '@/lib/providers/hotel/types'
import type { Activity } from '@/lib/providers/activity/types'

export type ComponentPreference = 'mas_barato' | 'mejor_valorado' | 'romantico' | 'con_piscina' | 'mas_lujo'

export const PREFERENCE_OPTIONS: { id: ComponentPreference; label: string }[] = [
  { id: 'mas_barato', label: 'Más barato' },
  { id: 'mejor_valorado', label: 'Mejor valorado' },
  { id: 'romantico', label: 'Más romántico' },
  { id: 'con_piscina', label: 'Con piscina' },
  { id: 'mas_lujo', label: 'Más lujo' },
]

// A deterministic, explainable rule set over the real alternatives pool —
// not a real LLM call. No AI provider is safely configured in this project
// (lib/ai/anthropic.ts depends on a real ANTHROPIC_API_KEY that isn't set
// here), so wiring this to an actual model would either silently no-op or
// need a key this environment doesn't have. "IA" in the UI copy matches how
// the rest of the app already presents rule-based scoring (decisionEngine)
// as "recomendación inteligente" — same honesty bar, not a new one.
export function filterHotelsByPreference(hotels: HotelOption[], preference: ComponentPreference): HotelOption[] {
  switch (preference) {
    case 'mas_barato':
      return [...hotels].sort((a, b) => a.price - b.price)
    case 'mejor_valorado':
      return [...hotels].sort((a, b) => b.stars - a.stars)
    case 'romantico': {
      const romantic = hotels.filter((h) => h.stars >= 4)
      return romantic.length > 0 ? romantic : hotels
    }
    case 'con_piscina': {
      const withPool = hotels.filter((h) => h.amenities.includes('Piscina'))
      return withPool.length > 0 ? withPool : hotels
    }
    case 'mas_lujo':
      return [...hotels].sort((a, b) => b.price - a.price)
    default:
      return hotels
  }
}

export function filterActivitiesByPreference(activities: Activity[], preference: ComponentPreference): Activity[] {
  switch (preference) {
    case 'mas_barato':
      return [...activities].sort((a, b) => a.price - b.price)
    case 'mejor_valorado':
      return [...activities].sort((a, b) => b.rating - a.rating)
    default:
      return activities
  }
}
