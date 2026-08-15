import { supabase } from '@/lib/db/client'
import { withSupabaseFallback } from '@/lib/utils/supabaseCircuit'
import { getTrendingItems, type FeedItem } from '@/lib/services/feedService'
import type { NewsletterFrequency, NewsletterSubscriber } from '@/lib/types/newsletter'

// Same Supabase-first / localStorage-fallback pattern as the rest of
// lib/services. No real email provider is wired up (see emailService.ts) —
// this only manages the subscription record itself.
const LOCAL_KEY = 'travelai_newsletter_subscribers'

function readLocal(): NewsletterSubscriber[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]')
  } catch {
    return []
  }
}
function writeLocal(subs: NewsletterSubscriber[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(subs))
}

export async function subscribeEmail(email: string, frequency: NewsletterFrequency = 'weekly'): Promise<boolean> {
  const normalized = email.trim().toLowerCase()
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) return false

  const subscriber: NewsletterSubscriber = {
    id: crypto.randomUUID(),
    email: normalized,
    subscribedAt: new Date().toISOString(),
    frequency,
    active: true,
    unsubscribeToken: crypto.randomUUID(),
  }

  await withSupabaseFallback(
    async () => {
      // Re-subscribing with the same email flips it back to active instead of duplicating.
      const { error } = await supabase
        .from('newsletter_subscribers')
        .upsert(
          [
            {
              id: subscriber.id,
              email: subscriber.email,
              subscribed_at: subscriber.subscribedAt,
              frequency: subscriber.frequency,
              active: true,
              unsubscribe_token: subscriber.unsubscribeToken,
            },
          ],
          { onConflict: 'email' }
        )
      if (error) throw error
    },
    () => {
      const existing = readLocal().filter((s) => s.email !== normalized)
      writeLocal([subscriber, ...existing])
    }
  )

  return true
}

export async function unsubscribeEmail(emailOrToken: string): Promise<boolean> {
  const normalized = emailOrToken.trim().toLowerCase()

  return withSupabaseFallback(
    async () => {
      const { error } = await supabase
        .from('newsletter_subscribers')
        .update({ active: false })
        .or(`email.eq.${normalized},unsubscribe_token.eq.${emailOrToken}`)
      if (error) throw error
      return true
    },
    () => {
      const subs = readLocal()
      const idx = subs.findIndex((s) => s.email === normalized || s.unsubscribeToken === emailOrToken)
      if (idx === -1) return false
      subs[idx] = { ...subs[idx], active: false }
      writeLocal(subs)
      return true
    }
  )
}

export async function unsubscribeByToken(token: string): Promise<boolean> {
  return unsubscribeEmail(token)
}

/** Curated weekly picks for the newsletter preview — reuses the same trending pool as the home page. */
export async function getWeeklyTrips(): Promise<FeedItem[]> {
  return getTrendingItems(3)
}
