import type { CreateFlightOrderInput, FlightOffer, FlightOrder, FlightSearchParams } from '../core/models'

/**
 * The contract every flight source implements — Duffel, Kiwi (via RapidAPI),
 * the mock fallback, and eventually Amadeus/Travelport. Nothing outside this
 * file and each adapter's own module is allowed to know which of those it's
 * talking to; the orchestrator only ever sees `FlightProvider`.
 *
 * Names/shape follow Section 4 of the brief (searchFlights → priceOffer →
 * createOrder → getOrder → cancelOrder). Providers that can't fulfil the
 * order-flow methods (no booking API of their own — Kiwi, mock) throw
 * `ProviderUnsupportedOperationError` rather than faking success.
 */
export interface FlightProvider {
  readonly id: string
  readonly name: string
  /** Whether this instance is actually usable right now (has required config, e.g. an API key). Checked by the registry before including it in a search. */
  readonly isConfigured: boolean

  searchFlights(params: FlightSearchParams): Promise<FlightOffer[]>

  /** Re-fetches a specific offer's current price/availability — offers can expire or reprice between search and checkout. */
  priceOffer(offerId: string): Promise<FlightOffer>

  createOrder(input: CreateFlightOrderInput): Promise<FlightOrder>

  getOrder(orderId: string): Promise<FlightOrder>

  cancelOrder(orderId: string): Promise<FlightOrder>
}
