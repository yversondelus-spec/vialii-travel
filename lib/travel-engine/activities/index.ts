import type { ActivityProvider } from './ActivityProvider'
import { getActivityEngineConfig } from '../core/config'
import { MockActivityProvider } from './MockActivityProvider'

export type { ActivityProvider } from './ActivityProvider'

const providerInstances: Record<string, ActivityProvider> = {
  mock: new MockActivityProvider(),
}

export function getEnabledActivityProviders(): ActivityProvider[] {
  const { enabledProviders } = getActivityEngineConfig()
  return enabledProviders.map((id) => providerInstances[id]).filter((provider): provider is ActivityProvider => Boolean(provider?.isConfigured))
}
