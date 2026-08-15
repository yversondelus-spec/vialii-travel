import { logger } from '@/lib/logger'

export interface AIRecommendation {
  name: string
  country: string
  matchReason: string
  estimatedCost: number
  bestTime: string
  difficulty: 'easy' | 'moderate' | 'challenging'
}

export async function getAIRecommendations(
  budget: number,
  duration: number,
  travelers: number,
  interests: string[],
  currency: string
): Promise<AIRecommendation[]> {
  try {
    const response = await fetch('/api/ai/recommendations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        budget,
        duration,
        travelers,
        interests,
        currency,
      }),
    })

    if (!response.ok) {
      throw new Error('Failed to get AI recommendations')
    }

    const data = await response.json()
    
    // Parse Claude's response
    try {
      const recommendations = JSON.parse(data.data)
      return Array.isArray(recommendations) ? recommendations : []
    } catch {
      logger.error('Failed to parse AI response', { raw: data.data })
      return []
    }
  } catch (error) {
    logger.error('Error fetching AI recommendations', { message: error instanceof Error ? error.message : String(error) })
    throw error
  }
}