'use client'

import { useState } from 'react'
import { Trash2, ChevronDown, TrendingDown } from 'lucide-react'
import { Card, CardBody } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import PriceHistoryChart from './PriceHistoryChart'
import { deleteAlert, getPriceHistory, getCurrentPrice } from '@/lib/services/priceAlertsService'
import { cn } from '@/lib/utils/cn'
import type { PriceAlert } from '@/lib/types/priceAlert'

interface PriceAlertListProps {
  alerts: PriceAlert[]
  userId: string
  onRemoved: (alertId: string) => void
}

export default function PriceAlertList({ alerts, userId, onRemoved }: PriceAlertListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const handleDelete = async (alertId: string) => {
    await deleteAlert(userId, alertId)
    onRemoved(alertId)
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardBody className="text-center py-10">
          <div className="text-4xl mb-3">🔔</div>
          <p className="text-slate-600 dark:text-slate-400">Aún no tienes alertas de precio.</p>
        </CardBody>
      </Card>
    )
  }

  return (
    <div className="space-y-3">
      {alerts.map((alert) => {
        const isExpanded = expandedId === alert.id
        const currentPrice = getCurrentPrice(alert.origin, alert.destination)
        const isBelowThreshold = currentPrice <= alert.maxPrice

        return (
          <Card key={alert.id}>
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : alert.id)}
              className="flex w-full items-center justify-between px-6 py-4 text-left gap-3"
              aria-expanded={isExpanded}
            >
              <div className="min-w-0">
                <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">
                  {alert.origin} → {alert.destination}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Límite: ${alert.maxPrice.toLocaleString('es-CL')}
                </p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                {isBelowThreshold && (
                  <Badge variant="success" className="gap-1 hidden sm:inline-flex">
                    <TrendingDown size={12} /> Precio bajo
                  </Badge>
                )}
                <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  ${currentPrice.toLocaleString('es-CL')}
                </span>
                <ChevronDown size={16} className={cn('text-slate-400 transition-transform', isExpanded && 'rotate-180')} />
              </div>
            </button>

            {isExpanded && (
              <CardBody className="pt-0">
                <PriceHistoryChart
                  data={getPriceHistory(alert.origin, alert.destination)}
                  thresholdPrice={alert.maxPrice}
                />
                <div className="flex items-center justify-between mt-4 text-xs text-slate-400 dark:text-slate-500">
                  <span>
                    {alert.lastTriggeredAt
                      ? `Última alerta enviada: ${new Date(alert.lastTriggeredAt).toLocaleDateString('es-CL')}`
                      : 'Aún no se ha activado'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleDelete(alert.id)}
                    className="flex items-center gap-1 text-red-500 hover:text-red-600 transition-colors"
                  >
                    <Trash2 size={13} /> Eliminar alerta
                  </button>
                </div>
              </CardBody>
            )}
          </Card>
        )
      })}
    </div>
  )
}
