export interface FlightSearchParams {
  origin: string
  destination: string
  departDate: Date
  returnDate?: Date
  passengers: number
  currency: string
}

export interface BusSearchParams {
  origin: string
  destination: string
  departDate: Date
  passengers: number
  currency: string
}

export interface TrainSearchParams {
  origin: string
  destination: string
  departDate: Date
  passengers: number
  currency: string
}

export interface SearchResult {
  id: string
  provider: string
  type: 'bus' | 'flight' | 'train'
  departure: Date
  arrival: Date
  duration: number
  price: number
  currency: string
  seats: number
  comfort: number
  stops: number
  direct: boolean
  amenities: string[]
  bookingUrl: string
  /** Original provider payload this result was built from — shape differs per provider, kept for debugging. */
  raw: unknown
  // Flight-specific — optional since bus/train never set these.
  airline?: string
  aircraftType?: string
  departureAirport?: string
  arrivalAirport?: string
}