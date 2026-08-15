'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Heart, Ticket, MapPin } from 'lucide-react'
import RequireAuth from '@/components/auth/RequireAuth'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { useAuth } from '@/lib/auth/authContext'
import { getSavedTrips, getSavedTripLabel } from '@/lib/services/savedTripsService'
import { getSubscription } from '@/lib/services/subscriptionService'
import type { SavedTrip } from '@/lib/types/auth'
import type { PlanTier } from '@/lib/types/subscription'

/**
 * Real account summary — pulls the actual signed-in user (useAuth), their
 * actual saved trips (savedTripsService), and actual plan tier
 * (subscriptionService). No hardcoded "Juan Pérez" placeholder identity: a
 * page at a fixed URL that shows the same fake person to every visitor
 * regardless of who's logged in isn't a demo shortcut, it's a broken auth
 * boundary. There's no real tour-booking backend yet (see
 * app/tours/[id]/book/page.tsx), so confirmed bookings aren't tracked —
 * that section says so honestly instead of inventing reservation data.
 */
function DashboardContent() {
  const { user } = useAuth()
  const [trips, setTrips] = useState<SavedTrip[]>([])
  const [loadingTrips, setLoadingTrips] = useState(true)
  const [tier, setTier] = useState<PlanTier>('free')

  useEffect(() => {
    if (!user) return
    let cancelled = false
    const load = () => {
      setLoadingTrips(true)
      getSavedTrips(user.id).then((result) => {
        if (!cancelled) {
          setTrips(result)
          setLoadingTrips(false)
        }
      })
    }
    load()
    return () => {
      cancelled = true
    }
  }, [user])

  useEffect(() => {
    if (!user) return
    getSubscription(user.id).then((sub) => setTier(sub.tier))
  }, [user])

  if (!user) return null

  const initial = user.email.charAt(0).toUpperCase()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* HEADER */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full gradient-primary text-white text-2xl font-bold">
            {initial}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{user.email}</h1>
            <Badge variant={tier === 'premium' ? 'success' : 'neutral'} className="mt-1">
              {tier === 'premium' ? 'Premium' : 'Free'}
            </Badge>
          </div>
          <Link href="/profile" className="ml-auto">
            <Button variant="outline" size="sm">
              Ver perfil completo
            </Button>
          </Link>
        </div>

        {/* RESERVAS DE TOURS — honesto: no hay backend de reservas todavía */}
        <Card>
          <CardHeader>
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Ticket size={18} /> Mis reservas
            </h2>
          </CardHeader>
          <CardBody className="text-center py-10">
            <p className="text-slate-600 dark:text-slate-400 mb-4">
              El seguimiento de reservas de tours todavía no está conectado a un sistema real — por ahora las reservas que hagas en la demo
              no quedan guardadas acá.
            </p>
            <Link href="/explore">
              <Button variant="outline">Explorar tours</Button>
            </Link>
          </CardBody>
        </Card>

        {/* VIAJES GUARDADOS — reales */}
        <Card>
          <CardHeader>
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Heart size={18} /> Viajes guardados
            </h2>
          </CardHeader>
          <CardBody>
            {loadingTrips ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando...</p>
            ) : trips.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-slate-600 dark:text-slate-400 mb-4">Aún no tienes viajes guardados</p>
                <Link href="/discover">
                  <Button>Explorar destinos</Button>
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {trips.map((trip) => (
                  <Link key={trip.id} href={`/trip/${trip.tripId}`}>
                    <div className="flex items-center gap-3 p-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:border-cyan-400 dark:hover:border-cyan-700 transition-colors">
                      <MapPin size={16} className="text-cyan-600 dark:text-cyan-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{getSavedTripLabel(trip)}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          Guardado el {new Date(trip.savedAt).toLocaleDateString('es-CL')}
                        </p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  return (
    <RequireAuth>
      <DashboardContent />
    </RequireAuth>
  )
}
