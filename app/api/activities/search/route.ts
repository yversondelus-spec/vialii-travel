import { getEnabledActivityProviders } from '@/lib/travel-engine/activities'
import { logger } from '@/lib/logger'
import type { ActivityOffer } from '@/lib/travel-engine/core/models'

/** VIALII's own activities search endpoint — frontend never imports an activity provider directly (Section 2/21). */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const destination = searchParams.get('destination')

    if (!destination) {
      return Response.json({ success: false, error: 'destination is required', code: 'VALIDATION_ERROR' }, { status: 400 })
    }

    const attractionsParam = searchParams.get('attractions')
    const params = {
      destination,
      currency: searchParams.get('currency') ?? 'CLP',
      attractions: attractionsParam ? attractionsParam.split(',').map((a) => a.trim()).filter(Boolean) : undefined,
    }

    const providers = getEnabledActivityProviders()
    const settled = await Promise.allSettled(providers.map((provider) => provider.searchActivities(params)))

    const offers: ActivityOffer[] = []
    settled.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        offers.push(...result.value)
      } else {
        logger.warn('Activity provider failed during search', { provider: providers[index].id, message: String(result.reason) })
      }
    })

    return Response.json({ success: true, data: { offers } })
  } catch (error) {
    logger.error('GET /api/activities/search failed', { message: error instanceof Error ? error.message : String(error) })
    return Response.json({ success: false, error: 'Activity search failed', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
