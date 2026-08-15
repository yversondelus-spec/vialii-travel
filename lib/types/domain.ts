// ============================================
// USUARIOS Y AUTH
// ============================================
export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  tier: 'free' | 'premium'
  created_at: Date
  updated_at: Date
  premium_until?: Date
  searches_remaining: number
}

export interface UserPreferences {
  user_id: string
  priority_mode: 'price' | 'time' | 'comfort' | 'experience' | 'balanced'
  max_duration_hours?: number
  min_comfort_score: number
  prefers_direct_routes: boolean
  environmental_preference: 'eco' | 'standard' | 'comfort'
}

// ============================================
// BÚSQUEDA Y COMPARATIVA
// ============================================
export interface SearchQuery {
  origin: string
  destination: string
  travel_date: Date
  num_passengers: number
  max_budget?: number
  preferences?: UserPreferences
  priority?: 'price' | 'time' | 'comfort' | 'experience' | 'balanced'
  // Additive fields from the unified search form (lib/types/searchCriteria.ts).
  // None of these are read by TransportAggregator/DecisionEngine yet — providers
  // still price every passenger the same and search a single outbound date.
  // Carried through so `results.search_query` reflects what was actually asked
  // for, and so this doesn't need another breaking shape change once child/
  // infant pricing and round-trip search are implemented.
  return_date?: Date
  passengers_detail?: { adults: number; children: number; infants: number }
  budget_unit?: 'per_person' | 'total'
  interests?: string[]
}

export interface SavedSearch {
  id: string
  user_id: string
  origin: string
  destination: string
  travel_date: Date
  num_passengers: number
  max_budget?: number
  preferences?: UserPreferences
  created_at: Date
}

// ============================================
// OPCIONES DE TRANSPORTE
// ============================================
export type TransportType = 'bus' | 'flight' | 'train' | 'combo'

export interface TransportOption {
  id: string
  type: TransportType
  provider: string
  departure_time: Date
  arrival_time: Date
  duration_minutes: number
  price: number
  currency: string
  seats_available: number
  comfort_score: number
  amenities: string[]
  stops: number
  direct: boolean
  co2_emissions?: number
  booking_url: string
  raw_data?: unknown
}

// ============================================
// HOTEL
// ============================================
export interface HotelOption {
  id: string
  name: string
  price_per_night: number
  currency: string
  rating: number
  reviews_count: number
  amenities: string[]
  location: {
    lat: number
    lng: number
    address: string
  }
  image_url: string
  booking_url: string
}

// ============================================
// ACTIVIDADES
// ============================================
export interface Activity {
  id: string
  name: string
  category: string
  price: number
  duration_minutes: number
  rating: number
  reviews: number
  description: string
  booking_url: string
}

// ============================================
// SCORING Y RECOMENDACIÓN
// ============================================
export interface OptionScore {
  transport_id: string
  price_score: number
  time_score: number
  comfort_score: number
  reliability_score: number
  experience_score: number
  final_score: number
  reasoning: string
}

export interface ComparisonResult {
  id: string
  search_query: SearchQuery
  options: TransportOption[]
  scores: OptionScore[]
  recommended: {
    option_id: string
    score: number
    reasoning: string
  }
  hotels: HotelOption[]
  activities: Activity[]
  created_at: Date
}

export interface SavedComparison {
  id: string
  search_id: string
  user_id: string
  comparison_data: ComparisonResult
  selected_option?: TransportOption
  created_at: Date
}

// ============================================
// BOOKING Y MONETIZACIÓN
// ============================================
export interface UserBooking {
  id: string
  user_id: string
  origin: string
  destination: string
  transport_type: TransportType
  booking_data: unknown
  total_cost: number
  affiliate_link: string
  booking_status: 'pending' | 'completed' | 'cancelled'
  created_at: Date
}

export interface AffiliateTracking {
  id: string
  booking_id: string
  user_id: string
  affiliate_source: 'busbud' | 'skyscanner' | 'booking' | 'viator'
  commission_percentage: number
  estimated_commission: number
  confirmed_commission?: number
  status: 'pending' | 'confirmed' | 'paid'
}

// ============================================
// ANALYTICS
// ============================================
export interface SearchAnalytic {
  id: string
  origin: string
  destination: string
  search_date: Date
  num_passengers: number
  budget_range?: string
  selected_transport: TransportType
  selected_option: TransportOption
  price_paid: number
}
