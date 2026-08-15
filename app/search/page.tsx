'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Heart } from 'lucide-react'
import TravelSearchForm from '@/components/search/TravelSearchForm'
import SearchRefineBar from '@/components/search/SearchRefineBar'
import NationalOffers from '@/components/search/NationalOffers'
import ComparisonResults from '@/components/search/ComparisonResults'
import { Badge } from '@/components/common/Badge'
import { useAuth } from '@/lib/auth/authContext'
import { getSavedTrips } from '@/lib/services/savedTripsService'
import { logSearch } from '@/lib/services/analyticsService'
import { DEFAULT_PASSENGERS, type PassengerCounts, type SearchCriteria } from '@/lib/types/searchCriteria'
import type { SmartSearchResolution } from '@/lib/services/smartSearchService'
import type { Interest } from '@/constants/interests'
import type { SearchComparisonResult } from '@/lib/types/search'
import { logger } from '@/lib/logger'

// Public page — search works without an account. SaveTripButton is what
// asks for a login, only when someone tries to save a result.
function SearchPageContent() {
  const searchParams = useSearchParams()
  const { user, isAuthenticated } = useAuth()
  const [results, setResults] = useState<SearchComparisonResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [savedCount, setSavedCount] = useState(0)
  // Tracked separately from `results` so SearchRefineBar has something to show
  // immediately on submit, before the (possibly slow) search resolves.
  const [currentResolution, setCurrentResolution] = useState<SmartSearchResolution | null>(null)

  useEffect(() => {
    if (!user) return
    getSavedTrips(user.id).then((trips) => setSavedCount(trips.length))
  }, [user])

  const handleSearch = async (resolution: SmartSearchResolution) => {
    setLoading(true)
    setHasSearched(true)
    setCurrentResolution(resolution)

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          origin: resolution.origin,
          destination: resolution.destination,
          travel_date: resolution.travelDate,
          return_date: resolution.returnDate,
          num_passengers: Math.max(1, resolution.passengers.adults + resolution.passengers.children + resolution.passengers.infants),
          passengers_detail: resolution.passengers,
          max_budget: resolution.budgetTotal,
          budget_unit: resolution.budgetUnit,
          interests: resolution.interests,
          priority: 'balanced',
        }),
      })

      const data = await response.json()

      if (data.success) {
        setResults(data.data)
        logSearch(resolution.origin, resolution.destination)
      } else {
        alert('Error: ' + data.error)
      }
    } catch (error) {
      logger.error('Search request failed', { message: error instanceof Error ? error.message : String(error) })
      alert('Hubo un error en la búsqueda')
    } finally {
      setLoading(false)
    }
  }

  // The Home search widget resolves everything (destination, dates,
  // passengers, budget) before redirecting here — this just reads that
  // already-resolved state back out of the URL and runs the same
  // handleSearch used everywhere else, once, on load.
  const qpDestination = searchParams.get('destination')
  const qpOrigin = searchParams.get('origin')
  const qpScope = searchParams.get('scope') as 'national' | 'international' | null
  const qpBudgetTotal = searchParams.get('budget')
  const qpBudgetAmount = searchParams.get('budget_amount')
  const qpBudgetUnit = (searchParams.get('budget_unit') as 'per_person' | 'total' | null) ?? 'total'
  const qpTravelDate = searchParams.get('travel_date')
  const qpReturnDate = searchParams.get('return_date')
  const qpInterests = (searchParams.get('interests')?.split(',').filter(Boolean) ?? []) as Interest[]
  const qpPassengers: PassengerCounts = {
    adults: Number(searchParams.get('adults')) || DEFAULT_PASSENGERS.adults,
    children: Number(searchParams.get('children')) || 0,
    infants: Number(searchParams.get('infants')) || 0,
  }

  const initialCriteria: Partial<SearchCriteria> | undefined = qpDestination
    ? {
        origin: qpOrigin ?? undefined,
        destination: qpDestination,
        scope: qpScope ?? 'national',
        dates: qpTravelDate ? { mode: 'exact', startDate: qpTravelDate, endDate: qpReturnDate ?? undefined } : { mode: 'duration' },
        passengers: qpPassengers,
        budget: qpBudgetAmount ? { amount: Number(qpBudgetAmount), unit: qpBudgetUnit } : undefined,
        interests: qpInterests,
      }
    : undefined

  const autoSearchedRef = useRef(false)
  useEffect(() => {
    if (autoSearchedRef.current || !qpDestination) return
    autoSearchedRef.current = true
    handleSearch({
      origin: qpOrigin || 'Santiago, Chile',
      destination: qpDestination,
      scope: qpScope ?? 'national',
      travelDate: qpTravelDate || new Date(Date.now() + 14 * 86_400_000).toISOString().split('T')[0],
      returnDate: qpReturnDate ?? undefined,
      passengers: qpPassengers,
      budgetTotal: qpBudgetTotal ? Number(qpBudgetTotal) : 300_000,
      budgetAmount: qpBudgetAmount ? Number(qpBudgetAmount) : 300_000,
      budgetUnit: qpBudgetUnit,
      interests: qpInterests,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qpDestination])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          {isAuthenticated && (
            <div className="flex justify-center mb-4">
              <Link href="/profile?tab=saved">
                <Badge variant="primary" className="gap-1.5 hover:opacity-80 transition-opacity">
                  <Heart size={12} className="fill-current" /> {savedCount} viajes guardados
                </Badge>
              </Link>
            </div>
          )}
          <h1 className="text-3xl sm:text-5xl font-bold mb-4 text-slate-900 dark:text-white">
            Encuentra la mejor forma de viajar
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-400">
            Compara buses, vuelos, trenes y descubre la opción perfecta para ti
          </p>
        </div>

        {/* Before any search: full form, centered — nothing to refine yet.
            After a search: compact refine bar + results, single column — a
            full-size form permanently beside results read like a second
            search page, so it collapses once there's something to show. */}
        {hasSearched ? (
          <div className="max-w-5xl mx-auto space-y-6">
            {currentResolution && (
              <SearchRefineBar
                origin={currentResolution.origin}
                destination={currentResolution.destination}
                travelDate={currentResolution.travelDate}
                returnDate={currentResolution.returnDate}
                passengers={currentResolution.passengers}
                initial={initialCriteria}
                onSearch={handleSearch}
                isLoading={loading}
              />
            )}
            {qpScope === 'national' && <NationalOffers origin={qpOrigin ?? undefined} budget={currentResolution?.budgetTotal} />}
            <ComparisonResults results={results} isLoading={loading} scope={qpScope} />
          </div>
        ) : (
          <div className="max-w-xl mx-auto">
            <TravelSearchForm onSearch={handleSearch} isLoading={loading} initial={initialCriteria} />
          </div>
        )}
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin text-4xl">⏳</div>
        </div>
      }
    >
      <SearchPageContent />
    </Suspense>
  )
}
