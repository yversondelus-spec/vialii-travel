/**
 * Puente entre el Travel Engine y el pipeline original de /api/search.
 *
 * El engine normaliza a `FlightOffer`; el `DecisionEngine` (anterior al
 * engine) consume `SearchResult`. Esto traduce entre ambos sin que ninguno
 * de los dos tenga que conocer al otro.
 *
 * Regla: lo que el proveedor no entrega no se inventa. `seats`, `comfort` y
 * `amenities` no existen en `FlightOffer`, así que se derivan de campos que
 * el proveedor sí atestigua (`cabin`, `baggage`, `refundable`) — nunca de
 * un número al azar que luego el ranking trataría como dato real.
 */
import type { FlightOffer, CabinClass } from '../core/models'
import type { SearchResult } from '@/lib/providers/transport/types'

/**
 * Escala 0-10 (`scoreCalculator.ts:20`), calibrada contra la banda que ya
 * usan los mocks: vuelos 7.2-9.0, tren 8, bus 5-8. Un economy real no debe
 * quedar por debajo de un bus mock solo por venir de un proveedor honesto.
 *
 * Es una heurística derivada de la cabina — el mismo tipo de derivación que
 * hace mockFlightProvider por aerolínea. No es un dato que Duffel atestigüe.
 */
const COMFORT_BY_CABIN: Record<CabinClass, number> = {
  economy: 7.5,
  premium_economy: 8.3,
  business: 9.2,
  first: 9.8,
}

/** Cabina desconocida: mismo trato que economy, que es lo que devuelve la mayoría de las búsquedas. */
const DEFAULT_COMFORT = 7.5

/**
 * Solo lo que el proveedor confirma; nada de "Wifi" asumido.
 *
 * Nota: `scoreCalculator.calculateExperienceScore` premia strings en inglés
 * ('Wifi', 'Food', 'Entertainment'). Estas amenities no matchean ninguna, así
 * que un vuelo real puntúa base en experiencia. Es deliberado — Duffel no
 * atestigua wifi ni comida a bordo, y falsearlo para subir el ranking sería
 * presentar datos inventados como reales.
 */
function amenitiesFrom(offer: FlightOffer): string[] {
  const list: string[] = []
  if (offer.baggage?.checked) list.push(`${offer.baggage.checked} maleta(s) en bodega`)
  if (offer.baggage?.carryOn) list.push(`${offer.baggage.carryOn} equipaje de mano`)
  if (offer.refundable) list.push('Reembolsable')
  if (offer.changeable) list.push('Cambiable')
  if (offer.cabin && offer.cabin !== 'economy') list.push(offer.cabin.replace('_', ' '))
  return list
}

export interface ToSearchResultOptions {
  /** Factor para convertir `offer.currency` a la moneda destino. 1 si ya coinciden. */
  rate: number
  targetCurrency: string
}

export function flightOfferToSearchResult(
  offer: FlightOffer,
  { rate, targetCurrency }: ToSearchResultOptions
): SearchResult {
  return {
    id: offer.id,
    provider: offer.provider,
    type: 'flight',
    departure: new Date(offer.departureTime),
    arrival: new Date(offer.arrivalTime),
    duration: offer.durationMinutes,
    price: Math.round(offer.price * rate),
    currency: targetCurrency,
    // El proveedor no expone asientos disponibles en el offer. 0 significa
    // "desconocido", no "agotado" — verificado: scoreCalculator nunca lee
    // este campo, así que no afecta el ranking.
    seats: 0,
    comfort: offer.cabin ? COMFORT_BY_CABIN[offer.cabin] : DEFAULT_COMFORT,
    stops: offer.stops,
    direct: offer.stops === 0,
    amenities: amenitiesFrom(offer),
    // Duffel reserva vía API, no por URL pública. Los providers que sí tienen
    // link (Kiwi, mock) lo traen en `deepLink`.
    bookingUrl: offer.deepLink ?? '',
    raw: offer,
  }
}

export function flightOffersToSearchResults(
  offers: FlightOffer[],
  options: ToSearchResultOptions
): SearchResult[] {
  return offers.map((offer) => flightOfferToSearchResult(offer, options))
}