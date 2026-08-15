'use client'

import { useEffect, useRef, useState } from 'react'
import { Coffee, Utensils, Plus, X, Clock, Star, ChevronDown } from 'lucide-react'
import { Card, CardBody } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { cn } from '@/lib/utils/cn'
import type { TripDay } from '@/lib/services/tripBuilder'
import type { Activity } from '@/lib/providers/activity/types'

interface DayItineraryProps {
  days: TripDay[]
  /** Full activity pool for the trip, used by "Add more activities". */
  activityPool?: Activity[]
  /** Day to force open + scroll into view, driven by TripTimeline. */
  focusedDay?: number
  onFocusDay?: (dayNumber: number) => void
}

function formatDuration(minutes: number) {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

function formatDate(date: Date) {
  const formatted = new Date(date).toLocaleDateString('es-CL', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
}

function ActivityModal({ activity, onClose }: { activity: Activity; onClose: () => void }) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={activity.name}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between mb-4">
          <div className="text-4xl">{activity.image}</div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-1">{activity.name}</h3>
        <Badge variant="primary" className="mb-4">
          {activity.category}
        </Badge>

        <div className="grid grid-cols-3 gap-3 text-sm mb-4">
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs mb-0.5">Precio</p>
            <p className="font-semibold text-blue-600 dark:text-blue-400">
              ${activity.price.toLocaleString('es-CL')}
            </p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs mb-0.5">Duración</p>
            <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <Clock size={13} /> {formatDuration(activity.duration)}
            </p>
          </div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs mb-0.5">Rating</p>
            <p className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
              <Star size={13} className="fill-amber-400 text-amber-400" /> {activity.rating}
            </p>
          </div>
        </div>

        <Button fullWidth onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </div>
  )
}

export default function DayItinerary({ days, activityPool = [], focusedDay, onFocusDay }: DayItineraryProps) {
  const [openDay, setOpenDay] = useState<number | null>(days[0]?.dayNumber ?? null)
  const [extraActivities, setExtraActivities] = useState<Record<number, Activity[]>>({})
  const [modalActivity, setModalActivity] = useState<Activity | null>(null)
  const dayRefs = useRef<Record<number, HTMLDivElement | null>>({})

  useEffect(() => {
    const focus = () => {
      if (focusedDay == null) return
      setOpenDay(focusedDay)
      dayRefs.current[focusedDay]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    focus()
  }, [focusedDay])

  const toggleDay = (dayNumber: number) => {
    setOpenDay((current) => (current === dayNumber ? null : dayNumber))
    onFocusDay?.(dayNumber)
  }

  const addActivity = (dayNumber: number, used: Activity[]) => {
    const usedIds = new Set(used.map((a) => a.id))
    const candidate = activityPool.find((a) => !usedIds.has(a.id))
    if (!candidate) return
    setExtraActivities((prev) => ({
      ...prev,
      [dayNumber]: [...(prev[dayNumber] ?? []), candidate],
    }))
  }

  return (
    <div className="space-y-3">
      {days.map((day) => {
        const isOpen = openDay === day.dayNumber
        const activities = [...day.activities, ...(extraActivities[day.dayNumber] ?? [])]
        const canAddMore = activityPool.length > activities.length

        return (
          <Card
            key={day.dayNumber}
            ref={(el) => {
              dayRefs.current[day.dayNumber] = el
            }}
          >
            <button
              type="button"
              onClick={() => toggleDay(day.dayNumber)}
              className="flex w-full items-center justify-between px-6 py-4 text-left"
              aria-expanded={isOpen}
            >
              <div>
                <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                  Día {day.dayNumber}
                </span>
                <span className="ml-2 text-sm text-slate-500 dark:text-slate-400">
                  {formatDate(day.date)}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="neutral" className="hidden sm:inline-flex">
                  {activities.length} actividad{activities.length === 1 ? '' : 'es'}
                </Badge>
                <ChevronDown
                  size={18}
                  className={cn(
                    'text-slate-400 transition-transform duration-200',
                    isOpen && 'rotate-180'
                  )}
                />
              </div>
            </button>

            <div
              className={cn(
                'grid transition-[grid-template-rows] duration-300 ease-in-out',
                isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              )}
            >
              <div className="overflow-hidden">
                <CardBody className="pt-0 space-y-4">
                  {/* Breakfast */}
                  <div className="flex items-start gap-3 text-sm">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400">
                      <Coffee size={15} />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">8:00 · Desayuno</p>
                      <p className="text-slate-500 dark:text-slate-400">{day.breakfast}</p>
                    </div>
                  </div>

                  {/* Activities */}
                  {activities.map((activity, idx) => (
                    <button
                      key={`${activity.id}-${idx}`}
                      type="button"
                      onClick={() => setModalActivity(activity)}
                      className="flex w-full items-start gap-3 text-sm text-left rounded-lg -mx-2 px-2 py-1.5 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-50 dark:bg-blue-950/40 text-lg">
                        {activity.image}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                          {activity.name}
                        </p>
                        <p className="text-slate-500 dark:text-slate-400">
                          {activity.category} · {formatDuration(activity.duration)} · $
                          {activity.price.toLocaleString('es-CL')}
                        </p>
                      </div>
                    </button>
                  ))}

                  {/* Dinner */}
                  <div className="flex items-start gap-3 text-sm">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
                      <Utensils size={15} />
                    </span>
                    <div>
                      <p className="font-semibold text-slate-800 dark:text-slate-200">19:00 · Cena</p>
                      <p className="text-slate-500 dark:text-slate-400">{day.dinner}</p>
                    </div>
                  </div>

                  <Button
                    variant="secondary"
                    size="sm"
                    className="mt-2"
                    disabled={!canAddMore}
                    onClick={() => addActivity(day.dayNumber, activities)}
                  >
                    <Plus size={14} className="mr-1" />
                    Agregar más actividades
                  </Button>
                </CardBody>
              </div>
            </div>
          </Card>
        )
      })}

      {modalActivity && (
        <ActivityModal activity={modalActivity} onClose={() => setModalActivity(null)} />
      )}
    </div>
  )
}
