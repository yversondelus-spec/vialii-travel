import type { FlightSearchParams, SearchResult } from './types'

export class MockFlightProvider {
  async search(params: FlightSearchParams): Promise<SearchResult[]> {
    await new Promise(resolve => setTimeout(resolve, 800))

    const airlines = ['LATAM', 'Sky Airline', 'Jetsmart', 'Viva Air']
    const results: SearchResult[] = []

    for (let i = 0; i < 3; i++) {
      const basePrice = 120000 + Math.random() * 80000
      const departHour = 8 + i * 4

      results.push({
        id: `flight-${i}`,
        provider: airlines[i],
        type: 'flight',
        departure: new Date(params.departDate.getTime() + departHour * 60 * 60 * 1000),
        arrival: new Date(params.departDate.getTime() + (departHour + 2.5) * 60 * 60 * 1000),
        duration: 150,
        price: Math.round(basePrice),
        currency: params.currency,
        seats: Math.floor(Math.random() * 20) + 5,
        comfort: 8 + Math.random() * 2,
        stops: i === 0 ? 0 : 1,
        direct: i === 0,
        amenities: ['Wifi', 'Food', 'Entertainment'],
        bookingUrl: 'https://booking.airline.com',
        raw: {}
      })
    }

    return results
  }
}