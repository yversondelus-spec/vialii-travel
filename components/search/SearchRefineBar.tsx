'use client'

import { useState } from 'react'
import { Pencil, MapPin, ArrowRight, X, Calendar, Users } from 'lucide-react'
import TravelSearchForm from './TravelSearchForm'
import type { SearchCriteria } from '@/lib/types/searchCriteria'
import type { SmartSearchResolution } from '@/lib/services/smartSearchService'

interface SearchRefineBarProps {
  origin: string
  destination: string
  travelDate?: string
  returnDate?: string
  passengers?: { adults: number; children: number; infants: number }
  initial?: Partial<SearchCriteria>
  onSearch: (resolution: SmartSearchResolution) => void
  isLoading?: boolean
}

function formatDate(iso?: string) {
  if (!iso) return null
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}

/**
 * Replaces the always-visible full search form sidebar once a search has run
 * — showing the full form permanently next to results read like a second
 * search page. This collapses to a one-line summary with an "Editar" toggle
 * that reveals the same TravelSearchForm inline, prefilled, on demand.
 */
export default function SearchRefineBar({ origin, destination, travelDate, returnDate, passengers, initial, onSearch, isLoading }: SearchRefineBarProps) {
  const [expanded, setExpanded] = useState(false)
  const dateRange = formatDate(travelDate) ? `${formatDate(travelDate)}${returnDate ? ` – ${formatDate(returnDate)}` : ''}` : null
  const paxTotal = passengers ? passengers.adults + passengers.children + passengers.infants : undefined

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl px-4 py-3">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 min-w-0">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-slate-100 min-w-0">
            <MapPin size={15} className="text-blue-500 shrink-0" />
            <span className="truncate">{origin}</span>
            <ArrowRight size={13} className="text-slate-400 shrink-0" />
            <span className="truncate">{destination}</span>
          </div>
          {dateRange && (
            <span className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
              <Calendar size={13} /> {dateRange}
            </span>
          )}
          {paxTotal !== undefined && (
            <span className="flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400">
              <Users size={13} /> {paxTotal} pasajero{paxTotal === 1 ? '' : 's'}
            </span>
          )}
        </div>
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline shrink-0"
        >
          {expanded ? <X size={14} /> : <Pencil size={14} />} {expanded ? 'Cerrar' : 'Editar'}
        </button>
      </div>

      {expanded && (
        <div className="mt-3 max-w-xl">
          <TravelSearchForm
            initial={initial}
            isLoading={isLoading}
            onSearch={(resolution) => {
              onSearch(resolution)
              setExpanded(false)
            }}
          />
        </div>
      )}
    </div>
  )
}
