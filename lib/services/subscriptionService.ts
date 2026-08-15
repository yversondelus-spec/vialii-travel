import { supabase } from '@/lib/db/client'
import { withSupabaseFallback } from '@/lib/utils/supabaseCircuit'
import { sendEmail, renderInvoiceEmail } from './emailService'
import { getSavedTrips } from './savedTripsService'
import { FREE_SAVED_TRIPS_LIMIT, PREMIUM_PRICE, PREMIUM_CURRENCY } from '@/lib/types/subscription'
import type { Subscription, Invoice } from '@/lib/types/subscription'

// Same Supabase-first / localStorage-fallback pattern as the rest of lib/services
// (see authContext.tsx for why). "Upgrading" never touches a real payment
// processor — see app/checkout/page.tsx — this just records the resulting
// tier + invoice.

const LOCAL_SUBS_KEY = 'travelai_subscriptions'
const LOCAL_INVOICES_KEY = 'travelai_invoices'

function readLocalSubs(): Record<string, Subscription> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(LOCAL_SUBS_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function writeLocalSubs(subs: Record<string, Subscription>) {
  localStorage.setItem(LOCAL_SUBS_KEY, JSON.stringify(subs))
}

function readLocalInvoices(): Invoice[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(LOCAL_INVOICES_KEY) ?? '[]')
  } catch {
    return []
  }
}

function writeLocalInvoices(invoices: Invoice[]) {
  localStorage.setItem(LOCAL_INVOICES_KEY, JSON.stringify(invoices))
}

export async function getSubscription(userId: string): Promise<Subscription> {
  // Read path: fall back to Free on ANY error, not just network ones.
  try {
    return await withSupabaseFallback(
      async () => {
        const { data, error } = await supabase.from('subscriptions').select('*').eq('user_id', userId).maybeSingle()
        if (error) throw error
        if (!data) return { userId, tier: 'free' as const }
        return { userId: data.user_id, tier: data.tier, upgradedAt: data.upgraded_at ?? undefined }
      },
      () => readLocalSubs()[userId] ?? { userId, tier: 'free' as const }
    )
  } catch {
    return { userId, tier: 'free' }
  }
}

export async function upgradeToPremium(userId: string, email: string): Promise<Invoice> {
  const now = new Date().toISOString()
  const invoice: Invoice = {
    id: crypto.randomUUID(),
    userId,
    plan: 'premium',
    amount: PREMIUM_PRICE,
    currency: PREMIUM_CURRENCY,
    issuedAt: now,
    status: 'paid',
  }

  await withSupabaseFallback(
    async () => {
      const { error: subError } = await supabase
        .from('subscriptions')
        .upsert([{ user_id: userId, tier: 'premium', upgraded_at: now }])
      if (subError) throw subError

      const { error: invError } = await supabase.from('invoices').insert([
        {
          id: invoice.id,
          user_id: userId,
          plan: invoice.plan,
          amount: invoice.amount,
          currency: invoice.currency,
          issued_at: invoice.issuedAt,
          status: invoice.status,
        },
      ])
      if (invError) throw invError
    },
    () => {
      const subs = readLocalSubs()
      subs[userId] = { userId, tier: 'premium', upgradedAt: now }
      writeLocalSubs(subs)
      writeLocalInvoices([invoice, ...readLocalInvoices()])
    }
  )

  const { subject, html } = renderInvoiceEmail(invoice)
  await sendEmail(email, 'invoice', subject, html)

  return invoice
}

export async function cancelPremium(userId: string): Promise<void> {
  return withSupabaseFallback(
    async () => {
      const { error } = await supabase
        .from('subscriptions')
        .upsert([{ user_id: userId, tier: 'free', upgraded_at: null }])
      if (error) throw error
    },
    () => {
      const subs = readLocalSubs()
      subs[userId] = { userId, tier: 'free' }
      writeLocalSubs(subs)
    }
  )
}

export async function getInvoices(userId: string): Promise<Invoice[]> {
  try {
    return await withSupabaseFallback(
      async () => {
        const { data, error } = await supabase
          .from('invoices')
          .select('*')
          .eq('user_id', userId)
          .order('issued_at', { ascending: false })
        if (error) throw error
        return (data ?? []).map(mapInvoiceRow)
      },
      () =>
        readLocalInvoices()
          .filter((i) => i.userId === userId)
          .sort((a, b) => (a.issuedAt < b.issuedAt ? 1 : -1))
    )
  } catch {
    return []
  }
}

/** All invoices, across users — for the admin revenue view. */
export async function getAllInvoices(): Promise<Invoice[]> {
  try {
    return await withSupabaseFallback(
      async () => {
        const { data, error } = await supabase.from('invoices').select('*').order('issued_at', { ascending: false })
        if (error) throw error
        return (data ?? []).map(mapInvoiceRow)
      },
      () => readLocalInvoices().sort((a, b) => (a.issuedAt < b.issuedAt ? 1 : -1))
    )
  } catch {
    return []
  }
}

interface InvoiceRow {
  id: string
  user_id: string
  plan: Invoice['plan']
  amount: number
  currency: string
  issued_at: string
  status: Invoice['status']
}

function mapInvoiceRow(row: InvoiceRow): Invoice {
  return {
    id: row.id,
    userId: row.user_id,
    plan: row.plan,
    amount: row.amount,
    currency: row.currency,
    issuedAt: row.issued_at,
    status: row.status,
  }
}

export async function canSaveMoreTrips(userId: string): Promise<boolean> {
  const [subscription, trips] = await Promise.all([getSubscription(userId), getSavedTrips(userId)])
  if (subscription.tier === 'premium') return true
  return trips.length < FREE_SAVED_TRIPS_LIMIT
}
