import type { ActivityOffer, ActivitySearchParams } from '../core/models'

/** Contract every activity/experience source implements (Section 11 — Viator, GetYourGuide, etc. down the line). */
export interface ActivityProvider {
  readonly id: string
  readonly name: string
  readonly isConfigured: boolean

  searchActivities(params: ActivitySearchParams): Promise<ActivityOffer[]>
  getActivityDetails(activityId: string): Promise<ActivityOffer | null>
  getAvailability(activityId: string, params: ActivitySearchParams): Promise<boolean>
}
