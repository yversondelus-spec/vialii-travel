import type { HotelProvider } from './HotelProvider'
import { getHotelEngineConfig } from '../core/config'
import { MockHotelProvider } from './MockHotelProvider'

export type { HotelProvider } from './HotelProvider'

const providerInstances: Record<string, HotelProvider> = {
  mock: new MockHotelProvider(),
}

export function getEnabledHotelProviders(): HotelProvider[] {
  const { enabledProviders } = getHotelEngineConfig()
  return enabledProviders.map((id) => providerInstances[id]).filter((provider): provider is HotelProvider => Boolean(provider?.isConfigured))
}
