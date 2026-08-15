/**
 * Provider on/off + priority, entirely config-driven (Section 20 — never
 * hardcode which provider is in use). Every function here is a pure read of
 * `process.env`, safe to call from server-only code (route handlers, the
 * orchestrator, adapters). Nothing here is imported by client components.
 */

import type { TravelEngineMode } from './models'

function readBool(name: string, fallback: boolean): boolean {
  const raw = process.env[name]
  if (raw === undefined || raw === '') return fallback
  return raw.toLowerCase() === 'true'
}

export type FlightProviderId = 'duffel' | 'kiwi' | 'mock'

export interface FlightEngineConfig {
  /** Priority order — first entry is tried first; a provider whose real call fails or returns nothing falls through to the next. */
  enabledProviders: FlightProviderId[]
  duffelConfigured: boolean
}

/**
 * `mock` is always appended last and can't be disabled — it's VIALII's
 * guaranteed fallback so a flight search never comes back with zero offers
 * just because every real provider is down or unconfigured, mirroring the
 * fallback behavior lib/providers/transport/realFlightProvider.ts already
 * has internally, just made explicit and provider-agnostic at the registry
 * level (Section 19 — primary/fallback chain).
 */
export function getFlightEngineConfig(): FlightEngineConfig {
  const duffelConfigured = Boolean(process.env.DUFFEL_API_KEY)
  const duffelEnabled = readBool('FLIGHTS_DUFFEL_ENABLED', false) && duffelConfigured
  const kiwiEnabled = readBool('FLIGHTS_KIWI_ENABLED', true)

  const enabledProviders: FlightProviderId[] = []
  if (duffelEnabled) enabledProviders.push('duffel')
  if (kiwiEnabled) enabledProviders.push('kiwi')
  enabledProviders.push('mock')

  return { enabledProviders, duffelConfigured }
}

export type HotelProviderId = 'mock'

export function getHotelEngineConfig(): { enabledProviders: HotelProviderId[] } {
  // Only a mock hotel source exists today — see PROVIDERS.md for how to add
  // a real one (ProviderA/ProviderB from Section 10) behind this same flag pattern.
  return { enabledProviders: ['mock'] }
}

export type ActivityProviderId = 'mock'

export function getActivityEngineConfig(): { enabledProviders: ActivityProviderId[] } {
  return { enabledProviders: ['mock'] }
}

/**
 * Single, explicit answer to "is VIALII actually talking to a real flight
 * provider right now, or running on demo data" (Fase 2 audit — no such
 * signal existed before; it had to be inferred by combining flags).
 * `RAPIDAPI_KEY`/`DUFFEL_API_KEY` presence is checked directly here (not
 * just the enable flags) because `FLIGHTS_KIWI_ENABLED` defaults to `true`
 * even with no key set — Kiwi's own provider silently self-falls-back to
 * mock data in that case, which would make "live" a lie.
 */
export function getTravelEngineMode(): TravelEngineMode {
  const kiwiLive = readBool('FLIGHTS_KIWI_ENABLED', true) && Boolean(process.env.RAPIDAPI_KEY)
  const { duffelConfigured } = getFlightEngineConfig()
  const duffelLive = readBool('FLIGHTS_DUFFEL_ENABLED', false) && duffelConfigured
  return kiwiLive || duffelLive ? 'live' : 'mock'
}

export const DUFFEL_API_BASE_URL = 'https://api.duffel.com'

/** Duffel versions their API via this header, not the URL — see PROVIDERS.md. */
export const DUFFEL_API_VERSION = 'v2'
