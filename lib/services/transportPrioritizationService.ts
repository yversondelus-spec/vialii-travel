import type { SearchResult } from '@/lib/providers/transport/types'
import type { SearchScope } from './transportService'

// This does NOT change decisionEngine's actual scores — a train can
// genuinely out-score a flight on comfort/reliability, which is why "Te
// recomendamos" was showing a train for a Santiago→Paris search. This layer
// only decides display order and which type is *featured*, so the fix
// doesn't touch the real scoring/comparison logic (lib/providers/comparison).

const NATIONAL_ORDER: Record<string, number> = { bus: 0, train: 1, flight: 2 }
const INTERNATIONAL_ORDER: Record<string, number> = { flight: 0, bus: 1, train: 2 }

function orderFor(scope: SearchScope | null | undefined): Record<string, number> {
  return scope === 'national' ? NATIONAL_ORDER : INTERNATIONAL_ORDER
}

/** Stable sort: groups by transport type per scope, preserves each type's existing relative order within itself (whatever the caller already sorted by, e.g. price). */
export function prioritizeTransport(results: SearchResult[], scope: SearchScope | null | undefined): SearchResult[] {
  const order = orderFor(scope)
  return [...results]
    .map((option, index) => ({ option, index }))
    .sort((a, b) => {
      const typeDelta = (order[a.option.type] ?? 99) - (order[b.option.type] ?? 99)
      return typeDelta !== 0 ? typeDelta : a.index - b.index
    })
    .map(({ option }) => option)
}

/**
 * Which option to feature as "recommended" — the best-scored option among
 * the highest-priority transport type actually present for this scope,
 * instead of the single best score regardless of type. Fixes the
 * train-for-Paris case without touching the scores themselves.
 */
export function pickFeaturedOption<T extends { id: string; type: string }>(
  options: T[],
  scores: { transport_id: string; final_score: number }[],
  scope: SearchScope | null | undefined
): T | undefined {
  if (options.length === 0) return undefined
  const order = orderFor(scope)
  const topPriority = Math.min(...options.map((o) => order[o.type] ?? 99))
  const topTypeOptions = options.filter((o) => (order[o.type] ?? 99) === topPriority)

  return [...topTypeOptions].sort((a, b) => {
    const scoreA = scores.find((s) => s.transport_id === a.id)?.final_score ?? 0
    const scoreB = scores.find((s) => s.transport_id === b.id)?.final_score ?? 0
    return scoreB - scoreA
  })[0]
}
