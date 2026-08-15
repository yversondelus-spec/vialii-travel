'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeft, CheckCircle, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { getTourById } from '@/constants/chileanTours'
import { MEMBERSHIP_PLANS, type MembershipTier } from '@/lib/types/membership'

/**
 * Booking flow for a tour — deliberately its own route (not /checkout, which
 * already handles the real Premium subscription upgrade — see that page).
 * No card number / CVV fields here: there's no payment processor wired up,
 * so asking for real card details would just be collecting sensitive data
 * with nowhere safe for it to go. Mirrors the same "this is a demo, no
 * money moves" disclosure already used on /checkout instead of pretending.
 */
export default function TourBookingPage() {
  const params = useParams()
  const tour = getTourById(params.id as string)

  const [step, setStep] = useState<'details' | 'confirmed'>('details')
  const [submitting, setSubmitting] = useState(false)
  const [selectedTier, setSelectedTier] = useState<MembershipTier>('free')
  const [confirmationCode, setConfirmationCode] = useState('')

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    participants: 1,
    date: '',
    specialRequests: '',
  })

  if (!tour) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4 text-slate-900 dark:text-white">Tour no encontrado</h1>
        <Link href="/explore">
          <Button>Volver a explorar</Button>
        </Link>
      </div>
    )
  }

  const discount = MEMBERSHIP_PLANS[selectedTier].benefits.discountPercentage
  const subtotal = tour.price * form.participants
  const discountAmount = Math.round((subtotal * discount) / 100)
  const total = subtotal - discountAmount

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    // No backend to actually persist this yet — same "demo checkout" pattern
    // as app/checkout/page.tsx. A short delay keeps the loading state honest
    // rather than snapping instantly.
    setTimeout(() => {
      setConfirmationCode(`VIALII-${Date.now().toString().slice(-8).toUpperCase()}`)
      setStep('confirmed')
      setSubmitting(false)
    }, 600)
  }

  if (step === 'confirmed') {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Card className="max-w-md w-full text-center">
          <CardBody className="py-10">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full mb-4">
              <CheckCircle size={32} className="text-green-600 dark:text-green-400" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">¡Reserva registrada!</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Esto es una demo de producto: nada fue cobrado y esta reserva no queda guardada en ningún sistema real todavía.
            </p>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-left text-sm space-y-1 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Código</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{confirmationCode}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Tour</span>
                <span className="text-slate-700 dark:text-slate-300">{tour.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Participantes</span>
                <span className="text-slate-700 dark:text-slate-300">{form.participants}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span className="text-slate-500 dark:text-slate-400">Total</span>
                <span className="text-slate-900 dark:text-slate-100">${total.toLocaleString('es-CL')} CLP</span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Link href="/dashboard">
                <Button fullWidth>Ir a mis viajes</Button>
              </Link>
              <Link href="/explore">
                <Button variant="secondary" fullWidth>
                  Explorar más tours
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <Link href={`/tours/${tour.id}`} className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 hover:underline mb-6 text-sm">
          <ArrowLeft size={16} />
          Volver al tour
        </Link>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* FORM */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Datos de la reserva</h1>
              </CardHeader>
              <CardBody>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      placeholder="Nombre"
                      value={form.firstName}
                      onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                      required
                      className="px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:border-cyan-500 focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                    <input
                      type="text"
                      placeholder="Apellido"
                      value={form.lastName}
                      onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                      required
                      className="px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:border-cyan-500 focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                    />
                  </div>

                  <input
                    type="email"
                    placeholder="Email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                    className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:border-cyan-500 focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                  />

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold mb-2 text-slate-900 dark:text-white">Fecha</label>
                      <input
                        type="date"
                        value={form.date}
                        onChange={(e) => setForm({ ...form, date: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                        required
                        className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:border-cyan-500 focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-2 text-slate-900 dark:text-white">Participantes</label>
                      <select
                        value={form.participants}
                        onChange={(e) => setForm({ ...form, participants: Number(e.target.value) })}
                        className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:border-cyan-500 focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
                      >
                        {Array.from({ length: Math.min(tour.groupSize, 8) }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>
                            {n} {n === 1 ? 'persona' : 'personas'}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold mb-2 text-slate-900 dark:text-white">Solicitudes especiales (opcional)</label>
                    <textarea
                      value={form.specialRequests}
                      onChange={(e) => setForm({ ...form, specialRequests: e.target.value })}
                      placeholder="Alergias, necesidades especiales, idioma preferido..."
                      className="w-full px-4 py-3 border-2 border-slate-200 dark:border-slate-700 rounded-lg focus:border-cyan-500 focus:outline-none bg-white dark:bg-slate-900 text-slate-900 dark:text-white h-24 resize-none"
                    />
                  </div>

                  <div className="pt-2">
                    <h3 className="text-base font-bold mb-3 text-slate-900 dark:text-white">🎁 Elige tu membresía</h3>
                    <div className="grid sm:grid-cols-2 gap-3">
                      {Object.values(MEMBERSHIP_PLANS).map((plan) => (
                        <button
                          key={plan.id}
                          type="button"
                          onClick={() => setSelectedTier(plan.id)}
                          className={`p-4 rounded-lg border-2 text-left transition-all ${
                            selectedTier === plan.id
                              ? `bg-gradient-to-br ${plan.color} text-white border-transparent`
                              : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white hover:border-slate-300'
                          }`}
                        >
                          <div className="text-lg mb-1">{plan.icon}</div>
                          <p className="font-bold text-sm">{plan.name}</p>
                          <p className="text-xs opacity-80">{plan.price === 0 ? 'Gratis' : `$${plan.price.toLocaleString('es-CL')}/mes`}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-start gap-2 rounded-lg bg-slate-100 dark:bg-slate-800/50 p-3 text-xs text-slate-500 dark:text-slate-400">
                    <ShieldCheck size={24} className="shrink-0 text-slate-400" />
                    <span>
                      Esta es una demo de producto: no se pide ni se procesa ningún dato de pago real, y no se realiza ningún cargo. Un botón
                      de confirmación simula la reserva.
                    </span>
                  </div>

                  <Button type="submit" size="lg" fullWidth isLoading={submitting} className="bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold">
                    {submitting ? 'Procesando...' : 'Confirmar reserva (demo)'}
                  </Button>
                </form>
              </CardBody>
            </Card>
          </div>

          {/* SUMMARY */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardBody>
                {tour.image && (
                  <div className="relative h-32 w-full mb-4 rounded-lg overflow-hidden">
                    <Image src={tour.image} alt={tour.name} fill sizes="400px" className="object-cover" />
                  </div>
                )}
                <h3 className="font-bold text-slate-900 dark:text-white mb-1">{tour.name}</h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                  {tour.city}, {tour.region}
                </p>

                <div className="space-y-2 text-sm border-t border-slate-200 dark:border-slate-800 pt-4">
                  <div className="flex justify-between text-slate-700 dark:text-slate-300">
                    <span>
                      {form.participants}x ${tour.price.toLocaleString('es-CL')}
                    </span>
                    <span>${subtotal.toLocaleString('es-CL')}</span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-600 dark:text-green-400">
                      <span>Descuento {discount}%</span>
                      <span>-${discountAmount.toLocaleString('es-CL')}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-base text-slate-900 dark:text-white pt-2 border-t border-slate-200 dark:border-slate-800">
                    <span>Total</span>
                    <span>${total.toLocaleString('es-CL')} CLP</span>
                  </div>
                </div>
              </CardBody>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
