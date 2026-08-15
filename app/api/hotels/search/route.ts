import { getEnabledHotelProviders } from '@/lib/travel-engine/hotels'
import { logger } from '@/lib/logger'
import type { HotelOffer } from '@/lib/travel-engine/core/models'

/** VIALII's own hotel search endpoint — frontend never imports a hotel provider directly (Section 2/21). */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const destination = searchParams.get('destination')
    const checkIn = searchParams.get('checkIn')
    const checkOut = searchParams.get('checkOut')

    if (!destination || !checkIn || !checkOut) {
      return Response.json({ success: false, error: 'destination, checkIn, and checkOut are required', code: 'VALIDATION_ERROR' }, { status: 400 })
    }

    const params = {
      destination,
      checkIn,
      checkOut,
      guests: Number(searchParams.get('guests') ?? '2') || 2,
      currency: searchParams.get('currency') ?? 'CLP',
    }

    const providers = getEnabledHotelProviders()
    const settled = await Promise.allSettled(providers.map((provider) => provider.searchHotels(params)))

    const offers: HotelOffer[] = []
    settled.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        offers.push(...result.value)
      } else {
        logger.warn('Hotel provider failed during search', { provider: providers[index].id, message: String(result.reason) })
      }
    })

    return Response.json({ success: true, data: { offers } })
  } catch (error) {
    logger.error('GET /api/hotels/search failed', { message: error instanceof Error ? error.message : String(error) })
    return Response.json({ success: false, error: 'Hotel search failed', code: 'INTERNAL_ERROR' }, { status: 500 })
  }
}
