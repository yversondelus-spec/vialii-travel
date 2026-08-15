import type { FlightProvider } from './FlightProvider'
import type { FlightOffer, FlightOrder, FlightSearchParams } from '../core/models'
import { ProviderUnsupportedOperationError } from '../core/errors'
import { timedProviderCall } from '../core/observability'
import { RealFlightProvider } from '@/lib/providers/transport/realFlightProvider'
import type { SearchResult } from '@/lib/providers/transport/types'

/**
 * Wraps the EXISTING `RealFlightProvider` (Kiwi.com via RapidAPI — see that
 * file's own comments) behind the `FlightProvider` interface, instead of
 * rewriting its request/parsing/fallback logic. That logic is already
 * battle-tested (it already degrades to mock data on missing key, 402, or
 * network failure) — this class only translates params in, and Kiwi's
 * `SearchResult` shape out, to the engine's normalized `FlightOffer`.
 *
 * Kiwi has no order-management API reachable through this integration
 * (RapidAPI's Kiwi endpoint is search-only) — priceOffer/createOrder/
 * getOrder/cancelOrder all throw `ProviderUnsupportedOperationError`, which
 * API routes turn into an explicit 501 rather than pretending to book.
 */
export class KiwiFlightProvider implements FlightProvider {
  readonly id = 'kiwi'
  readonly name = 'Kiwi (RapidAPI)'
  private readonly inner = new RealFlightProvider()

  get isConfigured(): boolean {
    // Always "configured" — RealFlightProvider already falls back to mock
    // data internally when RAPIDAPI_KEY is missing/invalid, so this
    // provider never fails a search outright either way.
    return true
  }

  async searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
    return timedProviderCall({ provider: this.id, vertical: 'flight', operation: 'searchFlights' }, async () => {
      const results = await this.inner.search({
        origin: params.origin,
        destination: params.destination,
        departDate: new Date(params.departureDate),
        passengers: (params.passengers.adults ?? 1) + (params.passengers.children ?? 0) + (params.passengers.infants ?? 0),
        currency: params.currency,
      })
      return results.map((result) => searchResultToFlightOffer(result, params))
    })
  }

  async priceOffer(): Promise<FlightOffer> {
    throw new ProviderUnsupportedOperationError(this.id, 'priceOffer')
  }

  async createOrder(): Promise<FlightOrder> {
    throw new ProviderUnsupportedOperationError(this.id, 'createOrder')
  }

  async getOrder(): Promise<FlightOrder> {
    throw new ProviderUnsupportedOperationError(this.id, 'getOrder')
  }

  async cancelOrder(): Promise<FlightOrder> {
    throw new ProviderUnsupportedOperationError(this.id, 'cancelOrder')
  }
}

/**
 * Exported for tests — proves Kiwi's raw shape normalizes into the exact
 * same `FlightOffer` model Duffel does. `params` fills in origin/destination
 * when Kiwi's live (non-mock-fallback) response doesn't echo them back —
 * see RealFlightProvider's Kiwi-success mapping, which doesn't set
 * departureAirport/arrivalAirport the way its mock fallback does.
 */
export function searchResultToFlightOffer(result: SearchResult, params?: FlightSearchParams): FlightOffer {
  return {
    id: result.id,
    provider: 'kiwi',
    airline: result.airline ?? result.provider,
    origin: result.departureAirport ?? params?.origin ?? '',
    destination: result.arrivalAirport ?? params?.destination ?? '',
    departureTime: new Date(result.departure).toISOString(),
    arrivalTime: new Date(result.arrival).toISOString(),
    durationMinutes: result.duration,
    stops: result.stops,
    price: result.price,
    currency: result.currency,
    deepLink: result.bookingUrl,
    meta: { provider: 'kiwi', cached: false, fetchedAt: new Date().toISOString() },
    raw: result.raw,
  }
}
