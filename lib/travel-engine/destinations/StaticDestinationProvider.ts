import type { DestinationProvider } from './DestinationProvider'
import type { DestinationInfo } from '../core/models'
import { timedProviderCall } from '../core/observability'
import { FEATURED_DESTINATIONS } from '@/constants/destinations'
import type { Destination } from '@/types/domain'

/**
 * Wraps the EXISTING `constants/destinations.ts` catalog — the only real
 * (curated, image-verified — see that file's own header comment) source of
 * destination data in this repo. Not a live API, so results are always
 * treated as `cached: true`-equivalent by callers; there's nothing to
 * fetch live yet. Swap for a real DestinationProvider (Google Places,
 * a CMS, etc.) later behind the same interface.
 */
export class StaticDestinationProvider implements DestinationProvider {
  readonly id = 'static'
  readonly name = 'VIALII curated destinations'
  readonly isConfigured = true

  async searchDestinations(query: string): Promise<DestinationInfo[]> {
    return timedProviderCall({ provider: this.id, vertical: 'destination', operation: 'searchDestinations' }, async () => {
      const needle = query.trim().toLowerCase()
      const matches = needle
        ? FEATURED_DESTINATIONS.filter((d) => d.name.toLowerCase().includes(needle) || d.country.toLowerCase().includes(needle))
        : FEATURED_DESTINATIONS
      return matches.map(destinationToDestinationInfo)
    })
  }

  async getDestination(id: string): Promise<DestinationInfo | null> {
    return timedProviderCall({ provider: this.id, vertical: 'destination', operation: 'getDestination' }, async () => {
      const found = FEATURED_DESTINATIONS.find((d) => d.id === id)
      return found ? destinationToDestinationInfo(found) : null
    })
  }
}

function destinationToDestinationInfo(destination: Destination): DestinationInfo {
  return {
    id: destination.id,
    provider: 'static',
    name: destination.name,
    country: destination.country,
    region: destination.region,
    coordinates: destination.coordinates,
    description: destination.description,
    images: [destination.images.hero, ...destination.images.gallery],
    bestMonths: destination.climate.bestMonths,
    attractions: destination.attractions,
    currency: destination.currency,
    languages: destination.languages,
  }
}
