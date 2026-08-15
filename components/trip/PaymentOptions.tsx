'use client'

import { useEffect, useState } from 'react'
import { CreditCard, ExternalLink, CalendarClock, ShieldCheck, Check } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { getPaymentPlan, markAllPaid, markComponentPaid, startInstallmentPlan } from '@/lib/services/modularPaymentService'
import { providersFor } from '@/lib/services/bookingIntegrationService'
import type { PaymentPlan } from '@/lib/types/modularPayment'
import type { CompleteTrip } from '@/lib/types/trip'
import { cn } from '@/lib/utils/cn'

interface PaymentOptionsProps {
  trip: CompleteTrip
  tripId: string
  destination: string
}

function formatCLP(value: number) {
  return `$${Math.round(value).toLocaleString('es-CL')}`
}

const COMPONENT_LABEL = { transport: '✈️ Transporte', accommodation: '🏨 Hospedaje', activities: '🎭 Tours' } as const

export default function PaymentOptions({ trip, tripId, destination }: PaymentOptionsProps) {
  const [plan, setPlan] = useState<PaymentPlan | null>(null)
  const [busy, setBusy] = useState(false)
  const [componentMode, setComponentMode] = useState(false)

  useEffect(() => {
    let cancelled = false
    getPaymentPlan(tripId, trip).then((result) => {
      if (!cancelled) setPlan(result)
    })
    return () => {
      cancelled = true
    }
  }, [tripId, trip])

  const handlePayAll = async () => {
    setBusy(true)
    setPlan(await markAllPaid(tripId, trip))
    setBusy(false)
  }

  const handlePayComponent = async (component: 'transport' | 'accommodation' | 'activities', providerType: 'transport' | 'accommodation' | 'activity') => {
    const provider = providersFor(providerType)[0]
    window.open(provider.buildSearchUrl({ destination }), '_blank', 'noopener,noreferrer')
    setBusy(true)
    setPlan(await markComponentPaid(tripId, trip, component))
    setBusy(false)
  }

  const handleInstallments = async () => {
    setBusy(true)
    setPlan(await startInstallmentPlan(tripId, trip))
    setBusy(false)
  }

  if (!plan) return <div className="h-24 rounded-xl bg-slate-100 dark:bg-slate-800 animate-pulse" />

  const fullyPaid = plan.remaining <= 0

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-xs text-slate-500 dark:text-slate-400">
        <ShieldCheck size={24} className="shrink-0 text-slate-400" />
        <span>
          Este es un flujo de pago de <strong>demostración</strong>: no se procesa ningún dato de pago real. Al pagar por
          componente serás redirigido al sitio real del proveedor para completar esa reserva ahí.
        </span>
      </div>

      {fullyPaid ? (
        <div className="rounded-xl border-2 border-emerald-400 dark:border-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 p-4 text-center">
          <Check className="mx-auto mb-1 text-emerald-500" size={24} />
          <p className="font-semibold text-emerald-700 dark:text-emerald-300">Viaje pagado por completo</p>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between text-sm">
            <span className="text-slate-500 dark:text-slate-400">Pagado</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">
              {formatCLP(plan.totalPaid)} / {formatCLP(plan.totalPrice)}
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-500 transition-all"
              style={{ width: `${Math.min(100, Math.round((plan.totalPaid / plan.totalPrice) * 100))}%` }}
            />
          </div>

          {!componentMode ? (
            <div className="grid grid-cols-1 gap-2">
              <Button fullWidth isLoading={busy} onClick={handlePayAll}>
                <CreditCard size={16} className="mr-1.5" /> Pagar todo ahora ({formatCLP(plan.remaining)})
              </Button>
              <Button variant="secondary" fullWidth onClick={() => setComponentMode(true)}>
                Pagar por componente
              </Button>
              <Button variant="outline" fullWidth isLoading={busy} onClick={handleInstallments}>
                <CalendarClock size={16} className="mr-1.5" /> Cuotas mensuales (3x {formatCLP(Math.ceil(plan.totalPrice / 3))})
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {(['transport', 'accommodation', 'activities'] as const).map((component) => {
                const status = plan[component]
                const providerType = component === 'transport' ? 'transport' : component === 'accommodation' ? 'accommodation' : 'activity'
                return (
                  <div key={component} className="flex items-center justify-between rounded-xl border border-slate-200 dark:border-slate-800 px-3.5 py-2.5">
                    <div>
                      <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{COMPONENT_LABEL[component]}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{formatCLP(status.price)}</p>
                    </div>
                    {status.status === 'paid' ? (
                      <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        <Check size={13} /> Pagado
                      </span>
                    ) : (
                      <Button size="sm" isLoading={busy} onClick={() => handlePayComponent(component, providerType)}>
                        <ExternalLink size={13} className="mr-1" /> Pagar
                      </Button>
                    )}
                  </div>
                )
              })}
              <button type="button" onClick={() => setComponentMode(false)} className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                ← Volver a opciones de pago
              </button>
            </div>
          )}

          {plan.installments && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-sm">
              {plan.installments.map((inst, idx) => (
                <div key={idx} className="flex items-center justify-between px-3.5 py-2">
                  <span className="text-slate-600 dark:text-slate-400">
                    Cuota {idx + 1} — {new Date(inst.dueDate).toLocaleDateString('es-CL', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                  <span className={cn('font-semibold', inst.status === 'paid' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-900 dark:text-slate-100')}>
                    {formatCLP(inst.amount)} {inst.status === 'paid' && '✓'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
