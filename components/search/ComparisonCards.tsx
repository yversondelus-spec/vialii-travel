'use client'

import PackResultCard from './PackResultCard'
import type { OptionScore } from '@/lib/types/domain'
import type { SearchResult } from '@/lib/providers/transport/types'
import type { Interest } from '@/constants/interests'

interface ComparisonCardsProps {
  options: SearchResult[]
  scores: OptionScore[]
  recommendedId?: string
  savedTripIdPrefix?: string
  origin?: string
  destination: string
  startDate: Date
  endDate: Date
  budget: number
  interests: Interest[]
  attractions?: string[]
  /** Optional per-option caption (option.id -> text) — how the 4 result tabs annotate the same shared card. */
  annotations?: Record<string, string>
  /** Ribbon shown on the card matching recommendedId — its label/gradient depend on which tab is active (see ResultsTabs). */
  badge?: { label: string; gradient: string }
  /** When true, `badge` is shown on every card instead of only the one matching recommendedId — used by the "Ofertas" tab, where every card shown already qualifies as an offer. */
  badgeAll?: boolean
}

/**
 * Grid of full trip-package cards (transport + hotel + activities + cost —
 * see PackResultCard) — options/scores/filtering are computed exactly as
 * before (see ComparisonResults.tsx); this only decides how each option is
 * presented, and reuses the SAME card across all 4 result tabs.
 */
export default function ComparisonCards({
  options,
  scores,
  recommendedId,
  savedTripIdPrefix,
  origin,
  destination,
  startDate,
  endDate,
  budget,
  interests,
  attractions,
  annotations,
  badge,
  badgeAll,
}: ComparisonCardsProps) {
  if (options.length === 0) {
    return (
      <div className="text-center py-12 text-slate-500 dark:text-slate-400">
        Ninguna opción coincide con los filtros seleccionados.
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
      {options.map((option) => {
        const score = scores.find((s) => s.transport_id === option.id)
        const isRecommended = option.id === recommendedId
        const cardBadge = badgeAll ? badge : isRecommended ? badge : undefined

        return (
          <PackResultCard
            key={option.id}
            transport={option}
            allTransportOptions={options}
            score={score}
            destination={destination}
            startDate={startDate}
            endDate={endDate}
            budget={budget}
            interests={interests}
            attractions={attractions}
            badge={cardBadge}
            annotation={annotations?.[option.id]}
            savedTripIdPrefix={savedTripIdPrefix}
            origin={origin}
          />
        )
      })}
    </div>
  )
}
