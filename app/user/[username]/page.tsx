'use client'

import { use, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Heart, MapPin, UserX } from 'lucide-react'
import { Card, CardBody } from '@/components/common/Card'
import FollowButton from '@/components/profile/FollowButton'
import { getPublicProfile, getPublicSavedTrips, getFollowerCount } from '@/lib/services/userProfileService'
import { getSavedTripLabel } from '@/lib/services/savedTripsService'
import type { UserProfile } from '@/lib/types/userProfile'
import type { SavedTrip } from '@/lib/types/auth'

interface PublicProfilePageProps {
  params: Promise<{ username: string }>
}

type Tab = 'trips' | 'destinations'

function tabClass(active: boolean) {
  return `flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${
    active
      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
  }`
}

export default function PublicProfilePage({ params }: PublicProfilePageProps) {
  const { username } = use(params)
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined)
  const [trips, setTrips] = useState<SavedTrip[]>([])
  const [followerCount, setFollowerCount] = useState(0)
  const [tab, setTab] = useState<Tab>('trips')

  useEffect(() => {
    let cancelled = false
    getPublicProfile(decodeURIComponent(username)).then(async (p) => {
      if (cancelled) return
      setProfile(p)
      if (p) {
        const [savedTrips, followers] = await Promise.all([getPublicSavedTrips(p.userId), getFollowerCount(p.userId)])
        if (!cancelled) {
          setTrips(savedTrips)
          setFollowerCount(followers)
        }
      }
    })
    return () => {
      cancelled = true
    }
  }, [username])

  const favoriteDestinations = useMemo(() => {
    const seen = new Map<string, string>()
    for (const trip of trips) {
      const name = getSavedTripLabel(trip)
      if (!seen.has(name)) seen.set(name, trip.tripId)
    }
    return Array.from(seen, ([name, tripId]) => ({ name, tripId }))
  }, [trips])

  if (profile === undefined) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    )
  }

  if (profile === null) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center px-6 text-center">
        <div>
          <UserX className="mx-auto mb-4 text-slate-300 dark:text-slate-700" size={40} />
          <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100">Usuario no encontrado</h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1">@{username} no existe en VIALII.</p>
        </div>
      </div>
    )
  }

  const initial = profile.username.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-12">
      <div className="max-w-4xl mx-auto px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex items-start gap-4 flex-wrap">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full gradient-primary text-white text-2xl font-bold">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">@{profile.username}</h1>
            {profile.bio && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{profile.bio}</p>}
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              {trips.length} viaje{trips.length === 1 ? '' : 's'} guardado{trips.length === 1 ? '' : 's'} ·{' '}
              {followerCount} seguidor{followerCount === 1 ? '' : 'es'}
            </p>
          </div>
          <FollowButton targetUserId={profile.userId} />
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
          <button type="button" onClick={() => setTab('trips')} className={tabClass(tab === 'trips')}>
            <Heart size={15} /> Viajes guardados
          </button>
          <button type="button" onClick={() => setTab('destinations')} className={tabClass(tab === 'destinations')}>
            <MapPin size={15} /> Destinos favoritos
          </button>
        </div>

        {tab === 'trips' &&
          (trips.length === 0 ? (
            <Card>
              <CardBody className="text-center py-12 text-slate-500 dark:text-slate-400">
                Aún no hay viajes guardados públicos.
              </CardBody>
            </Card>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {trips.map((trip) => (
                <Link key={trip.id} href={`/trip/${trip.tripId}`}>
                  <Card hover>
                    <CardBody>
                      <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{getSavedTripLabel(trip)}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                        Guardado el {new Date(trip.savedAt).toLocaleDateString('es-CL')}
                      </p>
                    </CardBody>
                  </Card>
                </Link>
              ))}
            </div>
          ))}

        {tab === 'destinations' &&
          (favoriteDestinations.length === 0 ? (
            <Card>
              <CardBody className="text-center py-12 text-slate-500 dark:text-slate-400">
                Sin destinos favoritos todavía.
              </CardBody>
            </Card>
          ) : (
            <div className="flex flex-wrap gap-2">
              {favoriteDestinations.map((d) => (
                <Link
                  key={d.tripId}
                  href={`/trip/${d.tripId}`}
                  className="px-4 py-2 rounded-full border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-medium text-slate-700 dark:text-slate-300 hover:border-blue-300 dark:hover:border-blue-800 transition-colors"
                >
                  <MapPin size={13} className="inline mr-1.5 text-blue-500" /> {d.name}
                </Link>
              ))}
            </div>
          ))}
      </div>
    </div>
  )
}
