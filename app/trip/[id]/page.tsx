'use client'

import { use, useEffect, useMemo, useState } from 'react'
import { MapPin, Calendar, Users } from 'lucide-react'
import { Badge } from '@/components/common/Badge'
import TripTimeline from '@/components/trip/TripTimeline'
import HotelSelector from '@/components/trip/HotelSelector'
import CostBreakdown from '@/components/trip/CostBreakdown'
import DayItinerary from '@/components/trip/DayItinerary'
import SocialActions from '@/components/common/SocialActions'
import CommentSection from '@/components/trip/CommentSection'
import { FEATURED_DESTINATIONS } from '@/constants/destinations'
import { generateTripItinerary, type TripItinerary, type TripTransportSummary } from '@/lib/services/tripBuilder'
import { getSavedCount } from '@/lib/services/savedTripsService'
import { getComments } from '@/lib/services/commentService'
import type { HotelOption } from '@/lib/providers/hotel/types'

interface TripPageProps {
  params: Promise<{ id: string }>
}

// This demo trip page is self-contained (no search->trip handoff exists yet),
// so we resolve a destination straight from the route id and build a fresh
// itinerary around sensible defaults.
function resolveDestination(id: string) {
  const slug = id.toLowerCase()
  return FEATURED_DESTINATIONS.find((d) => slug.includes(d.id)) ?? FEATURED_DESTINATIONS[0]
}

const DEFAULT_DURATION = 5
const DEFAULT_START_DATE = new Date('2026-08-15T00:00:00')
const MOCK_TRANSPORT: TripTransportSummary = {
  provider: 'Aerolíneas Mock',
  type: 'flight',
  price: 780000,
  duration: 660,
}

export default function TripPage({ params }: TripPageProps) {
  const { id } = use(params)
  const destination = useMemo(() => resolveDestination(id), [id])

  const [trip, setTrip] = useState<TripItinerary | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedDay, setSelectedDay] = useState<number | undefined>(undefined)
  const [selectedHotel, setSelectedHotel] = useState<HotelOption | undefined>(undefined)
  const [savesCount, setSavesCount] = useState(0)
  const [commentsCount, setCommentsCount] = useState(0)

  useEffect(() => {
    let cancelled = false
    const load = () => {
      setLoading(true)
      generateTripItinerary(destination, DEFAULT_START_DATE, DEFAULT_DURATION, MOCK_TRANSPORT).then((result) => {
        if (cancelled) return
        setTrip(result)
        setSelectedDay(result.days[0]?.dayNumber)
        setSelectedHotel(result.hotels[0])
        setLoading(false)
      })
    }
    load()

    return () => {
      cancelled = true
    }
  }, [destination])

  useEffect(() => {
    getSavedCount(id).then(setSavesCount)
    getComments(id).then((comments) => setCommentsCount(comments.length))
  }, [id])

  if (loading || !trip) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <div className="text-center">
          <div className="animate-spin text-5xl mb-4">⏳</div>
          <p className="text-slate-600 dark:text-slate-400">Preparando tu itinerario...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-8 sm:py-12">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="space-y-4">
          <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 dark:text-white">
            {trip.destination.name}, {trip.destination.country}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl">{trip.destination.description}</p>
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="primary" className="text-sm px-3 py-1.5 gap-1.5">
              <MapPin size={14} /> {trip.destination.region}
            </Badge>
            <Badge variant="neutral" className="text-sm px-3 py-1.5 gap-1.5">
              <Calendar size={14} /> {trip.duration} días
            </Badge>
            <Badge variant="neutral" className="text-sm px-3 py-1.5 gap-1.5">
              <Users size={14} /> 2 viajeros
            </Badge>
            {savesCount > 0 && (
              <span className="text-sm text-slate-500 dark:text-slate-400">
                {savesCount} persona{savesCount === 1 ? '' : 's'} guardaron este viaje
              </span>
            )}
          </div>

          <SocialActions
            tripId={id}
            tripData={trip}
            shareTitle={`Mira este viaje a ${trip.destination.name} en VIALII`}
            savesCount={savesCount}
            commentsCount={commentsCount}
            creatorHandle="@vialii"
          />
        </div>

        {/* Content: timeline/hotels/costs (left) + day-by-day itinerary (right) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6 lg:sticky lg:top-24 lg:self-start">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4">
              <TripTimeline days={trip.days} selectedDay={selectedDay} onSelectDay={setSelectedDay} />
            </div>
            <CostBreakdown breakdown={trip.costBreakdown} />
            <HotelSelector
              hotels={trip.hotels}
              selectedId={selectedHotel?.id}
              onSelect={setSelectedHotel}
            />
          </div>

          <div className="lg:col-span-2">
            <DayItinerary
              days={trip.days}
              activityPool={trip.activityPool}
              focusedDay={selectedDay}
              onFocusDay={setSelectedDay}
            />
          </div>
        </div>

        <CommentSection tripId={id} onCountChange={setCommentsCount} />
      </div>
    </div>
  )
}
