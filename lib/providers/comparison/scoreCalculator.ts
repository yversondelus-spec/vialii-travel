import type { SearchResult } from '@/lib/providers/transport/types'
import type { OptionScore, UserPreferences } from '@/lib/types/domain'

export class ScoreCalculator {
  calculateScores(
    options: SearchResult[],
    preferences?: UserPreferences,
    maxBudget?: number
  ): OptionScore[] {
    return options.map(option => this.scoreOption(option, preferences, maxBudget))
  }

  private scoreOption(
    option: SearchResult,
    preferences?: UserPreferences,
    maxBudget?: number
  ): OptionScore {
    const priceScore = this.calculatePriceScore(option.price, maxBudget)
    const timeScore = this.calculateTimeScore(option.duration)
    const comfortScore = Math.min(10, option.comfort)
    const reliabilityScore = this.calculateReliabilityScore(option.type, option.direct, option.stops)
    const experienceScore = this.calculateExperienceScore(option.amenities, option.type)

    const weights = this.getWeights(preferences)
    const finalScore =
      priceScore * weights.price +
      timeScore * weights.time +
      comfortScore * weights.comfort +
      reliabilityScore * weights.reliability +
      experienceScore * weights.experience

    return {
      transport_id: option.id,
      price_score: Math.round(priceScore * 10) / 10,
      time_score: Math.round(timeScore * 10) / 10,
      comfort_score: Math.round(comfortScore * 10) / 10,
      reliability_score: Math.round(reliabilityScore * 10) / 10,
      experience_score: Math.round(experienceScore * 10) / 10,
      final_score: Math.round(finalScore * 10) / 10,
      reasoning: this.generateReasoning(option, finalScore)
    }
  }

  private calculatePriceScore(price: number, maxBudget?: number): number {
    if (!maxBudget) return 5
    if (price > maxBudget) return 2
    if (price <= maxBudget * 0.5) return 10
    if (price <= maxBudget * 0.75) return 8
    if (price <= maxBudget) return 6
    return 2
  }

  private calculateTimeScore(durationMinutes: number): number {
    if (durationMinutes <= 180) return 10
    if (durationMinutes <= 360) return 8
    if (durationMinutes <= 600) return 6
    if (durationMinutes <= 720) return 4
    return 2
  }

  private calculateReliabilityScore(type: string, direct: boolean, stops: number): number {
    let baseScore = 5
    if (direct) baseScore += 3
    if (stops <= 1) baseScore += 2
    else if (stops <= 3) baseScore += 1
    if (type === 'bus') baseScore -= 1
    return Math.min(10, Math.max(0, baseScore))
  }

  private calculateExperienceScore(amenities: string[], type: string): number {
    let score = 3
    if (amenities.includes('Wifi')) score += 1.5
    if (amenities.includes('Food')) score += 1
    if (amenities.includes('Entertainment')) score += 1
    if (amenities.includes('Dining Car')) score += 2
    if (amenities.includes('Observation Deck')) score += 1.5
    if (amenities.includes('Scenic Views')) score += 2
    if (type === 'train') score += 1
    return Math.min(10, score)
  }

  private getWeights(preferences?: UserPreferences) {
    let weights = {
      price: 0.25,
      time: 0.25,
      comfort: 0.25,
      reliability: 0.15,
      experience: 0.1
    }

    if (!preferences) return weights

    switch (preferences.priority_mode) {
      case 'price':
        weights = { price: 0.5, time: 0.15, comfort: 0.15, reliability: 0.1, experience: 0.1 }
        break
      case 'time':
        weights = { price: 0.15, time: 0.5, comfort: 0.2, reliability: 0.1, experience: 0.05 }
        break
      case 'comfort':
        weights = { price: 0.15, time: 0.2, comfort: 0.5, reliability: 0.1, experience: 0.05 }
        break
      case 'experience':
        weights = { price: 0.1, time: 0.15, comfort: 0.25, reliability: 0.15, experience: 0.35 }
        break
    }

    return weights
  }

  private generateReasoning(option: SearchResult, score: number): string {
    const duration = Math.floor(option.duration / 60)
    const type = option.type === 'flight' ? 'vuelo' : option.type === 'bus' ? 'bus' : 'tren'
    return `${option.provider} - ${type.toUpperCase()} | $${option.price.toLocaleString()} | ${duration}h | Score: ${score.toFixed(1)}/10`
  }
}