/**
 * Agregador de transporte para /api/search.
 *
 * Los vuelos ahora vienen del VIALII Travel Engine (Duffel real cuando está
 * configurado, mock si no) en lugar de RealFlightProvider/RapidAPI. Bus y
 * tren siguen siendo mocks: no hay proveedor real integrado para ellos.
 *
 * El pipeline aguas abajo (DecisionEngine, /api/search, la UI) no cambia:
 * sigue recibiendo `SearchResult[]`. El puente vive en `toSearchResult.ts`.
 */
import { MockBusProvider } from './busProvider'
import { MockTrainProvider } from './trainProvider'
import { TravelSearchOrchestrator } from '@/lib/travel-engine/orchestrator/TravelSearchOrchestrator'
import { ExchangeRateCurrencyProvider } from '@/lib/travel-engine/currency/ExchangeRateCurrencyProvider'
import { resolveIata } from '@/lib/travel-engine/core/airports'
import { flightOffersToSearchResults } from '@/lib/travel-engine/flights/toSearchResult'
import { logger } from '@/lib/logger'
import type { SearchResult } from './types'
import type { SearchQuery } from '@/lib/types/domain'

const TARGET_CURRENCY = 'CLP'

export class TransportAggregator {
  private orchestrator = new TravelSearchOrchestrator()
  private currency = new ExchangeRateCurrencyProvider()
  private busProvider = new MockBusProvider()
  private trainProvider = new MockTrainProvider()

  async searchAll(query: SearchQuery): Promise<SearchResult[]> {
    const [flights, buses, trains] = await Promise.all([
      this.searchFlights(query),
      this.searchGround(query, this.busProvider),
      this.searchGround(query, this.trainProvider),
    ])

    return [...flights, ...buses, ...trains]
  }

  /**
   * Devuelve [] en vez de lanzar: si los vuelos fallan, la búsqueda todavía
   * puede ofrecer bus/tren en lugar de romperse entera.
   */
  private async searchFlights(query: SearchQuery): Promise<SearchResult[]> {
    const origin = resolveIata(query.origin)
    const destination = resolveIata(query.destination)

    // Ciudad sin aeropuerto conocido: no se ofrecen vuelos. Antes esto caía
    // silenciosamente a 'SCL' y devolvía una ruta que nadie pidió.
    if (!origin || !destination) {
      logger.debug('Vuelos omitidos: no se pudo resolver el aeropuerto', {
        origin: query.origin,
        destination: query.destination,
        resolvedOrigin: origin,
        resolvedDestination: destination,
      })
      return []
    }

    if (origin === destination) {
      logger.debug('Vuelos omitidos: origen y destino comparten aeropuerto', { origin })
      return []
    }

    try {
      const departureDate = new Date(query.travel_date).toISOString().split('T')[0]

      const result = await this.orchestrator.searchFlights({
        origin,
        destination,
        departureDate,
        passengers: { adults: query.num_passengers },
        cabinClass: 'economy',
        currency: TARGET_CURRENCY,
      })

      if (result.offers.length === 0) {
        logger.debug('El engine no devolvió vuelos', {
          origin,
          destination,
          mode: result.mode,
          resultCode: result.resultCode,
        })
        return []
      }

      const rate = await this.rateTo(result.offers[0].currency)

      logger.debug('Vuelos obtenidos del Travel Engine', {
        origin,
        destination,
        count: result.offers.length,
        mode: result.mode,
      })

      return flightOffersToSearchResults(result.offers, {
        rate,
        targetCurrency: TARGET_CURRENCY,
      })
    } catch (error) {
      logger.error('Búsqueda de vuelos falló en el Travel Engine', {
        message: error instanceof Error ? error.message : String(error),
      })
      return []
    }
  }

  /**
   * Una sola conversión por búsqueda, no una por oferta. Si Duffel ya cotizó
   * en la moneda destino, no se convierte nada.
   */
  private async rateTo(from: string): Promise<number> {
    if (from === TARGET_CURRENCY) return 1
    const quote = await this.currency.convertCurrency(1, from, TARGET_CURRENCY)
    return quote.rate
  }

  private async searchGround(
    query: SearchQuery,
    provider: MockBusProvider | MockTrainProvider
  ): Promise<SearchResult[]> {
    try {
      return await provider.search({
        origin: query.origin,
        destination: query.destination,
        departDate: query.travel_date,
        passengers: query.num_passengers,
        currency: TARGET_CURRENCY,
      })
    } catch (error) {
      logger.error('Búsqueda terrestre falló', {
        message: error instanceof Error ? error.message : String(error),
      })
      return []
    }
  }
}