import { supabase } from '@/lib/db/client'
import { withSupabaseFallback } from '@/lib/utils/supabaseCircuit'
import type { SavedTrip } from '@/lib/types/auth'

// Same real-Supabase-first, localStorage-fallback pattern as authContext.tsx
// (see the comment there) — this only reads/writes localStorage when
// Supabase is actually unreachable. withSupabaseFallback also short-circuits
// repeat attempts once Supabase has been observed unreachable (see
// lib/utils/supabaseCircuit.ts) so a chain of calls doesn't each pay a DNS
// timeout.

const LOCAL_KEY = 'travelai_saved_trips'

function readLocal(): SavedTrip[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]')
  } catch {
    return []
  }
}

function writeLocal(trips: SavedTrip[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(trips))
}

export async function saveTripToFavorites(userId: string, tripId: string, tripData: unknown): Promise<SavedTrip> {
  const savedAt = new Date().toISOString()

  return withSupabaseFallback(
    async () => {
      const { data, error } = await supabase
        .from('saved_trips')
        .insert([{ user_id: userId, trip_id: tripId, trip_data: tripData }])
        .select()
        .single()

      if (error) throw error
      return {
        id: data.id,
        userId: data.user_id,
        tripId: data.trip_id,
        tripData: data.trip_data,
        savedAt: data.saved_at ?? savedAt,
      }
    },
    () => {
      const trips = readLocal()
      const existing = trips.find((t) => t.userId === userId && t.tripId === tripId)
      if (existing) return existing

      const trip: SavedTrip = { id: crypto.randomUUID(), userId, tripId, tripData, savedAt }
      writeLocal([trip, ...trips])
      return trip
    }
  )
}

export async function getSavedTrips(userId: string): Promise<SavedTrip[]> {
  // Read path: fall back to [] on ANY error, not just network ones — a
  // broken read should never crash the UI, only a failed write should.
  try {
    return await withSupabaseFallback(
      async () => {
        const { data, error } = await supabase
          .from('saved_trips')
          .select('*')
          .eq('user_id', userId)
          .order('saved_at', { ascending: false })

        if (error) throw error
        return (data ?? []).map((row) => ({
          id: row.id,
          userId: row.user_id,
          tripId: row.trip_id,
          tripData: row.trip_data,
          savedAt: row.saved_at,
        }))
      },
      () =>
        readLocal()
          .filter((t) => t.userId === userId)
          .sort((a, b) => (a.savedAt < b.savedAt ? 1 : -1))
    )
  } catch {
    return []
  }
}

export async function removeSavedTrip(userId: string, tripId: string): Promise<void> {
  return withSupabaseFallback(
    async () => {
      const { error } = await supabase.from('saved_trips').delete().eq('user_id', userId).eq('trip_id', tripId)
      if (error) throw error
    },
    () => {
      writeLocal(readLocal().filter((t) => !(t.userId === userId && t.tripId === tripId)))
    }
  )
}

/** How many users (across everyone in this browser's local data) saved a trip — powers "X personas guardaron este viaje". */
export async function getSavedCount(tripId: string): Promise<number> {
  try {
    return await withSupabaseFallback(
      async () => {
        const { count, error } = await supabase
          .from('saved_trips')
          .select('id', { count: 'exact', head: true })
          .eq('trip_id', tripId)

        if (error) throw error
        return count ?? 0
      },
      () => readLocal().filter((t) => t.tripId === tripId).length
    )
  } catch {
    return 0
  }
}

/**
 * Best-effort display label for a saved trip's arbitrary `tripData` blob —
 * used instead of assuming a shape, since callers save very different
 * object types (see the comment on SavedTrip.tripData in lib/types/auth.ts).
 */
export function getSavedTripLabel(trip: SavedTrip): string {
  const data = trip.tripData
  if (data && typeof data === 'object') {
    const record = data as Record<string, unknown>
    const destination = record.destination
    if (destination && typeof destination === 'object') {
      const name = (destination as Record<string, unknown>).name
      if (typeof name === 'string' && name) return name
    }
    if (typeof record.provider === 'string' && record.provider) return record.provider
  }
  return trip.tripId
}

export async function isTripSaved(userId: string, tripId: string): Promise<boolean> {
  try {
    return await withSupabaseFallback(
      async () => {
        const { data, error } = await supabase
          .from('saved_trips')
          .select('id')
          .eq('user_id', userId)
          .eq('trip_id', tripId)
          .maybeSingle()

        if (error) throw error
        return !!data
      },
      () => readLocal().some((t) => t.userId === userId && t.tripId === tripId)
    )
  } catch {
    return false
  }
}
