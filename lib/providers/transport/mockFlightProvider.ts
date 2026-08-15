import type { FlightSearchParams, SearchResult } from './types'

// Fallback for when RealFlightProvider's actual API call fails (missing key,
// expired/unpaid RapidAPI plan — confirmed 402 Payment Required on the key
// configured in this project as of this build, network error) — mirrors
// MockBusProvider/MockTrainProvider's existing, already-disclosed pattern
// instead of silently returning zero flights. See realFlightProvider.ts for
// where this gets used.
const AIRLINES: { name: string; comfort: number }[] = [
  { name: 'LATAM', comfort: 8.5 },
  { name: 'Air France', comfort: 8.8 },
  { name: 'United', comfort: 8.2 },
  { name: 'Iberia', comfort: 8.6 },
  { name: 'American Airlines', comfort: 8.0 },
  { name: 'Sky Airline', comfort: 7.5 },
  { name: 'JetSmart', comfort: 7.2 },
]

const AIRCRAFT_TYPES = ['Boeing 787', 'Airbus A350', 'Airbus A320', 'Boeing 777']

// Only the destinations this app actually shows an airport code for get one
// — everything else falls back to a generic "Internacional" label rather
// than a fabricated IATA code for a place that was never verified.
const ARRIVAL_AIRPORTS: Record<string, string> = {
  paris: 'Paris (CDG)',
  madrid: 'Madrid (MAD)',
  barcelona: 'Barcelona (BCN)',
  roma: 'Roma (FCO)',
  londres: 'Londres (LHR)',
  amsterdam: 'Ámsterdam (AMS)',
  'buenos aires': 'Buenos Aires (AEP)',
  'mexico city': 'Ciudad de México (MEX)',
  'ciudad de méxico': 'Ciudad de México (MEX)',
  cancun: 'Cancún (CUN)',
  cusco: 'Cusco (CUZ)',
  'rio de janeiro': 'Río de Janeiro (GIG)',
  bogota: 'Bogotá (BOG)',
  bogotá: 'Bogotá (BOG)',
  tokyo: 'Tokio (NRT)',
  bali: 'Bali (DPS)',
  bangkok: 'Bangkok (BKK)',
  phuket: 'Phuket (HKT)',
  singapur: 'Singapur (SIN)',
  cartagena: 'Cartagena (CTG)',
  sydney: 'Sídney (SYD)',
}

function arrivalAirportFor(destination: string): string {
  return ARRIVAL_AIRPORTS[destination.trim().toLowerCase()] ?? `${destination} (Internacional)`
}

function pick<T>(items: T[], index: number): T {
  return items[index % items.length]
}

export class MockFlightProvider {
  async search(params: FlightSearchParams): Promise<SearchResult[]> {
    await new Promise((resolve) => setTimeout(resolve, 500))

    const results: SearchResult[] = []
    const arrivalAirport = arrivalAirportFor(params.destination)

    for (let i = 0; i < 5; i++) {
      const airline = pick(AIRLINES, i)
      const hasStops = Math.random() > 0.3 // ~70% with a connection, matching real long-haul international routes
      const stops = hasStops ? Math.floor(Math.random() * 2) + 1 : 0
      const durationMinutes = 480 + i * 60 + stops * 90
      const departHour = 6 + i * 3

      results.push({
        id: `flight-${i}`,
        provider: airline.name,
        type: 'flight',
        departure: new Date(params.departDate.getTime() + departHour * 60 * 60 * 1000),
        arrival: new Date(params.departDate.getTime() + (departHour * 60 + durationMinutes) * 60 * 1000),
        duration: durationMinutes,
        price: Math.round(350_000 + i * 50_000 + Math.random() * 60_000),
        currency: params.currency,
        seats: Math.max(10, 100 - i * 10),
        comfort: Math.min(10, airline.comfort + Math.random() * 0.5),
        stops,
        direct: stops === 0,
        amenities: ['Wifi', 'Food', 'Entertainment'],
        bookingUrl: `https://www.skyscanner.net/transport/flights-to/${encodeURIComponent(params.destination)}/`,
        raw: {},
        airline: airline.name,
        aircraftType: pick(AIRCRAFT_TYPES, i),
        departureAirport: 'Santiago (SCL)',
        arrivalAirport,
      })
    }

    return results
  }
}
