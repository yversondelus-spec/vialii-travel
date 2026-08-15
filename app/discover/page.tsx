'use client'

import { useState } from 'react'
import DiscoveryForm from '@/components/discover/DiscoveryForm'
import DestinationRecommendations from '@/components/discover/DestinationRecommendations'
import { Card, CardBody } from '@/components/common/Card'
import type { DiscoveryQuery, Recommendation } from '@/types/domain'
import { generateMockRecommendations } from '@/lib/mock/recommendations'
import { getAIRecommendations } from '@/lib/services/aiService'
import { FEATURED_DESTINATIONS } from '@/constants/destinations'
import { logger } from '@/lib/logger'

export default function DiscoverPage() {
  const [recommendations, setRecommendations] = useState<Recommendation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleDiscoverySubmit = async (query: DiscoveryQuery) => {
    setIsLoading(true)
    setHasSearched(true)
    setError(null)

    try {
      // Try to get AI recommendations
      const aiRecommendations = await getAIRecommendations(
        query.budget,
        query.duration ?? 7,
        query.travelers,
        query.interests,
        query.currency
      )

      if (aiRecommendations.length > 0) {
        // Map AI recommendations to our Recommendation format
        const mappedRecommendations: Recommendation[] = aiRecommendations
          .slice(0, 3)
          .map((aiRec, index) => {
            const destination = FEATURED_DESTINATIONS.find(
              (d) => d.name.toLowerCase() === aiRec.name.toLowerCase()
            ) || FEATURED_DESTINATIONS[index % FEATURED_DESTINATIONS.length]

            return {
              id: `ai-rec-${index}`,
              destination,
              score: {
                overall: 85 - index * 2,
                factors: {
                  priceValue: 8.5,
                  climate: 9,
                  connectivity: 8.5,
                  accommodation: 8.5,
                  activities: 9,
                  experience: 8.8,
                },
                explanation: aiRec.matchReason,
                recommendation: `Perfect for your ${query.interests.join(' & ')} trip`,
              },
              flights: [],
              accommodation: [],
              activities: [],
              estimatedBudget: {
                flights: aiRec.estimatedCost * 0.4,
                accommodation: aiRec.estimatedCost * 0.35,
                meals: aiRec.estimatedCost * 0.15,
                activities: aiRec.estimatedCost * 0.1,
                transfers: 0,
                insurance: 0,
                miscellaneous: 0,
                currency: query.currency,
                originalBudget: query.budget,
              },
              remainingBudget: query.budget - aiRec.estimatedCost,
              explanation: aiRec.matchReason,
              whyRecommended: [
                aiRec.matchReason,
                `Best time to visit: ${aiRec.bestTime}`,
                `Difficulty: ${aiRec.difficulty}`,
              ],
              ranking: index + 1,
            }
          })

        setRecommendations(mappedRecommendations)
      } else {
        // Fallback to mock recommendations
        const mockResults = generateMockRecommendations(query)
        setRecommendations(mockResults)
      }
    } catch (err) {
      logger.error('Error fetching AI recommendations', { message: err instanceof Error ? err.message : String(err) })
      setError('Failed to get AI recommendations. Using mock data instead.')
      
      // Fallback to mock recommendations
      const mockResults = generateMockRecommendations(query)
      setRecommendations(mockResults)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Discover Your Next Adventure
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Tell us what you&apos;re looking for, and our AI will find the perfect destination for you
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="sticky top-24">
              <DiscoveryForm
                onSubmit={handleDiscoverySubmit}
                isLoading={isLoading}
              />
            </div>
          </div>

          <div className="lg:col-span-2">
            {error && (
              <Card className="mb-4 border-yellow-200 bg-yellow-50">
                <CardBody className="text-yellow-800 text-sm">
                  ⚠️ {error}
                </CardBody>
              </Card>
            )}

            {hasSearched ? (
              <DestinationRecommendations
                recommendations={recommendations}
                isLoading={isLoading}
              />
            ) : (
              <Card>
                <CardBody className="text-center py-12">
                  <div className="text-slate-600">
                    <div className="text-5xl mb-4">🔍</div>
                    <p>Fill in your preferences to get personalized AI recommendations</p>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}