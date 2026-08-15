'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Filter } from 'lucide-react'
import TravelCard from '@/components/trip/TravelCard'
import { Badge } from '@/components/common/Badge'
import { getFeedPage, type FeedItem, type FeedFilters } from '@/lib/services/feedService'
import { VIBES, CONTINENTS, type Vibe, type Continent } from '@/constants/vibes'
import { cn } from '@/lib/utils/cn'

const PAGE_SIZE = 4
const BUDGET_OPTIONS = [
  { label: 'Cualquier presupuesto', value: undefined },
  { label: 'Hasta $500k', value: 500_000 },
  { label: 'Hasta $800k', value: 800_000 },
  { label: 'Hasta $1.2M', value: 1_200_000 },
]

export default function FeedPage() {
  const [continent, setContinent] = useState<Continent | undefined>(undefined)
  const [vibe, setVibe] = useState<Vibe | undefined>(undefined)
  const [maxBudget, setMaxBudget] = useState<number | undefined>(undefined)
  const [showFilters, setShowFilters] = useState(false)

  const [items, setItems] = useState<FeedItem[]>([])
  const [offset, setOffset] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loading, setLoading] = useState(false)

  const sentinelRef = useRef<HTMLDivElement>(null)

  // Memoized so this stays referentially stable across renders — otherwise
  // a new object every render would make loadMore's useCallback below (which
  // depends on it) regenerate every render too, retriggering the
  // IntersectionObserver effect further down on every keystroke/re-render.
  const filters = useMemo<FeedFilters>(() => ({ continent, vibe, maxBudget }), [continent, vibe, maxBudget])
  const filtersKey = `${continent ?? ''}|${vibe ?? ''}|${maxBudget ?? ''}`

  // Reset the feed whenever a filter changes.
  useEffect(() => {
    const reset = () => {
      const { items: page, hasMore: more } = getFeedPage(filters, 0, PAGE_SIZE)
      setItems(page)
      setOffset(page.length)
      setHasMore(more)
    }
    reset()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtersKey])

  const loadMore = useCallback(() => {
    if (loading || !hasMore) return
    setLoading(true)
    // Simulated latency so the loading state is actually visible — this is
    // client-side pagination over an in-memory list, not a real fetch.
    setTimeout(() => {
      const { items: page, hasMore: more } = getFeedPage(filters, offset, PAGE_SIZE)
      setItems((prev) => [...prev, ...page])
      setOffset((prev) => prev + page.length)
      setHasMore(more)
      setLoading(false)
    }, 300)
  }, [filters, offset, loading, hasMore])

  useEffect(() => {
    const node = sentinelRef.current
    if (!node) return
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) loadMore()
      },
      { rootMargin: '400px' }
    )
    observer.observe(node)
    return () => observer.disconnect()
  }, [loadMore])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-6 sm:py-10">
      <div className="max-w-md mx-auto px-4">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Feed de viajes</h1>
          <button
            type="button"
            onClick={() => setShowFilters((v) => !v)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-700 dark:text-slate-300"
          >
            <Filter size={14} /> Filtros
          </button>
        </div>

        {showFilters && (
          <div className="mb-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Región</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setContinent(undefined)}
                  className={cn('px-3 py-1 rounded-full text-xs font-semibold border', !continent ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300')}
                >
                  Todas
                </button>
                {CONTINENTS.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setContinent(c.id)}
                    className={cn('px-3 py-1 rounded-full text-xs font-semibold border', continent === c.id ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300')}
                  >
                    {c.icon} {c.id}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Vibe</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setVibe(undefined)}
                  className={cn('px-3 py-1 rounded-full text-xs font-semibold border', !vibe ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300')}
                >
                  Todos
                </button>
                {VIBES.map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => setVibe(v.id)}
                    className={cn('px-3 py-1 rounded-full text-xs font-semibold border', vibe === v.id ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300')}
                  >
                    {v.icon} {v.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase text-slate-500 dark:text-slate-400 mb-2">Presupuesto</p>
              <div className="flex flex-wrap gap-1.5">
                {BUDGET_OPTIONS.map((b) => (
                  <button
                    key={b.label}
                    type="button"
                    onClick={() => setMaxBudget(b.value)}
                    className={cn('px-3 py-1 rounded-full text-xs font-semibold border', maxBudget === b.value ? 'bg-blue-600 border-blue-600 text-white' : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300')}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {items.length === 0 ? (
          <div className="text-center py-20">
            <div className="text-4xl mb-3">🧳</div>
            <p className="text-slate-500 dark:text-slate-400">Sin resultados para estos filtros.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {items.map((item) => (
              <TravelCard key={item.id} item={item} variant="feed" />
            ))}
          </div>
        )}

        <div ref={sentinelRef} className="h-10 flex items-center justify-center mt-4">
          {loading && <div className="animate-spin text-2xl">⏳</div>}
          {!hasMore && items.length > 0 && (
            <Badge variant="neutral" className="text-xs">
              Llegaste al final ✨
            </Badge>
          )}
        </div>
      </div>
    </div>
  )
}
