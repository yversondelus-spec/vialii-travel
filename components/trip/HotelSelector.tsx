'use client'

import { useState } from 'react'
import { Star, MapPin, CheckCircle2 } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { cn } from '@/lib/utils/cn'
import type { HotelOption } from '@/lib/providers/hotel/types'

interface HotelSelectorProps {
  hotels: HotelOption[]
  /** Controlled selection. Omit to let the component manage its own state. */
  selectedId?: string
  onSelect?: (hotel: HotelOption) => void
}

function StarRating({ stars }: { stars: number }) {
  return (
    <div className="flex items-center gap-0.5" aria-label={`${stars} estrellas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          size={14}
          className={
            i < stars
              ? 'fill-amber-400 text-amber-400'
              : 'fill-transparent text-slate-300 dark:text-slate-700'
          }
        />
      ))}
    </div>
  )
}

export default function HotelSelector({ hotels, selectedId, onSelect }: HotelSelectorProps) {
  const [internalSelected, setInternalSelected] = useState<string | undefined>(hotels[0]?.id)
  const activeId = selectedId ?? internalSelected

  const handleSelect = (hotel: HotelOption) => {
    setInternalSelected(hotel.id)
    onSelect?.(hotel)
  }

  if (hotels.length === 0) return null

  return (
    <Card>
      <CardHeader>
        <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Elige tu alojamiento</h2>
      </CardHeader>
      <CardBody>
        {/* @container: this can sit in a narrow sidebar or a full-width column,
            so columns respond to this element's own width, not the viewport. */}
        <div className="@container">
          <div className="grid grid-cols-1 @sm:grid-cols-2 gap-4">
          {hotels.map((hotel) => {
            const isSelected = hotel.id === activeId

            return (
              <button
                key={hotel.id}
                type="button"
                onClick={() => handleSelect(hotel)}
                className={cn(
                  'text-left rounded-xl border-2 p-4 transition-all duration-200 bg-white dark:bg-slate-900',
                  isSelected
                    ? 'border-green-500 shadow-md ring-1 ring-green-500/30'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-sm'
                )}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100 leading-tight">
                      {hotel.name}
                    </h3>
                    <StarRating stars={hotel.stars} />
                  </div>
                  {isSelected && (
                    <CheckCircle2 size={20} className="text-green-500 shrink-0" aria-label="Seleccionado" />
                  )}
                </div>

                <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mb-3">
                  <MapPin size={12} className="shrink-0" />
                  <span className="truncate">{hotel.address}</span>
                </div>

                <div className="flex flex-wrap gap-1.5 mb-3">
                  {hotel.amenities.slice(0, 3).map((amenity) => (
                    <Badge key={amenity} variant="neutral" className="text-[10px]">
                      {amenity}
                    </Badge>
                  ))}
                  {hotel.amenities.length > 3 && (
                    <Badge variant="neutral" className="text-[10px]">
                      +{hotel.amenities.length - 3}
                    </Badge>
                  )}
                </div>

                <div className="text-lg font-bold text-blue-600 dark:text-blue-400">
                  ${hotel.price.toLocaleString('es-CL')}
                  <span className="text-xs font-normal text-slate-500 dark:text-slate-400"> /noche</span>
                </div>
              </button>
            )
          })}
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
