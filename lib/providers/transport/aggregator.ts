import { RealFlightProvider } from './realFlightProvider'
import { MockBusProvider } from './busProvider'
import { MockTrainProvider } from './trainProvider'
import { logger } from '@/lib/logger'
import type { SearchResult } from './types'
import type { SearchQuery } from '@/lib/types/domain'

export class TransportAggregator {
  private flightProvider = new RealFlightProvider()
  private busProvider = new MockBusProvider()
  private trainProvider = new MockTrainProvider()

  async searchAll(query: SearchQuery): Promise<SearchResult[]> {
    try {
      const [flights, buses, trains] = await Promise.all([
        this.flightProvider.search({
          origin: query.origin,
          destination: query.destination,
          departDate: query.travel_date,
          passengers: query.num_passengers,
          currency: 'CLP'
        }),
        this.busProvider.search({
          origin: query.origin,
          destination: query.destination,
          departDate: query.travel_date,
          passengers: query.num_passengers,
          currency: 'CLP'
        }),
        this.trainProvider.search({
          origin: query.origin,
          destination: query.destination,
          departDate: query.travel_date,
          passengers: query.num_passengers,
          currency: 'CLP'
        })
      ])

      const allResults = [...flights, ...buses, ...trains]
      return allResults.sort((a, b) => a.price - b.price)
    } catch (error) {
      logger.error('Transport search failed', { message: error instanceof Error ? error.message : String(error) })
      return []
    }
  }
}
