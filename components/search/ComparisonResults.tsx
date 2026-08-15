'use client'

import { useMemo, useState } from 'react'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import SaveTripButton from '@/components/trip/SaveTripButton'
import PriceAlertButton from '@/components/trip/PriceAlertButton'
import FilterBar, { type FilterBounds, type FilterState } from '@/components/search/FilterBar'
import ResultsTabs from '@/components/search/ResultsTabs'
import { filterOptionsByScope, getAvailableTypes, type SearchScope } from '@/lib/services/transportService'
import { prioritizeTransport, pickFeaturedOption } from '@/lib/services/transportPrioritizationService'
import { FEATURED_DESTINATIONS } from '@/constants/destinations'
import type { Interest } from '@/constants/interests'
import type { SearchComparisonResult } from '@/lib/types/search'

const DEFAULT_TRIP_LENGTH_DAYS = 5
const DEFAULT_BUDGET = 300_000

interface ComparisonResultsProps {
  results?: SearchComparisonResult | null
  isLoading?: boolean
  /** Filters which transport types are shown — a national search never shows a flight, an international one always can. Unknown/omitted scope (old links) shows everything, unfiltered. */
  scope?: SearchScope | null
}

function buildDefaultFilters(options: SearchComparisonResult['options']): { filters: FilterState; bounds: FilterBounds } {
  const prices = options.map((o) => o.price)
  const durations = options.map((o) => o.duration)

  const bounds: FilterBounds = {
    minPrice: prices.length ? Math.min(...prices) : 0,
    maxPrice: prices.length ? Math.max(...prices) : 0,
    maxDurationMinutes: durations.length ? Math.max(...durations) : 60,
  }

  const filters: FilterState = {
    ...bounds,
    types: { bus: true, flight: true, train: true },
    directOnly: false,
  }

  return { filters, bounds }
}

export default function ComparisonResults({ results, isLoading = false, scope }: ComparisonResultsProps) {
  const [filters, setFilters] = useState<FilterState | null>(null)

  // Scope filtering happens first, before anything else derives from
  // results.options — so price/duration bounds and the type checkboxes in
  // FilterBar only ever reflect transport that actually makes sense for a
  // national vs international trip (no "vuelo" checkbox for a Puerto Varas search).
  // Then reordered by type priority (flight-first internationally, bus-first
  // nationally) — this is display order only, scores are untouched.
  const scopedOptions = useMemo(
    () => (results ? prioritizeTransport(filterOptionsByScope(results.options, scope), scope) : []),
    [results, scope]
  )

  const defaults = useMemo(
    () => (results ? buildDefaultFilters(scopedOptions) : null),
    [results, scopedOptions]
  )

  const activeFilters = filters ?? defaults?.filters ?? null

  const filteredOptions = useMemo(() => {
    if (!activeFilters) return []
    return scopedOptions.filter((option) => {
      if (option.price > activeFilters.maxPrice) return false
      if (option.duration > activeFilters.maxDurationMinutes) return false
      if (option.direct === false && activeFilters.directOnly) return false
      const type = option.type as 'bus' | 'flight' | 'train'
      if (type in activeFilters.types && !activeFilters.types[type]) return false
      return true
    })
  }, [scopedOptions, activeFilters])

  if (isLoading) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <div className="animate-spin text-4xl mb-4">🔄</div>
          <p className="text-slate-600 dark:text-slate-400">Analizando opciones de viaje...</p>
        </CardBody>
      </Card>
    )
  }

  if (!results || !defaults || !activeFilters) {
    return null
  }

  // Featured pick: the best-scored option among the highest-priority
  // transport type for this scope (flight for international, bus for
  // national) — not just decisionEngine's single best score regardless of
  // type, which is how a train ended up "recommended" for Santiago→Paris.
  // Its own OptionScore (not results.recommended, which was scored for
  // whichever option decisionEngine picked before this reordering) drives
  // the score/reasoning shown below.
  const recommended = pickFeaturedOption(filteredOptions, results.scores, scope)
  const recommendedScore = recommended ? results.scores.find((s) => s.transport_id === recommended.id) : undefined

  // Mock transport IDs (bus-0, train-0, ...) are just array indices, so the
  // same id can appear across unrelated searches — scope saved-trip keys to
  // this route + date so saving doesn't collide across different searches.
  const savedTripIdPrefix = `${results.search_query.origin}→${results.search_query.destination}→${new Date(
    results.search_query.travel_date
  ).toDateString()}`

  // Pack context (Fase 3) — all additive fields from lib/types/domain.ts's
  // SearchQuery (Phase 1); sensible fallbacks for older/direct links that
  // predate them (e.g. a feed card linking straight to ?destination=X).
  const startDate = new Date(results.search_query.travel_date)
  const endDate = results.search_query.return_date
    ? new Date(results.search_query.return_date)
    : new Date(startDate.getTime() + DEFAULT_TRIP_LENGTH_DAYS * 86_400_000)
  const budget = results.search_query.max_budget ?? DEFAULT_BUDGET
  const interests = (results.search_query.interests ?? []) as Interest[]
  const attractions = FEATURED_DESTINATIONS.find((d) => d.name === results.search_query.destination)?.attractions

  return (
    <div className="space-y-6">
      {recommended && (
        <Card className="border-2 border-green-400 dark:border-green-600 bg-green-50 dark:bg-green-950/30">
          <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white border-0">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-2xl font-bold">🏆 Te recomendamos</h3>
              <div className="flex items-center gap-2">
                <Badge variant="success" className="text-lg">
                  {(recommendedScore?.final_score ?? 0).toFixed(1)}/10
                </Badge>
                <SaveTripButton
                  tripId={`${savedTripIdPrefix}:${recommended.id}`}
                  tripData={recommended}
                  className="bg-white/90 hover:bg-white"
                />
                <PriceAlertButton
                  origin={results.search_query.origin}
                  destination={results.search_query.destination}
                  suggestedMaxPrice={recommended.price}
                  className="bg-white/90 hover:bg-white"
                />
              </div>
            </div>
          </CardHeader>

          <CardBody>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Transporte</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {recommended.provider}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {recommended.type === 'flight'
                    ? 'Vuelo'
                    : recommended.type === 'bus'
                      ? 'Bus'
                      : 'Tren'}
                </p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Precio</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                  ${recommended.price.toLocaleString()}
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">por persona</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">Duración</p>
                <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">
                  {Math.floor(recommended.duration / 60)}h {recommended.duration % 60}m
                </p>
                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                  {recommended.direct ? 'Directo' : recommended.stops + ' paradas'}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800">
              <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                {recommendedScore?.reasoning ?? results.recommended.reasoning}
              </p>
            </div>

            <Button className="w-full mt-6 text-lg py-3">Reservar ahora</Button>
          </CardBody>
        </Card>
      )}

      <FilterBar
        bounds={defaults.bounds}
        filters={activeFilters}
        onChange={setFilters}
        onReset={() => setFilters(defaults.filters)}
        availableTypes={getAvailableTypes(scope) ?? undefined}
      />

      <ResultsTabs
        options={filteredOptions}
        scores={results.scores}
        savedTripIdPrefix={savedTripIdPrefix}
        origin={results.search_query.origin}
        destination={results.search_query.destination}
        startDate={startDate}
        endDate={endDate}
        budget={budget}
        interests={interests}
        attractions={attractions}
        scope={scope}
      />
    </div>
  )
}
