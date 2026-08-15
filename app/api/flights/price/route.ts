import { getFlightProviderById } from '@/lib/travel-engine/flights'
import { providerErrorResponse } from '@/lib/travel-engine/core/httpErrors'
import { ProviderConfigError } from '@/lib/travel-engine/core/errors'

/** Re-prices/re-checks availability for a specific offer before checkout — offers can expire or reprice between search and order. */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { provider: providerId, offerId } = body as { provider?: string; offerId?: string }

    if (!providerId || !offerId) {
      return Response.json({ success: false, error: 'provider and offerId are required' }, { status: 400 })
    }

    const provider = getFlightProviderById(providerId)
    if (!provider) throw new ProviderConfigError(providerId, 'priceOffer', `Unknown provider "${providerId}"`)

    const offer = await provider.priceOffer(offerId)
    return Response.json({ success: true, data: offer })
  } catch (error) {
    return providerErrorResponse(error, 'Could not price this offer')
  }
}
