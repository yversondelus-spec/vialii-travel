'use client'

import { useState, type FormEvent } from 'react'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { useAuth } from '@/lib/auth/authContext'
import { createAlert } from '@/lib/services/priceAlertsService'
import type { PriceAlert } from '@/lib/types/priceAlert'

interface PriceAlertFormProps {
  onCreated: (alert: PriceAlert) => void
}

export default function PriceAlertForm({ onCreated }: PriceAlertFormProps) {
  const { user } = useAuth()
  const [origin, setOrigin] = useState('Santiago')
  const [destination, setDestination] = useState('Puerto Montt')
  const [maxPrice, setMaxPrice] = useState(60000)
  const [creating, setCreating] = useState(false)

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !origin.trim() || !destination.trim()) return

    setCreating(true)
    const alert = await createAlert(user.id, origin.trim(), destination.trim(), maxPrice)
    setCreating(false)
    onCreated(alert)
  }

  return (
    <Card>
      <CardHeader>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">Nueva alerta de precio</h2>
      </CardHeader>
      <CardBody>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="alert-origin" className="block text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100">
                Origen
              </label>
              <input
                id="alert-origin"
                type="text"
                required
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label htmlFor="alert-destination" className="block text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100">
                Destino
              </label>
              <input
                id="alert-destination"
                type="text"
                required
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div>
            <label htmlFor="alert-max-price" className="block text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100">
              Avisarme cuando el precio baje de: ${maxPrice.toLocaleString('es-CL')}
            </label>
            <input
              id="alert-max-price"
              type="range"
              min={20000}
              max={200000}
              step={5000}
              value={maxPrice}
              onChange={(e) => setMaxPrice(Number(e.target.value))}
              className="w-full accent-blue-600"
            />
          </div>

          <Button type="submit" isLoading={creating}>
            {creating ? 'Creando...' : 'Crear alerta'}
          </Button>
        </form>
      </CardBody>
    </Card>
  )
}
