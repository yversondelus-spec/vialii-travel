import type { BusSearchParams, SearchResult } from './types'

export class MockBusProvider {
  async search(params: BusSearchParams): Promise<SearchResult[]> {
    await new Promise(resolve => setTimeout(resolve, 600))

    const companies = ['Pullman', 'Tur-Bus', 'Buses Vule', 'König']
    const results: SearchResult[] = []

    for (let i = 0; i < 3; i++) {
      const basePrice = 50000 + Math.random() * 30000
      const departHour = 8 + i * 6

      results.push({
        id: `bus-${i}`,
        provider: companies[i],
        type: 'bus',
        departure: new Date(params.departDate.getTime() + departHour * 60 * 60 * 1000),
        arrival: new Date(params.departDate.getTime() + (departHour + 10) * 60 * 60 * 1000),
        duration: 600,
        price: Math.round(basePrice),
        currency: params.currency,
        seats: Math.floor(Math.random() * 30) + 10,
        comfort: 5 + Math.random() * 3,
        stops: 2 + i,
        direct: false,
        amenities: ['Bathroom', 'Air AC', 'Snacks'],
        bookingUrl: 'https://booking.bus.com',
        raw: {}
      })
    }

    return results
  }
}