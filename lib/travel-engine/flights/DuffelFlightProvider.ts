import type { FlightProvider } from './FlightProvider'
import type {
  BaggageAllowance,
  CabinClass,
  CreateFlightOrderInput,
  FlightOffer,
  FlightOrder,
  FlightSearchParams,
  FlightSegment,
} from '../core/models'
import { ProviderAuthenticationError, ProviderConfigError, ProviderError, ProviderRateLimitError, ProviderTimeoutError, type TravelEngineErrorCode } from '../core/errors'
import { timedProviderCall } from '../core/observability'
import { withSingleRetry } from '../core/retry'
import { DUFFEL_API_BASE_URL, DUFFEL_API_VERSION } from '../core/config'
import { logger } from '@/lib/logger'

/**
 * Real Duffel adapter — Duffel is a live-flights aggregator (multiple
 * airlines behind one API), not an airline itself. Field names below were
 * verified against Duffel's official docs (duffel.com/docs/api) before
 * writing this file, not guessed:
 *   - Base URL / auth / versioning: docs/api/overview/making-requests
 *   - Offer request body + response: docs/api/offer-requests/schema
 *   - Offer object fields (slices/segments/conditions/pricing): docs/api/offers/schema
 *   - Order creation + response: docs/api/orders/create-order, docs/api/orders/schema
 *   - Cancellation (2-step: quote then confirm): docs/api/order-cancellations/create-order-cancellation
 *
 * Re-verify against those pages before wiring a real key for the first
 * time — Duffel can add/rename fields between doc snapshots.
 *
 * Requires `DUFFEL_API_KEY` (a Duffel test or live access token). Without
 * it, `isConfigured` is false and the registry (flights/index.ts) skips
 * this provider entirely — searches never hard-fail just because Duffel
 * isn't set up yet.
 *
 * `createOrder` uses Duffel's "hold" order type (reserve now, no payment
 * captured at creation) rather than "instant" (which requires an immediate
 * payment via a Duffel balance or card). This app has no payment processor
 * wired in yet (see DEPLOYMENT.md — /checkout is an explicit demo, no
 * Stripe/other PSP integrated), so implementing "instant" honestly would
 * mean either faking a payment or silently no-op'ing one — neither is
 * acceptable. Switch to "instant" once real payments exist.
 */

/**
 * `notFoundCode` lets a specific call site say what a 404 actually means
 * (an offer vs. an order) instead of everything collapsing into the
 * generic `PROVIDER_ERROR`. `genericErrorCode` similarly overrides the
 * default for any other non-specifically-handled failure status — e.g.
 * `createOrder`'s own POST uses `ORDER_CREATION_FAILED` instead of the
 * generic code, so a client (or a log) can tell "we tried to book this and
 * it failed" apart from "a GET request failed" without inspecting the
 * message string.
 */
interface RequestOptions {
  notFoundCode?: TravelEngineErrorCode
  genericErrorCode?: TravelEngineErrorCode
}

export class DuffelFlightProvider implements FlightProvider {
  readonly id = 'duffel'
  readonly name = 'Duffel'
  private readonly apiKey: string | undefined
  private readonly requestTimeoutMs = 20_000

  constructor(apiKey: string | undefined = process.env.DUFFEL_API_KEY) {
    this.apiKey = apiKey
  }

  get isConfigured(): boolean {
    return Boolean(this.apiKey)
  }

  private headers(): Record<string, string> {
    return {
      Authorization: `Bearer ${this.apiKey}`,
      'Duffel-Version': DUFFEL_API_VERSION,
      Accept: 'application/json',
      'Content-Type': 'application/json',
    }
  }

  /**
   * Public entry point: checks config, then retries once on a transient
   * failure (timeout or 5xx) via `withSingleRetry`. 4xx errors (including
   * 429, which carries its own `retryAfterSeconds` for the *caller* to act
   * on) are never retried here — retrying a client error blindly won't fix it.
   */
  private async request<T>(operation: string, path: string, init: RequestInit, options: RequestOptions = {}): Promise<T> {
    if (!this.isConfigured) {
      throw new ProviderConfigError(this.id, operation, 'DUFFEL_API_KEY is not set')
    }

    return withSingleRetry(
      () => this.attemptRequest<T>(operation, path, init, options),
      (error) => error instanceof ProviderTimeoutError || (error instanceof ProviderError && (error.httpStatus ?? 0) >= 500)
    )
  }

  private async attemptRequest<T>(operation: string, path: string, init: RequestInit, options: RequestOptions): Promise<T> {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), this.requestTimeoutMs)

    try {
      const response = await fetch(`${DUFFEL_API_BASE_URL}${path}`, {
        ...init,
        headers: { ...this.headers(), ...(init.headers ?? {}) },
        signal: controller.signal,
      })

      if (response.status === 401 || response.status === 403) {
        logger.warn('DuffelFlightProvider rejected credentials', { operation, status: response.status })
        throw new ProviderAuthenticationError(this.id, operation, response.status)
      }

      if (response.status === 429) {
        const retryAfter = response.headers.get('Retry-After')
        throw new ProviderRateLimitError(this.id, operation, retryAfter ? Number(retryAfter) : undefined)
      }

      if (response.status === 404 && options.notFoundCode) {
        logger.warn('DuffelFlightProvider: resource not found', { operation, status: 404, code: options.notFoundCode })
        throw new ProviderError(`${operation}: resource not found`, { provider: this.id, operation, code: options.notFoundCode, httpStatus: 404 })
      }

      if (!response.ok) {
        const body = await response.json().catch(() => null)
        const message = body?.errors?.[0]?.message ?? `Duffel API responded with ${response.status}`
        // Never log the key itself — only status/message, matching this
        // codebase's existing rule (see lib/ai/anthropic.ts) of never
        // putting secrets into logger output.
        logger.warn('DuffelFlightProvider request failed', { operation, status: response.status, message })
        throw new ProviderError(message, { provider: this.id, operation, code: options.genericErrorCode ?? 'PROVIDER_ERROR', httpStatus: response.status })
      }

      const json = await response.json()
      return json.data as T
    } catch (error) {
      if (error instanceof ProviderError) throw error
      if (error instanceof Error && error.name === 'AbortError') {
        throw new ProviderTimeoutError(this.id, operation, this.requestTimeoutMs)
      }
      throw new ProviderError(error instanceof Error ? error.message : String(error), {
        provider: this.id,
        operation,
        code: options.genericErrorCode ?? 'PROVIDER_ERROR',
        cause: error,
      })
    } finally {
      clearTimeout(timeout)
    }
  }

  async searchFlights(params: FlightSearchParams): Promise<FlightOffer[]> {
    return timedProviderCall({ provider: this.id, vertical: 'flight', operation: 'searchFlights' }, async () => {
      const slices = [{ origin: params.origin, destination: params.destination, departure_date: params.departureDate }]
      if (params.returnDate) {
        slices.push({ origin: params.destination, destination: params.origin, departure_date: params.returnDate })
      }

      const passengers = [
        ...Array(params.passengers.adults).fill({ type: 'adult' }),
        ...Array(params.passengers.children ?? 0).fill({ type: 'child' }),
        ...Array(params.passengers.infants ?? 0).fill({ type: 'infant_without_seat' }),
      ]

      const offerRequest = await this.request<DuffelOfferRequest>(
        'searchFlights',
        '/air/offer_requests?return_offers=true&supplier_timeout=20000',
        {
          method: 'POST',
          body: JSON.stringify({
            data: { slices, passengers, cabin_class: params.cabinClass ?? 'economy' },
          }),
        }
      )

      return (offerRequest.offers ?? []).map((offer) => duffelOfferToFlightOffer(offer, params))
    })
  }

  async priceOffer(offerId: string): Promise<FlightOffer> {
    return timedProviderCall({ provider: this.id, vertical: 'flight', operation: 'priceOffer' }, async () => {
      const offer = await this.request<DuffelOffer>(
        'priceOffer',
        `/air/offers/${offerId}?return_available_services=false`,
        { method: 'GET' },
        { notFoundCode: 'OFFER_NOT_FOUND' }
      )
      assertOfferNotExpired(offer, this.id, 'priceOffer')
      return duffelOfferToFlightOffer(offer)
    })
  }

  async createOrder(input: CreateFlightOrderInput): Promise<FlightOrder> {
    return timedProviderCall({ provider: this.id, vertical: 'flight', operation: 'createOrder' }, async () => {
      // Duffel requires the SAME passenger ids it already assigned to this
      // offer (from the offer/offer-request) — an invented id would be
      // rejected by the real API. Fetch the offer fresh (also gives us its
      // full detail to build a real `FlightOrder.offer` below, instead of a
      // mostly-empty placeholder, and lets us refuse to book an offer that
      // already expired instead of letting Duffel reject it opaquely).
      const offer = await this.request<DuffelOffer>(
        'createOrder',
        `/air/offers/${input.offerId}?return_available_services=false`,
        { method: 'GET' },
        { notFoundCode: 'OFFER_NOT_FOUND' }
      )
      assertOfferNotExpired(offer, this.id, 'createOrder')

      const offerPassengerIds = offer.passengers?.map((p) => p.id) ?? []

      if (offerPassengerIds.length !== input.passengers.length) {
        throw new ProviderError(
          `Passenger count mismatch: this offer has ${offerPassengerIds.length}, the order request has ${input.passengers.length}`,
          { provider: this.id, operation: 'createOrder', code: 'VALIDATION_ERROR' }
        )
      }

      const order = await this.request<DuffelOrder>(
        'createOrder',
        '/air/orders',
        {
          method: 'POST',
          body: JSON.stringify({
            data: {
              type: 'hold',
              selected_offers: [input.offerId],
              passengers: input.passengers.map((p, idx) => ({
                id: offerPassengerIds[idx],
                type: p.type,
                given_name: p.givenName,
                family_name: p.familyName,
                email: p.email,
                phone_number: p.phoneNumber,
                born_on: p.bornOn,
                gender: p.gender,
                title: p.title,
              })),
            },
          }),
        },
        { genericErrorCode: 'ORDER_CREATION_FAILED' }
      )
      return duffelOrderToFlightOrder(order, duffelOfferToFlightOffer(offer))
    })
  }

  async getOrder(orderId: string): Promise<FlightOrder> {
    return timedProviderCall({ provider: this.id, vertical: 'flight', operation: 'getOrder' }, async () => {
      const order = await this.request<DuffelOrder>('getOrder', `/air/orders/${orderId}`, { method: 'GET' }, { notFoundCode: 'ORDER_NOT_FOUND' })
      // No fresh offer to attach here — offers are ephemeral (they expire)
      // while orders persist, and Duffel's order resource doesn't carry full
      // flight detail on its own (see duffelOrderToFlightOrder's fallback).
      return duffelOrderToFlightOrder(order)
    })
  }

  async cancelOrder(orderId: string): Promise<FlightOrder> {
    return timedProviderCall({ provider: this.id, vertical: 'flight', operation: 'cancelOrder' }, async () => {
      // Duffel's cancellation is two calls: quote, then confirm — see file
      // header for the docs page this was verified against.
      const cancellation = await this.request<{ id: string }>(
        'cancelOrder',
        '/air/order_cancellations',
        { method: 'POST', body: JSON.stringify({ data: { order_id: orderId } }) },
        { notFoundCode: 'ORDER_NOT_FOUND', genericErrorCode: 'ORDER_CANCELLATION_FAILED' }
      )
      await this.request(
        'cancelOrder',
        `/air/order_cancellations/${cancellation.id}/actions/confirm`,
        { method: 'POST' },
        { genericErrorCode: 'ORDER_CANCELLATION_FAILED' }
      )
      return this.getOrder(orderId)
    })
  }
}

// ============================================
// Duffel raw response shapes (only the fields this adapter reads).
// Exported so tests can build fixtures with type-checking against the
// exact same shape this file parses, without duplicating field names.
// ============================================

export interface DuffelPlace {
  iata_code?: string
  name?: string
}

export interface DuffelCarrier {
  name?: string
  iata_code?: string
}

export interface DuffelBaggage {
  type?: string
  quantity?: number
}

export interface DuffelSegment {
  operating_carrier?: DuffelCarrier
  marketing_carrier?: DuffelCarrier
  marketing_carrier_flight_number?: string
  aircraft?: { name?: string }
  origin?: DuffelPlace
  destination?: DuffelPlace
  departing_at?: string
  arriving_at?: string
  duration?: string
  passengers?: { cabin_class?: string; baggages?: DuffelBaggage[] }[]
}

export interface DuffelSlice {
  origin?: DuffelPlace
  destination?: DuffelPlace
  duration?: string
  segments?: DuffelSegment[]
}

export interface DuffelConditionRule {
  allowed?: boolean
  penalty_amount?: string
  penalty_currency?: string
}

/** Passenger stub Duffel assigns when the offer (request) is created — `id` here is what `createOrder` must send back, not an id VIALII invents. */
export interface DuffelOfferPassenger {
  id: string
  type?: string
}

export interface DuffelOffer {
  id: string
  total_amount?: string
  total_currency?: string
  expires_at?: string
  owner?: DuffelCarrier
  slices?: DuffelSlice[]
  passengers?: DuffelOfferPassenger[]
  conditions?: {
    change_before_departure?: DuffelConditionRule
    refund_before_departure?: DuffelConditionRule
  }
}

export interface DuffelOfferRequest {
  id: string
  offers?: DuffelOffer[]
}

export interface DuffelOrder {
  id: string
  booking_reference?: string
  total_amount?: string
  total_currency?: string
  /** Set once the order is cancelled — the only reliable signal for that in Duffel's schema (there is no simple top-level `status` enum). */
  cancelled_at?: string | null
  payment_status?: { paid_at?: string | null } | null
}

// ============================================
// Normalization: Duffel -> VIALII models
// ============================================

/** Duffel durations are ISO 8601 ("PT2H26M") — parsed to whole minutes, 0 if unparseable rather than throwing (a display quirk shouldn't fail the whole search). */
function parseIsoDurationMinutes(duration: string | undefined): number {
  if (!duration) return 0
  const match = /P(?:T(?:(\d+)H)?(?:(\d+)M)?)?/.exec(duration)
  const hours = Number(match?.[1] ?? 0)
  const minutes = Number(match?.[2] ?? 0)
  return hours * 60 + minutes
}

function mapBaggage(segments: DuffelSegment[] | undefined): BaggageAllowance | undefined {
  const baggages = segments?.[0]?.passengers?.[0]?.baggages
  if (!baggages?.length) return undefined
  const checked = baggages.find((b) => b.type === 'checked')?.quantity
  const carryOn = baggages.find((b) => b.type === 'carry_on')?.quantity
  return { checked, carryOn }
}

/**
 * Duffel offers carry an `expires_at` — after that, the offer can no longer
 * be used to create an order, even if the id still resolves via GET. Caught
 * here, before attempting `createOrder`, rather than letting Duffel reject
 * the order request opaquely (Fase 3, Section 4: "si la oferta expiró,
 * devolver un error tipado apropiado, no intentar crear una orden").
 */
function assertOfferNotExpired(offer: DuffelOffer, provider: string, operation: string): void {
  if (offer.expires_at && new Date(offer.expires_at).getTime() < Date.now()) {
    throw new ProviderError(`Offer ${offer.id} expired at ${offer.expires_at}`, { provider, operation, code: 'OFFER_EXPIRED' })
  }
}

function describeConditions(conditions: DuffelOffer['conditions']): string | undefined {
  if (!conditions) return undefined
  const parts: string[] = []
  if (conditions.refund_before_departure) {
    parts.push(conditions.refund_before_departure.allowed ? 'Reembolsable' : 'No reembolsable')
  }
  if (conditions.change_before_departure) {
    parts.push(conditions.change_before_departure.allowed ? 'Cambios permitidos' : 'Sin cambios')
  }
  return parts.length ? parts.join(' · ') : undefined
}

export function duffelOfferToFlightOffer(offer: DuffelOffer, params?: FlightSearchParams): FlightOffer {
  const outboundSlice = offer.slices?.[0]
  const outboundSegments = outboundSlice?.segments ?? []
  const firstSegment = outboundSegments[0]
  const lastSegment = outboundSegments[outboundSegments.length - 1]

  const segments: FlightSegment[] = (offer.slices ?? []).flatMap((slice) =>
    (slice.segments ?? []).map((segment) => ({
      airline: segment.operating_carrier?.name ?? segment.marketing_carrier?.name ?? 'Aerolínea',
      airlineCode: segment.operating_carrier?.iata_code ?? segment.marketing_carrier?.iata_code,
      flightNumber: segment.marketing_carrier_flight_number,
      origin: segment.origin?.iata_code ?? '',
      destination: segment.destination?.iata_code ?? '',
      departureTime: segment.departing_at ?? '',
      arrivalTime: segment.arriving_at ?? '',
      aircraft: segment.aircraft?.name,
    }))
  )

  // Outbound-only summary (departure/arrival/duration/stops) — mirrors how
  // this codebase already summarizes round trips elsewhere (a single price,
  // single headline departure/arrival). Full detail lives in `segments`.
  const stops = Math.max(outboundSegments.length - 1, 0)

  return {
    id: offer.id,
    provider: 'duffel',
    airline: firstSegment?.operating_carrier?.name ?? offer.owner?.name ?? 'Aerolínea',
    airlineCode: firstSegment?.operating_carrier?.iata_code ?? offer.owner?.iata_code,
    flightNumber: firstSegment?.marketing_carrier_flight_number,
    origin: outboundSlice?.origin?.iata_code ?? params?.origin ?? '',
    destination: outboundSlice?.destination?.iata_code ?? params?.destination ?? '',
    departureTime: firstSegment?.departing_at ?? '',
    arrivalTime: lastSegment?.arriving_at ?? '',
    durationMinutes: parseIsoDurationMinutes(outboundSlice?.duration),
    stops,
    segments,
    cabin: (firstSegment?.passengers?.[0]?.cabin_class as CabinClass | undefined) ?? params?.cabinClass ?? 'economy',
    baggage: mapBaggage(outboundSegments),
    price: Number(offer.total_amount ?? 0),
    currency: offer.total_currency ?? params?.currency ?? 'USD',
    fareConditions: describeConditions(offer.conditions),
    refundable: offer.conditions?.refund_before_departure?.allowed,
    changeable: offer.conditions?.change_before_departure?.allowed,
    passengerCount: offer.passengers?.length,
    meta: { provider: 'duffel', cached: false, fetchedAt: new Date().toISOString() },
    raw: offer,
  }
}

/**
 * Duffel's order schema has no simple top-level `status` string — this
 * derives one from the fields that actually exist: `cancelled_at` set means
 * cancelled; a recorded payment means confirmed; otherwise it's a "hold"
 * order that's reserved but not yet paid/ticketed, i.e. still pending. (This
 * adapter only ever creates "hold" orders — see the class header comment —
 * so `pending` is the expected, correct status right after `createOrder`
 * succeeds, not `confirmed`.)
 */
function deriveOrderStatus(order: DuffelOrder): FlightOrder['status'] {
  if (order.cancelled_at) return 'cancelled'
  if (order.payment_status?.paid_at) return 'confirmed'
  return 'pending'
}

/**
 * `offer` is only available right after `createOrder` (which fetches the
 * offer fresh to get real passenger ids anyway — see above). `getOrder`/
 * `cancelOrder` don't have a live offer to attach (it may have since
 * expired, and Duffel's order resource doesn't embed full flight detail),
 * so they fall back to a minimal placeholder built only from what the order
 * itself actually reports — never fabricated flight details.
 */
function duffelOrderToFlightOrder(order: DuffelOrder, offer?: FlightOffer): FlightOrder {
  return {
    id: order.id,
    provider: 'duffel',
    status: deriveOrderStatus(order),
    bookingReference: order.booking_reference,
    totalPrice: Number(order.total_amount ?? 0),
    currency: order.total_currency ?? 'USD',
    offer: offer ?? {
      id: order.id,
      provider: 'duffel',
      airline: '',
      origin: '',
      destination: '',
      departureTime: '',
      arrivalTime: '',
      durationMinutes: 0,
      stops: 0,
      price: Number(order.total_amount ?? 0),
      currency: order.total_currency ?? 'USD',
      bookingReference: order.booking_reference,
      meta: { provider: 'duffel', cached: false, fetchedAt: new Date().toISOString() },
    },
    raw: order,
  }
}
