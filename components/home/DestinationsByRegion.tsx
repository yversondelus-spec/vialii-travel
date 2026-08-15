'use client'

import { useMemo, useState } from 'react'
import { CONTINENTS, type Continent } from '@/constants/vibes'
import TravelCard from '@/components/trip/TravelCard'
import { getAllItems } from '@/lib/services/feedService'
import { cn } from '@/lib/utils/cn'

export default function DestinationsByRegion() {
  const [continent, setContinent] = useState<Continent>('Europa')

  const items = useMemo(() => {
    const seen = new Set<string>()
    return getAllItems()
      .filter((item) => item.continent === continent)
      .filter((item) => {
        if (seen.has(item.destinationId)) return false
        seen.add(item.destinationId)
        return true
      })
  }, [continent])

  return (
    <div>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 -mx-1 px-1">
        {CONTINENTS.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => setContinent(c.id)}
            className={cn(
              'shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-semibold border transition-colors',
              continent === c.id
                ? 'bg-blue-600 border-blue-600 text-white'
                : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
            )}
          >
            {c.icon} {c.id}
          </button>
        ))}
      </div>

      {items.length === 0 ? (
        <div className="text-center py-12 text-slate-500 dark:text-slate-400">
          Próximamente destinos en {continent} ✨
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory">
          {items.map((item) => (
            <TravelCard key={item.id} item={item} variant="grid" className="min-w-[240px] sm:min-w-[260px] w-[240px] sm:w-[260px] shrink-0 snap-start" />
          ))}
        </div>
      )}
    </div>
  )
}
