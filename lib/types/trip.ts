import type { SearchResult } from '@/lib/providers/transport/types'
import type { HotelOption } from '@/lib/providers/hotel/types'
import type { Activity } from '@/lib/providers/activity/types'

export interface CostBreakdown {
  transport: number
  hotel: number
  activities: number
  meals: number
  total: number
  remainingBudget: number
  savingsPercent: number
  currency: string
}

export type ItineraryItemType = 'arrival' | 'checkin' | 'activity' | 'meal' | 'checkout' | 'free'

export interface ItineraryItem {
  time: string
  title: string
  type: ItineraryItemType
  durationMinutes?: number
}

export interface ItineraryDay {
  dayNumber: number
  date: Date
  title: string
  items: ItineraryItem[]
}

// Composition, not `extends SearchResult` as originally sketched — a trip's
// total price and the transport option's own price are different numbers,
// and inheriting would make that ambiguous (which `.price` wins?). `transport`
// keeps the real SearchResult intact and unambiguous.
export interface CompleteTrip {
  transport: SearchResult
  hotel: HotelOption | null
  activities: Activity[]
  itinerary: ItineraryDay[]
  costBreakdown: CostBreakdown
  recommendationScore: number
  // Modular pack additions — alternative pools already fetched alongside the
  // selected pick, so "cambiar este componente" has real options to offer
  // instead of fabricating new ones on demand. Optional so any existing
  // caller building a CompleteTrip without them still type-checks.
  transportAlternatives?: SearchResult[]
  hotelAlternatives?: HotelOption[]
  activityAlternatives?: Activity[]
}
