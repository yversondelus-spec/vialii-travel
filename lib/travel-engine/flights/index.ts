import type { FlightProvider } from './FlightProvider'
import type { FlightProviderId } from '../core/config'
import { getFlightEngineConfig } from '../core/config'
import { DuffelFlightProvider } from './DuffelFlightProvider'
import { KiwiFlightProvider } from './KiwiFlightProvider'
import { MockFlightProvider } from './MockFlightProvider'

export type { FlightProvider } from './FlightProvider'

const providerInstances: Record<FlightProviderId, FlightProvider> = {
  duffel: new DuffelFlightProvider(),
  kiwi: new KiwiFlightProvider(),
  mock: new MockFlightProvider(),
}

/**
 * The one place in the app that decides which flight providers are active
 * and in what order (Section 19/20 — config-driven, no hardcoded provider
 * choice anywhere else). Adding Amadeus later means: write
 * `AmadeusFlightProvider implements FlightProvider`, register it here and in
 * `FlightEngineConfig`, done — the orchestrator, ranking, AI layer, and
 * every API route are unaffected.
 */
export function getEnabledFlightProviders(): FlightProvider[] {
  const { enabledProviders } = getFlightEngineConfig()
  return enabledProviders.map((id) => providerInstances[id]).filter((provider) => provider.isConfigured)
}

export function getFlightProviderById(id: string): FlightProvider | undefined {
  return (providerInstances as Record<string, FlightProvider>)[id]
}
