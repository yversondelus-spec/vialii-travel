import type { CompleteTrip } from '@/lib/types/trip'
import type { HotelOption } from '@/lib/providers/hotel/types'
import type { Activity } from '@/lib/providers/activity/types'
import type { SearchResult } from '@/lib/providers/transport/types'
import { buildItinerary } from './activityDistributionService'

// Pure recalculation over an already-built CompleteTrip — this is what makes
// "cambiar 1 componente sin romper el resto" real: swapping a hotel/activity/
// transport only touches that component's line in costBreakdown, everything
// else (the other components, the original budget) stays exactly as it was.

function originalBudget(trip: CompleteTrip): number {
  return trip.costBreakdown.total + trip.costBreakdown.remainingBudget
}

function withRecomputedTotal(trip: CompleteTrip, newTransport: number, newHotel: number, newActivities: number): CompleteTrip['costBreakdown'] {
  const total = newTransport + newHotel + newActivities + trip.costBreakdown.meals
  const budget = originalBudget(trip)
  const remainingBudget = budget - total
  return {
    ...trip.costBreakdown,
    transport: newTransport,
    hotel: newHotel,
    activities: newActivities,
    total,
    remainingBudget,
    savingsPercent: budget > 0 ? Math.round((remainingBudget / budget) * 100) : 0,
  }
}

function nightsOf(startDate: Date, endDate: Date): number {
  return Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000))
}

export function swapHotel(trip: CompleteTrip, newHotel: HotelOption, startDate: Date, endDate: Date): CompleteTrip {
  const nights = nightsOf(startDate, endDate)
  const newHotelCost = newHotel.price * nights
  const alternatives = [...(trip.hotelAlternatives ?? []).filter((h) => h.id !== newHotel.id), ...(trip.hotel ? [trip.hotel] : [])]

  return {
    ...trip,
    hotel: newHotel,
    hotelAlternatives: alternatives,
    costBreakdown: withRecomputedTotal(trip, trip.costBreakdown.transport, newHotelCost, trip.costBreakdown.activities),
  }
}

export function swapTransport(trip: CompleteTrip, newTransport: SearchResult): CompleteTrip {
  const alternatives = [...(trip.transportAlternatives ?? []).filter((o) => o.id !== newTransport.id), trip.transport]

  return {
    ...trip,
    transport: newTransport,
    transportAlternatives: alternatives,
    costBreakdown: withRecomputedTotal(trip, newTransport.price, trip.costBreakdown.hotel, trip.costBreakdown.activities),
  }
}

/** Swaps one scheduled activity for one from the alternatives pool, then rebuilds the day-by-day itinerary around the new list so it stays consistent. */
export function swapActivity(trip: CompleteTrip, oldActivityId: string, newActivity: Activity, startDate: Date, duration: number): CompleteTrip {
  const activities = trip.activities.map((a) => (a.id === oldActivityId ? newActivity : a))
  const removedActivity = trip.activities.find((a) => a.id === oldActivityId)
  const alternatives = [...(trip.activityAlternatives ?? []).filter((a) => a.id !== newActivity.id), ...(removedActivity ? [removedActivity] : [])]
  const newActivitiesCost = trip.costBreakdown.activities - (removedActivity?.price ?? 0) + newActivity.price

  return {
    ...trip,
    activities,
    activityAlternatives: alternatives,
    itinerary: buildItinerary(startDate, duration, activities),
    costBreakdown: withRecomputedTotal(trip, trip.costBreakdown.transport, trip.costBreakdown.hotel, newActivitiesCost),
  }
}
