# VIALII API

Internal REST API — the only thing the VIALII frontend talks to (see [ARCHITECTURE.md](ARCHITECTURE.md)).
All routes are Next.js Route Handlers under `app/api/**`, server-only. Every response is JSON with
a `success: boolean` field; on failure, the travel-engine routes (`flights`, `hotels`,
`activities`, `ai/recommend`) return `{ success: false, error: string, code: TravelEngineErrorCode
}` — see [ARCHITECTURE.md](ARCHITECTURE.md#error-model) for the full code list and what each HTTP
status means. A `RATE_LIMIT` error also sets a `Retry-After` header.

## Travel Engine routes (new)

### `GET /api/flights/search`

Provider-agnostic flight search — runs every enabled `FlightProvider` in parallel, deduplicates,
and ranks (see [PROVIDERS.md](PROVIDERS.md), `lib/travel-engine/orchestrator/`).

Query params: `origin`, `destination`, `departureDate` (ISO date), `returnDate?`, `adults`
(default 1), `children?`, `infants?`, `cabinClass?` (`economy|premium_economy|business|first`),
`currency` (default `CLP`), `maxBudget?`, `priority?` (`price|time|comfort|experience|balanced`).

Response `data`: `{ offers, ranked, recommended, providersQueried, providersFailed, tookMs, cached,
mode, duplicateAlternatives, resultCode }` — `offers`/`ranked[].offer` are `FlightOffer`
(`lib/travel-engine/core/models.ts`), identical shape regardless of which provider answered.
`mode` is `'mock' | 'live'` (see ARCHITECTURE.md). `duplicateAlternatives` holds duplicate offers
dropped during dedup, keyed by the kept offer's id, so a discarded-but-cheaper-elsewhere match
isn't silently lost. `resultCode` (`'NO_RESULTS' | 'PROVIDER_ERROR' | undefined`) is only set
when `offers` is empty — see ARCHITECTURE.md's error-model section for what each means.

Errors: `400` invalid params (`code: VALIDATION_ERROR`), `500` unexpected failure
(`code: INTERNAL_ERROR`). Individual provider failures don't fail the whole request — they show up
in `providersFailed`, and the search still returns whatever other providers found.

### `POST /api/flights/price`

Body: `{ provider: string, offerId: string }`. Re-fetches an offer's current price/availability.
`501` if the resolved provider doesn't support this (Kiwi, mock).

### `POST /api/flights/order`

Body: `{ provider: string, offerId: string, passengers: FlightOrderPassenger[] }`. Creates an
order. Only Duffel supports this today (as a "hold" order — see PROVIDERS.md); Kiwi/mock return
`501`. No payment is captured — this app has no payment processor integrated.

### `GET /api/flights/order/:id?provider=duffel`

### `DELETE /api/flights/order/:id?provider=duffel`

Fetch / cancel an existing order. `provider` is required as a query param because an order id
alone doesn't say which provider issued it (see the route file's comment for why).

### `GET /api/hotels/search`

Query params: `destination`, `checkIn` (ISO date), `checkOut` (ISO date), `guests` (default 2),
`currency` (default `CLP`). Response `data`: `{ offers: HotelOffer[] }`.

### `GET /api/activities/search`

Query params: `destination`, `currency` (default `CLP`), `attractions?` (comma-separated).
Response `data`: `{ offers: ActivityOffer[] }`.

### `POST /api/ai/recommend`

Body: same shape as `/api/flights/search`'s params (JSON body instead of query string), plus
`maxBudget?`/`priority?`. Runs the full pipeline: `TravelSearchOrchestrator.searchFlights` →
`recommendFlight` (Claude, constrained to only the resulting ranked offers — see
`lib/travel-engine/ai/recommend.ts`). Response `data`: `{ search: FlightSearchResponse,
recommendation: AIFlightRecommendation }`, where `recommendation.status` is `'ok' |
'insufficient_data' | 'error'` — never a guess presented as fact.

### `POST /api/trips/plan`

Body: `{ destination, startDate, endDate, transport, budget, interests?, attractions?,
allTransportOptions? }` (same params `PackResultCard.tsx` already collected). Server-side home for
`lib/services/tripBuilder.ts#generateTripPackage` — moved here so the hotel/activity provider
calls it makes run server-side, not in the browser (see ARCHITECTURE.md's migration note).
Response `data`: `CompleteTrip` (`lib/types/trip.ts`) with `Date` fields as ISO strings — revive
with `reviveCompleteTrip` from `lib/services/tripBuilder.ts` before using.

### `POST /api/trips/itinerary`

Body: `{ destination, startDate, duration, transport }`. Server-side home for
`generateTripItinerary`, used by `app/trip/[id]/page.tsx`. Response `data`: `TripItinerary` with
`Date` fields as ISO strings — revive with `reviveTripItinerary`.

## Pre-existing routes (unchanged by this refactor)

### `POST /api/search`

Compares flight + bus + train for a route (`lib/services/searchService.ts` →
`TransportAggregator` → `DecisionEngine`). Powers the `/search` page. Left exactly as it was —
bus/train have no Travel Engine adapter yet (see ARCHITECTURE.md's "out of scope" section).

### `POST /api/ai/recommendations`

Destination ideas from budget/duration/interests, no real search behind it — powers `/discover`.
Unrelated to `/api/ai/recommend` above (note the singular/plural naming, inherited as-is; not
renamed in this pass to avoid a breaking change to `/discover`).
