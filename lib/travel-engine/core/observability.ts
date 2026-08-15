/**
 * Structured provider-call observability (Section 17) + a place for
 * per-operation cost to be attached (Section 18). No external monitoring
 * service is wired in — same "one seam now, real sink later" pattern as
 * lib/logger.ts, which this reuses for actual output. When a real metrics
 * backend exists, replace `recordProviderCall`'s body with a call to it;
 * nothing calling `timedProviderCall` needs to change.
 */

import { logger } from '@/lib/logger'
import { isProviderError } from './errors'
import type { ProviderVertical } from './models'

export interface ProviderCost {
  amount: number
  currency: string
  operationType: 'search' | 'price' | 'order' | 'cancel' | 'other'
}

export interface ProviderCallRecord {
  provider: string
  vertical: ProviderVertical
  operation: string
  tookMs: number
  success: boolean
  errorCode?: string
  resultCount?: number
  cost?: ProviderCost
  timestamp: string
}

const MAX_RECORDS = 500
const recentCalls: ProviderCallRecord[] = []

export function recordProviderCall(record: Omit<ProviderCallRecord, 'timestamp'>): void {
  const entry: ProviderCallRecord = { ...record, timestamp: new Date().toISOString() }
  recentCalls.push(entry)
  if (recentCalls.length > MAX_RECORDS) recentCalls.shift()

  const message = `[travel-engine] ${entry.provider}.${entry.operation} (${entry.vertical}) — ${entry.tookMs}ms`
  if (entry.success) {
    logger.debug(message, { resultCount: entry.resultCount, cost: entry.cost })
  } else {
    logger.warn(message, { errorCode: entry.errorCode })
  }
}

/** In-memory only — good enough for local dashboards/debugging today; swap for a real store once search volume justifies it (Section 17/18). */
export function getRecentProviderCalls(): ProviderCallRecord[] {
  return [...recentCalls]
}

/** Aggregate view matching the exact question Section 17 asks for: "Duffel recibió N búsquedas y generó M reservas". */
export function summarizeProviderCalls(): Record<string, { calls: number; successes: number; failures: number; orders: number; avgMs: number }> {
  const summary: Record<string, { calls: number; successes: number; failures: number; orders: number; totalMs: number }> = {}

  for (const call of recentCalls) {
    const entry = summary[call.provider] ?? { calls: 0, successes: 0, failures: 0, orders: 0, totalMs: 0 }
    entry.calls += 1
    entry.totalMs += call.tookMs
    if (call.success) entry.successes += 1
    else entry.failures += 1
    if (call.success && call.operation === 'createOrder') entry.orders += 1
    summary[call.provider] = entry
  }

  const result: Record<string, { calls: number; successes: number; failures: number; orders: number; avgMs: number }> = {}
  for (const [provider, entry] of Object.entries(summary)) {
    result[provider] = { calls: entry.calls, successes: entry.successes, failures: entry.failures, orders: entry.orders, avgMs: Math.round(entry.totalMs / entry.calls) }
  }
  return result
}

/** Wraps a single provider call with timing + success/failure recording. Every adapter method should go through this. */
export async function timedProviderCall<T>(
  params: { provider: string; vertical: ProviderVertical; operation: string },
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now()
  try {
    const result = await fn()
    recordProviderCall({
      ...params,
      tookMs: Date.now() - start,
      success: true,
      resultCount: Array.isArray(result) ? result.length : undefined,
    })
    return result
  } catch (error) {
    recordProviderCall({
      ...params,
      tookMs: Date.now() - start,
      success: false,
      errorCode: isProviderError(error) ? error.code : 'unknown_error',
    })
    throw error
  }
}
