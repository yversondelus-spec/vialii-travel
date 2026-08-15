import type { ActivityProvider } from './ActivityProvider'
import type { ActivityOffer, ActivitySearchParams } from '../core/models'
import { timedProviderCall } from '../core/observability'
import { MockActivityProvider as LegacyMockActivityProvider } from '@/lib/providers/activity/mockActivityProvider'
import type { Activity } from '@/lib/providers/activity/types'

/** Engine-level wrapper around the EXISTING mock activity generator — see MockHotelProvider.ts for why this stays a thin wrap rather than a rewrite. */
export class MockActivityProvider implements ActivityProvider {
  readonly id = 'mock'
  readonly name = 'Mock (demo data)'
  readonly isConfigured = true
  private readonly inner = new LegacyMockActivityProvider()

  async searchActivities(params: ActivitySearchParams): Promise<ActivityOffer[]> {
    return timedProviderCall({ provider: this.id, vertical: 'activity', operation: 'searchActivities' }, async () => {
      const results = await this.inner.searchActivities(params)
      return results.map((activity) => activityToActivityOffer(activity, params))
    })
  }

  async getActivityDetails(activityId: string): Promise<ActivityOffer | null> {
    return timedProviderCall({ provider: this.id, vertical: 'activity', operation: 'getActivityDetails' }, async () => {
      const offers = await this.searchActivities({ destination: 'destino', currency: 'CLP' })
      return offers.find((o) => o.id === activityId) ?? null
    })
  }

  async getAvailability(activityId: string, params: ActivitySearchParams): Promise<boolean> {
    const offers = await this.searchActivities(params)
    return offers.some((o) => o.id === activityId)
  }
}

export function activityToActivityOffer(activity: Activity, params: ActivitySearchParams): ActivityOffer {
  return {
    id: activity.id,
    provider: 'mock',
    name: activity.name,
    destination: params.destination,
    category: activity.category,
    price: activity.price,
    currency: params.currency,
    durationMinutes: activity.duration,
    rating: activity.rating,
    meta: { provider: 'mock', cached: false, fetchedAt: new Date().toISOString() },
  }
}
