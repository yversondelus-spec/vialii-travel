'use client'

import Image from 'next/image'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import ItineraryView from './ItineraryView'
import type { Recommendation, Itinerary } from '@/types/domain'

interface TripDetailsProps {
  recommendation: Recommendation
  itinerary: Itinerary
}

export default function TripDetails({ recommendation, itinerary }: TripDetailsProps) {
  const totalCost =
    recommendation.estimatedBudget.flights +
    recommendation.estimatedBudget.accommodation +
    recommendation.estimatedBudget.meals +
    recommendation.estimatedBudget.activities +
    recommendation.estimatedBudget.transfers

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h1 className="text-5xl font-bold mb-2">
          {recommendation.destination.name}, {recommendation.destination.country}
        </h1>
        <p className="text-xl text-slate-600">{recommendation.destination.description}</p>
        <div className="flex flex-wrap gap-3">
          <Badge variant="primary" className="text-base px-4 py-2">
            Score: {recommendation.score.overall}/100
          </Badge>
          <Badge variant="success" className="text-base px-4 py-2">
            {recommendation.destination.difficulty}
          </Badge>
          <Badge variant="neutral" className="text-base px-4 py-2">
            {itinerary.days.length} days
          </Badge>
        </div>
      </div>

      <div className="relative h-96 rounded-2xl overflow-hidden">
        <Image
          src={recommendation.destination.images.hero}
          alt={recommendation.destination.name}
          fill
          sizes="100vw"
          priority
          className="object-cover"
        />
      </div>

      <Card>
        <CardHeader><h2 className="text-2xl font-bold">Budget Breakdown</h2></CardHeader>
        <CardBody>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center">
              <p className="text-sm text-slate-600">Flights</p>
              <p className="text-xl font-bold text-blue-600">{recommendation.estimatedBudget.flights.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-600">Hotel</p>
              <p className="text-xl font-bold text-blue-600">{recommendation.estimatedBudget.accommodation.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-600">Meals</p>
              <p className="text-xl font-bold text-blue-600">{recommendation.estimatedBudget.meals.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-600">Activities</p>
              <p className="text-xl font-bold text-blue-600">{recommendation.estimatedBudget.activities.toLocaleString()}</p>
            </div>
            <div className="text-center">
              <p className="text-sm text-slate-600">Transfers</p>
              <p className="text-xl font-bold text-blue-600">{recommendation.estimatedBudget.transfers.toLocaleString()}</p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t border-slate-200 flex items-center justify-between">
            <span className="text-lg font-semibold">Total Cost</span>
            <span className="text-3xl font-bold text-green-600">{totalCost.toLocaleString()}</span>
          </div>
        </CardBody>
      </Card>

      <Card>
        <CardHeader><h2 className="text-2xl font-bold">Why We Recommend This</h2></CardHeader>
        <CardBody>
          <p className="text-slate-700 mb-4">{recommendation.score.explanation}</p>
          <ul className="space-y-2">
            {recommendation.whyRecommended.map((reason, idx) => (
              <li key={idx} className="flex gap-2 text-slate-700">
                <span className="text-green-600">✓</span>
                {reason}
              </li>
            ))}
          </ul>
        </CardBody>
      </Card>

      <ItineraryView itinerary={itinerary} />

      <Card>
        <CardHeader><h2 className="text-2xl font-bold">Destination Info</h2></CardHeader>
        <CardBody>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2">Basic Info</h3>
              <ul className="space-y-1 text-sm text-slate-700">
                <li><strong>Currency:</strong> {recommendation.destination.currency}</li>
                <li><strong>Languages:</strong> {recommendation.destination.languages.join(', ')}</li>
                <li><strong>Timezone:</strong> {recommendation.destination.timezone}</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Top Attractions</h3>
              <ul className="space-y-1 text-sm text-slate-700">
                {recommendation.destination.attractions.map((attr, idx) => (
                  <li key={idx}>• {attr}</li>
                ))}
              </ul>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  )
}
