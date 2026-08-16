/**
 * Extrae la oferta de vuelo reservable desde un `SearchResult`.
 *
 * `SearchResult.raw` es `unknown` a proposito (cada provider guarda ahi su
 * payload original) y ademas viaja por JSON hasta el cliente, asi que no se
 * puede castear a ciegas: se valida en runtime y se devuelve `null` cuando
 * la opcion no es reservable por API.
 *
 * Hoy solo Duffel implementa createOrder. Kiwi y mock devuelven `null` y su
 * flujo sigue siendo el redirect al proveedor externo.
 */
import type { SearchResult } from '@/lib/providers/transport/types'

export interface BookableOffer {
  offerId: string
  provider: string
  price: number
  currency: string
}

/** Providers cuyo adapter implementa el flujo real de orden. */
const BOOKABLE_PROVIDERS = new Set(['duffel'])

export function bookableOfferFrom(result: SearchResult): BookableOffer | null {
  if (result.type !== 'flight') return null

  const raw = result.raw
  if (!raw || typeof raw !== 'object') return null

  const offer = raw as Record<string, unknown>
  const offerId = offer.id
  const provider = offer.provider
  const price = offer.price
  const currency = offer.currency

  if (typeof offerId !== 'string' || typeof provider !== 'string') return null
  if (typeof price !== 'number' || typeof currency !== 'string') return null
  if (!BOOKABLE_PROVIDERS.has(provider)) return null

  return { offerId, provider, price, currency }
}