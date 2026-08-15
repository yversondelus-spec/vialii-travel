import type { SearchResult } from '@/lib/providers/transport/types'
import type { OptionScore, SearchQuery } from '@/lib/types/domain'

/**
 * Shape actually returned by POST /api/search (via SearchService -> DecisionEngine).
 *
 * `domain.ts`'s `ComparisonResult` types `options` as `TransportOption[]`, but the
 * real pipeline produces `SearchResult[]` (see AGENTS.md's "MODELO DE DATOS" — this
 * is the shape it documents as canonical). Using this type instead keeps the search
 * UI aligned with the runtime data without touching `domain.ts`.
 */
export interface SearchComparisonResult {
  id: string
  search_query: SearchQuery
  options: SearchResult[]
  scores: OptionScore[]
  recommended: {
    option_id: string
    score: number
    reasoning: string
  }
  hotels: unknown[]
  activities: unknown[]
  created_at: string | Date
}
