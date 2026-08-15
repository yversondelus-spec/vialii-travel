import { supabase } from '@/lib/db/client'
import { withSupabaseFallback } from '@/lib/utils/supabaseCircuit'
import { sendEmail, renderPriceAlertEmail } from './emailService'
import type { PriceAlert, PricePoint } from '@/lib/types/priceAlert'

// --- Deterministic mock price simulation --------------------------------
// No real fare-history data source exists, so price history/current price
// are generated from a seeded random walk keyed by the route name — stable
// across reloads for the same origin/destination, but different per route.

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0
  }
  return hash >>> 0
}

function mulberry32(seed: number) {
  let state = seed
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function getPriceHistory(origin: string, destination: string, days = 30): PricePoint[] {
  const routeKey = `${origin}→${destination}`.toLowerCase().trim()
  const rand = mulberry32(hashString(routeKey))
  let price = 40_000 + Math.floor(rand() * 80_000)

  const now = Date.now()
  return Array.from({ length: days }, (_, i) => {
    const dayIndex = days - 1 - i
    const delta = (rand() - 0.5) * 0.16 // +/-8% daily random walk
    price = Math.max(15_000, Math.round(price * (1 + delta)))
    return { date: new Date(now - dayIndex * 86_400_000).toISOString(), price }
  })
}

export function getCurrentPrice(origin: string, destination: string): number {
  const history = getPriceHistory(origin, destination)
  return history[history.length - 1].price
}

// --- Alerts CRUD (Supabase-first, localStorage fallback) ---------------

const LOCAL_ALERTS_KEY = 'travelai_price_alerts'

function readLocalAlerts(): PriceAlert[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(LOCAL_ALERTS_KEY) ?? '[]')
  } catch {
    return []
  }
}

function writeLocalAlerts(alerts: PriceAlert[]) {
  localStorage.setItem(LOCAL_ALERTS_KEY, JSON.stringify(alerts))
}

interface PriceAlertRow {
  id: string
  user_id: string
  origin: string
  destination: string
  max_price: number
  currency: string
  active: boolean
  created_at: string
  last_triggered_at: string | null
}

function mapAlertRow(row: PriceAlertRow): PriceAlert {
  return {
    id: row.id,
    userId: row.user_id,
    origin: row.origin,
    destination: row.destination,
    maxPrice: row.max_price,
    currency: row.currency,
    active: row.active,
    createdAt: row.created_at,
    lastTriggeredAt: row.last_triggered_at ?? undefined,
  }
}

export async function createAlert(
  userId: string,
  origin: string,
  destination: string,
  maxPrice: number
): Promise<PriceAlert> {
  const alert: PriceAlert = {
    id: crypto.randomUUID(),
    userId,
    origin,
    destination,
    maxPrice,
    currency: 'CLP',
    active: true,
    createdAt: new Date().toISOString(),
  }

  await withSupabaseFallback(
    async () => {
      const { error } = await supabase.from('price_alerts').insert([
        {
          id: alert.id,
          user_id: userId,
          origin,
          destination,
          max_price: maxPrice,
          currency: alert.currency,
          active: true,
          created_at: alert.createdAt,
        },
      ])
      if (error) throw error
    },
    () => {
      writeLocalAlerts([alert, ...readLocalAlerts()])
    }
  )

  return alert
}

export async function getUserAlerts(userId: string): Promise<PriceAlert[]> {
  try {
    return await withSupabaseFallback(
      async () => {
        const { data, error } = await supabase
          .from('price_alerts')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
        if (error) throw error
        return (data ?? []).map(mapAlertRow)
      },
      () =>
        readLocalAlerts()
          .filter((a) => a.userId === userId)
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    )
  } catch {
    return []
  }
}

export async function deleteAlert(userId: string, alertId: string): Promise<void> {
  return withSupabaseFallback(
    async () => {
      const { error } = await supabase.from('price_alerts').delete().eq('id', alertId).eq('user_id', userId)
      if (error) throw error
    },
    () => {
      writeLocalAlerts(readLocalAlerts().filter((a) => !(a.id === alertId && a.userId === userId)))
    }
  )
}

async function markTriggered(userId: string, alertId: string, triggeredAt: string): Promise<void> {
  try {
    await withSupabaseFallback(
      async () => {
        const { error } = await supabase
          .from('price_alerts')
          .update({ last_triggered_at: triggeredAt })
          .eq('id', alertId)
          .eq('user_id', userId)
        if (error) throw error
      },
      () => {
        writeLocalAlerts(
          readLocalAlerts().map((a) => (a.id === alertId ? { ...a, lastTriggeredAt: triggeredAt } : a))
        )
      }
    )
  } catch {
    // Best-effort — a failed "mark as triggered" shouldn't block the email that already sent.
  }
}

/**
 * Simulates a price check for a user's alerts against the mock price feed
 * above. Any alert whose route is now at/below its threshold "sends" a
 * price-drop email (see emailService.ts — recorded, not actually delivered).
 * In production this would run on a schedule; here it's a manual/demo trigger.
 */
export async function checkAlerts(userId: string, email: string): Promise<PriceAlert[]> {
  const alerts = await getUserAlerts(userId)
  const triggered: PriceAlert[] = []
  const now = new Date().toISOString()

  for (const alert of alerts) {
    if (!alert.active) continue
    const currentPrice = getCurrentPrice(alert.origin, alert.destination)
    if (currentPrice <= alert.maxPrice) {
      triggered.push({ ...alert, lastTriggeredAt: now })
      const { subject, html } = renderPriceAlertEmail(alert, currentPrice)
      await sendEmail(email, 'price_alert', subject, html)
      await markTriggered(userId, alert.id, now)
    }
  }

  return triggered
}
