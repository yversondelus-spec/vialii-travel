import type { SearchResult } from '@/lib/providers/transport/types'
import type { OptionScore } from '@/lib/types/domain'
import { pickFeaturedOption } from './transportPrioritizationService'
import type { SearchScope } from './transportService'

export interface RankedResult {
  option: SearchResult
  score?: OptionScore
  reason?: string
  savingsPercent?: number
}

// Every signal used below (final_score, price, departure date) already
// exists on SearchResult/OptionScore — nothing here is fabricated data, it's
// four different sort/filter views over the same real result set.

function findScore(scores: OptionScore[], optionId: string): OptionScore | undefined {
  return scores.find((s) => s.transport_id === optionId)
}

function dominantReason(score: OptionScore): string {
  const entries: [string, number][] = [
    ['el precio', score.price_score],
    ['el tiempo de viaje', score.time_score],
    ['la comodidad', score.comfort_score],
    ['la confiabilidad', score.reliability_score],
    ['la experiencia', score.experience_score],
  ]
  entries.sort((a, b) => b[1] - a[1])
  return `Destaca por ${entries[0][0]}`
}

export function selectForYou(options: SearchResult[], scores: OptionScore[], scope?: SearchScope | null, limit = 5): RankedResult[] {
  const byScore = options
    .map((option) => ({ option, score: findScore(scores, option.id) }))
    .filter((r): r is { option: SearchResult; score: OptionScore } => !!r.score)
    .sort((a, b) => b.score.final_score - a.score.final_score)

  // The #1 "Para ti" pick gets the same type-priority treatment as the hero
  // card (flight-first internationally) — a train can genuinely out-score a
  // flight on comfort, which reads as a bug for a Santiago→Paris search.
  // Everything past #1 stays purely score-ranked; only the top pick moves.
  const featured = pickFeaturedOption(options, scores, scope)
  const reordered = featured ? [featured, ...byScore.map((r) => r.option).filter((o) => o.id !== featured.id)] : byScore.map((r) => r.option)

  return reordered
    .slice(0, limit)
    .map((option) => {
      const score = findScore(scores, option.id)
      return score ? { option, score, reason: dominantReason(score) } : { option }
    })
}

export function selectBestPrice(options: SearchResult[], scores: OptionScore[]): RankedResult[] {
  if (options.length === 0) return []
  const sorted = [...options].sort((a, b) => a.price - b.price)
  const mostExpensive = sorted[sorted.length - 1].price

  return sorted.map((option) => ({
    option,
    score: findScore(scores, option.id),
    savingsPercent: mostExpensive > 0 ? Math.round(((mostExpensive - option.price) / mostExpensive) * 100) : 0,
  }))
}

export function selectBestExperience(options: SearchResult[], scores: OptionScore[]): RankedResult[] {
  return options
    .map((option) => ({ option, score: findScore(scores, option.id) }))
    .filter((r): r is { option: SearchResult; score: OptionScore } => !!r.score)
    .sort((a, b) => b.score.comfort_score + b.score.experience_score - (a.score.comfort_score + a.score.experience_score))
}

const OFFER_SAVINGS_THRESHOLD = 25 // percent vs the most expensive option in the result set
const EARLY_DEPARTURE_DAYS = 3

export function selectOffers(options: SearchResult[], scores: OptionScore[]): RankedResult[] {
  if (options.length === 0) return []
  const mostExpensive = Math.max(...options.map((o) => o.price))
  const now = Date.now()

  return options
    .map((option): RankedResult | null => {
      const savingsPercent = mostExpensive > 0 ? Math.round(((mostExpensive - option.price) / mostExpensive) * 100) : 0
      const daysUntilDeparture = Math.round((new Date(option.departure).getTime() - now) / 86_400_000)
      const isEarlyDeparture = daysUntilDeparture >= 0 && daysUntilDeparture <= EARLY_DEPARTURE_DAYS

      if (savingsPercent < OFFER_SAVINGS_THRESHOLD && !isEarlyDeparture) return null

      const reason = isEarlyDeparture
        ? `🔥 Sale en ${daysUntilDeparture} día${daysUntilDeparture === 1 ? '' : 's'}`
        : `🔥 ${savingsPercent}% más barato que la opción más cara`

      return { option, score: findScore(scores, option.id), reason, savingsPercent }
    })
    .filter((r): r is RankedResult => r !== null)
    .sort((a, b) => (b.savingsPercent ?? 0) - (a.savingsPercent ?? 0))
}
