import type { FlightOffer } from '../core/models'

export type RankingPriority = 'price' | 'time' | 'comfort' | 'experience' | 'balanced'

export interface FlightOfferScore {
  offerId: string
  priceScore: number
  timeScore: number
  reliabilityScore: number
  experienceScore: number
  finalScore: number
}

export interface RankedFlightOffer {
  offer: FlightOffer
  score: FlightOfferScore
  reason: string
}

/**
 * Generalizes the scoring approach already proven in
 * lib/providers/comparison/scoreCalculator.ts (weighted price/time/
 * reliability/experience, 0-10 each) to work over `FlightOffer` instead of
 * the older `SearchResult`, so multi-provider flight results get the same
 * "compare price, duration, stops, baggage, conditions" treatment Section 6
 * asks for — this is the Travel Engine's ranking step, not a rewrite of the
 * existing transport comparison logic (which keeps serving /api/search as-is).
 */

function priceScore(price: number, prices: number[], maxBudget?: number): number {
  if (maxBudget) {
    if (price > maxBudget) return 2
    if (price <= maxBudget * 0.5) return 10
    if (price <= maxBudget * 0.75) return 8
    return 6
  }
  const cheapest = Math.min(...prices)
  const priciest = Math.max(...prices)
  if (priciest === cheapest) return 10
  // Linear scale: cheapest offer in this result set scores 10, priciest scores 2.
  return Math.round((10 - ((price - cheapest) / (priciest - cheapest)) * 8) * 10) / 10
}

function timeScore(durationMinutes: number): number {
  if (durationMinutes <= 180) return 10
  if (durationMinutes <= 360) return 9
  if (durationMinutes <= 600) return 7
  if (durationMinutes <= 900) return 5
  if (durationMinutes <= 1200) return 3
  return 2
}

function reliabilityScore(stops: number): number {
  if (stops === 0) return 10
  if (stops === 1) return 7
  if (stops === 2) return 4
  return 2
}

/** No numeric "comfort" exists for a flight offer the way it does for a bus/train amenity list — this proxies experience off what a flight offer actually attests to: baggage included, refund/change flexibility. */
function experienceScore(offer: FlightOffer): number {
  let score = 5
  if (offer.baggage?.checked) score += 2
  if (offer.refundable) score += 1.5
  if (offer.changeable) score += 1.5
  return Math.min(10, score)
}

function weightsFor(priority: RankingPriority | undefined) {
  switch (priority) {
    case 'price':
      return { price: 0.55, time: 0.2, reliability: 0.15, experience: 0.1 }
    case 'time':
      return { price: 0.15, time: 0.55, reliability: 0.2, experience: 0.1 }
    case 'comfort':
    case 'experience':
      return { price: 0.15, time: 0.2, reliability: 0.2, experience: 0.45 }
    default:
      return { price: 0.3, time: 0.3, reliability: 0.25, experience: 0.15 }
  }
}

function reasonFor(offer: FlightOffer, score: FlightOfferScore): string {
  const entries: [string, number][] = [
    ['el precio', score.priceScore],
    ['el tiempo de viaje', score.timeScore],
    ['la confiabilidad de la ruta', score.reliabilityScore],
    ['las condiciones de la tarifa', score.experienceScore],
  ]
  entries.sort((a, b) => b[1] - a[1])
  return `Destaca por ${entries[0][0]}`
}

export function rankFlightOffers(
  offers: FlightOffer[],
  options?: { maxBudget?: number; priority?: RankingPriority }
): RankedFlightOffer[] {
  if (offers.length === 0) return []

  const prices = offers.map((o) => o.price)
  const weights = weightsFor(options?.priority)

  const scored = offers.map((offer) => {
    const price = priceScore(offer.price, prices, options?.maxBudget)
    const time = timeScore(offer.durationMinutes)
    const reliability = reliabilityScore(offer.stops)
    const experience = experienceScore(offer)
    const finalScore =
      Math.round((price * weights.price + time * weights.time + reliability * weights.reliability + experience * weights.experience) * 10) / 10

    const score: FlightOfferScore = { offerId: offer.id, priceScore: price, timeScore: time, reliabilityScore: reliability, experienceScore: experience, finalScore }
    return { offer, score, reason: reasonFor(offer, score) }
  })

  return scored.sort((a, b) => b.score.finalScore - a.score.finalScore)
}
