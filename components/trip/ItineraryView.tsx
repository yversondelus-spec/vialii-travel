'use client'

import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import type { Itinerary } from '@/types/domain'

interface ItineraryViewProps {
  itinerary: Itinerary
}

export default function ItineraryView({ itinerary }: ItineraryViewProps) {
  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold">Your Itinerary</h2>

      {itinerary.days.map((day) => (
        <Card key={day.day} className="overflow-hidden">
          <CardHeader className="bg-gradient-to-r from-blue-50 to-cyan-50 border-b">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold">
                  Day {day.day} - {day.title}
                </h3>
                <p className="text-sm text-slate-600">
                  {day.date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <Badge variant="primary" className="text-lg px-4 py-2">
                {day.estimatedCost.toLocaleString()}
              </Badge>
            </div>
          </CardHeader>

          <CardBody>
            <div className="space-y-4">
              {day.activities.map((activity, idx) => (
                <div key={activity.id} className="flex gap-4 pb-4 border-b border-slate-200 last:border-0 last:pb-0">
                  <div className="flex flex-col items-center">
                    <div className="text-sm font-bold text-blue-600 w-16 text-center">
                      {activity.time}
                    </div>
                    <div className="w-3 h-3 rounded-full bg-blue-600 mt-2"></div>
                    {idx < day.activities.length - 1 && (
                      <div className="w-0.5 h-12 bg-slate-200 mt-2"></div>
                    )}
                  </div>
                  <div className="flex-1 pt-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h4 className="font-semibold text-slate-900">{activity.title}</h4>
                        <p className="text-sm text-slate-600">{activity.location}</p>
                      </div>
                      <Badge variant="success" className="text-xs">
                        {activity.type}
                      </Badge>
                    </div>
                    <p className="text-sm text-slate-700 mb-2">{activity.description}</p>
                    <div className="flex items-center justify-between text-xs text-slate-600">
                      <span>Duration: {activity.duration} min</span>
                      {activity.estimatedCost > 0 && (
                        <span className="font-semibold text-blue-600">
                          {activity.estimatedCost.toLocaleString()}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardBody>
        </Card>
      ))}
    </div>
  )
}
