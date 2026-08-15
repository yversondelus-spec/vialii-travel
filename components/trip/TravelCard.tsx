'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { TrendingUp, Clock } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import SocialActions from '@/components/common/SocialActions'
import { VIBES } from '@/constants/vibes'
import { cn } from '@/lib/utils/cn'
import type { FeedItem } from '@/lib/services/feedService'

interface TravelCardProps {
  item: FeedItem
  className?: string
  /** 'feed' = tall full-bleed vertical card (app/feed). 'grid' = compact card (home, explore). */
  variant?: 'feed' | 'grid'
}

function formatBudget(clp: number) {
  return `$${Math.round(clp / 1000)}k`
}

// Some FEATURED_DESTINATIONS photo IDs (constants/destinations.ts) 404 —
// dead Unsplash links, not something this component can fix. Since this
// card format is now the centerpiece of the feed/explore/home experience, a
// failed photo falls back to a themed gradient + icon instead of a blank box.
const FALLBACK_GRADIENTS = [
  'from-blue-500 to-cyan-500',
  'from-violet-500 to-fuchsia-500',
  'from-amber-500 to-orange-600',
  'from-emerald-500 to-teal-600',
  'from-rose-500 to-pink-600',
]

function fallbackGradient(seed: string): string {
  let hash = 0
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0
  return FALLBACK_GRADIENTS[hash % FALLBACK_GRADIENTS.length]
}

export default function TravelCard({ item, className, variant = 'grid' }: TravelCardProps) {
  const isFeed = variant === 'feed'
  const [imageFailed, setImageFailed] = useState(false)
  const primaryVibeIcon = VIBES.find((v) => v.id === item.vibes[0])?.icon ?? '✈️'

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 group bg-slate-100 dark:bg-slate-900 transition-shadow duration-300 hover:shadow-md',
        isFeed ? 'aspect-[3/4]' : 'aspect-[4/5]',
        className
      )}
    >
      {imageFailed ? (
        <div
          className={cn(
            'absolute inset-0 bg-gradient-to-br flex items-center justify-center text-6xl',
            fallbackGradient(item.destinationId)
          )}
        >
          {primaryVibeIcon}
        </div>
      ) : (
        <Image
          src={item.image}
          alt={`Foto de ${item.destinationName}, ${item.tagline}`}
          fill
          sizes={isFeed ? '100vw' : '(min-width: 1024px) 25vw, (min-width: 640px) 33vw, 50vw'}
          onError={() => setImageFailed(true)}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

      {/* Painted before the badges/info below, so it only catches clicks where nothing else does. */}
      <Link
        href={`/trip/${item.destinationId}`}
        className="absolute inset-0"
        aria-label={`Explorar ${item.destinationName}`}
      />

      <div className="absolute top-3 left-3 right-3 flex flex-wrap gap-1.5 pointer-events-none">
        {item.trending && (
          <Badge variant="warning" className="gap-1 backdrop-blur-sm bg-white/90 dark:bg-slate-900/90">
            <TrendingUp size={11} /> Trending
          </Badge>
        )}
        {item.vibes.slice(0, 2).map((v) => {
          const vibe = VIBES.find((x) => x.id === v)
          return vibe ? (
            <Badge key={v} variant="neutral" className="backdrop-blur-sm bg-white/85 dark:bg-slate-900/85">
              {vibe.icon} {vibe.label}
            </Badge>
          ) : null
        })}
      </div>

      <div className="absolute inset-x-0 bottom-0 p-4 text-white">
        <h3 className="text-xl font-bold leading-tight drop-shadow-sm">{item.destinationName}</h3>
        <p className="text-sm text-white/85 mb-2">{item.tagline}</p>
        <div className="flex items-center gap-3 text-sm text-white/90 mb-3">
          <span className="flex items-center gap-1">
            <Clock size={13} /> {item.durationDays} días
          </span>
          <span className="font-semibold">{formatBudget(item.budgetCLP)}</span>
        </div>

        <SocialActions
          tripId={item.destinationId}
          tripData={{ destination: { name: item.destinationName } }}
          shareTitle={`Mira este viaje a ${item.destinationName} en VIALII`}
          savesCount={item.savesCount}
          commentsCount={item.commentsCount}
          creatorHandle={item.creatorHandle}
          theme="overlay"
        />
      </div>
    </div>
  )
}
