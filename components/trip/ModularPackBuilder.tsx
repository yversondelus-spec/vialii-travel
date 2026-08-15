'use client'

import { useState } from 'react'
import {
  X, Plane, Bus, TrainFront, Hotel, Ticket, UtensilsCrossed, RefreshCw, ChevronDown, TrendingDown, TrendingUp,
} from 'lucide-react'
import ComponentSelector from './ComponentSelector'
import PaymentOptions from './PaymentOptions'
import type { SelectableOption } from './AlternativeComponent'
import { swapHotel, swapTransport, swapActivity } from '@/lib/services/packRecalculation'
import { checkForPriceChanges, type PriceCheckResult } from '@/lib/services/priceTrackingService'
import { filterHotelsByPreference, filterActivitiesByPreference, PREFERENCE_OPTIONS, type ComponentPreference } from '@/lib/services/aiComponentSuggestionService'
import type { CompleteTrip, ItineraryItemType } from '@/lib/types/trip'
import type { Interest } from '@/constants/interests'
import { cn } from '@/lib/utils/cn'

interface ModularPackBuilderProps {
  initialTrip: CompleteTrip
  tripId: string
  destination: string
  startDate: Date
  endDate: Date
  interests: Interest[]
  onClose: () => void
}

const ITEM_ICON: Record<ItineraryItemType, typeof Plane> = {
  arrival: Plane,
  checkin: Hotel,
  activity: Ticket,
  meal: UtensilsCrossed,
  checkout: Hotel,
  free: Ticket,
}

const TRANSPORT_ICON = { bus: Bus, flight: Plane, train: TrainFront } as const

function formatCLP(value: number) {
  return `$${Math.round(value).toLocaleString('es-CL')}`
}

type SwapTarget = 'transport' | 'hotel' | { activityId: string } | null

/**
 * The modular, swappable pack view — "Tu viaje a X" with one row per
 * component (transporte/hospedaje/actividades/comidas), each with its own
 * [Cambiar] that opens ComponentSelector, plus cost breakdown, day-by-day
 * itinerary, and payment options. Supersedes ExpandedItinerary as
 * PackResultCard's detail modal — same itinerary section folded in here
 * rather than composing two separate modals.
 */
export default function ModularPackBuilder({ initialTrip, tripId, destination, startDate, endDate, interests, onClose }: ModularPackBuilderProps) {
  const [trip, setTrip] = useState(initialTrip)
  const [swapTarget, setSwapTarget] = useState<SwapTarget>(null)
  const [componentPreference, setComponentPreference] = useState<ComponentPreference | ''>('')
  const [showTransportDetails, setShowTransportDetails] = useState(false)
  const [showHotelDetails, setShowHotelDetails] = useState(false)
  const [priceCheck, setPriceCheck] = useState<PriceCheckResult | null>(null)
  const [checkingPrice, setCheckingPrice] = useState(false)

  const duration = trip.itinerary.length
  const TransportIcon = TRANSPORT_ICON[trip.transport.type as keyof typeof TRANSPORT_ICON] ?? Bus

  const handleRefreshPrices = async () => {
    setCheckingPrice(true)
    const result = await checkForPriceChanges(trip, destination, startDate, endDate, interests)
    setPriceCheck(result)
    setCheckingPrice(false)
  }

  // --- Component selectors -------------------------------------------------

  const transportOptions: SelectableOption[] = [trip.transport, ...(trip.transportAlternatives ?? [])].map((o) => ({
    id: o.id,
    title: o.provider,
    subtitle: `${o.type === 'flight' ? 'Vuelo' : o.type === 'bus' ? 'Bus' : 'Tren'} · ${o.direct ? 'Directo' : `${o.stops} paradas`}`,
    price: o.price,
    isCurrent: o.id === trip.transport.id,
  }))

  const hotelPool = componentPreference && trip.hotel
    ? filterHotelsByPreference([trip.hotel, ...(trip.hotelAlternatives ?? [])], componentPreference)
    : [trip.hotel, ...(trip.hotelAlternatives ?? [])].filter((h): h is NonNullable<typeof h> => !!h)
  const hotelOptions: SelectableOption[] = hotelPool.map((h) => ({
    id: h.id,
    title: h.name,
    subtitle: h.address,
    price: h.price,
    rating: h.stars,
    isCurrent: h.id === trip.hotel?.id,
  }))

  const activityPreference = swapTarget && typeof swapTarget === 'object' ? componentPreference : ''
  const activityBeingSwapped = swapTarget && typeof swapTarget === 'object' ? trip.activities.find((a) => a.id === swapTarget.activityId) : undefined
  const activityPool = activityBeingSwapped
    ? [activityBeingSwapped, ...(trip.activityAlternatives ?? [])]
    : []
  const filteredActivityPool = activityPreference ? filterActivitiesByPreference(activityPool, activityPreference as ComponentPreference) : activityPool
  const activityOptions: SelectableOption[] = filteredActivityPool.map((a) => ({
    id: a.id,
    title: a.name,
    subtitle: a.category,
    price: a.price,
    rating: a.rating,
    isCurrent: a.id === activityBeingSwapped?.id,
  }))

  const handleSelectTransport = (id: string) => {
    const chosen = [trip.transport, ...(trip.transportAlternatives ?? [])].find((o) => o.id === id)
    if (chosen) setTrip(swapTransport(trip, chosen))
    setSwapTarget(null)
  }

  const handleSelectHotel = (id: string) => {
    const chosen = hotelPool.find((h) => h.id === id)
    if (chosen) setTrip(swapHotel(trip, chosen, startDate, endDate))
    setSwapTarget(null)
    setComponentPreference('')
  }

  const handleSelectActivity = (id: string) => {
    const chosen = activityPool.find((a) => a.id === id)
    if (chosen && activityBeingSwapped) setTrip(swapActivity(trip, activityBeingSwapped.id, chosen, startDate, duration))
    setSwapTarget(null)
    setComponentPreference('')
  }

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 py-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="pack-builder-title"
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-2xl max-h-full overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 sm:px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 id="pack-builder-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
              Tu viaje a {destination}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">{duration} días · Presupuesto {formatCLP(trip.costBreakdown.total + trip.costBreakdown.remainingBudget)}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          <button
            type="button"
            onClick={handleRefreshPrices}
            disabled={checkingPrice}
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline disabled:opacity-60"
          >
            <RefreshCw size={12} className={checkingPrice ? 'animate-spin' : ''} /> {checkingPrice ? 'Consultando...' : 'Actualizar precios'}
          </button>

          {priceCheck?.changed && (
            <div
              className={cn(
                'flex items-center gap-2 rounded-lg px-3.5 py-2.5 text-sm',
                priceCheck.delta < 0
                  ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300'
                  : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-300'
              )}
            >
              {priceCheck.delta < 0 ? <TrendingDown size={16} /> : <TrendingUp size={16} />}
              {priceCheck.delta < 0
                ? `¡El hotel bajó de precio! Ahorras ${formatCLP(Math.abs(priceCheck.delta))}.`
                : `El precio del hotel subió ${formatCLP(priceCheck.delta)} desde que armaste este viaje.`}
            </div>
          )}

          {/* ✈️ Transporte */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                  <TransportIcon size={16} /> Transporte
                </p>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">{trip.transport.provider}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {destination !== trip.transport.provider ? `→ ${destination}` : ''} · {trip.transport.direct ? 'Directo' : `${trip.transport.stops} paradas`}
                </p>
                <p className="font-bold text-blue-600 dark:text-blue-400 mt-1">{formatCLP(trip.transport.price)}</p>
              </div>
              <div className="flex flex-col gap-1.5 shrink-0">
                <button type="button" onClick={() => setSwapTarget('transport')} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                  Cambiar
                </button>
                <button
                  type="button"
                  onClick={() => setShowTransportDetails((v) => !v)}
                  className="flex items-center gap-0.5 text-xs text-slate-500 dark:text-slate-400 hover:underline"
                >
                  Detalles <ChevronDown size={12} className={cn('transition-transform', showTransportDetails && 'rotate-180')} />
                </button>
              </div>
            </div>
            {showTransportDetails && (
              <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400 space-y-1">
                {trip.transport.departureAirport && trip.transport.arrivalAirport && (
                  <p>{trip.transport.departureAirport} → {trip.transport.arrivalAirport}</p>
                )}
                <p>
                  Salida: {new Date(trip.transport.departure).toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
                <p>Llegada: {new Date(trip.transport.arrival).toLocaleString('es-CL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                <p>Duración: {Math.floor(trip.transport.duration / 60)}h {trip.transport.duration % 60}m</p>
                {trip.transport.aircraftType && <p>Aeronave: {trip.transport.aircraftType}</p>}
                {trip.transport.amenities.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {trip.transport.amenities.map((a) => (
                      <span key={a} className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                        {a}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 🏨 Hospedaje */}
          {trip.hotel && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
                    <Hotel size={16} /> Hospedaje
                  </p>
                  <p className="text-sm text-slate-700 dark:text-slate-300 mt-1">
                    {trip.hotel.name} <span className="text-amber-500">{'★'.repeat(trip.hotel.stars)}</span>
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{trip.hotel.address}</p>
                  <p className="font-bold text-blue-600 dark:text-blue-400 mt-1">{formatCLP(trip.costBreakdown.hotel)}</p>
                </div>
                <div className="flex flex-col gap-1.5 shrink-0">
                  <button type="button" onClick={() => setSwapTarget('hotel')} className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline">
                    Cambiar
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowHotelDetails((v) => !v)}
                    className="flex items-center gap-0.5 text-xs text-slate-500 dark:text-slate-400 hover:underline"
                  >
                    Detalles <ChevronDown size={12} className={cn('transition-transform', showHotelDetails && 'rotate-180')} />
                  </button>
                </div>
              </div>
              {showHotelDetails && (
                <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800 flex flex-wrap gap-1.5">
                  {trip.hotel.amenities.map((a) => (
                    <span key={a} className="px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-[11px] text-slate-600 dark:text-slate-300">
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* 🎭 Actividades */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <p className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100 mb-2">
              <Ticket size={16} /> Actividades ({trip.activities.length})
            </p>
            <ul className="space-y-2">
              {trip.activities.map((activity) => (
                <li key={activity.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="text-slate-700 dark:text-slate-300 truncate">{activity.name}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-slate-500 dark:text-slate-400">{formatCLP(activity.price)}</span>
                    <button
                      type="button"
                      onClick={() => setSwapTarget({ activityId: activity.id })}
                      className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Cambiar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
            <p className="font-bold text-blue-600 dark:text-blue-400 mt-2">{formatCLP(trip.costBreakdown.activities)}</p>
          </div>

          {/* 🍽️ Comidas */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <p className="flex items-center gap-1.5 font-bold text-slate-900 dark:text-slate-100">
              <UtensilsCrossed size={16} /> Comidas
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Presupuestado — desayuno y cena estimados por día</p>
            <p className="font-bold text-blue-600 dark:text-blue-400 mt-1">{formatCLP(trip.costBreakdown.meals)}</p>
          </div>

          {/* Cost breakdown */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 dark:bg-slate-800/50">
              <span className="font-bold text-slate-900 dark:text-slate-100">Total</span>
              <span className="font-bold text-lg text-blue-600 dark:text-blue-400">{formatCLP(trip.costBreakdown.total)}</span>
            </div>
            <p className={cn('px-4 py-2 text-xs', trip.costBreakdown.remainingBudget >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500 dark:text-red-400')}>
              {trip.costBreakdown.remainingBudget >= 0
                ? `Ahorro: ${formatCLP(trip.costBreakdown.remainingBudget)} (${trip.costBreakdown.savingsPercent}%)`
                : `Supera tu presupuesto en ${formatCLP(Math.abs(trip.costBreakdown.remainingBudget))}`}
            </p>
          </div>

          {/* Itinerario día a día */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Itinerario día a día</h3>
            <div className="space-y-4">
              {trip.itinerary.map((day) => (
                <div key={day.dayNumber}>
                  <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-2">
                    Día {day.dayNumber} — {day.title}
                  </p>
                  <ul className="space-y-1.5 border-l-2 border-slate-200 dark:border-slate-700 pl-4">
                    {day.items.map((item, idx) => {
                      const Icon = ITEM_ICON[item.type]
                      return (
                        <li key={idx} className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                          <Icon size={14} className="mt-0.5 shrink-0 text-slate-400 dark:text-slate-500" />
                          <span>
                            <span className="font-medium text-slate-800 dark:text-slate-200">{item.time}</span> {item.title}
                          </span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Pago */}
          <div>
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-3">Pago</h3>
            <PaymentOptions trip={trip} tripId={tripId} destination={destination} />
          </div>
        </div>
      </div>

      {swapTarget === 'transport' && (
        <ComponentSelector title="Cambiar transporte" options={transportOptions} onSelect={handleSelectTransport} onClose={() => setSwapTarget(null)} />
      )}
      {swapTarget === 'hotel' && (
        <ComponentSelector
          title="Cambiar hotel"
          options={hotelOptions}
          preferenceOptions={PREFERENCE_OPTIONS}
          onPreferenceChange={(id) => setComponentPreference(id as ComponentPreference)}
          onSelect={handleSelectHotel}
          onClose={() => {
            setSwapTarget(null)
            setComponentPreference('')
          }}
        />
      )}
      {swapTarget && typeof swapTarget === 'object' && (
        <ComponentSelector
          title="Cambiar actividad"
          options={activityOptions}
          preferenceOptions={PREFERENCE_OPTIONS.filter((p) => p.id === 'mas_barato' || p.id === 'mejor_valorado')}
          onPreferenceChange={(id) => setComponentPreference(id as ComponentPreference)}
          onSelect={handleSelectActivity}
          onClose={() => {
            setSwapTarget(null)
            setComponentPreference('')
          }}
        />
      )}
    </div>
  )
}
