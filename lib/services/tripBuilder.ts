import type { Destination } from '@/types/domain'
import type { HotelOption } from '@/lib/providers/hotel/types'
import type { Activity } from '@/lib/providers/activity/types'
import type { SearchResult } from '@/lib/providers/transport/types'
import type { Interest } from '@/constants/interests'
import type { CompleteTrip, CostBreakdown as PackCostBreakdown } from '@/lib/types/trip'
import { MockHotelProvider } from '@/lib/providers/hotel/mockHotelProvider'
import { MockActivityProvider } from '@/lib/providers/activity/mockActivityProvider'
import { rankHotels } from './hotelSelectionService'
import { rankActivities, buildItinerary } from './activityDistributionService'

export interface TripTransportSummary {
  provider: string
  type: 'bus' | 'flight' | 'train'
  price: number
  duration: number
}

export interface TripDay {
  date: Date
  dayNumber: number
  breakfast: string
  activities: Activity[]
  dinner: string
  accommodations: HotelOption[]
}

export interface TripCostBreakdown {
  transport: number
  hotels: number
  activities: number
  meals: number
  total: number
  currency: string
}

export interface TripItinerary {
  destination: Destination
  startDate: Date
  duration: number
  days: TripDay[]
  hotels: HotelOption[]
  /** Full pool of activities considered for the trip (superset of what's scheduled per day). */
  activityPool: Activity[]
  transport: TripTransportSummary
  costBreakdown: TripCostBreakdown
}

const BREAKFAST_OPTIONS = [
  'Desayuno buffet en el hotel',
  'Café y pastelería local',
  'Desayuno continental en el hotel',
]

const DINNER_STYLES = [
  'un restaurante de cocina local',
  'una terraza con vista panorámica',
  'un bistró de barrio',
  'un mercado gastronómico nocturno',
]

// Flat per-day meal estimate (CLP) — breakfast + dinner. Lunch is left to the
// traveler's own budget since it's usually eaten out near whatever's on the plan.
const MEAL_COST_PER_DAY = 8000 + 18000

function addDays(date: Date, days: number): Date {
  const result = new Date(date)
  result.setDate(result.getDate() + days)
  return result
}

function pick<T>(items: T[], seed: number): T {
  return items[seed % items.length]
}

/**
 * Builds a day-by-day itinerary for a destination: hotel options, a spread of
 * activities across the trip, and an estimated cost breakdown.
 */
export async function generateTripItinerary(
  destination: Destination,
  startDate: Date,
  duration: number,
  transport: TripTransportSummary
): Promise<TripItinerary> {
  const currency = 'CLP'
  const nights = Math.max(duration - 1, 1)

  const hotelProvider = new MockHotelProvider()
  const activityProvider = new MockActivityProvider()

  const [hotels, activityPool] = await Promise.all([
    hotelProvider.searchHotels({
      destination: destination.name,
      checkIn: startDate,
      checkOut: addDays(startDate, nights),
      guests: 2,
      currency,
    }),
    activityProvider.searchActivities({
      destination: destination.name,
      currency,
      attractions: destination.attractions,
    }),
  ])

  const days: TripDay[] = []
  const scheduledActivities: Activity[] = []
  let activityCursor = 0

  for (let i = 0; i < duration; i++) {
    const activitiesToday = i % 2 === 0 ? 2 : 1
    const dayActivities: Activity[] = []

    for (let j = 0; j < activitiesToday && activityPool.length > 0; j++) {
      const activity = activityPool[activityCursor % activityPool.length]
      dayActivities.push(activity)
      scheduledActivities.push(activity)
      activityCursor++
    }

    days.push({
      date: addDays(startDate, i),
      dayNumber: i + 1,
      breakfast: pick(BREAKFAST_OPTIONS, i),
      activities: dayActivities,
      dinner: `Cena en ${pick(DINNER_STYLES, i)} de ${destination.name}`,
      accommodations: hotels,
    })
  }

  const avgHotelPrice = hotels.reduce((sum, h) => sum + h.price, 0) / (hotels.length || 1)
  const hotelsCost = Math.round(avgHotelPrice * nights)
  const activitiesCost = scheduledActivities.reduce((sum, a) => sum + a.price, 0)
  const mealsCost = duration * MEAL_COST_PER_DAY
  const total = hotelsCost + activitiesCost + mealsCost + transport.price

  return {
    destination,
    startDate,
    duration,
    days,
    hotels,
    activityPool,
    transport,
    costBreakdown: {
      transport: transport.price,
      hotels: hotelsCost,
      activities: activitiesCost,
      meals: mealsCost,
      total,
      currency,
    },
  }
}

/**
 * Builds a full trip package around a REAL transport option from search
 * results — as opposed to generateTripItinerary above, which builds a
 * self-contained demo itinerary for /trip/[id] around a fixed mock
 * transport. Additive: nothing above this line changed, /trip/[id] keeps
 * working exactly as before. Used by PackResultCard, once per rendered card.
 */
export async function generateTripPackage(
  destination: string,
  startDate: Date,
  endDate: Date,
  transport: SearchResult,
  budget: number,
  interests: Interest[],
  attractions?: string[],
  /** Sibling transport options from the same search (results.options) — becomes transportAlternatives, so "cambiar transporte" offers the bus/train/flight actually returned, not fabricated ones. */
  allTransportOptions?: SearchResult[]
): Promise<CompleteTrip> {
  const duration = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1)
  const nights = Math.max(duration - 1, 1)
  const mealsCost = duration * MEAL_COST_PER_DAY

  // What's left after transport + meals is split so the hotel doesn't eat
  // everything activities would need — roughly 65/35, hotel/activities.
  const remainingAfterTransportAndMeals = Math.max(budget - transport.price - mealsCost, 0)
  const budgetForHotel = Math.round(remainingAfterTransportAndMeals * 0.65)
  const budgetForActivities = remainingAfterTransportAndMeals - budgetForHotel

  const [rankedHotels, rankedActivitiesFull] = await Promise.all([
    rankHotels(destination, startDate, endDate, budgetForHotel, interests),
    rankActivities(destination, attractions, interests),
  ])

  const hotel = rankedHotels[0] ?? null
  const hotelAlternatives = rankedHotels.slice(1)
  const rankedActivities = rankedActivitiesFull.slice(0, Math.min(duration, 6))
  const activityAlternatives = rankedActivitiesFull.slice(Math.min(duration, 6))
  const transportAlternatives = allTransportOptions?.filter((o) => o.id !== transport.id) ?? []

  const hotelCost = hotel ? hotel.price * nights : 0

  // Trim from the bottom of the interest-ranked list until the picks
  // actually fit what's left, instead of silently blowing the budget.
  const fittedActivities = [...rankedActivities]
  let activitiesCost = fittedActivities.reduce((sum, a) => sum + a.price, 0)
  while (activitiesCost > budgetForActivities && fittedActivities.length > 0) {
    const removed = fittedActivities.pop()
    if (!removed) break
    activitiesCost -= removed.price
  }

  const itinerary = buildItinerary(startDate, duration, fittedActivities)

  const total = transport.price + hotelCost + activitiesCost + mealsCost
  const remainingBudget = budget - total
  const savingsPercent = budget > 0 ? Math.round((remainingBudget / budget) * 100) : 0

  const costBreakdown: PackCostBreakdown = {
    transport: transport.price,
    hotel: hotelCost,
    activities: activitiesCost,
    meals: mealsCost,
    total,
    remainingBudget,
    savingsPercent,
    currency: 'CLP',
  }

  // Simple 0-10 composite: how well the pack fits the stated budget (close
  // to it, not over, scores best) plus a small bonus for actually having a
  // hotel and activities to show, not just bare transport.
  const budgetFit = budget > 0 ? Math.max(0, 1 - Math.abs(remainingBudget) / budget) : 0.5
  const completenessBonus = (hotel ? 0.5 : 0) + (fittedActivities.length > 0 ? 0.5 : 0)
  const recommendationScore = Math.min(10, Math.round((budgetFit * 9 + completenessBonus) * 10) / 10)

  return {
    transport,
    hotel,
    activities: fittedActivities,
    itinerary,
    costBreakdown,
    recommendationScore,
    transportAlternatives,
    hotelAlternatives,
    activityAlternatives,
  }
}
