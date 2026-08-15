'use client'

import Image from 'next/image'
import { useRouter } from 'next/navigation'
import type { NationalOffer } from '@/constants/nationalOffers'

interface OfferCardProps {
  offer: NationalOffer
  origin?: string
  budget?: number
}

export default function OfferCard({ offer, origin = 'Santiago', budget }: OfferCardProps) {
  const router = useRouter()

  const handleClick = () => {
    const qs = new URLSearchParams({ destination: offer.name, origin, scope: 'national' })
    if (budget) qs.set('budget', String(budget))
    router.push(`/search?${qs.toString()}`)
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      className="group relative overflow-hidden rounded-2xl aspect-[4/5] text-left border border-slate-200 dark:border-slate-800 hover:shadow-md transition-shadow"
    >
      <Image
        src={offer.image}
        alt={`${offer.name} — ${offer.tagline}`}
        fill
        sizes="(min-width: 1024px) 25vw, 50vw"
        className="object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-3 text-white">
        <p className="font-bold text-base sm:text-lg leading-tight">{offer.name}</p>
        <p className="text-xs text-white/85">{offer.tagline}</p>
      </div>
    </button>
  )
}
