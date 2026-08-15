import type { HotelOffer, HotelSearchParams } from '../core/models'

/** Contract every hotel source implements (Section 10). Only a mock exists today — see PROVIDERS.md for how to wire in a real one behind this same interface. */
export interface HotelProvider {
  readonly id: string
  readonly name: string
  readonly isConfigured: boolean

  searchHotels(params: HotelSearchParams): Promise<HotelOffer[]>
  getHotelDetails(hotelId: string): Promise<HotelOffer | null>
  getRoomOffers(hotelId: string, params: HotelSearchParams): Promise<HotelOffer[]>
  getAvailability(hotelId: string, params: HotelSearchParams): Promise<boolean>
}
