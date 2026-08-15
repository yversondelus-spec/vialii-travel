export type PlanTier = 'free' | 'premium'

export interface Invoice {
  id: string
  userId: string
  plan: PlanTier
  amount: number
  currency: string
  issuedAt: string
  status: 'paid'
}

export interface Subscription {
  userId: string
  tier: PlanTier
  upgradedAt?: string
}

export const FREE_SAVED_TRIPS_LIMIT = 3
export const PREMIUM_PRICE = 4990
export const PREMIUM_CURRENCY = 'CLP'
