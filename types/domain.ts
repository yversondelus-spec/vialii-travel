export interface User {
  id: string
  email: string
  name: string
  avatar?: string
  createdAt: Date
  updatedAt: Date
  preferences?: UserPreferences
}

export interface UserPreferences {
  currency: 'COP' | 'USD' | 'EUR' | 'GBP'
  travelStyle: 'budget' | 'comfort' | 'luxury'
  preferredDestinations: string[]
  blockedDestinations: string[]
  notificationsEnabled: boolean
  language: 'es' | 'en'
}

export interface Traveler {
  id?: string
  name: string
  age: number
  type: 'adult' | 'child' | 'senior'
  email?: string
  phone?: string
}

export type TravelInterest = 'beach' | 'adventure' | 'romantic' | 'family' | 'culture' | 'luxury' | 'nature' | 'escape'
export type TravelPace = 'relaxed' | 'moderate' | 'fast'
export type TravelStyle = 'budget' | 'comfort' | 'luxury'
export type ClimatePreference = 'hot' | 'temperate' | 'cold'

export interface DiscoveryQuery {
  budget: number
  currency: string
  origin: string
  destination?: string
  startDate: Date
  endDate?: Date
  duration?: number
  travelers: number
  interests: TravelInterest[]
  travelStyle?: TravelStyle
  climate?: ClimatePreference
  pace?: TravelPace
  flexibility?: number
}

export interface Destination {
  id: string
  name: string
  country: string
  region: string
  timezone: string
  coordinates: { lat: number; lng: number }
  description: string
  images: { hero: string; gallery: string[] }
  climate: { avgTemp: number; rainfall: number; bestMonths: string[] }
  travelScore: number
  difficulty: 'easy' | 'moderate' | 'challenging'
  currency: string
  languages: string[]
  attractions: string[]
  safetyRating: number
  costOfLiving: 'cheap' | 'moderate' | 'expensive'
  accessibility: string[]
}

export interface FlightOffer {
  id: string
  provider: string
  airline: string
  flightNumber: string
  departure: { airport: string; airportCode: string; city: string; time: Date }
  arrival: { airport: string; airportCode: string; city: string; time: Date }
  duration: number
  stops: number
  stopsList?: string[]
  price: number
  currency: string
  bookingUrl: string
  affiliate?: { provider: string; commission: number; trackingId?: string }
  rating?: number
  cabin?: 'economy' | 'premium_economy' | 'business' | 'first'
}

export interface HotelOffer {
  id: string
  provider: string
  name: string
  destination: string
  destinationId: string
  address: string
  images: string[]
  coordinates: { lat: number; lng: number }
  checkIn: Date
  checkOut: Date
  nights: number
  roomType: string
  pricePerNight: number
  totalPrice: number
  currency: string
  amenities: string[]
  rating: number
  reviews: number
  bookingUrl: string
  affiliate?: { provider: string; commission: number; trackingId?: string }
  breakfast?: boolean
  cancellation?: string
}

export interface Activity {
  id: string
  name: string
  destination: string
  destinationId: string
  category: 'tour' | 'experience' | 'dining' | 'adventure' | 'cultural' | 'nightlife'
  price: number
  currency: string
  duration: number
  groupSize: number
  minAge?: number
  rating: number
  reviewCount: number
  description: string
  images: string[]
  bookingUrl: string
  provider: string
  highlights: string[]
  difficulty?: 'easy' | 'moderate' | 'challenging'
  language?: string
  meetingPoint?: string
  included?: string[]
}

export interface TripBudget {
  flights: number
  accommodation: number
  meals: number
  activities: number
  transfers: number
  insurance: number
  miscellaneous: number
  currency: string
  originalBudget: number
  savingsPercentage?: number
}

export interface TravelScore {
  overall: number
  factors: { priceValue: number; climate: number; connectivity: number; accommodation: number; activities: number; experience: number }
  explanation: string
  recommendation: string
}

export interface Recommendation {
  id: string
  destination: Destination
  score: TravelScore
  flights: FlightOffer[]
  accommodation: HotelOffer[]
  activities: Activity[]
  transfers?: unknown[]
  estimatedBudget: TripBudget
  remainingBudget: number
  explanation: string
  whyRecommended: string[]
  bestFor?: string[]
  ranking: number
}

export interface Trip {
  id: string
  userId: string
  title: string
  destination: Destination
  travelers: Traveler[]
  startDate: Date
  endDate: Date
  duration: number
  booking: { flights: FlightOffer[]; accommodation: HotelOffer[]; transfers?: unknown[]; insurance?: unknown[] }
  itinerary?: Itinerary
  budget: TripBudget
  status: 'planning' | 'confirmed' | 'booked' | 'completed' | 'cancelled'
  favorite: boolean
  createdAt: Date
  updatedAt: Date
  publishedAt?: Date
}

export interface Itinerary {
  id: string
  tripId: string
  days: DayPlan[]
  generatedBy: 'ai' | 'manual'
  notes: string
  createdAt: Date
  updatedAt: Date
}

export interface DayPlan {
  day: number
  date: Date
  title?: string
  activities: ItineraryActivity[]
  meals: { breakfast?: Meal; lunch?: Meal; dinner?: Meal }
  notes: string
  travelTime?: number
  estimatedCost: number
}

export interface ItineraryActivity {
  id: string
  time: string
  title: string
  description: string
  location: string
  duration: number
  activity?: Activity
  estimatedCost: number
  type: 'transport' | 'activity' | 'tour' | 'dining' | 'rest' | 'check-in' | 'check-out'
  notes?: string
  optional?: boolean
}

export interface Meal {
  name: string
  type: 'breakfast' | 'lunch' | 'dinner'
  location: string
  cuisine?: string
  estimatedCost: number
}

export interface SavedSearch {
  id: string
  userId: string
  destination: Destination
  startDate: Date
  endDate: Date
  budget: number
  travelers: number
  active: boolean
  createdAt: Date
  lastCheckedAt?: Date
}

export interface PriceAlert {
  id: string
  searchId: string
  priceSnapshot: number
  percentageDrop: number
  detectedAt: Date
  notified: boolean
  flightUrl?: string
  hotelUrl?: string
}
