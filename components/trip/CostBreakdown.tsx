'use client'

import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { useCurrency } from '@/lib/currency/currencyContext'
import type { TripCostBreakdown } from '@/lib/services/tripBuilder'

interface CostBreakdownProps {
  breakdown: TripCostBreakdown
}

// Fixed categorical order + validated colorblind-safe hues (light/dark pairs).
// Never reorder — the sequence itself is what keeps adjacent bars distinguishable.
const CATEGORIES: {
  key: keyof Pick<TripCostBreakdown, 'transport' | 'hotels' | 'activities' | 'meals'>
  label: string
  color: string
}[] = [
  { key: 'transport', label: 'Transporte', color: 'var(--cost-transport)' },
  { key: 'hotels', label: 'Hoteles', color: 'var(--cost-hotels)' },
  { key: 'activities', label: 'Actividades', color: 'var(--cost-activities)' },
  { key: 'meals', label: 'Comidas', color: 'var(--cost-meals)' },
]

function formatCLP(value: number) {
  return `$${Math.round(value).toLocaleString('es-CL')}`
}

export default function CostBreakdown({ breakdown }: CostBreakdownProps) {
  const { currency, displayPrice } = useCurrency()
  const total = breakdown.total || 1
  // All costs in this app are computed in CLP; convert to whatever the user has picked.
  const showConverted = currency !== 'CLP'

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Desglose de costos</h2>
      </CardHeader>
      <CardBody className="space-y-5">
        {CATEGORIES.map((category) => {
          const value = breakdown[category.key]
          const pct = Math.round((value / total) * 100)

          return (
            <div key={category.key}>
              <div className="flex items-center justify-between mb-1.5 text-sm">
                <span className="flex items-center gap-2 font-medium text-slate-700 dark:text-slate-300">
                  <span
                    className="h-2.5 w-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: category.color }}
                  />
                  {category.label}
                </span>
                <span className="text-slate-500 dark:text-slate-400">
                  {formatCLP(value)} · {pct}%
                </span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: category.color }}
                />
              </div>
            </div>
          )
        })}

        <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-end justify-between">
          <span className="text-base font-semibold text-slate-700 dark:text-slate-300">Total estimado</span>
          <div className="text-right">
            <div className="text-3xl font-bold text-slate-900 dark:text-slate-100">
              {formatCLP(breakdown.total)}
            </div>
            {showConverted && (
              <div className="text-sm text-slate-500 dark:text-slate-400">
                ~{displayPrice(breakdown.total, 'CLP')}
              </div>
            )}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
