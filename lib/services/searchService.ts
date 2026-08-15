import { TransportAggregator } from '@/lib/providers/transport/aggregator'
import { DecisionEngine } from '@/lib/providers/comparison/decisionEngine'
import { logger } from '@/lib/logger'
import type { SearchQuery } from '@/lib/types/domain'
import type { SearchComparisonResult } from '@/lib/types/search'

export class SearchService {
  private aggregator = new TransportAggregator()
  private decisionEngine = new DecisionEngine()

  async search(query: SearchQuery): Promise<SearchComparisonResult> {
    logger.debug('Buscando opciones de transporte', { origin: query.origin, destination: query.destination })
    const options = await this.aggregator.searchAll(query)

    if (options.length === 0) {
      throw new Error('No se encontraron opciones de transporte')
    }

    logger.debug('Generando recomendación con IA', { optionCount: options.length })
    const comparison = await this.decisionEngine.generateRecommendation(query, options)

    // TODO: Habilitar cuando Supabase esté configurado
    // await saveSearchCache(...)
    // await logSearchAnalytic(...)

    return comparison
  }
}