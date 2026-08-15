export interface HotelSearchParams {
  destination: string
  checkIn: Date
  checkOut: Date
  guests: number
  currency: string
}

export interface HotelOption {
  id: string
  name: string
  stars: number
  price: number
  currency: string
  amenities: string[]
  address: string
  bookingUrl: string
}

export interface HotelProvider {
  searchHotels(params: HotelSearchParams): Promise<HotelOption[]>
}
