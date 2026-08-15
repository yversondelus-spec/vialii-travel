/**
 * Retries `fn` once, after a short delay, when it rejects with something
 * `isRetryable` recognizes as transient. Deliberately not a generic
 * exponential-backoff library — a flight search is a single user-facing
 * request; a provider that's genuinely down should fail fast so the
 * orchestrator can move on to the next provider, not have this adapter
 * alone block for several attempts. One retry catches the common transient
 * case (a blip, a slow cold start) without meaningfully slowing everything
 * else down.
 */
export async function withSingleRetry<T>(fn: () => Promise<T>, isRetryable: (error: unknown) => boolean, delayMs = 500): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (!isRetryable(error)) throw error
    await new Promise((resolve) => setTimeout(resolve, delayMs))
    return fn()
  }
}
