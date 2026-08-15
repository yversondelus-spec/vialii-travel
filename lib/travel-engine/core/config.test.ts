import { afterEach, describe, expect, it } from 'vitest'
import { getFlightEngineConfig } from './config'

const ENV_KEYS = ['FLIGHTS_DUFFEL_ENABLED', 'DUFFEL_API_KEY', 'FLIGHTS_KIWI_ENABLED'] as const

function resetEnv() {
  for (const key of ENV_KEYS) delete process.env[key]
}

describe('getFlightEngineConfig', () => {
  afterEach(resetEnv)

  it('defaults to Kiwi + mock, with Duffel off, when nothing is configured', () => {
    resetEnv()
    const config = getFlightEngineConfig()
    expect(config.enabledProviders).toEqual(['kiwi', 'mock'])
    expect(config.duffelConfigured).toBe(false)
  })

  it('never activates Duffel without a real API key, even if the flag is true', () => {
    process.env.FLIGHTS_DUFFEL_ENABLED = 'true'
    const config = getFlightEngineConfig()
    expect(config.enabledProviders).not.toContain('duffel')
  })

  it('activates Duffel only when both the flag AND the key are set, ahead of Kiwi', () => {
    process.env.FLIGHTS_DUFFEL_ENABLED = 'true'
    process.env.DUFFEL_API_KEY = 'duffel_test_123'
    const config = getFlightEngineConfig()
    expect(config.enabledProviders).toEqual(['duffel', 'kiwi', 'mock'])
    expect(config.duffelConfigured).toBe(true)
  })

  it('always keeps "mock" last, as a guaranteed fallback, regardless of config', () => {
    process.env.FLIGHTS_KIWI_ENABLED = 'false'
    const config = getFlightEngineConfig()
    expect(config.enabledProviders[config.enabledProviders.length - 1]).toBe('mock')
  })
})
