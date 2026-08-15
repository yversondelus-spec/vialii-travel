import type { SearchResult } from '@/lib/providers/transport/types'

export type SearchScope = 'national' | 'international'

/**
 * Which of the (already-fetched, real) transport types make sense to show
 * for a given scope. This filters results TransportAggregator already
 * returned — it never invents new transport types or fabricates results for
 * ones that don't exist (no "car_rental" option, since no provider backs it).
 *
 * Unknown/missing scope (old links without ?scope=, e.g. from feed/explore
 * cards) returns null, meaning "don't filter" — full backward compatibility.
 */
export function getAvailableTypes(scope: SearchScope | null | undefined): SearchResult['type'][] | null {
  if (scope === 'national') return ['bus', 'train']
  if (scope === 'international') return ['flight', 'bus', 'train']
  return null
}

export function filterOptionsByScope(options: SearchResult[], scope: SearchScope | null | undefined): SearchResult[] {
  const allowed = getAvailableTypes(scope)
  if (!allowed) return options
  return options.filter((o) => allowed.includes(o.type))
}
