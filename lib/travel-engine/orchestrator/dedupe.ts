import type { FlightOffer } from '../core/models'

/**
 * Cross-provider duplicate detection (Section 6). Not exercised much today
 * with a single real flight source active by default, but this is exactly
 * what runs once Duffel + Kiwi (or Duffel + Amadeus) are both enabled and
 * happen to return the same physical flight — same airline, same flight
 * number, same route, same departure time. Keeps the cheapest of any
 * matching set rather than showing the traveler the same flight twice at
 * two different prices.
 */
function dedupeKey(offer: FlightOffer): string {
  const flightId = offer.flightNumber ? `${offer.airlineCode ?? offer.airline}${offer.flightNumber}` : (offer.airlineCode ?? offer.airline)
  return [flightId, offer.origin, offer.destination, offer.departureTime].join('|').toLowerCase()
}

export interface DedupeResult {
  offers: FlightOffer[]
  /**
   * Duplicates of a kept offer — same flight, different provider and/or
   * price — dropped from `offers` but preserved here instead of silently
   * discarded (Fase 2 audit, Caso 4: "mismo vuelo pero diferente precio.
   * Debe conservar correctamente las alternativas"). Keyed by the *kept*
   * offer's id, so a caller can show "también disponible por $X vía otro
   * proveedor" against the offer actually being displayed.
   */
  alternatives: Record<string, FlightOffer[]>
}

export function dedupeFlightOffers(offers: FlightOffer[]): DedupeResult {
  const bestByKey = new Map<string, FlightOffer>()
  const groupsByKey = new Map<string, FlightOffer[]>()

  for (const offer of offers) {
    const key = dedupeKey(offer)
    const existing = bestByKey.get(key)
    if (!existing || offer.price < existing.price) {
      bestByKey.set(key, offer)
    }
    groupsByKey.set(key, [...(groupsByKey.get(key) ?? []), offer])
  }

  const alternatives: Record<string, FlightOffer[]> = {}
  for (const [key, kept] of bestByKey) {
    const others = (groupsByKey.get(key) ?? []).filter((offer) => offer.id !== kept.id)
    if (others.length > 0) alternatives[kept.id] = others
  }

  return { offers: [...bestByKey.values()], alternatives }
}
