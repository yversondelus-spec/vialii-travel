import type { FlightSearchParams, SearchResult } from './types'
import { MockFlightProvider } from './mockFlightProvider'
import { logger } from '@/lib/logger'

const mockFallback = new MockFlightProvider()

/** Shape actually read off the Kiwi.com "round-trip" response — the API returns far more than this. */
interface KiwiFlight {
  airline?: string
  local_departure: number
  local_arrival: number
  price: number
  stops?: number
  deep_link?: string
}

export class RealFlightProvider {
  async search(params: FlightSearchParams): Promise<SearchResult[]> {
    try {
      const fromIata = this.getCityIATA(params.origin)
      const toIata = this.getCityIATA(params.destination)
      const dateStr = params.departDate.toISOString().split('T')[0]

      const url = `https://kiwi-com-cheap-flights.p.rapidapi.com/round-trip?fly_from=${fromIata}&fly_to=${toIata}&departure_date=${dateStr}&adults=${params.passengers}&limit=10`

      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'x-rapidapi-key': process.env.RAPIDAPI_KEY || '',
          'x-rapidapi-host': 'kiwi-com-cheap-flights.p.rapidapi.com'
        }
      })

      // Falls back to mock flights below on ANY failure path (bad response,
      // no data, thrown error) — same "try real, degrade to mock" pattern
      // used everywhere else in this app (Supabase circuit breaker,
      // MockBusProvider/MockTrainProvider always being mock). Without this,
      // an expired/unpaid RapidAPI plan (as of this build: 402 Payment
      // Required) meant flight always silently returned zero results,
      // making "avión primero en internacional" impossible to satisfy no
      // matter how results are ranked — there was nothing to rank.
      if (!response.ok) {
        logger.warn('RealFlightProvider: RapidAPI request failed, falling back to mock flights', { status: response.status })
        return mockFallback.search(params)
      }

      const data = await response.json()

      if (!data.data || data.data.length === 0) {
        return mockFallback.search(params)
      }

      return data.data.slice(0, 5).map((flight: KiwiFlight, idx: number) => ({
        id: `kiwi-flight-${idx}`,
        provider: flight.airline || 'Airline',
        type: 'flight' as const,
        departure: new Date(flight.local_departure * 1000),
        arrival: new Date(flight.local_arrival * 1000),
        duration: Math.round((flight.local_arrival - flight.local_departure) / 60),
        price: Math.round(flight.price * 1000),
        currency: 'CLP',
        seats: 50,
        comfort: 8.5,
        stops: flight.stops || 0,
        direct: (flight.stops || 0) === 0,
        amenities: ['Wifi', 'Food', 'Entertainment'],
        bookingUrl: flight.deep_link || 'https://kiwi.com',
        raw: flight
      }))
    } catch (error) {
      logger.warn('RealFlightProvider: request threw, falling back to mock flights', {
        message: error instanceof Error ? error.message : String(error),
      })
      return mockFallback.search(params)
    }
  }

  private getCityIATA(cityName: string): string {
    const mapping: Record<string, string> = {
      'Santiago': 'SCL',
      'Puerto Montt': 'PMC',
      'Antofagasta': 'CTS',
      'Concepción': 'CCP',
      'Temuco': 'ZCO',
      'Valparaíso': 'VAP',
      'La Serena': 'LSC',
      'Coyhaique': 'BRC',
      'Buenos Aires': 'AEP',
      'Lima': 'LIM',
      'Bogotá': 'BOG'
    }
    return mapping[cityName] || 'SCL'
  }
}
