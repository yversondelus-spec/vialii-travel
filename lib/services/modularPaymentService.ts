import { supabase } from '@/lib/db/client'
import { withSupabaseFallback } from '@/lib/utils/supabaseCircuit'
import type { PaymentPlan, Installment } from '@/lib/types/modularPayment'
import type { CompleteTrip } from '@/lib/types/trip'

// Same "never touches a real payment processor" pattern as
// subscriptionService.ts / app/checkout/page.tsx (see that file's own
// disclosure text) — this only records which of the 3 payment paths the
// user chose and tracks status, it doesn't charge anything or talk to Stripe.

const LOCAL_KEY = 'travelai_payment_plans'
const INSTALLMENT_COUNT = 3
const INSTALLMENT_INTERVAL_DAYS = 30

function readLocal(): Record<string, PaymentPlan> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '{}')
  } catch {
    return {}
  }
}
function writeLocal(plans: Record<string, PaymentPlan>) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(plans))
}

function buildInitialPlan(tripId: string, trip: CompleteTrip): PaymentPlan {
  return {
    tripId,
    mode: 'unpaid',
    transport: { price: trip.costBreakdown.transport, paid: 0, status: 'unpaid' },
    accommodation: { price: trip.costBreakdown.hotel, paid: 0, status: 'unpaid' },
    activities: { price: trip.costBreakdown.activities, paid: 0, status: 'unpaid' },
    totalPrice: trip.costBreakdown.total,
    totalPaid: 0,
    remaining: trip.costBreakdown.total,
    updatedAt: new Date().toISOString(),
  }
}

interface PaymentPlanRow {
  trip_id: string
  mode: PaymentPlan['mode']
  transport: PaymentPlan['transport']
  accommodation: PaymentPlan['accommodation']
  activities: PaymentPlan['activities']
  installments?: PaymentPlan['installments']
  total_price: number
  total_paid: number
  remaining: number
  updated_at: string
}

function rowToPlan(row: PaymentPlanRow): PaymentPlan {
  return {
    tripId: row.trip_id,
    mode: row.mode,
    transport: row.transport,
    accommodation: row.accommodation,
    activities: row.activities,
    installments: row.installments ?? undefined,
    totalPrice: row.total_price,
    totalPaid: row.total_paid,
    remaining: row.remaining,
    updatedAt: row.updated_at,
  }
}

function planToRow(plan: PaymentPlan) {
  return {
    trip_id: plan.tripId,
    mode: plan.mode,
    transport: plan.transport,
    accommodation: plan.accommodation,
    activities: plan.activities,
    installments: plan.installments ?? null,
    total_price: plan.totalPrice,
    total_paid: plan.totalPaid,
    remaining: plan.remaining,
    updated_at: plan.updatedAt,
  }
}

export async function getPaymentPlan(tripId: string, trip: CompleteTrip): Promise<PaymentPlan> {
  try {
    return await withSupabaseFallback(
      async () => {
        const { data, error } = await supabase.from('payment_plans').select('*').eq('trip_id', tripId).maybeSingle()
        if (error) throw error
        return data ? rowToPlan(data) : buildInitialPlan(tripId, trip)
      },
      () => readLocal()[tripId] ?? buildInitialPlan(tripId, trip)
    )
  } catch {
    return buildInitialPlan(tripId, trip)
  }
}

async function savePlan(plan: PaymentPlan): Promise<void> {
  await withSupabaseFallback(
    async () => {
      const { error } = await supabase.from('payment_plans').upsert([planToRow(plan)])
      if (error) throw error
    },
    () => {
      const plans = readLocal()
      plans[plan.tripId] = plan
      writeLocal(plans)
    }
  )
}

function recompute(plan: PaymentPlan): PaymentPlan {
  const totalPaid = plan.transport.paid + plan.accommodation.paid + plan.activities.paid
  return { ...plan, totalPaid, remaining: plan.totalPrice - totalPaid, updatedAt: new Date().toISOString() }
}

/** "Pagar todo ahora" — marks every component paid in one action (demo confirmation, no real charge). */
export async function markAllPaid(tripId: string, trip: CompleteTrip): Promise<PaymentPlan> {
  const plan = await getPaymentPlan(tripId, trip)
  plan.transport = { ...plan.transport, paid: plan.transport.price, status: 'paid' }
  plan.accommodation = { ...plan.accommodation, paid: plan.accommodation.price, status: 'paid' }
  plan.activities = { ...plan.activities, paid: plan.activities.price, status: 'paid' }
  plan.mode = 'pay_all'
  const updated = recompute(plan)
  await savePlan(updated)
  return updated
}

/** "Pagar por componente" — one component at a time, each redirecting to its own provider (see bookingIntegrationService.ts); this just records that the user completed that leg. */
export async function markComponentPaid(
  tripId: string,
  trip: CompleteTrip,
  component: 'transport' | 'accommodation' | 'activities'
): Promise<PaymentPlan> {
  const plan = await getPaymentPlan(tripId, trip)
  plan[component] = { ...plan[component], paid: plan[component].price, status: 'paid' }
  plan.mode = 'pay_by_component'
  const updated = recompute(plan)
  await savePlan(updated)
  return updated
}

/** "Cuotas mensuales" — splits the total into N installments; the demo marks the first as paid immediately (matching the "pay today" moment) and the rest as pending, spaced a month apart. */
export async function startInstallmentPlan(tripId: string, trip: CompleteTrip, numInstallments = INSTALLMENT_COUNT): Promise<PaymentPlan> {
  const plan = await getPaymentPlan(tripId, trip)
  const amount = Math.ceil(plan.totalPrice / numInstallments)
  const now = Date.now()

  const installments: Installment[] = Array.from({ length: numInstallments }, (_, i) => ({
    amount,
    dueDate: new Date(now + (i + 1) * INSTALLMENT_INTERVAL_DAYS * 86_400_000).toISOString(),
    status: i === 0 ? 'paid' : 'pending',
  }))

  plan.mode = 'installments'
  plan.installments = installments
  plan.transport = { ...plan.transport, status: 'partial' }
  plan.accommodation = { ...plan.accommodation, status: 'partial' }
  plan.activities = { ...plan.activities, status: 'partial' }

  const updated: PaymentPlan = {
    ...plan,
    totalPaid: amount,
    remaining: plan.totalPrice - amount,
    updatedAt: new Date().toISOString(),
  }
  await savePlan(updated)
  return updated
}
