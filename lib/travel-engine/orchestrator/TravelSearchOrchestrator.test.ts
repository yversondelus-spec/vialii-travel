import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { FlightOffer } from '../core/models'
import type { FlightProvider } from '../flights/FlightProvider'

const { getEnabledFlightProvidersMock, workingOffer } = vi.hoisted(() => {
  const workingOffer: FlightOffer = {
    id: 'working-offer',
    provider: 'working',
    airline: 'LATAM',
    origin: 'SCL',
    destination: 'MAD',
    departureTime: '2026-10-10T22:00:00Z',
    arrivalTime: '2026-10-11T12:00:00Z',
    durationMinutes: 840,
    stops: 0,
    price: 500000,
    currency: 'CLP',
    meta: { provider: 'working', cached: false, fetchedAt: new Date().toISOString() },
  }
  return { getEnabledFlightProvidersMock: vi.fn(), workingOffer }
})

// Mocked so this test exercises the orchestrator's own logic (parallel
// calls, per-provider failure tolerance, dedupe, rank, result codes)
// without depending on real config/env or making any network call.
vi.mock('../flights', () => ({
  getEnabledFlightProviders: getEnabledFlightProvidersMock,
}))

// Static imports work here because Vitest hoists `vi.mock(...)` calls above
// every import in this file (including these), so `../flights` is already
// mocked by the time `TravelSearchOrchestrator` (which imports it) loads.
import { TravelSearchOrchestrator } from './TravelSearchOrchestrator'
import { InvalidSearchParamsError } from '../core/errors'

function fakeProvider(id: string, searchFlights: FlightProvider['searchFlights']): FlightProvider {
  return { id, name: id, isConfigured: true, searchFlights, priceOffer: vi.fn(), createOrder: vi.fn(), getOrder: vi.fn(), cancelOrder: vi.fn() }
}

const failingSearchFlights = vi.fn().mockRejectedValue(new Error('provider is down'))
const workingSearchFlights = vi.fn().mockResolvedValue([workingOffer])
const failingProvider = fakeProvider('failing', failingSearchFlights)
const workingProvider = fakeProvider('working', workingSearchFlights)

const baseRequest = {
  origin: 'SCL',
  destination: 'MAD',
  departureDate: '2026-10-10',
  passengers: { adults: 1 },
  currency: 'CLP',
}

describe('TravelSearchOrchestrator.searchFlights', () => {
  beforeEach(() => {
    failingSearchFlights.mockClear()
    workingSearchFlights.mockClear()
    getEnabledFlightProvidersMock.mockReset()
    getEnabledFlightProvidersMock.mockReturnValue([failingProvider, workingProvider])
  })

  it('tolerates one provider failing and still returns the working provider\'s offers (Caso 5)', async () => {
    const orchestrator = new TravelSearchOrchestrator()
    const result = await orchestrator.searchFlights(baseRequest)

    expect(result.offers).toHaveLength(1)
    expect(result.offers[0].id).toBe(workingOffer.id)
    expect(result.providersQueried).toEqual(['failing', 'working'])
    expect(result.providersFailed).toHaveLength(1)
    expect(result.providersFailed[0].provider).toBe('failing')
    expect(result.ranked[0].offer.id).toBe(workingOffer.id)
    expect(result.recommended?.offer.id).toBe(workingOffer.id)
    expect(result.resultCode).toBeUndefined()
  })

  it('rejects a search with a missing origin before calling any provider', async () => {
    const orchestrator = new TravelSearchOrchestrator()
    await expect(orchestrator.searchFlights({ ...baseRequest, origin: '' })).rejects.toBeInstanceOf(InvalidSearchParamsError)
    expect(failingSearchFlights).not.toHaveBeenCalled()
    expect(workingSearchFlights).not.toHaveBeenCalled()
  })

  it('rejects a search with an invalid departure date', async () => {
    const orchestrator = new TravelSearchOrchestrator()
    await expect(orchestrator.searchFlights({ ...baseRequest, departureDate: 'not-a-date' })).rejects.toBeInstanceOf(InvalidSearchParamsError)
  })

  it('rejects a search with zero adult passengers', async () => {
    const orchestrator = new TravelSearchOrchestrator()
    await expect(orchestrator.searchFlights({ ...baseRequest, passengers: { adults: 0 } })).rejects.toBeInstanceOf(InvalidSearchParamsError)
  })

  it('Caso 6: every queried provider fails -> resultCode is PROVIDER_ERROR, still success (empty offers, not a thrown error)', async () => {
    const otherFailing = fakeProvider('other-failing', vi.fn().mockRejectedValue(new Error('also down')))
    getEnabledFlightProvidersMock.mockReturnValue([failingProvider, otherFailing])

    const orchestrator = new TravelSearchOrchestrator()
    const result = await orchestrator.searchFlights(baseRequest)

    expect(result.offers).toEqual([])
    expect(result.providersFailed).toHaveLength(2)
    expect(result.resultCode).toBe('PROVIDER_ERROR')
  })

  it('Caso 7: no providers failed but none had flights -> resultCode is NO_RESULTS, distinct from PROVIDER_ERROR', async () => {
    const emptyProvider = fakeProvider('empty', vi.fn().mockResolvedValue([]))
    getEnabledFlightProvidersMock.mockReturnValue([emptyProvider])

    const orchestrator = new TravelSearchOrchestrator()
    const result = await orchestrator.searchFlights(baseRequest)

    expect(result.offers).toEqual([])
    expect(result.providersFailed).toEqual([])
    expect(result.resultCode).toBe('NO_RESULTS')
  })

  it('resolves a travel-engine mode of "mock" when no provider credentials are configured', async () => {
    // Cleared explicitly rather than assumed — this must not depend on
    // whatever happens to be in the environment running the test suite.
    delete process.env.RAPIDAPI_KEY
    delete process.env.DUFFEL_API_KEY
    const orchestrator = new TravelSearchOrchestrator()
    const result = await orchestrator.searchFlights(baseRequest)
    expect(result.mode).toBe('mock')
  })
})
