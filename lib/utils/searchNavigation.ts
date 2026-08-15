import type { SmartSearchResolution } from '@/lib/services/smartSearchService'

/** Single place that turns a resolved search into the /search query string — used by Home's redirect and anywhere else that needs to link into a search. */
export function buildSearchUrl(resolution: SmartSearchResolution): string {
  const qs = new URLSearchParams({
    destination: resolution.destination,
    origin: resolution.origin,
    budget: String(resolution.budgetTotal),
    budget_amount: String(resolution.budgetAmount),
    budget_unit: resolution.budgetUnit,
    scope: resolution.scope,
    travel_date: resolution.travelDate,
    adults: String(resolution.passengers.adults),
    children: String(resolution.passengers.children),
    infants: String(resolution.passengers.infants),
  })
  if (resolution.returnDate) qs.set('return_date', resolution.returnDate)
  if (resolution.interests.length) qs.set('interests', resolution.interests.join(','))
  return `/search?${qs.toString()}`
}
