'use client'

import { NATIONAL_OFFERS } from '@/constants/nationalOffers'
import OfferCard from './OfferCard'

interface NationalOffersProps {
  origin?: string
  budget?: number
}

/** Shown on /search when arriving with ?scope=national — inspiration/alternatives alongside whichever destination was auto-picked. */
export default function NationalOffers({ origin, budget }: NationalOffersProps) {
  return (
    <div>
      <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3">🇨🇱 Destinos nacionales destacados</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        {NATIONAL_OFFERS.map((offer) => (
          <OfferCard key={offer.id} offer={offer} origin={origin} budget={budget} />
        ))}
      </div>
    </div>
  )
}
