import type { TrainSearchParams, SearchResult } from './types'

export class MockTrainProvider {
  async search(params: TrainSearchParams): Promise<SearchResult[]> {
    await new Promise(resolve => setTimeout(resolve, 500))

    const results: SearchResult[] = []
    const basePrice = 80000 + Math.random() * 40000

    results.push({
      id: 'train-0',
      provider: 'EFE Tren Chile',
      type: 'train',
      departure: new Date(params.departDate.getTime() + 8 * 60 * 60 * 1000),
      arrival: new Date(params.departDate.getTime() + 16 * 60 * 60 * 1000),
      duration: 480,
      price: Math.round(basePrice),
      currency: params.currency,
      seats: Math.floor(Math.random() * 50) + 20,
      comfort: 8,
      stops: 3,
      direct: false,
      amenities: ['Dining Car', 'Observation Deck', 'Comfortable Seats', 'Scenic Views'],
      bookingUrl: 'https://www.efe.cl',
      raw: {}
    })

    return results
  }
}