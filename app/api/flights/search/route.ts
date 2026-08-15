import { TravelSearchOrchestrator } from '@/lib/travel-engine/orchestrator/TravelSearchOrchestrator'
import { providerErrorResponse } from '@/lib/travel-engine/core/httpErrors'

const orchestrator = new TravelSearchOrchestrator()

function parseIntOr(value: string | null, fallback: number): number {
  if (!value) return fallback
  const parsed = Number.parseInt(value, 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

/**
 * VIALII's own flight search endpoint — the ONLY thing the frontend is
 * meant to call for flights. It never sees "duffel" or "kiwi" as anything
 * more than a `provider` string on an already-normalized `FlightOffer`
 * (Section 21). Swapping/adding a flight provider is a change to
 * `lib/travel-engine/flights/index.ts` + `.env.local` — this route doesn't change.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)

    const result = await orchestrator.searchFlights({
      origin: searchParams.get('origin') ?? '',
      destination: searchParams.get('destination') ?? '',
      departureDate: searchParams.get('departureDate') ?? '',
      returnDate: searchParams.get('returnDate') ?? undefined,
      passengers: {
        adults: parseIntOr(searchParams.get('adults'), 1),
        children: parseIntOr(searchParams.get('children'), 0),
        infants: parseIntOr(searchParams.get('infants'), 0),
      },
      cabinClass: (searchParams.get('cabinClass') as 'economy' | 'premium_economy' | 'business' | 'first' | null) ?? undefined,
      currency: searchParams.get('currency') ?? 'CLP',
      maxBudget: searchParams.get('maxBudget') ? Number(searchParams.get('maxBudget')) : undefined,
      priority: (searchParams.get('priority') as 'price' | 'time' | 'comfort' | 'experience' | 'balanced' | null) ?? undefined,
    })

    return Response.json({ success: true, data: result })
  } catch (error) {
    return providerErrorResponse(error, 'Flight search failed')
  }
}
