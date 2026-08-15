'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import { Plane, Bus, TrainFront, Ticket, CalendarDays } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import SaveTripButton from '@/components/trip/SaveTripButton'
import PriceAlertButton from '@/components/trip/PriceAlertButton'
import ModularPackBuilder from '@/components/trip/ModularPackBuilder'
import { FEATURED_DESTINATIONS } from '@/constants/destinations'
import { reviveCompleteTrip } from '@/lib/services/tripBuilder'
import type { CompleteTrip } from '@/lib/types/trip'
import type { OptionScore } from '@/lib/types/domain'
import type { SearchResult } from '@/lib/providers/transport/types'
import type { Interest } from '@/constants/interests'
import { cn } from '@/lib/utils/cn'

interface PackResultCardProps {
  transport: SearchResult
  allTransportOptions?: SearchResult[]
  score?: OptionScore
  destination: string
  startDate: Date
  endDate: Date
  budget: number
  interests: Interest[]
  attractions?: string[]
  badge?: { label: string; gradient: string }
  annotation?: string
  savedTripIdPrefix?: string
  origin?: string
}

const TRANSPORT_META: Record<string, { icon: typeof Bus; label: string; photo: string }> = {
  bus: { icon: Bus, label: 'Bus', photo: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=400&h=200&fit=crop' },
  flight: { icon: Plane, label: 'Vuelo', photo: 'https://images.unsplash.com/photo-1436491865332-7a61a109cc05?w=400&h=200&fit=crop' },
  train: { icon: TrainFront, label: 'Tren', photo: 'https://images.unsplash.com/photo-1474487548417-781cb71495f3?w=400&h=200&fit=crop' },
}

function formatCLP(value: number) {
  return `$${Math.round(value).toLocaleString('es-CL')}`
}

/**
 * Fase 3 (pack data: hotel + activities + itinerary + cost) and Fase B
 * (visual priority — hotel first, total price, duration/activity count,
 * stops/schedule pushed into the expandable modal) combined into one card,
 * reused across all 4 result tabs via ComparisonCards.
 */
export default function PackResultCard({
  transport,
  allTransportOptions,
  score,
  destination,
  startDate,
  endDate,
  budget,
  interests,
  attractions,
  badge,
  annotation,
  savedTripIdPrefix,
  origin,
}: PackResultCardProps) {
  const [trip, setTrip] = useState<CompleteTrip | null>(null)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setTrip(null)
      // Calls VIALII's own API instead of building the pack locally — the
      // hotel/activity providers this needs now run server-side, inside
      // POST /api/trips/plan, never in the browser bundle (Section 2).
      const response = await fetch('/api/trips/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ destination, startDate, endDate, transport, budget, interests, attractions, allTransportOptions }),
      })
      const body = await response.json()
      if (!cancelled && body.success) setTrip(reviveCompleteTrip(body.data))
    }
    load()
    return () => {
      cancelled = true
    }
    // transport.id is enough to key this — startDate/endDate/budget/interests are stable per search, not per card
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transport.id])

  const meta = TRANSPORT_META[transport.type] ?? TRANSPORT_META.bus
  const Icon = meta.icon
  const destinationPhoto = FEATURED_DESTINATIONS.find((d) => d.name === destination)?.images.hero
  const headerPhoto = destinationPhoto ?? meta.photo
  const durationDays = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000) + 1)
  const tripId = savedTripIdPrefix ? `${savedTripIdPrefix}:${transport.id}` : transport.id

  return (
    <>
      <div
        className={cn(
          'rounded-2xl border overflow-hidden bg-white dark:bg-slate-900 flex flex-col transition-shadow hover:shadow-lg',
          badge ? 'border-blue-300 dark:border-blue-700 ring-2 ring-blue-400/20' : 'border-slate-200 dark:border-slate-800'
        )}
      >
        <div className="relative h-32 sm:h-36 overflow-hidden">
          <Image src={headerPhoto} alt={`${destination} — ${meta.label}`} fill sizes="(min-width: 1024px) 33vw, 50vw" className="object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
          {badge && (
            <Badge className={cn('absolute top-2 left-2 text-[10px] text-white border-0 bg-gradient-to-r', badge.gradient)}>
              {badge.label}
            </Badge>
          )}
          {score && (
            <Badge variant="primary" className="absolute top-2 right-2 text-[10px] bg-white/90 dark:bg-slate-900/90">
              {score.final_score.toFixed(1)}/10
            </Badge>
          )}
          <p className="absolute bottom-2 left-3 text-white font-bold text-sm drop-shadow">{destination}</p>
        </div>

        <div className="p-3.5 sm:p-4 flex-1 flex flex-col">
          {/* Priority 1: hotel + rating */}
          {trip?.hotel ? (
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
              🏨 {trip.hotel.name} <span className="text-amber-500">{'★'.repeat(trip.hotel.stars)}</span>
            </p>
          ) : (
            <div className="h-4 w-3/4 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
          )}

          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
            <Icon size={12} /> {transport.provider} · {meta.label} · {origin} → {destination}
          </p>

          {annotation && <p className="text-[11px] font-medium text-blue-600 dark:text-blue-400 mt-1.5">{annotation}</p>}

          <div className="mt-auto pt-3">
            {/* Priority 2: total price */}
            {trip ? (
              <span className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400 block">{formatCLP(trip.costBreakdown.total)}</span>
            ) : (
              <div className="h-7 w-28 rounded bg-slate-100 dark:bg-slate-800 animate-pulse" />
            )}
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">viaje completo · por persona</p>

            {/* Priority 3: duration + activity count */}
            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="flex items-center gap-1">
                <CalendarDays size={12} /> {durationDays} días
              </span>
              {trip && (
                <span className="flex items-center gap-1">
                  <Ticket size={12} /> {trip.activities.length} actividad{trip.activities.length === 1 ? '' : 'es'}
                </span>
              )}
            </div>

            {/* CTA row */}
            <div className="flex items-center gap-1.5 mt-3">
              <Button size="sm" className="flex-1 text-xs px-2" disabled={!trip} onClick={() => setExpanded(true)}>
                Ver itinerario completo
              </Button>
              <SaveTripButton tripId={tripId} tripData={trip ?? transport} className="h-8 w-8 shrink-0" />
              {origin && (
                <PriceAlertButton origin={origin} destination={destination} suggestedMaxPrice={transport.price} className="h-8 w-8 shrink-0" />
              )}
            </div>
          </div>
        </div>
      </div>

      {expanded && trip && (
        <ModularPackBuilder
          initialTrip={trip}
          tripId={tripId}
          destination={destination}
          startDate={startDate}
          endDate={endDate}
          interests={interests}
          onClose={() => setExpanded(false)}
        />
      )}
    </>
  )
}
