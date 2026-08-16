import type { HotelOption, HotelProvider, HotelSearchParams } from './types'

// Neighborhoods used to build believable hotel names/addresses. Curated per
// well-known destination where we have one, generic fallback otherwise.
const NEIGHBORHOODS: Record<string, string[]> = {
  paris: ['Le Marais', 'Champs-Élysées', 'Île Saint-Louis', 'Montmartre', 'Saint-Germain'],
  santorini: ['Oia', 'Fira', 'Imerovigli', 'Firostefani'],
  tokyo: ['Shinjuku', 'Shibuya', 'Ginza', 'Asakusa'],
  bali: ['Ubud', 'Seminyak', 'Canggu', 'Nusa Dua'],
  cartagena: ['Ciudad Amurallada', 'Getsemaní', 'Bocagrande'],
}

const GENERIC_NEIGHBORHOODS = ['Centro Histórico', 'Distrito Financiero', 'Barrio Antiguo', 'Zona Costera']

const HOTEL_STYLES = ['Boutique', 'Palace', 'Grand Hotel', 'Suites', 'Residence']

const AMENITY_POOL = [
  'WiFi gratis',
  'Piscina',
  'Desayuno incluido',
  'Gimnasio',
  'Spa',
  'Bar en la azotea',
  'Servicio a la habitación',
  'Recepción 24h',
  'Estacionamiento',
]

function pickAmenities(count: number): string[] {
  const shuffled = [...AMENITY_POOL].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

// $50-200 USD/night, approximated to this app's base currency (CLP) at ~1000x
// (mirrors CostBreakdown's CLP/1000 ≈ USD approximation).
function randomPricePerNight(): number {
  return Math.round(50 + Math.random() * 150) * 1000
}

export class MockHotelProvider implements HotelProvider {
  async searchHotels(params: HotelSearchParams): Promise<HotelOption[]> {

    const key = params.destination.trim().toLowerCase()
    const neighborhoods = NEIGHBORHOODS[key] ?? GENERIC_NEIGHBORHOODS
    const count = 3 + Math.floor(Math.random() * 3) // 3-5 hotels

    return Array.from({ length: count }, (_, idx) => {
      const neighborhood = neighborhoods[idx % neighborhoods.length]
      const style = HOTEL_STYLES[idx % HOTEL_STYLES.length]
      const stars = 3 + Math.floor(Math.random() * 3) // 3-5 stars

      return {
        id: `hotel-${key}-${idx}`,
        name: `${neighborhood} ${style}`,
        stars,
        price: randomPricePerNight(),
        currency: params.currency,
        amenities: pickAmenities(3 + Math.floor(Math.random() * 3)),
        address: `${neighborhood}, ${params.destination}`,
        bookingUrl: `https://booking.example.com/hotel-${key}-${idx}`,
      }
    })
  }
}
