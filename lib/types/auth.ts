export interface AuthUser {
  id: string
  email: string
  created_at: string
}

/**
 * Whatever trip/recommendation object was on screen when the user hit
 * "save" — callers pass genuinely different, unrelated shapes (TripItinerary,
 * SearchResult, CompleteTrip, or a bare `{ tripId }`), so this is kept as
 * `unknown` rather than a shared interface. Readers that need a label back
 * out of it should go through `getSavedTripLabel` in savedTripsService.ts
 * rather than assuming a shape.
 */
export interface SavedTrip {
  id: string
  userId: string
  tripId: string
  tripData: unknown
  savedAt: string
}
