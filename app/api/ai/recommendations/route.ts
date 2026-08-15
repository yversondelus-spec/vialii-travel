import { generateDestinationRecommendations } from '@/lib/ai/anthropic'
import { logger } from '@/lib/logger'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { budget, duration, travelers, interests, currency } = body

    if (
      typeof budget !== 'number' ||
      typeof duration !== 'number' ||
      typeof travelers !== 'number' ||
      !Array.isArray(interests) ||
      typeof currency !== 'string'
    ) {
      return Response.json({ success: false, error: 'Invalid request body' }, { status: 400 })
    }

    const recommendations = await generateDestinationRecommendations(
      budget,
      duration,
      travelers,
      interests,
      currency
    )

    return Response.json({ success: true, data: recommendations })
  } catch (error) {
    logger.error('POST /api/ai/recommendations failed', { message: error instanceof Error ? error.message : String(error) })
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}