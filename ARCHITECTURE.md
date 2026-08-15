# VIALII Travel Engine — Architecture

This document describes the provider-agnostic architecture introduced to stop VIALII from
depending directly on any single external travel API, and how it fits around the code that
already existed before this refactor. Read this alongside [PROVIDERS.md](PROVIDERS.md) (how to
add/configure a provider) and [API.md](API.md) (the internal API surface).

## The rule

```
Frontend (VIALII UI)
        │  fetch('/api/...')  — never a provider SDK/URL directly
        ▼
VIALII API (Next.js Route Handlers, app/api/**)
        │
        ▼
Travel Engine (lib/travel-engine/)
   ├── Orchestrator     — validates input, calls provider(s), tolerates failures
   ├── Normalization    — each adapter maps its provider's raw response to a VIALII model
   ├── Dedup + Ranking  — cross-provider dedup, weighted scoring
   └── AI layer         — interprets already-ranked, already-priced offers; never invents data
        │
        ▼
Provider Adapters (one class per provider, implementing a shared interface)
        │
        ▼
Duffel · Kiwi (RapidAPI) · mock · (future: Amadeus, Travelport, real hotel/activity APIs, ...)
```

The frontend only ever imports `fetch('/api/flights/search')`, never
`lib/travel-engine/flights/DuffelFlightProvider`. A component can render `offer.provider ===
'duffel'` as a small badge, but it never branches its logic on which provider answered.

## Module layout (modular monolith — see AGENTS.md's "no sobreingeniería" guidance)

```
lib/travel-engine/
  core/            Normalized models, config (provider on/off + priority), error types,
                   observability (structured per-call logging + cost tracking)
  flights/         FlightProvider interface + DuffelFlightProvider, KiwiFlightProvider,
                   MockFlightProvider + the registry that picks which are active
  hotels/          HotelProvider interface + MockHotelProvider (only real source today)
  activities/      ActivityProvider interface + MockActivityProvider
  destinations/    DestinationProvider interface + StaticDestinationProvider
                   (wraps constants/destinations.ts — the only real destination data in the repo)
  currency/        CurrencyProvider interface + ExchangeRateCurrencyProvider
                   (wraps lib/services/currencyService.ts, already live)
  weather/         WeatherProvider interface + UnconfiguredWeatherProvider
                   (no weather API exists in this repo — this returns an explicit
                   "not available" result rather than fabricating one)
  orchestrator/    TravelSearchOrchestrator, dedupe, rank
  ai/              recommend.ts — Claude interpreting the orchestrator's structured output
```

Every adapter file is intentionally small: it does authentication, request building, error
mapping, and normalization for exactly one provider. Nothing outside a given adapter file (and
the shared interface it implements) knows that provider's field names, auth scheme, or quirks.

## Why this wraps existing code instead of replacing it

Before this refactor, `lib/providers/{transport,hotel,activity}/*` and
`lib/services/{searchService,tripBuilder,hotelSelectionService,activityDistributionService}.ts`
already contained real, working logic — a Kiwi/RapidAPI flight integration with graceful mock
fallback, a genuine weighted comparison engine (`lib/providers/comparison/scoreCalculator.ts`),
and hotel/activity mock generators. None of that was broken; it just had no interface boundary
and no way to add a second provider without editing the code that already worked.

So `lib/travel-engine/flights/KiwiFlightProvider.ts`, `hotels/MockHotelProvider.ts`, and
`activities/MockActivityProvider.ts` **wrap** that existing code — translating params in and
normalizing the existing output shape out — rather than reimplementing it. `lib/providers/*` and
the older services stay in place and keep powering the pre-existing `/api/search` flow and
`/search` page exactly as before; nothing there was deleted or rewritten in this pass.

## Three normalized data models — deliberately, not by accident

This repo already had two incompatible normalized models before this refactor (documented in
`README.md` and known project debt): `lib/types/domain.ts` (an older Search-flow model that
nothing currently produces) and `types/domain.ts` (the Discover-flow model, still in active use
by `/discover`). This refactor adds a **third**, `lib/travel-engine/core/models.ts`, scoped
strictly to the new `/api/flights/*`, `/api/hotels/search`, and `/api/activities/search` routes.

That's a real tradeoff, made deliberately: unifying all three into one model in the same pass
that also introduces multi-provider flights would have meant touching every consumer of the two
existing models (Discover's recommendation cards, Search's comparison UI) at the same time as
adding brand-new provider logic — high risk, hard to verify, and out of scope for "add a Travel
Engine without breaking what works." `lib/travel-engine/core/models.ts` is the one new model going
forward; a future, separately-scoped pass can migrate `/api/search` and `/discover` onto it and
retire the older two.

**Full consumer map** (audited Fase 2, re-checked with a fresh `grep`, not assumed from memory):

| Model | Consumers | Flow |
|---|---|---|
| `lib/types/domain.ts` (`TransportOption`/`ComparisonResult`/`OptionScore`) | 12 files: `app/api/search`, `lib/services/searchService.ts`, `lib/providers/comparison/{decisionEngine,scoreCalculator}.ts`, `lib/providers/transport/aggregator.ts`, `lib/services/resultsRanking.ts`, `lib/types/search.ts`, `lib/db/queries.ts`, `components/search/{ComparisonCards,ResultsTabs,FilterBar,PackResultCard}.tsx` | `/search`, `POST /api/search` |
| `types/domain.ts` (`FlightOffer`/`HotelOffer`/`Destination`/`Trip`) | 11 files: `app/discover/page.tsx`, `components/discover/{DiscoveryForm,DestinationRecommendations}.tsx`, `components/trip/{TripDetails,ItineraryView}.tsx`, `lib/services/tripBuilder.ts`, `lib/mock/{itineraries,recommendations}.ts`, `constants/destinations.ts`, plus 2 files this refactor added that deliberately wrap the *existing* Discover flow: `lib/travel-engine/destinations/StaticDestinationProvider.ts`, `app/api/trips/itinerary/route.ts` | `/discover`, `/trip/[id]` |
| `lib/travel-engine/core/models.ts` (`FlightOffer`/`HotelOffer`/`ActivityOffer`/`DestinationInfo`) | 24 files, entirely inside `lib/travel-engine/` plus `app/api/flights|hotels|activities/*` and `app/api/ai/recommend` | `/api/flights/*`, `/api/hotels/search`, `/api/activities/search` |

**When it's time to consolidate**, do it as its own pass, in this order (each step independently
verifiable in a browser, same discipline as every other change in this project):
1. `types/domain.ts` → `lib/travel-engine/core/models.ts`, migrating `/discover` first — fewer
   consumers, and none of them touch the heavier `decisionEngine`/`scoreCalculator` logic.
2. `lib/types/domain.ts` → last, migrating `/search`/`/api/search` — the most entangled with
   business logic (`decisionEngine.ts`, `scoreCalculator.ts`, `resultsRanking.ts`), so it should be
   the step done with the most existing coverage from the earlier migration already proven out.
3. Only after both migrations are verified (build, tests, and a real Playwright pass over
   `/search`, `/discover`, and `/trip/[id]`) delete the two retired files and their exports.

## Config-driven provider selection

`lib/travel-engine/core/config.ts` is the only place that decides which providers are active, by
reading environment variables (see [ENVIRONMENT.md](README.md#variables-de-entorno) /
`.env.example`). No provider name is hardcoded anywhere else — `lib/travel-engine/flights/index.ts`
builds the registry purely from that config. `mock` is always appended last per vertical as a
guaranteed fallback, mirroring the fallback behavior `RealFlightProvider` already had internally,
just made explicit and provider-agnostic at the registry level.

## Mock vs. live — one explicit answer, not an inference

Every `FlightSearchResponse` carries `mode: 'mock' | 'live'`, resolved once per request by
`lib/travel-engine/core/config.ts#getTravelEngineMode()`. `'live'` means at least one real
provider is actually configured (has a credential set, not just its enable flag on) — it does
**not** guarantee that provider's call succeeded on this particular request: Kiwi in particular
can still silently self-fall-back to mock data per-request inside `realFlightProvider.ts` if
RapidAPI itself fails (402, timeout, etc.), which `mode` alone can't see. Before this (Fase 2
audit), which mode was running had to be inferred by combining two separate env flags — there was
no single place that said so.

## Error model

Every travel-engine error response is `{ success: false, error: string, code: TravelEngineErrorCode
}` (`lib/travel-engine/core/errors.ts`) — `VALIDATION_ERROR | PROVIDER_ERROR | PROVIDER_TIMEOUT |
RATE_LIMIT | AUTHENTICATION_ERROR | PROVIDER_NOT_CONFIGURED | PROVIDER_UNSUPPORTED | NO_RESULTS |
OFFER_NOT_FOUND | OFFER_EXPIRED | ORDER_CREATION_FAILED | ORDER_NOT_FOUND |
ORDER_CANCELLATION_FAILED | INTERNAL_ERROR`. `lib/travel-engine/core/httpErrors.ts#providerErrorResponse`
is the single place that maps a thrown error to this shape plus the right HTTP status, so no
`app/api/flights|hotels|activities|ai/recommend` route hand-rolls its own mapping or leaks a raw
provider error to the client. A `RATE_LIMIT` error also carries a `Retry-After` HTTP header and a
`retryAfterSeconds` body field when the provider told us one.

`GET /api/flights/search` additionally distinguishes two ways a search can come back with zero
offers, in `FlightSearchResponse.resultCode` (still `success: true` — an empty result isn't a
request error): `NO_RESULTS` when every queried provider responded and genuinely had nothing, vs.
`PROVIDER_ERROR` when every queried provider failed — reusing the same code vocabulary as every
other engine error rather than a parallel string. Combined with `mode`, this is what lets a caller
distinguish `MOCK`, `LIVE + SUCCESS`, `LIVE + NO_RESULTS`, and `LIVE + PROVIDER_ERROR` (Fase 3).
Before this (Fase 2 audit, "muy importante" per the brief), both empty-result cases produced an
identical `offers: []` with no way to tell them apart without manually inspecting
`providersFailed`. Note `PROVIDER_ERROR` as a `resultCode` is only reachable at all when Duffel or
Kiwi is the sole active provider in a test/mocked setup — in the real default configuration `mock`
is always appended as a guaranteed fallback and never itself returns zero offers; see
`TravelSearchOrchestrator.test.ts`'s Caso 6/7 tests, which exercise it directly by mocking the
provider registry.

## Duffel live booking flow (Fase 3)

The transactional core VIALII needs to prove out against a real Duffel account, end to end:

```
Search                  DuffelFlightProvider#searchFlights
   ↓                    POST /air/offer_requests?return_offers=true
Real Duffel Offer          ↓
   ↓                    duffelOfferToFlightOffer — offer.id kept byte-for-byte, never regenerated
Retrieve fresh offer    DuffelFlightProvider#priceOffer / the GET inside #createOrder
   ↓                    GET /air/offers/:id — also where expiry is checked (see below)
Passenger mapping       offer.passengers[].id (Duffel-issued) zipped positionally with the
   ↓                    caller's name/contact details — never an id VIALII invents
Create Order            POST /air/orders, type: "hold" (see class header comment — no payment
   ↓                    processor exists in this app, so "instant" isn't implementable honestly)
Retrieve Order           GET /air/orders/:id
   ↓
Status derived            deriveOrderStatus(order): cancelled_at set → 'cancelled';
   ↓                      payment_status.paid_at set → 'confirmed'; otherwise → 'pending'
Cancel                    POST /air/order_cancellations, then .../actions/confirm (Duffel's own
   ↓                      two-step flow — no single "delete order" endpoint exists)
Retrieve again           GET /air/orders/:id — cancellation is only trusted once this read-back
                          shows cancelled_at set, not because the cancel call itself returned 200
```

**Offer validity.** Before `createOrder` builds the order payload, it checks the freshly-fetched
offer's `expires_at` against the current time (`assertOfferNotExpired`) and refuses to proceed —
with `code: OFFER_EXPIRED` — rather than letting Duffel reject a stale offer opaquely. A 404 on any
offer/order fetch maps to `OFFER_NOT_FOUND`/`ORDER_NOT_FOUND` specifically (via `RequestOptions` in
`DuffelFlightProvider.ts`), not the generic `PROVIDER_ERROR`. A persisting failure creating the
order itself is `ORDER_CREATION_FAILED`; a persisting failure cancelling one is
`ORDER_CANCELLATION_FAILED` — see [ARCHITECTURE.md's error model](#error-model) for the full code
list.

**Mock vs. live vs. no-results vs. provider-error**, all distinguishable without inspecting a raw
provider payload: `FlightSearchResponse.mode` (`'mock' | 'live'`) tells you whether a real provider
was configured to be tried; `resultCode` (`'NO_RESULTS' | 'PROVIDER_ERROR' | undefined`, only set
when `offers` is empty) tells you why nothing came back. `LIVE + SUCCESS` is `mode: 'live'` with a
non-empty `offers`; `LIVE + NO_RESULTS` is `mode: 'live'`, `resultCode: 'NO_RESULTS'`;
`LIVE + PROVIDER_ERROR` is `mode: 'live'`, `resultCode: 'PROVIDER_ERROR'`; `MOCK` is `mode: 'mock'`
regardless of `resultCode`.

**Protection against an accidental real booking.** `DuffelFlightProvider.createOrder` will place a
real, chargeable-in-live-mode order the moment it's called with a valid offer — there is no
sandbox-detection in this adapter (Duffel's test vs. live behavior is entirely a property of which
access token is configured, not something the code can introspect safely). Two independent guards
exist:
1. **In the app itself:** `createOrder` is only reachable through `POST /api/flights/order`, which
   only ever runs if a caller explicitly hits that endpoint with a real offer id — nothing in
   search, ranking, or the AI layer calls it implicitly.
2. **In `scripts/duffel-live-smoke-test.ts`** (Section 14): the script always runs search + offer
   retrieval, but only proceeds to `createOrder` (then retrieve, then cancel) when
   `LIVE_BOOKING_CONFIRM=true` is explicitly set in the environment. Without it, the script stops
   right after printing the retrieved offer. Nothing in this codebase sets that variable
   automatically, and it isn't read anywhere outside this one script.

**Running it:** `npm run duffel:smoke` (or `npx tsx scripts/duffel-live-smoke-test.ts`). Requires a
real `DUFFEL_API_KEY` in `.env.local` — the script reads it the same place `next dev` does, prints
a clear `BLOCKED` message and exits with code `2` if it's missing, and never fabricates a result.

## Observability and cost

`lib/travel-engine/core/observability.ts` wraps every adapter call with `timedProviderCall`,
recording provider, operation, duration, success/failure, and an optional `cost` field, through
the existing `lib/logger.ts` (no new external service — same "one seam, wire a real sink later"
pattern already used there). `summarizeProviderCalls()` answers exactly the question the brief
asked for: "how many searches did Duffel get, how many became orders."

**Real limitation, not yet solved:** `recordProviderCall`'s `recentCalls` array is an in-memory
ring buffer, scoped to one running Node process. On Vercel (or any serverless host) each request
can land on a different function instance, and instances get recycled — there is **no shared,
durable store** behind this today, so `summarizeProviderCalls()` only reflects one instance's
recent activity, not real production-wide totals. That's fine for local debugging; it is not real
observability. Fixing this properly means a shared store (Postgres/Supabase table, or a metrics
service) — deliberately not added in Fase 2 to avoid the same "dispersión" the brief warned
against (Section 15); flagged here so it's a known gap, not a false sense of coverage.

## AI's role

The AI layer (`lib/travel-engine/ai/recommend.ts`) only ever receives the orchestrator's already
fetched, normalized, and ranked offers. Its system prompt explicitly forbids citing any price,
availability, or condition not present in that data, and the code path returns an
`insufficient_data` result *before* calling the model at all when there's nothing to rank. This is
a prompt-level guarantee, not a cryptographic one — there's no post-hoc check that every number in
Claude's reply appears in the input. If that matters more than a well-constrained prompt in some
future use of this layer, add that check before trusting it in a stricter context.

## What's deliberately out of scope in this pass

- **Bus/train** stay on the pre-existing `/api/search` path — there's no real bus/train aggregator
  in this codebase to wrap, and inventing one would violate the "don't fabricate provider
  functionality" rule. Add `BusProvider`/`TrainProvider` interfaces the same way `FlightProvider`
  was done, when a real integration exists.
- **A live Duffel account.** `DuffelFlightProvider` is written and unit-tested against fixtures
  matching Duffel's documented schema, but this environment has no `DUFFEL_API_KEY` to make a real
  call with. See [PROVIDERS.md](PROVIDERS.md).
- **Real hotel/activity providers** (Section 10/11 of the original brief) — the interfaces and a
  mock implementation exist; wiring a real one (Booking-style API, Viator, GetYourGuide) is future
  work behind the same `HotelProvider`/`ActivityProvider` contracts.
- **Payments.** No processor is integrated anywhere in this app (`/checkout` is an explicit demo).
  `DuffelFlightProvider.createOrder` uses Duffel's "hold" order type specifically because of this
  — see that file's header comment.
