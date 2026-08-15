import { describe, expect, it } from 'vitest'
import { rankFlightOffers } from './rank'
import type { FlightOffer } from '../core/models'

function makeOffer(overrides: Partial<FlightOffer>): FlightOffer {
  return {
    id: 'offer',
    provider: 'mock',
    airline: 'LATAM',
    origin: 'SCL',
    destination: 'MAD',
    departureTime: '2026-10-10T22:00:00Z',
    arrivalTime: '2026-10-11T12:00:00Z',
    durationMinutes: 840,
    stops: 0,
    price: 500000,
    currency: 'CLP',
    meta: { provider: 'mock', cached: false, fetchedAt: new Date().toISOString() },
    ...overrides,
  }
}

describe('rankFlightOffers', () => {
  it('returns an empty array for no offers', () => {
    expect(rankFlightOffers([])).toEqual([])
  })

  it('ranks the cheapest direct flight above a pricier one with a stop, under balanced priority', () => {
    const cheapDirect = makeOffer({ id: 'cheap-direct', price: 400000, stops: 0, durationMinutes: 780 })
    const pricierWithStop = makeOffer({ id: 'pricier-stop', price: 600000, stops: 2, durationMinutes: 1100 })

    const ranked = rankFlightOffers([pricierWithStop, cheapDirect])

    expect(ranked[0].offer.id).toBe('cheap-direct')
    expect(ranked[0].score.finalScore).toBeGreaterThan(ranked[1].score.finalScore)
  })

  it('weighs price much more heavily when priority is "price"', () => {
    const cheaper = makeOffer({ id: 'cheaper', price: 300000, durationMinutes: 1200, stops: 2 })
    const fasterButPricier = makeOffer({ id: 'faster', price: 900000, durationMinutes: 200, stops: 0 })

    const ranked = rankFlightOffers([fasterButPricier, cheaper], { priority: 'price' })

    expect(ranked[0].offer.id).toBe('cheaper')
  })

  it('penalizes offers over the given max budget', () => {
    const overBudget = makeOffer({ id: 'over', price: 900000 })
    const withinBudget = makeOffer({ id: 'within', price: 400000 })

    const ranked = rankFlightOffers([overBudget, withinBudget], { maxBudget: 500000 })

    expect(ranked[0].offer.id).toBe('within')
  })

  it('gives every offer a reason string', () => {
    const ranked = rankFlightOffers([makeOffer({ id: 'a' }), makeOffer({ id: 'b', price: 700000 })])
    for (const r of ranked) {
      expect(typeof r.reason).toBe('string')
      expect(r.reason.length).toBeGreaterThan(0)
    }
  })
})
