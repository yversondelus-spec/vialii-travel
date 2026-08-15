import type { FlightProvider } from './FlightProvider'
import type { FlightOffer, FlightOrder, FlightSearchParams } from '../core/models'
import { ProviderUnsupportedOperationError } from '../core/errors'
import { timedProviderCall } from '../core/observability'
import { MockFlightProvider as LegacyMockFlightProvider } from '@/lib/providers/transport/mockFlightProvider'
import type { SearchResult } from '@/lib/providers/transport/types'

/**
 * Engine-level wrapper around the EXISTING mock flight generator — VIALII's
 * guaranteed last-resort provider (see core/config.ts: always appended last,
 * can't be disabled) so a search never returns zero flights just because
 * every real provider is down or unconfigured.
 */
export class MockFlightProvider implements FlightProvider {
  readonly id = 'mock'
  readonly name = 'Mock (demo data)'
  readonly isConfigured = true
  private readonly inner = new LegacyMockFlightProvider()

  async searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
    return timedProviderCall({ provider: this.id, vertical: 'flight', operation: 'searchFlights' }, async () => {
      const results = await this.inner.search({
        origin: params.origin,
        destination: params.destination,
        departDate: new Date(params.departureDate),
        passengers: (params.passengers.adults ?? 1) + (params.passengers.children ?? 0) + (params.passengers.infants ?? 0),
        currency: params.currency,
      })
      return results.map((result) => mockResultToFlightOffer(result, params))
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

export function mockResultToFlightOffer(result: SearchResult, params?: FlightSearchParams): FlightOffer {
  return {
    id: result.id,
    provider: 'mock',
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
    meta: { provider: 'mock', cached: false, fetchedAt: new Date().toISOString() },
    raw: result.raw,
  }
}
