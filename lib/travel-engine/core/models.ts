/**
 * VIALII Travel Engine — normalized domain models.
 *
 * These are the ONLY shapes the orchestrator, ranking engine, AI layer, and
 * frontend are allowed to see for the new `/api/flights/*`, `/api/hotels/search`,
 * `/api/activities/search` routes. Every provider adapter (Duffel, Kiwi, mock,
 * future Amadeus, ...) normalizes its own raw response into these — nothing
 * upstream of an adapter ever inspects a provider-specific field.
 *
 * Deliberately scoped to the new travel-engine API surface only. This project
 * already has two other normalized models for older flows (`lib/types/domain.ts`
 * for /api/search, `types/domain.ts` for /discover) — see ARCHITECTURE.md for
 * why a third one exists here instead of unifying all three in one pass.
 */

// ============================================
// SHARED
// ============================================

/** Which vertical a provider belongs to — used by config/observability/registries. */
export type ProviderVertical = 'flight' | 'hotel' | 'activity' | 'destination' | 'currency' | 'weather'

export interface Money {
  amount: number
  currency: string
}

/**
 * Every normalized offer carries this so the orchestrator/AI/frontend can
 * always tell live data from cache, and which provider is actually behind
 * `provider: "duffel"` without the frontend needing provider-specific logic.
 */
export interface OfferMeta {
  provider: string
  /** True when this offer came from a cache read rather than a live provider call — see Section 16 (cache vs live). */
  cached: boolean
  cachedAt?: string
  fetchedAt: string
}

// ============================================
// FLIGHTS
// ============================================

export type CabinClass = 'economy' | 'premium_economy' | 'business' | 'first'

export interface FlightSegment {
  airline: string
  airlineCode?: string
  flightNumber?: string
  origin: string
  destination: string
  departureTime: string
  arrivalTime: string
  aircraft?: string
}

export interface BaggageAllowance {
  checked?: number
  carryOn?: number
  description?: string
}

/**
 * VIALII's normalized flight offer. Field list matches what the brief asked
 * for (Section 5), adjusted to what a provider can actually attest to —
 * anything a given provider doesn't return stays `undefined`, it is never
 * guessed by the adapter.
 */
export interface FlightOffer {
  id: string
  provider: string
  airline: string
  airlineCode?: string
  flightNumber?: string
  origin: string
  destination: string
  departureTime: string
  arrivalTime: string
  durationMinutes: number
  stops: number
  /** Present when the provider exposes multi-leg detail (e.g. Duffel slices/segments). Single-entry when a provider only reports a summary. */
  segments?: FlightSegment[]
  cabin?: CabinClass
  baggage?: BaggageAllowance
  price: number
  currency: string
  fareConditions?: string
  refundable?: boolean
  changeable?: boolean
  /** Public search/booking link — used by providers with no order API of their own (Kiwi, mock). */
  deepLink?: string
  /** Set once an order exists against this offer (Duffel-style providers only). */
  bookingReference?: string
  meta: OfferMeta
  /** Original provider payload — debugging only, never shown to the user or handed to the AI as a source of truth. */
  raw?: unknown
}

export interface FlightSearchParams {
  origin: string
  destination: string
  departureDate: string
  returnDate?: string
  passengers: { adults: number; children?: number; infants?: number }
  cabinClass?: CabinClass
  currency: string
}

export interface FlightOrderPassenger {
  type: 'adult' | 'child' | 'infant_without_seat'
  givenName: string
  familyName: string
  email?: string
  phoneNumber?: string
  bornOn?: string
  /** Duffel: 'm' | 'f'. Required at order creation. */
  gender?: 'm' | 'f'
  /** Duffel: 'mr' | 'ms' | 'mrs' | 'miss' | 'dr'. */
  title?: 'mr' | 'ms' | 'mrs' | 'miss' | 'dr'
}

export interface CreateFlightOrderInput {
  offerId: string
  passengers: FlightOrderPassenger[]
}

export interface FlightOrder {
  id: string
  provider: string
  status: 'pending' | 'confirmed' | 'cancelled'
  bookingReference?: string
  totalPrice: number
  currency: string
  offer: FlightOffer
  raw?: unknown
}

// ============================================
// HOTELS
// ============================================

export interface HotelOffer {
  id: string
  provider: string
  name: string
  destination: string
  address?: string
  coordinates?: { lat: number; lng: number }
  checkIn: string
  checkOut: string
  nights: number
  pricePerNight: number
  totalPrice: number
  currency: string
  stars?: number
  rating?: number
  reviewCount?: number
  amenities: string[]
  images?: string[]
  refundable?: boolean
  cancellationPolicy?: string
  deepLink?: string
  meta: OfferMeta
  raw?: unknown
}

export interface HotelSearchParams {
  destination: string
  checkIn: string
  checkOut: string
  guests: number
  currency: string
}

// ============================================
// ACTIVITIES
// ============================================

export interface ActivityOffer {
  id: string
  provider: string
  name: string
  destination: string
  category: string
  price: number
  currency: string
  durationMinutes: number
  rating?: number
  reviewCount?: number
  images?: string[]
  deepLink?: string
  meta: OfferMeta
  raw?: unknown
}

export interface ActivitySearchParams {
  destination: string
  currency: string
  attractions?: string[]
}

// ============================================
// DESTINATIONS
// ============================================

export interface DestinationInfo {
  id: string
  provider: string
  name: string
  country: string
  region?: string
  coordinates?: { lat: number; lng: number }
  description?: string
  images?: string[]
  bestMonths?: string[]
  attractions?: string[]
  currency?: string
  languages?: string[]
  raw?: unknown
}

// ============================================
// CURRENCY / WEATHER
// ============================================

export interface CurrencyQuote {
  provider: string
  from: string
  to: string
  rate: number
  amount: number
  convertedAmount: number
  fetchedAt: string
  isFallback: boolean
}

export interface WeatherDayForecast {
  date: string
  tempMinC?: number
  tempMaxC?: number
  condition?: string
}

/**
 * Discriminated result rather than a bare nullable — matches Section 7's
 * rule for every info source, not just AI: when data isn't available, say
 * so explicitly instead of returning something that merely looks empty.
 */
export type WeatherForecastResult =
  | { available: true; provider: string; destination: string; days: WeatherDayForecast[] }
  | { available: false; provider: string; reason: string }

// ============================================
// SEARCH RESULT ENVELOPES
// ============================================

export interface ProviderFailure {
  provider: string
  operation: string
  errorCode: string
  message: string
}

/**
 * Whether this search actually reached a real provider or is running
 * entirely on demo data — resolved once per request from config
 * (`core/config.ts#getTravelEngineMode`), not guessed by the caller.
 * `'live'` means at least one real provider is configured to be tried; it
 * does not guarantee that provider's call succeeded (Kiwi in particular can
 * still silently self-fall-back to mock data per-request — see PROVIDERS.md).
 */
export type TravelEngineMode = 'mock' | 'live'

/** What every orchestrator search returns — offers plus enough metadata to answer "who did we ask, who failed, was this cached, mock or live". */
export interface EngineSearchResult<TOffer> {
  offers: TOffer[]
  providersQueried: string[]
  providersFailed: ProviderFailure[]
  tookMs: number
  cached: boolean
  mode: TravelEngineMode
}
