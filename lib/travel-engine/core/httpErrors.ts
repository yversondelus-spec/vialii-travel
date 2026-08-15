import {
  InvalidSearchParamsError,
  ProviderAuthenticationError,
  ProviderConfigError,
  ProviderError,
  ProviderRateLimitError,
  ProviderTimeoutError,
  ProviderUnsupportedOperationError,
} from './errors'
import { logger } from '@/lib/logger'

/**
 * Shared translation from a travel-engine error to an HTTP response, used
 * by every `app/api/flights|hotels|activities/*` route so each one doesn't
 * reinvent this switch. Keeps provider-specific error detail server-side
 * (logged) and returns a clean, provider-agnostic message PLUS a typed
 * `code` (`TravelEngineErrorCode`) the client can branch on (Section 21 +
 * Fase 2 audit Section 12 — no raw provider errors, no code-less errors).
 */
export function providerErrorResponse(error: unknown, fallbackMessage: string): Response {
  if (error instanceof InvalidSearchParamsError) {
    return Response.json({ success: false, error: error.message, code: error.code }, { status: 400 })
  }

  if (error instanceof ProviderUnsupportedOperationError) {
    return Response.json({ success: false, error: 'This provider does not support this operation yet.', code: error.code }, { status: 501 })
  }

  if (error instanceof ProviderConfigError) {
    return Response.json({ success: false, error: 'This provider is not configured yet.', code: error.code }, { status: 503 })
  }

  if (error instanceof ProviderAuthenticationError) {
    // Deliberately vague to the client (never confirm/deny "the key is bad"
    // beyond this) — the actionable detail (provider, operation, status) is
    // logged server-side only.
    logger.error('Provider rejected credentials', { provider: error.provider, operation: error.operation, httpStatus: error.httpStatus })
    return Response.json({ success: false, error: 'This provider is temporarily unavailable.', code: error.code }, { status: 502 })
  }

  if (error instanceof ProviderRateLimitError) {
    const headers = error.retryAfterSeconds ? { 'Retry-After': String(error.retryAfterSeconds) } : undefined
    return Response.json(
      { success: false, error: 'The provider is rate limiting requests, try again shortly.', code: error.code, retryAfterSeconds: error.retryAfterSeconds },
      { status: 429, headers }
    )
  }

  if (error instanceof ProviderTimeoutError) {
    return Response.json({ success: false, error: 'The provider took too long to respond.', code: error.code }, { status: 504 })
  }

  if (error instanceof ProviderError) {
    logger.error('Provider error in travel-engine route', { provider: error.provider, operation: error.operation, code: error.code, httpStatus: error.httpStatus, message: error.message })
    return Response.json({ success: false, error: fallbackMessage, code: error.code }, { status: 502 })
  }

  logger.error('Unexpected error in travel-engine route', { message: error instanceof Error ? error.message : String(error) })
  return Response.json({ success: false, error: fallbackMessage, code: 'INTERNAL_ERROR' }, { status: 500 })
}
