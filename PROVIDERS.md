# VIALII Travel Engine — Providers

How each provider vertical is implemented today, how to turn one on, and how to add a new one.
See [ARCHITECTURE.md](ARCHITECTURE.md) for how these fit into the overall system.

## Flights

| Provider | File | Status | Enable with |
|---|---|---|---|
| Duffel | `lib/travel-engine/flights/DuffelFlightProvider.ts` | Real adapter, needs a key | `FLIGHTS_DUFFEL_ENABLED=true` + `DUFFEL_API_KEY` |
| Kiwi (RapidAPI) | `lib/travel-engine/flights/KiwiFlightProvider.ts` | Real, already live (wraps pre-existing code) | `FLIGHTS_KIWI_ENABLED=true` (default) + `RAPIDAPI_KEY` |
| Mock | `lib/travel-engine/flights/MockFlightProvider.ts` | Always on, can't be disabled | — (guaranteed fallback) |

Priority order (which one is tried, and what falls back to what) is resolved by
`lib/travel-engine/core/config.ts#getFlightEngineConfig` — Duffel first when configured, then
Kiwi, then mock last. All three implement `lib/travel-engine/flights/FlightProvider.ts` and are
combined by `TravelSearchOrchestrator`, which runs every enabled provider in parallel, tolerates
individual failures, deduplicates, and ranks.

### Duffel

Duffel aggregates many airlines behind one API — it's the provider the original brief asked to
prioritize. **This adapter has never made a live call in this environment** — there is no
`DUFFEL_API_KEY` here, and none was invented (per the project's own rule against fabricating
provider credentials). It was built and its request/response field names verified against
Duffel's official docs before writing any code:

- Base URL, auth (`Authorization: Bearer <token>`), versioning (`Duffel-Version: v2`): `duffel.com/docs/api/overview/making-requests`
- Offer Request body/response: `duffel.com/docs/api/offer-requests/schema`
- Offer object fields (slices, segments, conditions, pricing): `duffel.com/docs/api/offers/schema`
- Order creation/response: `duffel.com/docs/api/orders/create-order`, `duffel.com/docs/api/orders/schema`
- Cancellation (two-step: create a cancellation quote, then confirm it): `duffel.com/docs/api/order-cancellations/create-order-cancellation`

**To activate it:**
1. Create a Duffel account at [duffel.com](https://duffel.com) and get a test access token from
   the dashboard (no business/commercial approval is required for Duffel's test environment —
   confirm current requirements on their site, this may change).
2. Set `DUFFEL_API_KEY` and `FLIGHTS_DUFFEL_ENABLED=true` in `.env.local`.
3. Re-verify the field names above against Duffel's live docs before trusting real traffic — API
   docs can change between when this was written and when you read it.

**Order type:** `createOrder` books a Duffel **"hold"** order (reserved, no payment captured at
creation) rather than "instant" (which requires an immediate payment). This app has no payment
processor integrated anywhere (`/checkout` is an explicit demo — see `DEPLOYMENT.md`), so
implementing "instant" honestly wasn't possible without either faking a payment or silently
no-op'ing one. Switch to "instant" once a real payment processor exists.

**Order status** is derived, not assumed: `cancelled_at` set → `'cancelled'`; a recorded payment
(`payment_status.paid_at`) → `'confirmed'`; otherwise (the expected state right after `createOrder`
succeeds, since it only ever creates "hold" orders) → `'pending'`. Duffel's order schema has no
simple top-level `status` string — this reads the fields that actually carry that information
(fixed in the Fase 2 audit; the original implementation hardcoded `'confirmed'` unconditionally).

**Passenger ids:** `createOrder` fetches the offer fresh (`GET /air/offers/:id`) to read the real
passenger ids Duffel already assigned when the offer was created, and sends those back — Duffel
rejects (or at best ignores) ids it didn't itself issue. Also fixed in the Fase 2 audit; the
original implementation invented ids client-side, which would not have worked against a real key.

**Resilience:** one retry (after ~500ms, via `lib/travel-engine/core/retry.ts#withSingleRetry`) on
a timeout or 5xx — never on a 4xx, since retrying a malformed/unauthorized request won't fix it. A
401/403 raises `ProviderAuthenticationError` specifically, distinct from a generic transient
failure, so logs and error codes (`AUTHENTICATION_ERROR`) can tell "the key is wrong" apart from
"Duffel is having a bad day" without a human reading the message. A 404 on an offer/order fetch
raises `OFFER_NOT_FOUND`/`ORDER_NOT_FOUND` specifically; an offer past its `expires_at` is refused
with `OFFER_EXPIRED` before `createOrder` ever attempts to book it; a persisting failure creating
or cancelling an order is `ORDER_CREATION_FAILED`/`ORDER_CANCELLATION_FAILED` (Fase 3).

**Live smoke test:** `npm run duffel:smoke` (`scripts/duffel-live-smoke-test.ts`) runs the real
transactional core — search → retrieve offer → validate passenger ids → (only with
`LIVE_BOOKING_CONFIRM=true`) create → retrieve → cancel → retrieve → verify final status — against
whatever `DUFFEL_API_KEY` is actually configured. This is the only place in the repo that makes a
live call to Duffel; it is never run by `npm test` or CI. See ARCHITECTURE.md's "Duffel live
booking flow" section for the full diagram and the accidental-booking safeguards.

### Kiwi (RapidAPI)

Largely unchanged behavior from before this refactor — `KiwiFlightProvider` is a thin wrapper
around the pre-existing `lib/providers/transport/realFlightProvider.ts`, which already has its own
graceful fallback to mock data on any failure (missing key, expired RapidAPI plan, network error).
It has no order-management API reachable through this integration — `priceOffer`/`createOrder`/
`getOrder`/`cancelOrder` all return HTTP 501 through the API.

One real gap closed in the Fase 2 audit: `realFlightProvider.ts`'s fetch call had no timeout of its
own (every other provider does), so a hung RapidAPI request had no application-level cap. Fixed
with a 10s `AbortController` directly in that file — a narrow, additive change (mirrors the same
pattern already used in `lib/ai/anthropic.ts` and `DuffelFlightProvider.ts`) that reuses the
existing catch block's fallback-to-mock behavior rather than introducing a new one. A
wrapper-level retry was deliberately **not** added at the `KiwiFlightProvider` layer: since
`realFlightProvider.ts` already swallows every failure internally and falls back to mock rather
than rejecting, there is essentially nothing for an outer retry to ever catch — it would be dead
code. Retry only makes sense where the adapter can actually observe a real failure, which today
means Duffel only.

### Mock

Deterministic demo data generator, always included last in the provider chain so a flight search
never returns zero results just because every real provider is down or unconfigured. Same
limitation as Kiwi: no order API, 501 on those operations.

## Hotels / Activities

Only a mock source exists for either vertical today (`lib/travel-engine/hotels/MockHotelProvider.ts`,
`lib/travel-engine/activities/MockActivityProvider.ts`), each wrapping the pre-existing generators
in `lib/providers/hotel/` and `lib/providers/activity/`. Both interfaces
(`lib/travel-engine/hotels/HotelProvider.ts`, `.../activities/ActivityProvider.ts`) already include
the full method set the brief asked for (`searchHotels`/`getHotelDetails`/`getRoomOffers`/
`getAvailability` and `searchActivities`/`getActivityDetails`/`getAvailability`), so a real
provider (a hotel aggregator API, Viator, GetYourGuide) can be added later without touching the
orchestrator, API routes, or frontend — same pattern as Duffel below.

## Destinations / Currency / Weather

- **Destinations** — `StaticDestinationProvider` wraps `constants/destinations.ts`, the only real
  (curated, image-verified) destination data in this repo. Not a live API.
- **Currency** — `ExchangeRateCurrencyProvider` wraps the already-live
  `lib/services/currencyService.ts` (real rates via open.er-api.com, with a static fallback table).
- **Weather** — `UnconfiguredWeatherProvider` always returns an explicit "not available" result.
  No weather API is integrated in this codebase; nothing was invented to fill the interface.

## Adding a new provider (worked example: a second flight source)

1. Create `lib/travel-engine/flights/AmadeusFlightProvider.ts` implementing
   `FlightProvider` (`lib/travel-engine/flights/FlightProvider.ts`) — auth, request building, error
   mapping, and normalization to `FlightOffer` (`lib/travel-engine/core/models.ts`) all live in this
   one file. Verify Amadeus's actual API docs before writing field names, the same way Duffel's
   were verified above.
2. Register it in `lib/travel-engine/flights/index.ts`'s `providerInstances` map and add an
   `'amadeus'` entry to `FlightProviderId` in `lib/travel-engine/core/config.ts`.
3. Add an `AMADEUS_ENABLED` / `AMADEUS_API_KEY` pair to `.env.example` and
   `getFlightEngineConfig()`.
4. Nothing else changes — `TravelSearchOrchestrator`, `rank.ts`/`dedupe.ts`, the AI layer, every
   `app/api/flights/*` route, and the frontend are all provider-agnostic already. This is the
   concrete version of the brief's success criterion (Section 29).

## Observability

Every adapter call goes through `lib/travel-engine/core/observability.ts#timedProviderCall`, which
records provider/operation/duration/success/failure (and an optional cost) through the existing
`lib/logger.ts`. `summarizeProviderCalls()` gives a per-provider rollup (calls, successes,
failures, orders created, average latency) — in-memory only today (no external metrics service is
wired in, same posture as the rest of this codebase's logging).
