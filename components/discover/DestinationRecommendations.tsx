'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Card, CardBody } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import type { Recommendation } from '@/types/domain'
import { Button } from '@/components/common/Button'

interface DestinationRecommendationsProps {
  recommendations: Recommendation[]
  isLoading?: boolean
}

export default function DestinationRecommendations({
  recommendations,
  isLoading = false,
}: DestinationRecommendationsProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardBody className="h-48 bg-slate-200" />
          </Card>
        ))}
      </div>
    )
  }

  if (recommendations.length === 0) {
    return (
      <Card>
        <CardBody className="text-center py-12">
          <p className="text-slate-600">No recommendations found.</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {recommendations.map((rec) => (
        <Card key={rec.id} hover interactive>
          <div className="flex flex-col md:flex-row">
            {/* Image */}
            <div className="relative md:w-48 h-48 flex-shrink-0 overflow-hidden bg-slate-200">
              <Image
                src={rec.destination.images.hero}
                alt={rec.destination.name}
                fill
                sizes="(min-width: 768px) 192px, 100vw"
                className="object-cover"
              />
            </div>

            {/* Content */}
            <CardBody className="flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      {rec.destination.name}
                    </h3>
                    <p className="text-slate-600">{rec.destination.country}</p>
                  </div>
                  <Badge variant="primary" className="text-lg p-2 font-bold">
                    {rec.score.overall}/100
                  </Badge>
                </div>

                <p className="text-slate-700 mb-4 line-clamp-2">
                  {rec.destination.description}
                </p>

                <div className="mb-4">
                  <p className="text-sm font-semibold text-slate-600 mb-2">Why we recommend it:</p>
                  <ul className="text-sm text-slate-600 space-y-1">
                    {rec.whyRecommended.slice(0, 2).map((reason, i) => (
                      <li key={i}>✓ {reason}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Budget Breakdown */}
              <div>
                <div className="grid grid-cols-3 gap-4 mb-4 pt-4 border-t border-slate-200">
                  <div>
                    <p className="text-xs text-slate-600">Flights</p>
                    <p className="font-semibold text-slate-900">
                      ${rec.estimatedBudget.flights.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Hotel</p>
                    <p className="font-semibold text-slate-900">
                      ${rec.estimatedBudget.accommodation.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-slate-600">Activities</p>
                    <p className="font-semibold text-slate-900">
                      ${rec.estimatedBudget.activities.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Total */}
                <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                  <div>
                    <p className="text-sm text-slate-600">Total Estimate</p>
                    <p className="text-2xl font-bold text-blue-600">
                      ${(
                        rec.estimatedBudget.flights +
                        rec.estimatedBudget.accommodation +
                        rec.estimatedBudget.meals +
                        rec.estimatedBudget.activities
                      ).toLocaleString()}
                    </p>
                  </div>
                  <Link href={`/trip/${rec.id}`}>
                    <Button>View Details →</Button>
                  </Link>
                </div>
              </div>
            </CardBody>
          </div>
        </Card>
      ))}
    </div>
  )
}