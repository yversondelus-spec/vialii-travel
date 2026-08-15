'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Heart, HeartOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth/authContext'
import { saveTripToFavorites, removeSavedTrip, isTripSaved } from '@/lib/services/savedTripsService'
import { canSaveMoreTrips } from '@/lib/services/subscriptionService'
import { cn } from '@/lib/utils/cn'
import { logger } from '@/lib/logger'

interface SaveTripButtonProps {
  tripId: string
  tripData?: unknown
  className?: string
}

export default function SaveTripButton({ tripId, tripData, className }: SaveTripButtonProps) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [saved, setSaved] = useState(false)
  const [checking, setChecking] = useState(true)
  const [busy, setBusy] = useState(false)
  const [hover, setHover] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = () => {
      if (!isAuthenticated || !user) {
        setSaved(false)
        setChecking(false)
        return
      }
      setChecking(true)
      isTripSaved(user.id, tripId).then((result) => {
        if (!cancelled) {
          setSaved(result)
          setChecking(false)
        }
      })
    }
    load()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, user, tripId])

  const handleClick = async () => {
    if (!isAuthenticated || !user) {
      router.push('/auth/login')
      return
    }

    setBusy(true)
    try {
      if (saved) {
        await removeSavedTrip(user.id, tripId)
        setSaved(false)
      } else {
        if (!(await canSaveMoreTrips(user.id))) {
          router.push('/pricing?upsell=trips')
          return
        }
        await saveTripToFavorites(user.id, tripId, tripData ?? { tripId })
        setSaved(true)
      }
    } catch (err) {
      logger.error('Save trip failed', { message: err instanceof Error ? err.message : String(err) })
    } finally {
      setBusy(false)
    }
  }

  const label = !isAuthenticated ? 'Inicia sesión para guardar' : saved ? 'Quitar de favoritos' : 'Guardar viaje'
  const ShownIcon = busy || checking ? Loader2 : saved && hover ? HeartOff : Heart

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={busy || checking}
      title={label}
      aria-label={label}
      aria-pressed={saved}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full border transition-colors disabled:opacity-60',
        saved
          ? 'border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 text-red-500'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:text-red-500 hover:border-red-200 dark:hover:border-red-900',
        className
      )}
    >
      <ShownIcon size={18} className={cn((busy || checking) && 'animate-spin', saved && !hover && 'fill-current')} />
    </button>
  )
}
