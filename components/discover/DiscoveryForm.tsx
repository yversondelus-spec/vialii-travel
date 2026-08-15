'use client'

import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { TRAVEL_INTERESTS } from '@/constants/destinations'
import type { DiscoveryQuery, TravelInterest } from '@/types/domain'

interface DiscoveryFormProps {
  onSubmit: (query: DiscoveryQuery) => void
  isLoading?: boolean
}

export default function DiscoveryForm({ onSubmit, isLoading = false }: DiscoveryFormProps) {
  const [step, setStep] = useState(1)
  const [formData, setFormData] = useState({
    budget: 1000000,
    currency: 'COP',
    origin: 'Santiago',
    startDate: new Date().toISOString().split('T')[0],
    duration: 7,
    travelers: 2,
    interests: [] as TravelInterest[],
  })

  const handleInterestToggle = (interest: TravelInterest) => {
    setFormData((prev) => ({
      ...prev,
      interests: prev.interests.includes(interest)
        ? prev.interests.filter((i) => i !== interest)
        : [...prev.interests, interest],
    }))
  }

  const handleSubmit = () => {
    if (formData.interests.length === 0) {
      alert('Please select at least one interest')
      return
    }

    const query: DiscoveryQuery = {
      ...formData,
      startDate: new Date(formData.startDate),
      destination: undefined,
    }

    onSubmit(query)
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <h2 className="text-2xl font-bold">Find Your Perfect Trip</h2>
        <p className="text-gray-600 mt-2">Step {step} of 2</p>
      </CardHeader>

      <CardBody>
        {step === 1 ? (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold mb-2">
                Budget: ${formData.budget.toLocaleString()}
              </label>
              <input
                type="range"
                min="500000"
                max="5000000"
                step="100000"
                value={formData.budget}
                onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Duration: {formData.duration} days
              </label>
              <input
                type="range"
                min="3"
                max="30"
                step="1"
                value={formData.duration}
                onChange={(e) => setFormData({ ...formData, duration: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">
                Travelers: {formData.travelers}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                step="1"
                value={formData.travelers}
                onChange={(e) => setFormData({ ...formData, travelers: Number(e.target.value) })}
                className="w-full"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold mb-2">Start Date</label>
              <input
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <Button fullWidth onClick={() => setStep(2)} disabled={!formData.startDate}>
              Next: Select Interests
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <p className="text-gray-600">What are you interested in?</p>

            <div className="grid grid-cols-2 gap-3">
              {TRAVEL_INTERESTS.map((interest) => {
                const isSelected = formData.interests.includes(interest.id as TravelInterest)
                return (
                  <button
                    key={interest.id}
                    onClick={() => handleInterestToggle(interest.id as TravelInterest)}
                    className={isSelected 
                      ? 'p-4 rounded-lg border-2 border-blue-600 bg-blue-50 text-center transition-all'
                      : 'p-4 rounded-lg border-2 border-gray-200 bg-white text-center transition-all hover:border-gray-300'
                    }
                  >
                    <div className="text-2xl mb-1">{interest.icon}</div>
                    <div className="text-sm font-medium">{interest.label}</div>
                  </button>
                )
              })}
            </div>

            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                fullWidth
                onClick={handleSubmit}
                isLoading={isLoading}
                disabled={formData.interests.length === 0}
              >
                Find Trips
              </Button>
            </div>
          </div>
        )}
      </CardBody>
    </Card>
  )
}