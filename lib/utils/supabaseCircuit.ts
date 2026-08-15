/**
 * Tiny circuit breaker for the Supabase-first / localStorage-fallback pattern
 * used across lib/services and authContext.tsx.
 *
 * Without this, every call independently tries the real Supabase project
 * first and only falls back after its request fails — and with the fake
 * credentials in .env.local, that failure is a real DNS timeout (~7s), not
 * an instant rejection. A single user action that makes 2-3 such calls (e.g.
 * saving a trip: check the free-tier limit, then save) was compounding into
 * 10-15s of silent spinner. Once *any* call observes a network failure, this
 * flips the breaker so subsequent calls skip the real attempt entirely for a
 * while — then quietly retries in case connectivity (or real credentials)
 * shows up later.
 */

import { isNetworkError } from './isNetworkError'

const RETRY_AFTER_MS = 60_000

let unreachableUntil = 0

export function shouldTrySupabase(): boolean {
  return Date.now() > unreachableUntil
}

export function recordSupabaseNetworkFailure(): void {
  unreachableUntil = Date.now() + RETRY_AFTER_MS
}

export function recordSupabaseSuccess(): void {
  unreachableUntil = 0
}

/**
 * Runs `supabaseCall`, but only when the breaker is closed; skips straight
 * to `fallback` otherwise. A network-error result from `supabaseCall` opens
 * the breaker and falls back; any other error (bad request, RLS, etc) is
 * rethrown as-is so the caller's own error handling still applies.
 */
export async function withSupabaseFallback<T>(
  supabaseCall: () => Promise<T>,
  fallback: () => T | Promise<T>
): Promise<T> {
  if (!shouldTrySupabase()) return fallback()

  try {
    const result = await supabaseCall()
    recordSupabaseSuccess()
    return result
  } catch (err) {
    if (!isNetworkError(err)) throw err
    recordSupabaseNetworkFailure()
    return fallback()
  }
}
