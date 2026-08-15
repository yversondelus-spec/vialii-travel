import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { DuffelFlightProvider } from './DuffelFlightProvider'
import { ProviderAuthenticationError, ProviderConfigError, ProviderError, ProviderRateLimitError, ProviderTimeoutError } from '../core/errors'

/** Minimal fetch Response stand-in — only what DuffelFlightProvider actually reads. */
function fakeResponse(status: number, body: unknown, headers: Record<string, string> = {}) {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: (name: string) => headers[name] ?? null },
    json: async () => body,
  } as Response
}

const OFFER_REQUEST_RESPONSE = {
  data: {
    id: 'orq_1',
    offers: [
      {
        id: 'off_1',
        total_amount: '425.50',
        total_currency: 'USD',
        owner: { name: 'Iberia', iata_code: 'IB' },
        slices: [
          {
            origin: { iata_code: 'SCL' },
            destination: { iata_code: 'MAD' },
            duration: 'PT13H45M',
            segments: [
              {
                operating_carrier: { name: 'Iberia', iata_code: 'IB' },
                marketing_carrier_flight_number: '6842',
                origin: { iata_code: 'SCL' },
                destination: { iata_code: 'MAD' },
                departing_at: '2026-10-10T22:15:00',
                arriving_at: '2026-10-11T12:00:00',
              },
            ],
          },
        ],
        passengers: [{ id: 'pas_real_001', type: 'adult' }],
      },
    ],
  },
}

describe('DuffelFlightProvider', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  describe('without an API key', () => {
    it('throws ProviderConfigError and never calls fetch', async () => {
      const provider = new DuffelFlightProvider(undefined)
      expect(provider.isConfigured).toBe(false)

      await expect(
        provider.searchFlights({ origin: 'SCL', destination: 'MAD', departureDate: '2026-10-10', passengers: { adults: 1 }, currency: 'USD' })
      ).rejects.toBeInstanceOf(ProviderConfigError)
      expect(fetch).not.toHaveBeenCalled()
    })
  })

  describe('searchFlights', () => {
    it('normalizes a successful offer request into FlightOffer[]', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(fakeResponse(200, OFFER_REQUEST_RESPONSE))
      const provider = new DuffelFlightProvider('test_key')

      const offers = await provider.searchFlights({ origin: 'SCL', destination: 'MAD', departureDate: '2026-10-10', passengers: { adults: 1 }, currency: 'USD' })

      expect(offers).toHaveLength(1)
      expect(offers[0].provider).toBe('duffel')
      expect(offers[0].price).toBe(425.5)
      expect(offers[0].origin).toBe('SCL')
    })

    it('maps a 401 to ProviderAuthenticationError, not the generic ProviderError', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(fakeResponse(401, { errors: [{ message: 'invalid token' }] }))
      const provider = new DuffelFlightProvider('bad_key')

      await expect(
        provider.searchFlights({ origin: 'SCL', destination: 'MAD', departureDate: '2026-10-10', passengers: { adults: 1 }, currency: 'USD' })
      ).rejects.toBeInstanceOf(ProviderAuthenticationError)
    })

    it('maps a 429 with a Retry-After header to ProviderRateLimitError.retryAfterSeconds', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(fakeResponse(429, {}, { 'Retry-After': '30' }))
      const provider = new DuffelFlightProvider('test_key')

      const error = await provider
        .searchFlights({ origin: 'SCL', destination: 'MAD', departureDate: '2026-10-10', passengers: { adults: 1 }, currency: 'USD' })
        .catch((e) => e)

      expect(error).toBeInstanceOf(ProviderRateLimitError)
      expect(error.retryAfterSeconds).toBe(30)
    })

    it('retries once on a 500, then succeeds if the retry works', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(fakeResponse(500, { errors: [{ message: 'boom' }] })).mockResolvedValueOnce(fakeResponse(200, OFFER_REQUEST_RESPONSE))
      const provider = new DuffelFlightProvider('test_key')

      const offers = await provider.searchFlights({ origin: 'SCL', destination: 'MAD', departureDate: '2026-10-10', passengers: { adults: 1 }, currency: 'USD' })

      expect(fetch).toHaveBeenCalledTimes(2)
      expect(offers).toHaveLength(1)
    })

    it('does not retry a 400 (non-transient) — fetch is called exactly once', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(fakeResponse(400, { errors: [{ message: 'bad request' }] }))
      const provider = new DuffelFlightProvider('test_key')

      await expect(
        provider.searchFlights({ origin: 'SCL', destination: 'MAD', departureDate: '2026-10-10', passengers: { adults: 1 }, currency: 'USD' })
      ).rejects.toBeInstanceOf(ProviderError)
      expect(fetch).toHaveBeenCalledTimes(1)
    })

    it('LIVE + NO_RESULTS: a well-formed offer request with zero offers resolves to an empty array, not an error', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(fakeResponse(200, { data: { id: 'orq_2', offers: [] } }))
      const provider = new DuffelFlightProvider('test_key')

      const offers = await provider.searchFlights({ origin: 'SCL', destination: 'LIM', departureDate: '2026-10-10', passengers: { adults: 1 }, currency: 'USD' })

      expect(offers).toEqual([])
    })

    it('LIVE + PROVIDER_ERROR: a 500 that persists through the retry surfaces as ProviderError with code PROVIDER_ERROR', async () => {
      vi.mocked(fetch).mockResolvedValue(fakeResponse(500, { errors: [{ message: 'still down' }] }))
      const provider = new DuffelFlightProvider('test_key')

      const error = await provider
        .searchFlights({ origin: 'SCL', destination: 'MAD', departureDate: '2026-10-10', passengers: { adults: 1 }, currency: 'USD' })
        .catch((e) => e)

      expect(error).toBeInstanceOf(ProviderError)
      expect(error.code).toBe('PROVIDER_ERROR')
      expect(fetch).toHaveBeenCalledTimes(2) // original attempt + the one retry, both failed
    })

    it('PROVIDER_TIMEOUT: an aborted request maps to ProviderTimeoutError', async () => {
      const abortError = Object.assign(new Error('The operation was aborted'), { name: 'AbortError' })
      vi.mocked(fetch).mockRejectedValue(abortError)
      const provider = new DuffelFlightProvider('test_key')

      const error = await provider
        .searchFlights({ origin: 'SCL', destination: 'MAD', departureDate: '2026-10-10', passengers: { adults: 1 }, currency: 'USD' })
        .catch((e) => e)

      expect(error).toBeInstanceOf(ProviderTimeoutError)
      expect(error.code).toBe('PROVIDER_TIMEOUT')
    })
  })

  describe('priceOffer', () => {
    it('OFFER_NOT_FOUND: a 404 fetching the offer maps to that specific code, not the generic PROVIDER_ERROR', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(fakeResponse(404, { errors: [{ message: 'not found' }] }))
      const provider = new DuffelFlightProvider('test_key')

      const error = await provider.priceOffer('off_missing').catch((e) => e)

      expect(error).toBeInstanceOf(ProviderError)
      expect(error.code).toBe('OFFER_NOT_FOUND')
    })

    it('OFFER_EXPIRED: an offer whose expires_at is in the past is rejected before being used', async () => {
      const expiredOffer = { ...OFFER_REQUEST_RESPONSE.data.offers[0], expires_at: '2020-01-01T00:00:00Z' }
      vi.mocked(fetch).mockResolvedValueOnce(fakeResponse(200, { data: expiredOffer }))
      const provider = new DuffelFlightProvider('test_key')

      const error = await provider.priceOffer('off_1').catch((e) => e)

      expect(error).toBeInstanceOf(ProviderError)
      expect(error.code).toBe('OFFER_EXPIRED')
    })

    it('a non-expired offer (expires_at in the future) is returned normally', async () => {
      const validOffer = { ...OFFER_REQUEST_RESPONSE.data.offers[0], expires_at: '2099-01-01T00:00:00Z' }
      vi.mocked(fetch).mockResolvedValueOnce(fakeResponse(200, { data: validOffer }))
      const provider = new DuffelFlightProvider('test_key')

      const offer = await provider.priceOffer('off_1')

      expect(offer.id).toBe('off_1')
    })
  })

  describe('createOrder', () => {
    it('sends back the real passenger ids Duffel assigned to the offer, never invented ones', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce(fakeResponse(200, { data: OFFER_REQUEST_RESPONSE.data.offers[0] })) // GET offer
        .mockResolvedValueOnce(fakeResponse(200, { data: { id: 'ord_1', booking_reference: 'RZPNX8', total_amount: '425.50', total_currency: 'USD' } })) // POST order

      const provider = new DuffelFlightProvider('test_key')
      await provider.createOrder({ offerId: 'off_1', passengers: [{ type: 'adult', givenName: 'Amelia', familyName: 'Earhart' }] })

      const orderCall = vi.mocked(fetch).mock.calls[1]
      const requestBody = JSON.parse((orderCall[1] as RequestInit).body as string)
      expect(requestBody.data.passengers[0].id).toBe('pas_real_001')
      expect(requestBody.data.passengers[0].id).not.toMatch(/^engine_pax_/)
      expect(requestBody.data.type).toBe('hold')
    })

    it('rejects when the passenger count sent does not match the offer', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(fakeResponse(200, { data: OFFER_REQUEST_RESPONSE.data.offers[0] }))
      const provider = new DuffelFlightProvider('test_key')

      await expect(
        provider.createOrder({ offerId: 'off_1', passengers: [{ type: 'adult', givenName: 'A', familyName: 'B' }, { type: 'adult', givenName: 'C', familyName: 'D' }] })
      ).rejects.toBeInstanceOf(ProviderError)
    })

    it('OFFER_EXPIRED: refuses to create an order against an expired offer, and never attempts the POST', async () => {
      const expiredOffer = { ...OFFER_REQUEST_RESPONSE.data.offers[0], expires_at: '2020-01-01T00:00:00Z' }
      vi.mocked(fetch).mockResolvedValueOnce(fakeResponse(200, { data: expiredOffer }))
      const provider = new DuffelFlightProvider('test_key')

      const error = await provider
        .createOrder({ offerId: 'off_1', passengers: [{ type: 'adult', givenName: 'A', familyName: 'B' }] })
        .catch((e) => e)

      expect(error).toBeInstanceOf(ProviderError)
      expect(error.code).toBe('OFFER_EXPIRED')
      expect(fetch).toHaveBeenCalledTimes(1) // only the offer GET — no POST /air/orders attempted
    })

    it('OFFER_NOT_FOUND: a 404 fetching the offer before booking maps to that code, and never attempts the POST', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(fakeResponse(404, { errors: [{ message: 'not found' }] }))
      const provider = new DuffelFlightProvider('test_key')

      const error = await provider
        .createOrder({ offerId: 'off_missing', passengers: [{ type: 'adult', givenName: 'A', familyName: 'B' }] })
        .catch((e) => e)

      expect(error).toBeInstanceOf(ProviderError)
      expect(error.code).toBe('OFFER_NOT_FOUND')
      expect(fetch).toHaveBeenCalledTimes(1)
    })

    it('ORDER_CREATION_FAILED: a 500 from POST /air/orders that persists through the retry gets this specific code, not the generic PROVIDER_ERROR', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce(fakeResponse(200, { data: OFFER_REQUEST_RESPONSE.data.offers[0] })) // GET offer succeeds
        .mockResolvedValue(fakeResponse(500, { errors: [{ message: 'booking engine down' }] })) // every POST /air/orders attempt fails

      const provider = new DuffelFlightProvider('test_key')
      const error = await provider
        .createOrder({ offerId: 'off_1', passengers: [{ type: 'adult', givenName: 'Amelia', familyName: 'Earhart' }] })
        .catch((e) => e)

      expect(error).toBeInstanceOf(ProviderError)
      expect(error.code).toBe('ORDER_CREATION_FAILED')
    })
  })

  describe('cancelOrder', () => {
    it('returns status "cancelled" after a successful cancellation, not the old hardcoded "confirmed"', async () => {
      vi.mocked(fetch)
        .mockResolvedValueOnce(fakeResponse(200, { data: { id: 'orc_1' } })) // POST order_cancellations
        .mockResolvedValueOnce(fakeResponse(200, { data: {} })) // POST .../actions/confirm
        .mockResolvedValueOnce(fakeResponse(200, { data: { id: 'ord_1', total_amount: '425.50', total_currency: 'USD', cancelled_at: '2026-10-05T00:00:00Z' } })) // GET order

      const provider = new DuffelFlightProvider('test_key')
      const order = await provider.cancelOrder('ord_1')

      expect(order.status).toBe('cancelled')
    })

    it('ORDER_CANCELLATION_FAILED: a persisting failure creating the cancellation quote gets this specific code', async () => {
      vi.mocked(fetch).mockResolvedValue(fakeResponse(500, { errors: [{ message: 'cancellation engine down' }] }))
      const provider = new DuffelFlightProvider('test_key')

      const error = await provider.cancelOrder('ord_1').catch((e) => e)

      expect(error).toBeInstanceOf(ProviderError)
      expect(error.code).toBe('ORDER_CANCELLATION_FAILED')
    })

    it('ORDER_NOT_FOUND: cancelling a nonexistent order maps the 404 to that code', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(fakeResponse(404, { errors: [{ message: 'not found' }] }))
      const provider = new DuffelFlightProvider('test_key')

      const error = await provider.cancelOrder('ord_missing').catch((e) => e)

      expect(error).toBeInstanceOf(ProviderError)
      expect(error.code).toBe('ORDER_NOT_FOUND')
    })
  })

  describe('getOrder', () => {
    it('is "confirmed" when a payment has been recorded', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(
        fakeResponse(200, { data: { id: 'ord_1', total_amount: '1', total_currency: 'USD', payment_status: { paid_at: '2026-10-05T00:00:00Z' } } })
      )
      const provider = new DuffelFlightProvider('test_key')
      const order = await provider.getOrder('ord_1')
      expect(order.status).toBe('confirmed')
    })

    it('is "pending" for an unpaid hold order (neither cancelled nor paid)', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(fakeResponse(200, { data: { id: 'ord_1', total_amount: '1', total_currency: 'USD' } }))
      const provider = new DuffelFlightProvider('test_key')
      const order = await provider.getOrder('ord_1')
      expect(order.status).toBe('pending')
    })

    it('ORDER_NOT_FOUND: a 404 fetching the order maps to that specific code', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(fakeResponse(404, { errors: [{ message: 'not found' }] }))
      const provider = new DuffelFlightProvider('test_key')

      const error = await provider.getOrder('ord_missing').catch((e) => e)

      expect(error).toBeInstanceOf(ProviderError)
      expect(error.code).toBe('ORDER_NOT_FOUND')
    })
  })
})
