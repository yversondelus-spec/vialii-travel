'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Heart, Settings, Trash2, LogOut, Crown, ReceiptText, BellRing, Gift } from 'lucide-react'
import RequireAuth from '@/components/auth/RequireAuth'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import PublicProfileLink from '@/components/profile/PublicProfileLink'
import { useAuth } from '@/lib/auth/authContext'
import { getSavedTrips, removeSavedTrip, getSavedTripLabel } from '@/lib/services/savedTripsService'
import { getSubscription, getInvoices, cancelPremium } from '@/lib/services/subscriptionService'
import { FREE_SAVED_TRIPS_LIMIT } from '@/lib/types/subscription'
import { cn } from '@/lib/utils/cn'
import type { SavedTrip } from '@/lib/types/auth'
import type { PlanTier, Invoice } from '@/lib/types/subscription'

type Tab = 'saved' | 'settings'

function tabClass(active: boolean) {
  return cn(
    'flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors',
    active
      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
  )
}

function ProfileContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, logout } = useAuth()
  const [tab, setTab] = useState<Tab>(searchParams.get('tab') === 'settings' ? 'settings' : 'saved')
  const [trips, setTrips] = useState<SavedTrip[]>([])
  const [loadingTrips, setLoadingTrips] = useState(true)
  const [tier, setTier] = useState<PlanTier>('free')
  const [invoices, setInvoices] = useState<Invoice[]>([])

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
    getInvoices(user.id).then(setInvoices)
  }, [user])

  if (!user) return null

  const initial = user.email.charAt(0).toUpperCase()

  const handleRemove = async (tripId: string) => {
    await removeSavedTrip(user.id, tripId)
    setTrips((prev) => prev.filter((t) => t.tripId !== tripId))
  }

  const handleLogout = async () => {
    await logout()
    router.push('/')
  }

  // Real account deletion needs a server-side call with the Supabase admin
  // key (the browser's anon key can't delete auth users). This best-effort
  // version signs the user out locally; wire it to a /api/account route
  // backed by the service key to actually delete the record.
  const handleDeleteAccount = async () => {
    if (!confirm('¿Seguro que quieres eliminar tu cuenta? Esta acción no se puede deshacer.')) return
    await logout()
    router.push('/')
  }

  const handleCancelPremium = async () => {
    if (!confirm('¿Cancelar tu suscripción Premium? Volverás al plan Free.')) return
    await cancelPremium(user.id)
    setTier('free')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Header */}
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full gradient-primary text-white text-2xl font-bold">
            {initial}
          </div>
          <div className="min-w-0">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">{user.email}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Miembro desde{' '}
              {new Date(user.created_at).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })}
            </p>
            <PublicProfileLink className="mt-1" />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
          <button type="button" onClick={() => setTab('saved')} className={tabClass(tab === 'saved')}>
            <Heart size={15} /> Viajes guardados
          </button>
          <button type="button" onClick={() => setTab('settings')} className={tabClass(tab === 'settings')}>
            <Settings size={15} /> Configuración
          </button>
          <Link href="/profile/referrals" className={tabClass(false)}>
            <Gift size={15} /> Referidos
          </Link>
        </div>

        {tab === 'saved' && (
          <div>
            {loadingTrips ? (
              <p className="text-slate-500 dark:text-slate-400">Cargando...</p>
            ) : trips.length === 0 ? (
              <Card>
                <CardBody className="text-center py-12">
                  <div className="text-5xl mb-4">💙</div>
                  <p className="text-slate-600 dark:text-slate-400 mb-4">Aún no tienes viajes guardados</p>
                  <Link href="/discover">
                    <Button>Explorar destinos</Button>
                  </Link>
                </CardBody>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {trips.map((trip) => (
                  <Card key={trip.id} hover>
                    <CardBody className="flex items-start justify-between gap-3">
                      <Link href={`/trip/${trip.tripId}`} className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                          {getSavedTripLabel(trip)}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                          Guardado el {new Date(trip.savedAt).toLocaleDateString('es-CL')}
                        </p>
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleRemove(trip.tripId)}
                        aria-label="Eliminar de guardados"
                        className="text-slate-400 hover:text-red-500 transition-colors shrink-0"
                      >
                        <Trash2 size={16} />
                      </button>
                    </CardBody>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'settings' && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <h2 className="font-bold text-slate-900 dark:text-slate-100">Apariencia</h2>
              </CardHeader>
              <CardBody className="flex items-center justify-between">
                <span className="text-sm text-slate-600 dark:text-slate-400">Modo oscuro</span>
                <ThemeToggle />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="font-bold text-slate-900 dark:text-slate-100">Plan</h2>
              </CardHeader>
              <CardBody className="flex items-center justify-between">
                <div>
                  <Badge variant={tier === 'premium' ? 'success' : 'neutral'}>
                    {tier === 'premium' ? 'Premium' : 'Free'}
                  </Badge>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                    {tier === 'premium'
                      ? 'Viajes guardados ilimitados + alertas de precio'
                      : `${FREE_SAVED_TRIPS_LIMIT} viajes guardados`}
                  </p>
                </div>
                {tier === 'premium' ? (
                  <Button variant="outline" size="sm" onClick={handleCancelPremium}>
                    Cancelar Premium
                  </Button>
                ) : (
                  <Link href="/pricing">
                    <Button variant="outline" size="sm">
                      <Crown size={14} className="mr-1.5" /> Mejorar a Premium
                    </Button>
                  </Link>
                )}
              </CardBody>
            </Card>

            {tier === 'premium' && (
              <Card>
                <CardHeader>
                  <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <BellRing size={16} /> Alertas de precio
                  </h2>
                </CardHeader>
                <CardBody className="flex items-center justify-between">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Recibe un aviso cuando baje el precio de tu ruta favorita.
                  </p>
                  <Link href="/alerts">
                    <Button size="sm">Gestionar alertas</Button>
                  </Link>
                </CardBody>
              </Card>
            )}

            {invoices.length > 0 && (
              <Card>
                <CardHeader>
                  <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <ReceiptText size={16} /> Facturas
                  </h2>
                </CardHeader>
                <CardBody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {invoices.map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between py-2.5 text-sm first:pt-0 last:pb-0">
                      <div>
                        <p className="text-slate-700 dark:text-slate-300">
                          Plan {invoice.plan === 'premium' ? 'Premium' : 'Free'}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                          {new Date(invoice.issuedAt).toLocaleDateString('es-CL')}
                        </p>
                      </div>
                      <span className="font-semibold text-slate-900 dark:text-slate-100">
                        ${invoice.amount.toLocaleString('es-CL')} {invoice.currency}
                      </span>
                    </div>
                  ))}
                </CardBody>
              </Card>
            )}

            <Card>
              <CardBody className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                <Button variant="secondary" onClick={handleLogout}>
                  <LogOut size={15} className="mr-1.5" /> Cerrar sesión
                </Button>
                <Button variant="danger" size="sm" onClick={handleDeleteAccount}>
                  Eliminar cuenta
                </Button>
              </CardBody>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}

export default function ProfilePage() {
  return (
    <RequireAuth>
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-24">
            <div className="animate-spin text-4xl">⏳</div>
          </div>
        }
      >
        <ProfileContent />
      </Suspense>
    </RequireAuth>
  )
}
