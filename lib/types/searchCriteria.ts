import type { Interest } from '@/constants/interests'
import type { SearchScope } from '@/lib/services/aiSearchHelper'

export interface PassengerCounts {
  adults: number
  children: number
  infants: number
}

export function totalPassengers(p: PassengerCounts): number {
  return p.adults + p.children + p.infants
}

export type DateMode = 'exact' | 'flexible' | 'duration'

export interface DateCriteria {
  mode: DateMode
  /** 'exact' and 'flexible' modes */
  startDate?: string
  endDate?: string
  /** 'duration' mode — no exact dates yet, just a rough length ("3-5 días", "7-10 días", "2 semanas") */
  approxDuration?: string
}

export type BudgetUnit = 'per_person' | 'total'

export interface BudgetCriteria {
  amount: number
  unit: BudgetUnit
}

/**
 * The single search model shared by the Home page and /search — replaces the
 * two divergent shapes that existed before (UnifiedSearch's ad-hoc params vs
 * SearchForm's fields). Destination is deliberately optional throughout: "no
 * lo sé, recomiéndame" is a first-class path, not an error state.
 */
export interface SearchCriteria {
  origin: string
  destination?: string
  scope: SearchScope | 'surprise'
  dates: DateCriteria
  passengers: PassengerCounts
  budget?: BudgetCriteria
  interests: Interest[]
}

export const DEFAULT_PASSENGERS: PassengerCounts = { adults: 1, children: 0, infants: 0 }

/** Total budget in CLP regardless of how the user expressed it — what the transport search actually needs. */
export function resolveBudgetTotal(budget: BudgetCriteria | undefined, passengers: PassengerCounts): number | undefined {
  if (!budget) return undefined
  if (budget.unit === 'total') return budget.amount
  return budget.amount * Math.max(totalPassengers(passengers), 1)
}
