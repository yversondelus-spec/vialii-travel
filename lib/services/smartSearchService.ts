import { NATIONAL_OFFERS } from '@/constants/nationalOffers'
import { FEATURED_DESTINATIONS } from '@/constants/destinations'
import { DESTINATION_VIBES, DESIRE_TO_DESTINATION, type Vibe } from '@/constants/vibes'
import { interestsToVibes, type Interest } from '@/constants/interests'
import type { SearchCriteria, PassengerCounts } from '@/lib/types/searchCriteria'
import { DEFAULT_PASSENGERS, resolveBudgetTotal } from '@/lib/types/searchCriteria'
import { suggestInterestsByBudget, pickSurpriseScope, pickSurpriseDate, DURATION_OPTIONS, type SearchScope } from './aiSearchHelper'

// Plain functions rather than a class, to match how every other service in
// lib/services (savedTripsService, referralService, etc.) is written — no
// behavioral difference, just consistency with the rest of the codebase.
//
// This layer only decides WHICH origin/destination/dates/budget to hand to
// the existing, untouched search flow (/api/search → lib/providers/transport
// → decisionEngine). None of that scoring/comparison logic is touched here.

export interface SmartSearchResolution {
  origin: string
  destination: string
  scope: SearchScope
  travelDate: string
  returnDate?: string
  passengers: PassengerCounts
  /** Total CLP, already resolved from per-person/total — what /api/search's max_budget expects. */
  budgetTotal: number
  /** Kept alongside the total so the UI can still show "$X por persona" without re-deriving it. */
  budgetAmount: number
  budgetUnit: 'per_person' | 'total'
  interests: Interest[]
}

const DEFAULT_BUDGET_AMOUNT = 300_000

function pickNationalDestination(vibes: Vibe[]): string {
  const match = NATIONAL_OFFERS.find((offer) => offer.vibes.some((v) => vibes.includes(v)))
  if (match) return match.name
  // DESIRE_TO_DESTINATION always has an entry per vibe — safe fallback covering the rest of Chile.
  return vibes[0] ? DESIRE_TO_DESTINATION[vibes[0]] : NATIONAL_OFFERS[0].name
}

function pickInternationalDestination(vibes: Vibe[]): string {
  const candidates = FEATURED_DESTINATIONS.filter((d) => (DESTINATION_VIBES[d.id] ?? []).some((v) => vibes.includes(v)))
  const pool = candidates.length ? candidates : FEATURED_DESTINATIONS
  return pool[Math.floor(Math.random() * pool.length)].name
}

function resolveDates(dates: SearchCriteria['dates']): { travelDate: string; returnDate?: string } {
  if (dates.mode !== 'duration' && dates.startDate) {
    return { travelDate: dates.startDate, returnDate: dates.endDate }
  }

  // "duration" mode (or nothing given at all): no exact dates, so we pick a
  // plausible outbound date and derive a return date from the requested
  // length. This is a placeholder for "when", not real availability.
  const travelDate = dates.mode === 'duration' || !dates.startDate ? pickSurpriseDate() : dates.startDate
  const durationDays = DURATION_OPTIONS.find((d) => d.label === dates.approxDuration)?.days ?? 7
  const returnDate = new Date(new Date(travelDate).getTime() + durationDays * 86_400_000).toISOString().split('T')[0]
  return { travelDate, returnDate }
}

/**
 * Fills in whatever the search form left blank (dates, budget, interests)
 * and picks a concrete destination when the traveler didn't name one — the
 * "no lo sé, recomiéndame" and "Sorpréndeme" paths both go through here.
 */
export function resolveSmartSearch(criteria: SearchCriteria): SmartSearchResolution {
  const passengers = criteria.passengers ?? DEFAULT_PASSENGERS
  const budgetAmount = criteria.budget?.amount ?? DEFAULT_BUDGET_AMOUNT
  const budgetUnit = criteria.budget?.unit ?? 'total'
  const budgetTotal = resolveBudgetTotal({ amount: budgetAmount, unit: budgetUnit }, passengers) ?? DEFAULT_BUDGET_AMOUNT

  const interests = criteria.interests.length > 0 ? criteria.interests : suggestInterestsByBudget(budgetTotal)
  const vibes = interestsToVibes(interests)

  const scope: SearchScope = criteria.scope === 'surprise' ? pickSurpriseScope() : criteria.scope

  const destination = criteria.destination?.trim()
    ? criteria.destination.trim()
    : scope === 'national'
      ? pickNationalDestination(vibes)
      : pickInternationalDestination(vibes)

  const { travelDate, returnDate } = resolveDates(criteria.dates)

  return { origin: criteria.origin, destination, scope, travelDate, returnDate, passengers, budgetTotal, budgetAmount, budgetUnit, interests }
}
