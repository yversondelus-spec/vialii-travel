import { getEnabledFlightProviders, type FlightProvider } from '../flights'
import { dedupeFlightOffers } from './dedupe'
import { rankFlightOffers, type RankedFlightOffer, type RankingPriority } from './rank'
import { InvalidSearchParamsError, isProviderError, type TravelEngineErrorCode } from '../core/errors'
import { getTravelEngineMode } from '../core/config'
import type { EngineSearchResult, FlightOffer, FlightSearchParams, ProviderFailure } from '../core/models'
import { logger } from '@/lib/logger'

export interface FlightSearchRequest extends FlightSearchParams {
  maxBudget?: number
  priority?: RankingPriority
}

export interface FlightSearchResponse extends EngineSearchResult<FlightOffer> {
  ranked: RankedFlightOffer[]
  recommended?: RankedFlightOffer
  /** Duplicate offers dropped during dedup, keyed by the kept offer's id — see dedupe.ts. */
  duplicateAlternatives: Record<string, FlightOffer[]>
  /**
   * Only set when `offers` is empty. Distinguishes "every provider
   * responded and genuinely had nothing" (`NO_RESULTS`) from "every
   * provider we queried failed" (`PROVIDER_ERROR`) — Fase 2 audit,
   * Caso 6/7: these read identically to a naive caller (`offers: []`)
   * without this. Reuses the same `TravelEngineErrorCode` vocabulary as
   * every other error in the engine (Fase 3) instead of a parallel string.
   * Still a `success: true` response either way — an empty result isn't
   * itself a request error. Combined with `mode`, this is what lets a
   * caller tell apart LIVE+SUCCESS / LIVE+NO_RESULTS / LIVE+PROVIDER_ERROR
   * / MOCK (Fase 3, Section 2).
   */
  resultCode?: Extract<TravelEngineErrorCode, 'NO_RESULTS' | 'PROVIDER_ERROR'>
}

function validateFlightSearch(request: FlightSearchRequest): void {
  if (!request.origin?.trim()) throw new InvalidSearchParamsError('origin is required')
  if (!request.destination?.trim()) throw new InvalidSearchParamsError('destination is required')
  if (!request.departureDate || Number.isNaN(Date.parse(request.departureDate))) {
    throw new InvalidSearchParamsError('departureDate must be a valid date')
  }
  if (request.returnDate && Number.isNaN(Date.parse(request.returnDate))) {
    throw new InvalidSearchParamsError('returnDate must be a valid date')
  }
  if (!request.passengers || request.passengers.adults < 1) {
    throw new InvalidSearchParamsError('at least one adult passenger is required')
  }
  if (!request.currency?.trim()) throw new InvalidSearchParamsError('currency is required')
}

/**
 * Central entry point for flight search (Section 8 — TravelSearchOrchestrator).
 * Validates input, decides which providers to call (via the config-driven
 * registry in flights/index.ts), runs them in parallel, tolerates individual
 * provider failures, normalizes (each adapter already did this), dedupes,
 * and ranks. Nothing about Duffel/Kiwi/Amadeus leaks past this class — API
 * routes and the AI layer only ever see `FlightSearchResponse`.
 *
 * `mock` is deliberately NOT part of that parallel fan-out. config.ts calls it
 * a "guaranteed fallback", but querying it alongside the real providers and
 * merging the results made demo flights compete with real Duffel offers in the
 * same ranking — and the demo ones won, because they advertise amenities the
 * score rewards ('Wifi', 'Food') that a real provider never attests to. It now
 * runs only when the real providers returned nothing, which is what "fallback"
 * meant in the first place.
 */
export class TravelSearchOrchestrator {
  async searchFlights(request: FlightSearchRequest): Promise<FlightSearchResponse> {
    validateFlightSearch(request)

    const start = Date.now()
    const allProviders = getEnabledFlightProviders()
    const realProviders = allProviders.filter((p) => p.id !== 'mock')
    const mockProvider = allProviders.find((p) => p.id === 'mock')

    const providersQueried: string[] = []
    const providersFailed: ProviderFailure[] = []
    const allOffers: FlightOffer[] = []

    const runProviders = async (providers: FlightProvider[]): Promise<void> => {
      if (providers.length === 0) return
      providersQueried.push(...providers.map((p) => p.id))

      const settled = await Promise.allSettled(providers.map((provider) => provider.searchFlights(request)))

      settled.forEach((result, index) => {
        const provider = providers[index]
        if (result.status === 'fulfilled') {
          allOffers.push(...result.value)
          return
        }

        const reason = result.reason
        const failure: ProviderFailure = {
          provider: provider.id,
          operation: 'searchFlights',
          errorCode: isProviderError(reason) ? reason.code : 'unknown_error',
          message: reason instanceof Error ? reason.message : String(reason),
        }
        providersFailed.push(failure)
        logger.warn('Flight provider failed during orchestrated search', { ...failure })
      })
    }

    await runProviders(realProviders)

    const usedMockFallback = allOffers.length === 0 && mockProvider !== undefined
    if (usedMockFallback) {
      logger.warn('No real flight provider returned offers — falling back to demo data', {
        realProvidersQueried: realProviders.map((p) => p.id),
        realProvidersFailed: providersFailed.map((f) => f.provider),
      })
      await runProviders([mockProvider])
    }

    const { offers: deduped, alternatives: duplicateAlternatives } = dedupeFlightOffers(allOffers)
    const ranked = rankFlightOffers(deduped, { maxBudget: request.maxBudget, priority: request.priority })

    let resultCode: FlightSearchResponse['resultCode']
    if (deduped.length === 0) {
      const allQueriedProvidersFailed = providersQueried.length > 0 && providersFailed.length === providersQueried.length
      resultCode = allQueriedProvidersFailed ? 'PROVIDER_ERROR' : 'NO_RESULTS'
    }

    return {
      offers: deduped,
      providersQueried,
      providersFailed,
      tookMs: Date.now() - start,
      cached: false,
      // Serving only demo data is `mock`, even when a real provider is
      // configured — reporting `live` alongside invented flights is exactly
      // the "datos simulados presentados como reales" this engine must avoid.
      mode: usedMockFallback ? 'mock' : getTravelEngineMode(),
      ranked,
      recommended: ranked[0],
      duplicateAlternatives,
      resultCode,
    }
  }
}