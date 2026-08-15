import type { SearchResult } from '@/lib/providers/transport/types'
import type { SearchQuery } from '@/lib/types/domain'
// This has always actually returned this shape (options: SearchResult[]),
// not domain.ts's ComparisonResult (options: TransportOption[]) — the two
// types diverged and lib/types/search.ts was written specifically to
// describe what this function really produces (see its own doc comment).
// Wiring the producer's return type to that instead of ComparisonResult
// fixes a pre-existing tsc error without changing any runtime behavior.
import type { SearchComparisonResult } from '@/lib/types/search'
import { ScoreCalculator } from './scoreCalculator'

export class DecisionEngine {
  private scoreCalculator = new ScoreCalculator()

  async generateRecommendation(
    query: SearchQuery,
    options: SearchResult[]
  ): Promise<SearchComparisonResult> {
    const scores = this.scoreCalculator.calculateScores(
      options,
      query.preferences,
      query.max_budget
    )

    const sortedScores = [...scores].sort((a, b) => b.final_score - a.final_score)
    const bestScore = sortedScores[0]
    const bestOption = options.find(o => o.id === bestScore.transport_id)

    if (!bestOption) throw new Error('No se encontró la mejor opción')

    const typeLabel = bestOption.type === 'flight' ? 'Vuelo' : bestOption.type === 'bus' ? 'Bus' : 'Tren'
    const duration = Math.floor(bestOption.duration / 60)
    
    const reasoning = `🏆 Recomendamos ${bestOption.provider} (${typeLabel})\n\nPrecio: $${bestOption.price.toLocaleString()}\nDuración: ${duration}h\n${bestOption.direct ? 'Directo ✓' : bestOption.stops + ' paradas'}\n\nEsta opción ofrece la mejor relación precio-tiempo.`

    return {
      id: `comparison-${Date.now()}`,
      search_query: query,
      options,
      scores,
      recommended: {
        option_id: bestOption.id,
        score: bestScore.final_score,
        reasoning: reasoning
      },
      hotels: [],
      activities: [],
      created_at: new Date()
    }
  }
}