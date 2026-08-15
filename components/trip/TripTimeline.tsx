'use client'

import { Calendar, Mountain, Landmark, Utensils, Umbrella, Leaf, PartyPopper } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import type { TripDay } from '@/lib/services/tripBuilder'
import type { ActivityCategory } from '@/lib/providers/activity/types'

interface TripTimelineProps {
  days: TripDay[]
  selectedDay?: number
  onSelectDay: (dayNumber: number) => void
}

const CATEGORY_ICON: Record<ActivityCategory, typeof Calendar> = {
  Adventure: Mountain,
  Culture: Landmark,
  Food: Utensils,
  Beach: Umbrella,
  Nature: Leaf,
  Nightlife: PartyPopper,
}

function iconForDay(day: TripDay) {
  return CATEGORY_ICON[day.activities[0]?.category] ?? Calendar
}

function formatShortDate(date: Date) {
  return new Date(date).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}

export default function TripTimeline({ days, selectedDay, onSelectDay }: TripTimelineProps) {
  return (
    <nav aria-label="Timeline del viaje">
      {/* Desktop: vertical timeline */}
      <ol className="hidden lg:block relative space-y-1">
        <div className="absolute left-[15px] top-2 bottom-2 w-px bg-slate-200 dark:bg-slate-800" aria-hidden="true" />
        {days.map((day) => {
          const Icon = iconForDay(day)
          const isSelected = day.dayNumber === selectedDay

          return (
            <li key={day.dayNumber}>
              <button
                type="button"
                onClick={() => onSelectDay(day.dayNumber)}
                className={cn(
                  'relative z-10 flex items-center gap-3 w-full rounded-lg px-2 py-2.5 text-left transition-colors',
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/40'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-colors',
                    isSelected
                      ? 'border-blue-600 bg-blue-600 text-white'
                      : 'border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-500 dark:text-slate-400'
                  )}
                >
                  <Icon size={14} />
                </span>
                <span>
                  <span
                    className={cn(
                      'block text-sm font-semibold',
                      isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-800 dark:text-slate-200'
                    )}
                  >
                    Día {day.dayNumber}
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400">
                    {formatShortDate(day.date)}
                  </span>
                </span>
              </button>
            </li>
          )
        })}
      </ol>

      {/* Mobile/tablet: horizontal scrollable timeline */}
      <ol className="flex lg:hidden gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        {days.map((day) => {
          const Icon = iconForDay(day)
          const isSelected = day.dayNumber === selectedDay

          return (
            <li key={day.dayNumber} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelectDay(day.dayNumber)}
                className={cn(
                  'flex flex-col items-center gap-1 rounded-xl border-2 px-4 py-2 min-w-[76px] transition-colors',
                  isSelected
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-950/40'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                )}
              >
                <Icon
                  size={16}
                  className={isSelected ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500'}
                />
                <span
                  className={cn(
                    'text-xs font-semibold',
                    isSelected ? 'text-blue-700 dark:text-blue-400' : 'text-slate-700 dark:text-slate-300'
                  )}
                >
                  Día {day.dayNumber}
                </span>
                <span className="text-[10px] text-slate-500 dark:text-slate-400">{formatShortDate(day.date)}</span>
              </button>
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
