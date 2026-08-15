import { describe, expect, it } from 'vitest'
import { duffelOfferToFlightOffer, type DuffelOffer } from './DuffelFlightProvider'
import { searchResultToFlightOffer } from './KiwiFlightProvider'
import { mockResultToFlightOffer } from './MockFlightProvider'
import type { FlightOffer } from '../core/models'
import type { SearchResult } from '@/lib/providers/transport/types'

/**
 * Proves the contract Section 29 asks for: no matter which provider
 * answered, the orchestrator/ranking/AI/frontend see the exact same
 * `FlightOffer` shape. If a future `AmadeusFlightProvider` passes this same
 * assertion list, it's a drop-in fourth provider.
 */
function assertIsValidFlightOffer(offer: FlightOffer) {
  expect(typeof offer.id).toBe('string')
  expect(offer.id.length).toBeGreaterThan(0)
  expect(typeof offer.provider).toBe('string')
  expect(typeof offer.airline).toBe('string')
  expect(typeof offer.origin).toBe('string')
  expect(typeof offer.destination).toBe('string')
  expect(typeof offer.departureTime).toBe('string')
  expect(typeof offer.arrivalTime).toBe('string')
  expect(typeof offer.durationMinutes).toBe('number')
  expect(typeof offer.stops).toBe('number')
  expect(typeof offer.price).toBe('number')
  expect(offer.price).toBeGreaterThan(0)
  expect(typeof offer.currency).toBe('string')
  expect(offer.meta).toBeDefined()
  expect(typeof offer.meta.provider).toBe('string')
  expect(typeof offer.meta.cached).toBe('boolean')
}

const duffelFixture: DuffelOffer = {
  id: 'off_00009htYpSCXrwaB9DnUm0',
  total_amount: '425.50',
  total_currency: 'USD',
  expires_at: '2026-09-01T00:00:00Z',
  owner: { name: 'Iberia', iata_code: 'IB' },
  slices: [
    {
      origin: { iata_code: 'SCL', name: 'Santiago' },
      destination: { iata_code: 'MAD', name: 'Madrid' },
      duration: 'PT13H45M',
      segments: [
        {
          operating_carrier: { name: 'Iberia', iata_code: 'IB' },
          marketing_carrier: { name: 'Iberia', iata_code: 'IB' },
          marketing_carrier_flight_number: '6842',
          aircraft: { name: 'Airbus A350' },
          origin: { iata_code: 'SCL' },
          destination: { iata_code: 'MAD' },
          departing_at: '2026-10-10T22:15:00',
          arriving_at: '2026-10-11T12:00:00',
          duration: 'PT13H45M',
          passengers: [{ cabin_class: 'economy', baggages: [{ type: 'checked', quantity: 1 }] }],
        },
      ],
    },
  ],
  conditions: {
    refund_before_departure: { allowed: false },
    change_before_departure: { allowed: true, penalty_amount: '75.00', penalty_currency: 'USD' },
  },
}

const kiwiFixture: SearchResult = {
  id: 'kiwi-flight-0',
  provider: 'Iberia',
  type: 'flight',
  departure: new Date('2026-10-10T22:15:00Z'),
  arrival: new Date('2026-10-11T12:00:00Z'),
  duration: 825,
  price: 410000,
  currency: 'CLP',
  seats: 50,
  comfort: 8.5,
  stops: 0,
  direct: true,
  amenities: ['Wifi', 'Food'],
  bookingUrl: 'https://kiwi.com',
  raw: {},
  airline: 'Iberia',
  departureAirport: 'Santiago (SCL)',
  arrivalAirport: 'Madrid (MAD)',
}

describe('Flight offer normalization', () => {
  it('normalizes a Duffel offer into a valid FlightOffer', () => {
    const offer = duffelOfferToFlightOffer(duffelFixture)
    assertIsValidFlightOffer(offer)
    expect(offer.provider).toBe('duffel')
    expect(offer.airline).toBe('Iberia')
    expect(offer.airlineCode).toBe('IB')
    expect(offer.origin).toBe('SCL')
    expect(offer.destination).toBe('MAD')
    expect(offer.price).toBe(425.5)
    expect(offer.currency).toBe('USD')
    expect(offer.durationMinutes).toBe(13 * 60 + 45)
    expect(offer.baggage?.checked).toBe(1)
    expect(offer.refundable).toBe(false)
    expect(offer.changeable).toBe(true)
    expect(offer.segments?.[0].flightNumber).toBe('6842')
  })

  it('normalizes a Kiwi SearchResult into a valid FlightOffer with the same shape', () => {
    const offer = searchResultToFlightOffer(kiwiFixture)
    assertIsValidFlightOffer(offer)
    expect(offer.provider).toBe('kiwi')
    expect(offer.origin).toBe('Santiago (SCL)')
    expect(offer.destination).toBe('Madrid (MAD)')
    expect(offer.price).toBe(410000)
  })

  it('normalizes the mock generator into a valid FlightOffer with the same shape', () => {
    const offer = mockResultToFlightOffer(kiwiFixture)
    assertIsValidFlightOffer(offer)
    expect(offer.provider).toBe('mock')
  })

  it('Duffel and Kiwi offers both carry every required FlightOffer field — proving the "swap provider, same model" contract', () => {
    const REQUIRED_FIELDS: (keyof FlightOffer)[] = [
      'id', 'provider', 'airline', 'origin', 'destination', 'departureTime', 'arrivalTime', 'durationMinutes', 'stops', 'price', 'currency', 'meta',
    ]
    const duffelOffer = duffelOfferToFlightOffer(duffelFixture)
    const kiwiOffer = searchResultToFlightOffer(kiwiFixture)

    for (const field of REQUIRED_FIELDS) {
      expect(duffelOffer, `Duffel offer missing ${field}`).toHaveProperty(field)
      expect(kiwiOffer, `Kiwi offer missing ${field}`).toHaveProperty(field)
    }
  })
})
