'use client'

import { useState } from 'react'
import { Card, CardBody } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import type { TransportType } from '@/lib/types/domain'

export interface FilterState {
  minPrice: number
  maxPrice: number
  maxDurationMinutes: number
  types: Record<Extract<TransportType, 'bus' | 'flight' | 'train'>, boolean>
  directOnly: boolean
}

export interface FilterBounds {
  minPrice: number
  maxPrice: number
  maxDurationMinutes: number
}

interface FilterBarProps {
  bounds: FilterBounds
  filters: FilterState
  onChange: (filters: FilterState) => void
  onReset: () => void
  /** Which type checkboxes to show — omit to show all 3. A scoped search (national/international) only offers the types that can actually appear, instead of a "Vuelo" checkbox that can never do anything on a national search. */
  availableTypes?: ('bus' | 'flight' | 'train')[]
}

const TYPE_LABELS: Record<'bus' | 'flight' | 'train', string> = {
  bus: '🚌 Bus',
  flight: '✈️ Vuelo',
  train: '🚆 Tren',
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

export default function FilterBar({ bounds, filters, onChange, onReset, availableTypes }: FilterBarProps) {
  const [isOpen, setIsOpen] = useState(false)
  const visibleTypes = availableTypes ?? (Object.keys(TYPE_LABELS) as Array<'bus' | 'flight' | 'train'>)

  const update = (patch: Partial<FilterState>) => onChange({ ...filters, ...patch })

  const toggleType = (type: 'bus' | 'flight' | 'train') => {
    update({ types: { ...filters.types, [type]: !filters.types[type] } })
  }

  return (
    <Card>
      <CardBody className="py-4">
        {/* Mobile toggle */}
        <button
          type="button"
          className="flex w-full items-center justify-between md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="font-semibold text-slate-900 dark:text-slate-100">
            🔍 Filtros
          </span>
          <span className="text-slate-500 dark:text-slate-400">{isOpen ? '▲' : '▼'}</span>
        </button>

        <div className={`${isOpen ? 'mt-4 grid' : 'hidden'} md:grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 md:mt-0`}>
          {/* Price range */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100">
              Precio máximo: ${filters.maxPrice.toLocaleString()}
            </label>
            <input
              type="range"
              min={bounds.minPrice}
              max={bounds.maxPrice}
              step={1000}
              value={filters.maxPrice}
              onChange={(e) => update({ maxPrice: Number(e.target.value) })}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>${bounds.minPrice.toLocaleString()}</span>
              <span>${bounds.maxPrice.toLocaleString()}</span>
            </div>
          </div>

          {/* Duration */}
          <div>
            <label className="block text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100">
              Duración máxima: {formatDuration(filters.maxDurationMinutes)}
            </label>
            <input
              type="range"
              min={30}
              max={bounds.maxDurationMinutes}
              step={30}
              value={filters.maxDurationMinutes}
              onChange={(e) => update({ maxDurationMinutes: Number(e.target.value) })}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>30m</span>
              <span>{formatDuration(bounds.maxDurationMinutes)}</span>
            </div>
          </div>

          {/* Transport type */}
          <div>
            <span className="block text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100">
              Tipo de transporte
            </span>
            <div className="flex flex-col gap-2">
              {visibleTypes.map((type) => (
                <label key={type} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={filters.types[type]}
                    onChange={() => toggleType(type)}
                    className="h-4 w-4 rounded accent-blue-600"
                  />
                  {TYPE_LABELS[type]}
                </label>
              ))}
            </div>
          </div>

          {/* Direct only + reset */}
          <div className="flex flex-col justify-between">
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={filters.directOnly}
                onChange={(e) => update({ directOnly: e.target.checked })}
                className="h-4 w-4 rounded accent-blue-600"
              />
              Solo directos
            </label>
            <Button variant="secondary" size="sm" className="mt-4 sm:mt-0" onClick={onReset}>
              Limpiar filtros
            </Button>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
