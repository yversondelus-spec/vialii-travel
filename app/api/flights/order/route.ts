import { getFlightProviderById } from '@/lib/travel-engine/flights'
import { providerErrorResponse } from '@/lib/travel-engine/core/httpErrors'
import { ProviderConfigError } from '@/lib/travel-engine/core/errors'
import type { FlightOrderPassenger } from '@/lib/travel-engine/core/models'

/**
 * Creates an order against a priced offer. Only providers whose adapter
 * implements the real order flow (currently Duffel — see
 * lib/travel-engine/flights/DuffelFlightProvider.ts for why it books as a
 * "hold" order, not "instant") support this; Kiwi/mock respond 501, per
 * `providerErrorResponse`. No payment is captured here — this app has no
 * payment processor wired in yet (see DEPLOYMENT.md).
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { provider: providerId, offerId, passengers } = body as {
      provider?: string
      offerId?: string
      passengers?: FlightOrderPassenger[]
    }

    if (!providerId || !offerId || !Array.isArray(passengers) || passengers.length === 0) {
      return Response.json({ success: false, error: 'provider, offerId, and at least one passenger are required' }, { status: 400 })
    }

    const provider = getFlightProviderById(providerId)
    if (!provider) throw new ProviderConfigError(providerId, 'createOrder', `Unknown provider "${providerId}"`)

    const order = await provider.createOrder({ offerId, passengers })
    return Response.json({ success: true, data: order })
  } catch (error) {
    return providerErrorResponse(error, 'Could not create this order')
  }
}
