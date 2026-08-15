import type { HotelProvider } from './HotelProvider'
import type { HotelOffer, HotelSearchParams } from '../core/models'
import { timedProviderCall } from '../core/observability'
import { MockHotelProvider as LegacyMockHotelProvider } from '@/lib/providers/hotel/mockHotelProvider'
import type { HotelOption } from '@/lib/providers/hotel/types'

/**
 * Engine-level wrapper around the EXISTING mock hotel generator. Only
 * hotel source in the repo today (Section 10 — real providers deferred, not
 * implemented here to avoid fabricating one). `getHotelDetails`/
 * `getRoomOffers`/`getAvailability` are thin, mock-appropriate
 * implementations built on top of the same search generator — they exist so
 * the interface is real and callable, not so this mock behaves like a real
 * inventory system (re-running search regenerates random prices, it's not
 * a persisted catalog).
 */
export class MockHotelProvider implements HotelProvider {
  readonly id = 'mock'
  readonly name = 'Mock (demo data)'
  readonly isConfigured = true
  private readonly inner = new LegacyMockHotelProvider()

  async searchHotels(params: HotelSearchParams): Promise<HotelOffer[]> {
    return timedProviderCall({ provider: this.id, vertical: 'hotel', operation: 'searchHotels' }, async () => {
      const nights = Math.max(1, Math.round((new Date(params.checkOut).getTime() - new Date(params.checkIn).getTime()) / 86_400_000))
      const results = await this.inner.searchHotels({
        destination: params.destination,
        checkIn: new Date(params.checkIn),
        checkOut: new Date(params.checkOut),
        guests: params.guests,
        currency: params.currency,
      })
      return results.map((hotel) => hotelOptionToHotelOffer(hotel, params, nights))
    })
  }

  async getHotelDetails(hotelId: string): Promise<HotelOffer | null> {
    return timedProviderCall({ provider: this.id, vertical: 'hotel', operation: 'getHotelDetails' }, async () => {
      // No persisted catalog behind the mock — re-search a generic window and match by id.
      const params: HotelSearchParams = { destination: 'destino', checkIn: new Date().toISOString(), checkOut: new Date(Date.now() + 86_400_000).toISOString(), guests: 2, currency: 'CLP' }
      const offers = await this.searchHotels(params)
      return offers.find((o) => o.id === hotelId) ?? null
    })
  }

  async getRoomOffers(hotelId: string, params: HotelSearchParams): Promise<HotelOffer[]> {
    const offers = await this.searchHotels(params)
    return offers.filter((o) => o.id === hotelId)
  }

  async getAvailability(hotelId: string, params: HotelSearchParams): Promise<boolean> {
    const offers = await this.getRoomOffers(hotelId, params)
    return offers.length > 0
  }
}

export function hotelOptionToHotelOffer(hotel: HotelOption, params: HotelSearchParams, nights: number): HotelOffer {
  return {
    id: hotel.id,
    provider: 'mock',
    name: hotel.name,
    destination: params.destination,
    address: hotel.address,
    checkIn: params.checkIn,
    checkOut: params.checkOut,
    nights,
    pricePerNight: hotel.price,
    totalPrice: hotel.price * nights,
    currency: hotel.currency,
    stars: hotel.stars,
    amenities: hotel.amenities,
    deepLink: hotel.bookingUrl,
    meta: { provider: 'mock', cached: false, fetchedAt: new Date().toISOString() },
  }
}
