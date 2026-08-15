import { describe, expect, it } from 'vitest'
import { dedupeFlightOffers } from './dedupe'
import type { FlightOffer } from '../core/models'

function makeOffer(overrides: Partial<FlightOffer>): FlightOffer {
  return {
    id: 'offer-1',
    provider: 'kiwi',
    airline: 'LATAM',
    airlineCode: 'LA',
    flightNumber: '800',
    origin: 'SCL',
    destination: 'MAD',
    departureTime: '2026-10-10T22:00:00Z',
    arrivalTime: '2026-10-11T12:00:00Z',
    durationMinutes: 840,
    stops: 0,
    price: 500000,
    currency: 'CLP',
    meta: { provider: 'kiwi', cached: false, fetchedAt: new Date().toISOString() },
    ...overrides,
  }
}

describe('dedupeFlightOffers', () => {
  it('collapses two providers reporting the same physical flight, keeping the cheaper one', () => {
    const cheaper = makeOffer({ id: 'duffel-1', provider: 'duffel', price: 480000 })
    const pricier = makeOffer({ id: 'kiwi-1', provider: 'kiwi', price: 520000 })

    const result = dedupeFlightOffers([pricier, cheaper])

    expect(result.offers).toHaveLength(1)
    expect(result.offers[0].id).toBe('duffel-1')
    expect(result.offers[0].price).toBe(480000)
  })

  it('Caso 4: preserves the discarded, pricier duplicate as an alternative instead of dropping it', () => {
    const cheaper = makeOffer({ id: 'duffel-1', provider: 'duffel', price: 480000 })
    const pricier = makeOffer({ id: 'kiwi-1', provider: 'kiwi', price: 520000 })

    const result = dedupeFlightOffers([pricier, cheaper])

    expect(result.alternatives['duffel-1']).toBeDefined()
    expect(result.alternatives['duffel-1']).toHaveLength(1)
    expect(result.alternatives['duffel-1'][0].id).toBe('kiwi-1')
    expect(result.alternatives['duffel-1'][0].price).toBe(520000)
  })

  it('keeps offers that are genuinely different flights, with no alternatives recorded', () => {
    const morning = makeOffer({ id: 'a', departureTime: '2026-10-10T08:00:00Z' })
    const evening = makeOffer({ id: 'b', departureTime: '2026-10-10T22:00:00Z' })

    const result = dedupeFlightOffers([morning, evening])

    expect(result.offers).toHaveLength(2)
    expect(result.alternatives).toEqual({})
  })

  it('returns an empty result for empty input without throwing', () => {
    expect(dedupeFlightOffers([])).toEqual({ offers: [], alternatives: {} })
  })
})
