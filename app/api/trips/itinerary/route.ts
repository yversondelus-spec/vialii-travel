import { generateTripItinerary, type TripTransportSummary } from '@/lib/services/tripBuilder'
import { logger } from '@/lib/logger'
import type { Destination } from '@/types/domain'

/**
 * Builds a self-contained demo itinerary (hotel options + activity spread +
 * cost breakdown) around a destination and a fixed transport summary.
 * Server-side home for what `app/trip/[id]/page.tsx` used to call directly
 * as a client component — see that file's fetch call.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { destination, startDate, duration, transport } = body as {
      destination?: Destination
      startDate?: string
      duration?: number
      transport?: TripTransportSummary
    }

    if (!destination || !startDate || !duration || !transport) {
      return Response.json({ success: false, error: 'destination, startDate, duration, and transport are required' }, { status: 400 })
    }

    const trip = await generateTripItinerary(destination, new Date(startDate), duration, transport)
    return Response.json({ success: true, data: trip })
  } catch (error) {
    logger.error('POST /api/trips/itinerary failed', { message: error instanceof Error ? error.message : String(error) })
    return Response.json({ success: false, error: 'Itinerary generation failed' }, { status: 500 })
  }
}
