export type BookingComponentType = 'transport' | 'accommodation' | 'activity'

export interface BookingProvider {
  name: string
  buildSearchUrl: (params: { destination: string; checkIn?: string; checkOut?: string }) => string
}

// Real providers, real public search-page URLs — no API key needed to build
// these (they're just links, not authenticated requests). IMPORTANT: no
// affiliate/tracking ID is appended anywhere here, because no real
// affiliate agreement exists with any of these companies yet. Adding one
// later is just filling in a query param once that partnership is real —
// don't fabricate `affiliate_id=VIALII_ID` before it means something.
export const FLIGHT_PROVIDERS: BookingProvider[] = [
  { name: 'Skyscanner', buildSearchUrl: ({ destination }) => `https://www.skyscanner.net/transport/flights-to/${encodeURIComponent(destination)}/` },
  { name: 'Kayak', buildSearchUrl: ({ destination }) => `https://www.kayak.com/flights?destination=${encodeURIComponent(destination)}` },
]

export const HOTEL_PROVIDERS: BookingProvider[] = [
  { name: 'Booking.com', buildSearchUrl: ({ destination, checkIn, checkOut }) => {
    const qs = new URLSearchParams({ ss: destination })
    if (checkIn) qs.set('checkin', checkIn)
    if (checkOut) qs.set('checkout', checkOut)
    return `https://www.booking.com/searchresults.html?${qs.toString()}`
  }},
  { name: 'Airbnb', buildSearchUrl: ({ destination }) => `https://www.airbnb.com/s/${encodeURIComponent(destination)}/homes` },
]

export const ACTIVITY_PROVIDERS: BookingProvider[] = [
  { name: 'Viator', buildSearchUrl: ({ destination }) => `https://www.viator.com/searchResults/all?text=${encodeURIComponent(destination)}` },
  { name: 'GetYourGuide', buildSearchUrl: ({ destination }) => `https://www.getyourguide.com/s/?q=${encodeURIComponent(destination)}` },
]

export function providersFor(type: BookingComponentType): BookingProvider[] {
  if (type === 'transport') return FLIGHT_PROVIDERS
  if (type === 'accommodation') return HOTEL_PROVIDERS
  return ACTIVITY_PROVIDERS
}
