'use client'

import { Suspense, useEffect, useState, type FormEvent } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Plane, ShieldCheck, Check, AlertTriangle, Clock, User } from 'lucide-react'
import { Button } from '@/components/common/Button'
import type { FlightOffer, FlightOrder, FlightOrderPassenger } from '@/lib/travel-engine/core/models'

/**
 * Reserva de un vuelo real contra el proveedor (hoy Duffel).
 *
 * Crea una "hold order": el asiento queda reservado de verdad, pero no se
 * captura ningun pago — VIALII todavia no tiene procesador conectado. Duffel
 * libera la reserva sola si no se paga antes de su plazo, asi que el usuario
 * no queda con una deuda ni con un cargo sorpresa.
 *
 * Ruta aparte de /checkout, que es el demo de suscripciones y no toca un
 * proveedor real.
 */

const TITLES = [
  { value: 'mr', label: 'Sr.' },
  { value: 'ms', label: 'Sra.' },
  { value: 'mrs', label: 'Sra. (casada)' },
  { value: 'miss', label: 'Srta.' },
  { value: 'dr', label: 'Dr./Dra.' },
] as const

/** Duffel exige E.164: '+' + codigo de pais + numero, sin espacios ni guiones. */
const E164 = /^\+[1-9]\d{7,14}$/

type PassengerForm = {
  givenName: string
  familyName: string
  bornOn: string
  gender: 'm' | 'f'
  title: (typeof TITLES)[number]['value']
  email: string
  phoneNumber: string
}

function emptyPassenger(): PassengerForm {
  return {
    givenName: '',
    familyName: '',
    bornOn: '',
    gender: 'm',
    title: 'mr',
    email: '',
    phoneNumber: '',
  }
}

function formatPrice(amount: number, currency: string): string {
  return `${currency} ${Math.round(amount).toLocaleString('es-CL')}`
}

const inputClass =
  'w-full rounded-xl border border-slate-300 px-4 py-2.5 focus:border-transparent focus:ring-2 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100'
const labelClass = 'mb-1 block text-sm font-semibold text-slate-900 dark:text-slate-100'

function BookFlightContent() {
  const searchParams = useSearchParams()
  const offerId = searchParams.get('offerId')
  const provider = searchParams.get('provider')
  const missingParams = !offerId || !provider

  const [offer, setOffer] = useState<FlightOffer | null>(null)
  // Arranca en false cuando no hay que pedir nada: sin offerId el efecto
  // retorna temprano y nunca apagaria el loading.
  const [loadingOffer, setLoadingOffer] = useState(!missingParams)
  const [offerError, setOfferError] = useState<string | null>(null)

  // Lo que el usuario ha escrito. Puede tener menos entradas que el offer si
  // todavia no lo conocemos, o mas si el offer resulta ser de un solo pasajero.
  const [entered, setEntered] = useState<PassengerForm[]>([])

  /**
   * El offer fija cuantos pasajeros cubre (se decidio al buscar) y la orden
   * debe enviar exactamente esa cantidad, o el proveedor la rechaza por
   * mismatch de conteo. Se deriva en render en vez de sincronizar con un
   * efecto: el largo es funcion del offer, no un estado propio.
   */
  const passengerCount = Math.max(1, offer?.passengerCount ?? 1)
  const forms: PassengerForm[] = Array.from(
    { length: passengerCount },
    (_, i) => entered[i] ?? emptyPassenger()
  )
  const [submitting, setSubmitting] = useState(false)
  const [orderError, setOrderError] = useState<string | null>(null)
  const [order, setOrder] = useState<FlightOrder | null>(null)

  /**
   * Re-precia la oferta antes de mostrarla: las ofertas de Duffel expiran
   * (~30 min) y pueden cambiar de precio entre la busqueda y la reserva.
   * Mejor descubrirlo aqui que en medio del createOrder.
   *
   * El `cancelled` evita escribir estado si el usuario navega mientras la
   * peticion esta en vuelo — mismo patron que detectOrigin en
   * TravelSearchForm.
   */
  useEffect(() => {
    if (!offerId || !provider) return

    let cancelled = false

    fetch('/api/flights/price', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ provider, offerId }),
    })
      .then((response) => response.json())
      .then((body) => {
        if (cancelled) return
        if (!body.success) {
          setOfferError(
            body.code === 'OFFER_EXPIRED'
              ? 'Esta oferta expiró. Vuelve a buscar para ver precios vigentes.'
              : (body.error ?? 'No pudimos confirmar esta oferta.')
          )
          return
        }
        setOffer(body.data as FlightOffer)
      })
      .catch(() => {
        if (!cancelled) setOfferError('No pudimos conectar con el proveedor. Intenta de nuevo.')
      })
      .finally(() => {
        if (!cancelled) setLoadingOffer(false)
      })

    return () => {
      cancelled = true
    }
  }, [offerId, provider])


  const updatePassenger = (index: number, patch: Partial<PassengerForm>) => {
    setEntered((prev) => {
      const next = Array.from(
        { length: passengerCount },
        (_, i) => prev[i] ?? emptyPassenger()
      )
      next[index] = { ...next[index], ...patch }
      return next
    })
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!offer || !provider) return

    const invalidPhone = forms.findIndex((f) => !E164.test(f.phoneNumber))
    if (invalidPhone !== -1) {
      setOrderError(
        `El teléfono del pasajero ${invalidPhone + 1} debe incluir el código de país, por ejemplo +56912345678.`
      )
      return
    }

    setSubmitting(true)
    setOrderError(null)

    const passengers: FlightOrderPassenger[] = forms.map((f) => ({
      type: 'adult',
      givenName: f.givenName.trim(),
      familyName: f.familyName.trim(),
      bornOn: f.bornOn,
      gender: f.gender,
      title: f.title,
      email: f.email.trim(),
      phoneNumber: f.phoneNumber.trim(),
    }))

    try {
      const response = await fetch('/api/flights/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, offerId: offer.id, passengers }),
      })
      const body = await response.json()

      if (!body.success) {
        setOrderError(
          body.code === 'OFFER_EXPIRED'
            ? 'La oferta expiró mientras completabas tus datos. Vuelve a buscar.'
            : (body.error ?? 'No pudimos crear la reserva.')
        )
        return
      }

      setOrder(body.data as FlightOrder)
    } catch {
      setOrderError('No pudimos conectar con el proveedor. Tu reserva no se creó.')
    } finally {
      setSubmitting(false)
    }
  }

  // --- Confirmacion ---
  if (order) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="rounded-2xl border-2 border-emerald-400 bg-emerald-50 p-6 text-center dark:border-emerald-600 dark:bg-emerald-950/30">
          <Check className="mx-auto mb-2 text-emerald-500" size={32} />
          <h1 className="text-xl font-bold text-emerald-800 dark:text-emerald-200">Reserva creada</h1>
          {order.bookingReference && (
            <p className="mt-3 text-sm text-emerald-700 dark:text-emerald-300">
              Código de reserva
              <span className="mt-1 block font-mono text-2xl font-bold tracking-widest">{order.bookingReference}</span>
            </p>
          )}
          <p className="mt-4 text-sm text-emerald-700 dark:text-emerald-300">
            Estado: <strong>{order.status === 'pending' ? 'pendiente de pago' : order.status}</strong>
          </p>
        </div>

        <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm text-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
          Tu asiento quedó reservado, pero <strong>todavía no está pagado</strong>. La aerolínea libera la
          reserva si no se paga dentro de su plazo. Te avisaremos en cuanto tengamos los pagos habilitados.
        </div>

        <Link href="/" className="mt-6 block">
          <Button variant="outline" fullWidth>Volver al inicio</Button>
        </Link>
      </div>
    )
  }

  // --- Carga ---
  if (loadingOffer) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" />
      </div>
    )
  }

  // --- Errores de oferta ---
  if (missingParams || offerError || !offer) {
    return (
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="rounded-2xl border-2 border-amber-400 bg-amber-50 p-6 text-center dark:border-amber-600 dark:bg-amber-950/30">
          <AlertTriangle className="mx-auto mb-2 text-amber-500" size={28} />
          <p className="text-amber-800 dark:text-amber-200">
            {missingParams ? 'Falta la oferta a reservar.' : (offerError ?? 'Oferta no disponible.')}
          </p>
        </div>
        <Link href="/search" className="mt-6 block">
          <Button fullWidth>Buscar de nuevo</Button>
        </Link>
      </div>
    )
  }

  // --- Formulario ---
  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100">
          <Plane size={16} /> {offer.airline}
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-slate-600 dark:text-slate-400">
            {offer.origin} → {offer.destination}
            {offer.stops === 0 ? ' · directo' : ` · ${offer.stops} escala${offer.stops > 1 ? 's' : ''}`}
          </span>
          <span className="text-xl font-bold text-blue-600 dark:text-blue-400">
            {formatPrice(offer.price, offer.currency)}
          </span>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
          <Clock size={12} /> Precio total confirmado con la aerolínea hace un momento
          {forms.length > 1 && ` · ${forms.length} pasajeros`}.
        </p>
      </div>

      <div className="mb-5 flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800/50 dark:text-slate-400">
        <ShieldCheck size={22} className="shrink-0 text-slate-400" />
        <span>
          Reservamos tu asiento <strong>sin cobrar nada</strong>: VIALII todavía no procesa pagos. La aerolínea
          exige estos datos tal como aparecen en tu documento de viaje.
        </span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {forms.map((passenger, index) => (
          <div
            key={index}
            className={
              forms.length > 1
                ? 'space-y-4 rounded-xl border border-slate-200 p-4 dark:border-slate-800'
                : 'space-y-4'
            }
          >
            {forms.length > 1 && (
              <p className="flex items-center gap-1.5 text-sm font-bold text-slate-900 dark:text-slate-100">
                <User size={14} /> Pasajero {index + 1}
              </p>
            )}

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className={labelClass}>Nombre</span>
                <input
                  type="text"
                  required
                  value={passenger.givenName}
                  onChange={(e) => updatePassenger(index, { givenName: e.target.value })}
                  className={inputClass}
                />
              </label>
              <label className="block">
                <span className={labelClass}>Apellido</span>
                <input
                  type="text"
                  required
                  value={passenger.familyName}
                  onChange={(e) => updatePassenger(index, { familyName: e.target.value })}
                  className={inputClass}
                />
              </label>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <label className="block">
                <span className={labelClass}>Trato</span>
                <select
                  value={passenger.title}
                  onChange={(e) => updatePassenger(index, { title: e.target.value as PassengerForm['title'] })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  {TITLES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className={labelClass}>Género</span>
                <select
                  value={passenger.gender}
                  onChange={(e) => updatePassenger(index, { gender: e.target.value as 'm' | 'f' })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                >
                  <option value="m">M</option>
                  <option value="f">F</option>
                </select>
              </label>
              <label className="block">
                <span className={labelClass}>Nacimiento</span>
                <input
                  type="date"
                  required
                  max={new Date().toISOString().split('T')[0]}
                  value={passenger.bornOn}
                  onChange={(e) => updatePassenger(index, { bornOn: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100"
                />
              </label>
            </div>

            <label className="block">
              <span className={labelClass}>Email</span>
              <input
                type="email"
                required
                value={passenger.email}
                onChange={(e) => updatePassenger(index, { email: e.target.value })}
                className={inputClass}
              />
            </label>

            <label className="block">
              <span className={labelClass}>Teléfono</span>
              <input
                type="tel"
                required
                placeholder="+56912345678"
                value={passenger.phoneNumber}
                onChange={(e) => updatePassenger(index, { phoneNumber: e.target.value })}
                className={inputClass}
              />
              <span className="mt-1 block text-xs text-slate-500 dark:text-slate-400">
                Con código de país, sin espacios. La aerolínea lo usa para avisar de cambios de vuelo.
              </span>
            </label>
          </div>
        ))}

        {orderError && (
          <div className="rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/30 dark:text-red-300">
            {orderError}
          </div>
        )}

        <Button type="submit" size="lg" fullWidth isLoading={submitting}>
          Reservar sin pagar · {formatPrice(offer.price, offer.currency)}
        </Button>
      </form>
    </div>
  )
}

export default function BookFlightPage() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-lg px-4 py-12"><div className="h-64 animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800" /></div>}>
      <BookFlightContent />
    </Suspense>
  )
}