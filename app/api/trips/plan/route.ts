import { generateTripPackage } from '@/lib/services/tripBuilder'
import { logger } from '@/lib/logger'
import type { SearchResult } from '@/lib/providers/transport/types'
import type { Interest } from '@/constants/interests'

/** Revives the `Date` fields a client sent as ISO strings over JSON. */
function reviveTransport(input: SearchResult): SearchResult {
  return { ...input, departure: new Date(input.departure), arrival: new Date(input.arrival) }
}

/**
 * Builds a full trip package (transport + hotel + activities + itinerary +
 * cost breakdown) around a real transport option from search results.
 * Section 14's `POST /api/trips/plan`. This is the server-side home for
 * what `PackResultCard.tsx` used to call directly as a client component —
 * see that file's fetch call and tripBuilder.ts's header comment.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { destination, startDate, endDate, transport, budget, interests, attractions, allTransportOptions } = body

    if (!destination || !startDate || !endDate || !transport || typeof budget !== 'number') {
      return Response.json({ success: false, error: 'destination, startDate, endDate, transport, and budget are required' }, { status: 400 })
    }

    const trip = await generateTripPackage(
      destination,
      new Date(startDate),
      new Date(endDate),
      reviveTransport(transport),
      budget,
      (interests ?? []) as Interest[],
      attractions,
      Array.isArray(allTransportOptions) ? allTransportOptions.map(reviveTransport) : undefined
    )

    return Response.json({ success: true, data: trip })
  } catch (error) {
    logger.error('POST /api/trips/plan failed', { message: error instanceof Error ? error.message : String(error) })
    return Response.json({ success: false, error: 'Trip planning failed' }, { status: 500 })
  }
}
