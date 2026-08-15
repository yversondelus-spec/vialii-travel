'use client'

import { useMemo, useState } from 'react'
import { TrendingUp, Globe2, Sparkles } from 'lucide-react'
import TravelCard from '@/components/trip/TravelCard'
import DestinationsByRegion from '@/components/home/DestinationsByRegion'
import { getTrendingItems, getAllItems } from '@/lib/services/feedService'
import { VIBES, type Vibe } from '@/constants/vibes'
import { cn } from '@/lib/utils/cn'

type Tab = 'trending' | 'region' | 'vibe'

function tabClass(active: boolean) {
  return cn(
    'flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors',
    active
      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
  )
}

export default function ExplorePage() {
  const [tab, setTab] = useState<Tab>('trending')
  const [vibe, setVibe] = useState<Vibe>(VIBES[0].id)

  const trending = useMemo(() => getTrendingItems(8), [])
  const byVibe = useMemo(() => getAllItems().filter((item) => item.vibes.includes(vibe)), [vibe])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-2">Explora</h1>
          <p className="text-slate-600 dark:text-slate-400">Inspiración para tu próximo viaje</p>
        </div>

        <div className="flex justify-center gap-1 border-b border-slate-200 dark:border-slate-800 mb-8 overflow-x-auto">
          <button type="button" onClick={() => setTab('trending')} className={tabClass(tab === 'trending')}>
            <TrendingUp size={15} /> Trending
          </button>
          <button type="button" onClick={() => setTab('region')} className={tabClass(tab === 'region')}>
            <Globe2 size={15} /> Por región
          </button>
          <button type="button" onClick={() => setTab('vibe')} className={tabClass(tab === 'vibe')}>
            <Sparkles size={15} /> Por vibe
          </button>
        </div>

        {tab === 'trending' && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {trending.map((item) => (
              <TravelCard key={item.id} item={item} variant="grid" />
            ))}
          </div>
        )}

        {tab === 'region' && <DestinationsByRegion />}

        {tab === 'vibe' && (
          <div>
            <div className="flex flex-wrap justify-center gap-2 mb-6">
              {VIBES.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => setVibe(v.id)}
                  className={cn(
                    'px-4 py-2 rounded-full text-sm font-semibold border transition-colors',
                    vibe === v.id
                      ? 'bg-blue-600 border-blue-600 text-white'
                      : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800'
                  )}
                >
                  {v.icon} {v.label}
                </button>
              ))}
            </div>

            {byVibe.length === 0 ? (
              <p className="text-center text-slate-500 dark:text-slate-400 py-12">Sin resultados todavía.</p>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {byVibe.map((item) => (
                  <TravelCard key={item.id} item={item} variant="grid" />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
