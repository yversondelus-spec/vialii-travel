import { TravelSearchOrchestrator } from '@/lib/travel-engine/orchestrator/TravelSearchOrchestrator'
import { recommendFlight } from '@/lib/travel-engine/ai/recommend'
import { providerErrorResponse } from '@/lib/travel-engine/core/httpErrors'

const orchestrator = new TravelSearchOrchestrator()

/**
 * Orchestrator-aware AI recommendation for flights — the end-to-end path
 * Section 29 describes: search params -> TravelSearchOrchestrator ->
 * providers -> normalized + ranked offers -> AI explanation -> frontend.
 * Kept alongside the existing `/api/ai/recommendations` (used by /discover,
 * a different flow with no real search behind it) rather than replacing it.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()

    const searchResult = await orchestrator.searchFlights({
      origin: body.origin,
      destination: body.destination,
      departureDate: body.departureDate,
      returnDate: body.returnDate,
      passengers: body.passengers ?? { adults: 1 },
      cabinClass: body.cabinClass,
      currency: body.currency ?? 'CLP',
      maxBudget: body.maxBudget,
      priority: body.priority,
    })

    const recommendation = await recommendFlight(searchResult)

    return Response.json({ success: true, data: { search: searchResult, recommendation } })
  } catch (error) {
    return providerErrorResponse(error, 'Recommendation failed')
  }
}
