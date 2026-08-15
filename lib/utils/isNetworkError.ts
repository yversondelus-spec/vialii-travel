/**
 * True when `error` looks like a transport-level failure (DNS/connection/fetch)
 * rather than a real API response (bad credentials, validation, etc).
 *
 * Used to fall back to the local auth/saved-trips stores only when Supabase
 * itself is unreachable — see `lib/auth/authContext.tsx`.
 *
 * Supabase's own error shapes (`AuthError`, `PostgrestError`) are NOT
 * `instanceof Error` — they're plain objects with a `message` string — so
 * this checks the message text rather than the error's prototype.
 */
export function isNetworkError(error: unknown): boolean {
  const message =
    error && typeof error === 'object' && 'message' in error
      ? String((error as { message: unknown }).message)
      : String(error)

  return /fetch|network|getaddrinfo|enotfound/i.test(message)
}
