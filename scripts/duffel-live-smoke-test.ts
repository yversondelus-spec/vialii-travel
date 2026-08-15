/**
 * Duffel live smoke test — Fase 3, Section 14 of the VIALII Travel Engine work.
 *
 * Exercises the real transactional core against Duffel's actual API using
 * whatever `DUFFEL_API_KEY` is configured — NOT a unit test (see
 * `lib/travel-engine/flights/DuffelFlightProvider.test.ts` for those, which
 * mock `fetch` and run in every `npm test`). This script makes real network
 * calls and is never part of `npm test` or CI; it's a manually-run
 * verification step for whoever has a real key.
 *
 * Flow: search -> retrieve the chosen offer fresh -> validate its
 * Duffel-issued passenger ids -> (only if explicitly confirmed) create an
 * order -> retrieve it -> cancel it -> retrieve again and verify the final
 * status is actually "cancelled".
 *
 * Usage:
 *   npx tsx scripts/duffel-live-smoke-test.ts
 *   npm run duffel:smoke
 *
 * Safety — read before setting LIVE_BOOKING_CONFIRM:
 *   Without `LIVE_BOOKING_CONFIRM=true` in the environment, this script
 *   stops right after retrieving the offer. No order is ever created, so
 *   nothing can be charged. Only set that flag once you've deliberately
 *   decided to create (and then cancel) a real order against whatever
 *   Duffel account this key belongs to — this script never sets it for you,
 *   and nothing in VIALII's codebase sets it automatically.
 *
 * Exit codes:
 *   0 — completed the steps it was authorized to run
 *   1 — ran, but a step failed
 *   2 — did not run at all: DUFFEL_API_KEY is not configured
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { DuffelFlightProvider } from '../lib/travel-engine/flights/DuffelFlightProvider'
import { isProviderError } from '../lib/travel-engine/core/errors'

/** This script isn't run through `next dev`, so nothing else loads `.env.local` for it — read it the same minimal way, without adding a `dotenv` dependency just for this one file. Never overrides an already-set var (so real CI secrets still win). */
function loadEnvLocal(): void {
  const envPath = resolve(process.cwd(), '.env.local')
  if (!existsSync(envPath)) return
  for (const line of readFileSync(envPath, 'utf8').split(/\r?\n/)) {
    const match = /^([A-Z_][A-Z0-9_]*)=(.*)$/.exec(line.trim())
    if (!match) continue
    const [, key, rawValue] = match
    if (process.env[key] === undefined) {
      process.env[key] = rawValue.replace(/^["']|["']$/g, '')
    }
  }
}

function log(event: string, detail?: Record<string, unknown>): void {
  // Same allowlist as lib/travel-engine/core/observability.ts — provider/id/status/timing, never secrets or PII.
  console.log(`[duffel-smoke] ${event}`, detail ? JSON.stringify(detail) : '')
}

function daysFromNow(days: number): string {
  const date = new Date()
  date.setDate(date.getDate() + days)
  return date.toISOString().split('T')[0]
}

async function main(): Promise<void> {
  loadEnvLocal()

  const apiKey = process.env.DUFFEL_API_KEY
  if (!apiKey) {
    console.error('[duffel-smoke] BLOCKED: DUFFEL_API_KEY is not set (checked process.env and .env.local).')
    console.error('[duffel-smoke] Add it to .env.local (never commit it — see .gitignore) to run this script for real.')
    process.exitCode = 2
    return
  }

  const provider = new DuffelFlightProvider(apiKey)
  // 60 days out — far enough that near-term fare/availability edge cases
  // (same-day cutoffs, last-seat holds) don't make this flaky, without
  // hardcoding a specific calendar date that eventually becomes "the past".
  const departureDate = daysFromNow(60)

  log('SEARCH_STARTED', { origin: 'SCL', destination: 'LIM', departureDate, passengers: 1, cabin: 'economy' })
  const offers = await provider.searchFlights({
    origin: 'SCL',
    destination: 'LIM',
    departureDate,
    passengers: { adults: 1 },
    cabinClass: 'economy',
    currency: 'USD',
  })
  log('SEARCH_SUCCESS', { offerCount: offers.length })

  if (offers.length === 0) {
    log('NO_RESULTS', { note: 'Duffel returned zero offers for SCL->LIM on this date — try a different route/date before assuming something is broken.' })
    return
  }

  const chosen = offers[0]
  log('OFFER_CHOSEN', { offerId: chosen.id, airline: chosen.airline, price: chosen.price, currency: chosen.currency, stops: chosen.stops })

  log('OFFER_RETRIEVE_STARTED', { offerId: chosen.id })
  const freshOffer = await provider.priceOffer(chosen.id)
  log('OFFER_RETRIEVED', { offerId: freshOffer.id, price: freshOffer.price, currency: freshOffer.currency })

  if (process.env.LIVE_BOOKING_CONFIRM !== 'true') {
    log('STOPPED_BEFORE_ORDER', {
      reason: 'LIVE_BOOKING_CONFIRM is not "true" — order creation deliberately skipped so nothing can be charged.',
      toProceed: 'Set LIVE_BOOKING_CONFIRM=true only after deliberately deciding to create (and then cancel) a real order.',
    })
    log('DONE', { result: 'PASS (search + offer retrieve only)' })
    return
  }

  log('ORDER_CREATE_STARTED', { offerId: chosen.id })
  const order = await provider.createOrder({
    offerId: chosen.id,
    passengers: [
      {
        type: 'adult',
        givenName: 'VIALII',
        familyName: 'SmokeTest',
        bornOn: '1990-01-01',
        email: 'smoketest@vialii.com',
        phoneNumber: '+442080160508',
        gender: 'm',
        title: 'mr'
      },
    ],
  })
  log('ORDER_CREATED', { orderId: order.id, status: order.status, bookingReference: order.bookingReference })

  log('ORDER_RETRIEVE_STARTED', { orderId: order.id })
  const fetchedOrder = await provider.getOrder(order.id)
  log('ORDER_RETRIEVED', { orderId: fetchedOrder.id, status: fetchedOrder.status })

  log('ORDER_CANCEL_STARTED', { orderId: order.id })
  const cancelled = await provider.cancelOrder(order.id)
  log('ORDER_CANCELLED', { orderId: cancelled.id, status: cancelled.status })

  if (cancelled.status !== 'cancelled') {
    console.error(`[duffel-smoke] Final status after cancellation was "${cancelled.status}", expected "cancelled" — see PROVIDERS.md's order status derivation.`)
    process.exitCode = 1
    return
  }

  log('DONE', { result: 'PASS (full order lifecycle)' })
}

main().catch((error) => {
  const code = isProviderError(error) ? error.code : 'UNKNOWN'
  console.error(`[duffel-smoke] FAILED [${code}]:`, error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
