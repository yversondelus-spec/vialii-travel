/**
 * Error types every provider adapter throws instead of leaking whatever
 * shape the underlying HTTP client/SDK produced. The orchestrator and API
 * routes only ever need to branch on these, never on a provider's own error
 * format — that's the whole point of the adapter boundary.
 *
 * `code` is a `TravelEngineErrorCode` — a small, closed set every API route
 * echoes back in its JSON body (`{ success: false, error, code }`) so a
 * frontend can branch on it programmatically instead of parsing the human
 * message. Provider-specific detail (HTTP status, raw message) stays in
 * `httpStatus`/`message`/server logs, never folded into `code` itself.
 */

/**
 * Every category a travel-engine error response can carry. Kept deliberately
 * small — see Fase 2 audit, Section 12, extended in Fase 3 (Section 11) for
 * the offer/order lifecycle. `VALIDATION_ERROR` already covers what Fase 3's
 * brief calls "INVALID_REQUEST" — reused rather than duplicated, per its own
 * "si ya existen, utilízalos" instruction.
 */
export type TravelEngineErrorCode =
  | 'VALIDATION_ERROR'
  | 'PROVIDER_ERROR'
  | 'PROVIDER_TIMEOUT'
  | 'RATE_LIMIT'
  | 'AUTHENTICATION_ERROR'
  | 'PROVIDER_NOT_CONFIGURED'
  | 'PROVIDER_UNSUPPORTED'
  | 'NO_RESULTS'
  | 'OFFER_NOT_FOUND'
  | 'OFFER_EXPIRED'
  | 'ORDER_CREATION_FAILED'
  | 'ORDER_NOT_FOUND'
  | 'ORDER_CANCELLATION_FAILED'
  | 'INTERNAL_ERROR'

export class ProviderError extends Error {
  readonly provider: string
  readonly operation: string
  readonly code: TravelEngineErrorCode
  /** The provider's raw HTTP status, when this came from an HTTP call — used to decide retryability and for logging, never surfaced to the client as-is. */
  readonly httpStatus?: number
  /**
   * The original error this wraps, when there is one. Not using Error's
   * built-in `cause` (ES2022) since this project's `tsconfig.json` targets
   * ES2020 — a plain own property gives the same debugging value without
   * requiring a `lib`/`target` bump for the rest of the codebase.
   */
  readonly cause?: unknown

  constructor(message: string, params: { provider: string; operation: string; code?: TravelEngineErrorCode; httpStatus?: number; cause?: unknown }) {
    super(message)
    this.name = 'ProviderError'
    this.provider = params.provider
    this.operation = params.operation
    this.code = params.code ?? 'PROVIDER_ERROR'
    this.httpStatus = params.httpStatus
    this.cause = params.cause
  }
}

export class ProviderConfigError extends ProviderError {
  constructor(provider: string, operation: string, message = 'Provider is not configured') {
    super(message, { provider, operation, code: 'PROVIDER_NOT_CONFIGURED' })
    this.name = 'ProviderConfigError'
  }
}

export class ProviderTimeoutError extends ProviderError {
  constructor(provider: string, operation: string, timeoutMs: number) {
    super(`${provider} timed out after ${timeoutMs}ms during ${operation}`, { provider, operation, code: 'PROVIDER_TIMEOUT' })
    this.name = 'ProviderTimeoutError'
  }
}

export class ProviderRateLimitError extends ProviderError {
  readonly retryAfterSeconds?: number

  constructor(provider: string, operation: string, retryAfterSeconds?: number) {
    super(`${provider} rate limited this request${retryAfterSeconds ? ` (retry after ${retryAfterSeconds}s)` : ''}`, {
      provider,
      operation,
      code: 'RATE_LIMIT',
      httpStatus: 429,
    })
    this.name = 'ProviderRateLimitError'
    this.retryAfterSeconds = retryAfterSeconds
  }
}

/** A provider rejected our credentials (401/403) — distinct from a generic `ProviderError` so callers/logs can tell "misconfigured key" apart from "provider is having a bad day". */
export class ProviderAuthenticationError extends ProviderError {
  constructor(provider: string, operation: string, httpStatus?: number) {
    super(`${provider} rejected the configured credentials during ${operation}`, { provider, operation, code: 'AUTHENTICATION_ERROR', httpStatus })
    this.name = 'ProviderAuthenticationError'
  }
}

/** Thrown by adapters for capabilities their provider genuinely doesn't offer (e.g. Kiwi/mock have no order API) — a 501, not a bug. */
export class ProviderUnsupportedOperationError extends ProviderError {
  constructor(provider: string, operation: string) {
    super(`${provider} does not support "${operation}"`, { provider, operation, code: 'PROVIDER_UNSUPPORTED' })
    this.name = 'ProviderUnsupportedOperationError'
  }
}

export function isProviderError(err: unknown): err is ProviderError {
  return err instanceof ProviderError
}

/** Thrown by the orchestrator (not a provider) when the caller's search params fail basic validation — API routes turn this into a 400, not a 502. */
export class InvalidSearchParamsError extends Error {
  readonly code: TravelEngineErrorCode = 'VALIDATION_ERROR'

  constructor(message: string) {
    super(message)
    this.name = 'InvalidSearchParamsError'
  }
}
