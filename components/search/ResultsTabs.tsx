'use client'

import { useState } from 'react'
import { Sparkles, DollarSign, Star, Flame } from 'lucide-react'
import ComparisonCards from './ComparisonCards'
import EmptyResults from './EmptyResults'
import { selectForYou, selectBestPrice, selectBestExperience, selectOffers, type RankedResult } from '@/lib/services/resultsRanking'
import type { SearchResult } from '@/lib/providers/transport/types'
import type { OptionScore } from '@/lib/types/domain'
import type { Interest } from '@/constants/interests'
import type { SearchScope } from '@/lib/services/transportService'
import { cn } from '@/lib/utils/cn'

type Tab = 'for_you' | 'best_price' | 'best_experience' | 'offers'

interface ResultsTabsProps {
  options: SearchResult[]
  scores: OptionScore[]
  destination: string
  startDate: Date
  endDate: Date
  budget: number
  interests: Interest[]
  attractions?: string[]
  savedTripIdPrefix?: string
  origin?: string
  scope?: SearchScope | null
}

const TAB_META: Record<Tab, { label: string; icon: typeof Sparkles }> = {
  for_you: { label: 'Para ti', icon: Sparkles },
  best_price: { label: 'Mejor precio', icon: DollarSign },
  best_experience: { label: 'Mejor experiencia', icon: Star },
  offers: { label: 'Ofertas', icon: Flame },
}

// Fase B3 — one badge look per tab. `all: true` means every card in that tab
// carries the badge (Ofertas: everything shown there already qualifies as
// an offer); otherwise only the tab's own top pick gets it.
const TAB_BADGE: Record<Tab, { label: string; gradient: string; all?: boolean }> = {
  for_you: { label: '🏆 Recomendado', gradient: 'from-blue-500 to-cyan-500' },
  best_price: { label: '💰 Mejor precio', gradient: 'from-emerald-500 to-green-600' },
  best_experience: { label: '✨ Mejor experiencia', gradient: 'from-violet-500 to-purple-600' },
  offers: { label: '🔥 Oferta', gradient: 'from-red-500 to-orange-500', all: true },
}

const TAB_ORDER: Tab[] = ['for_you', 'best_price', 'best_experience', 'offers']

/**
 * 4 tabs, 1 card renderer. Each tab is just a different sort/filter over the
 * same options+scores (lib/services/resultsRanking.ts) — deliberately not 4
 * separate card components, which would just be the same markup copy-pasted
 * four times with a different badge.
 */
export default function ResultsTabs({
  options,
  scores,
  destination,
  startDate,
  endDate,
  budget,
  interests,
  attractions,
  savedTripIdPrefix,
  origin,
  scope,
}: ResultsTabsProps) {
  const [tab, setTab] = useState<Tab>('for_you')

  const lists: Record<Tab, RankedResult[]> = {
    for_you: selectForYou(options, scores, scope),
    best_price: selectBestPrice(options, scores),
    best_experience: selectBestExperience(options, scores),
    offers: selectOffers(options, scores),
  }

  const active = lists[tab]
  // Each tab highlights its OWN top pick (cheapest for "Mejor precio", etc.)
  // — not necessarily the same option as the single AI-recommended card
  // above the tabs, which stays tab-independent.
  const tabTopPickId = active[0]?.option.id

  return (
    <div>
      <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 -mx-1 px-1">
        {TAB_ORDER.map((id) => {
          const meta = TAB_META[id]
          const Icon = meta.icon
          const count = lists[id].length
          const isActive = tab === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={cn(
                'flex items-center gap-1.5 px-3.5 py-2 rounded-full text-sm font-semibold whitespace-nowrap border-2 transition-colors shrink-0',
                isActive
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-700'
              )}
            >
              <Icon size={14} /> {meta.label}
              <span className={cn('text-xs', isActive ? 'text-white/80' : 'text-slate-400 dark:text-slate-500')}>({count})</span>
            </button>
          )
        })}
      </div>

      {active.length === 0 ? (
        <EmptyResults tab={tab} />
      ) : (
        <ComparisonCards
          options={active.map((r) => r.option)}
          scores={scores}
          recommendedId={tabTopPickId}
          destination={destination}
          startDate={startDate}
          endDate={endDate}
          budget={budget}
          interests={interests}
          attractions={attractions}
          savedTripIdPrefix={savedTripIdPrefix}
          origin={origin}
          badge={TAB_BADGE[tab]}
          badgeAll={TAB_BADGE[tab].all}
          annotations={Object.fromEntries(active.filter((r) => r.reason).map((r) => [r.option.id, r.reason as string]))}
        />
      )}
    </div>
  )
}
