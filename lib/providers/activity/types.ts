export type ActivityCategory = 'Adventure' | 'Culture' | 'Food' | 'Beach' | 'Nature' | 'Nightlife'

export interface ActivitySearchParams {
  destination: string
  currency: string
  /** Known attractions for the destination, used to generate realistic names. */
  attractions?: string[]
}

export interface Activity {
  id: string
  name: string
  price: number
  duration: number
  category: ActivityCategory
  rating: number
  image: string
}

export interface ActivityProvider {
  searchActivities(params: ActivitySearchParams): Promise<Activity[]>
}
