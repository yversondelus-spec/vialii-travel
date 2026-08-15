import { getFlightProviderById } from '@/lib/travel-engine/flights'
import { providerErrorResponse } from '@/lib/travel-engine/core/httpErrors'
import { ProviderConfigError } from '@/lib/travel-engine/core/errors'

/**
 * `provider` is required as a query param (`?provider=duffel`) because an
 * order id alone doesn't say which provider issued it — VIALII doesn't
 * encode that into the id itself to keep ids exactly what the provider
 * returned. The client already has `provider` from the `createOrder`
 * response, so this is one extra query param, not an extra lookup.
 */
function resolveProvider(request: Request, id: string, operation: string) {
  const providerId = new URL(request.url).searchParams.get('provider')
  if (!providerId) {
    throw new ProviderConfigError('unknown', operation, 'provider query param is required (e.g. ?provider=duffel)')
  }
  const provider = getFlightProviderById(providerId)
  if (!provider) throw new ProviderConfigError(providerId, operation, `Unknown provider "${providerId}"`)
  return provider
}

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const provider = resolveProvider(request, id, 'getOrder')
    const order = await provider.getOrder(id)
    return Response.json({ success: true, data: order })
  } catch (error) {
    return providerErrorResponse(error, 'Could not fetch this order')
  }
}

export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  try {
    const provider = resolveProvider(request, id, 'cancelOrder')
    const order = await provider.cancelOrder(id)
    return Response.json({ success: true, data: order })
  } catch (error) {
    return providerErrorResponse(error, 'Could not cancel this order')
  }
}
