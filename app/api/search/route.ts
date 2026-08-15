import { SearchService } from '@/lib/services/searchService'
import { logger } from '@/lib/logger'
import type { SearchQuery } from '@/lib/types/domain'

export async function POST(request: Request) {
  try {
    const body = await request.json()

    if (!body.origin || !body.destination || !body.travel_date || !body.num_passengers) {
      return Response.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const query: SearchQuery = {
      origin: body.origin,
      destination: body.destination,
      travel_date: new Date(body.travel_date),
      num_passengers: body.num_passengers,
      max_budget: body.max_budget,
      priority: body.priority || 'balanced',
      preferences: body.preferences,
      return_date: body.return_date ? new Date(body.return_date) : undefined,
      passengers_detail: body.passengers_detail,
      budget_unit: body.budget_unit,
      interests: body.interests,
    }

    const searchService = new SearchService()
    const result = await searchService.search(query)

    return Response.json({ success: true, data: result })
  } catch (error) {
    logger.error('POST /api/search failed', { message: error instanceof Error ? error.message : String(error) })
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed'
      },
      { status: 500 }
    )
  }
}
