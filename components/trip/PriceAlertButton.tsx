'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell, BellOff, Loader2 } from 'lucide-react'
import { useAuth } from '@/lib/auth/authContext'
import { getSubscription } from '@/lib/services/subscriptionService'
import { createAlert, deleteAlert, getUserAlerts } from '@/lib/services/priceAlertsService'
import { cn } from '@/lib/utils/cn'
import { logger } from '@/lib/logger'

interface PriceAlertButtonProps {
  origin: string
  destination: string
  /** Used as the alert's initial threshold — the price that was showing when the user clicked. */
  suggestedMaxPrice: number
  className?: string
}

/**
 * Quick "notify me if this route gets cheaper" toggle for a search result —
 * the one-click counterpart to the full form on /alerts. Premium-gated: a
 * free-tier user is sent to /pricing instead of creating the alert.
 */
export default function PriceAlertButton({ origin, destination, suggestedMaxPrice, className }: PriceAlertButtonProps) {
  const router = useRouter()
  const { user, isAuthenticated } = useAuth()
  const [existingAlertId, setExistingAlertId] = useState<string | null>(null)
  const [checking, setChecking] = useState(true)
  const [busy, setBusy] = useState(false)
  const [hover, setHover] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = () => {
      if (!isAuthenticated || !user) {
        setExistingAlertId(null)
        setChecking(false)
        return
      }
      setChecking(true)
      getUserAlerts(user.id).then((alerts) => {
        if (cancelled) return
        const match = alerts.find((a) => a.origin === origin && a.destination === destination)
        setExistingAlertId(match?.id ?? null)
        setChecking(false)
      })
    }
    load()
    return () => {
      cancelled = true
    }
  }, [isAuthenticated, user, origin, destination])

  const handleClick = async () => {
    if (!isAuthenticated || !user) {
      router.push('/auth/login')
      return
    }

    setBusy(true)
    try {
      if (existingAlertId) {
        await deleteAlert(user.id, existingAlertId)
        setExistingAlertId(null)
      } else {
        const subscription = await getSubscription(user.id)
        if (subscription.tier !== 'premium') {
          router.push('/pricing?upsell=alerts')
          return
        }
        const alert = await createAlert(user.id, origin, destination, suggestedMaxPrice)
        setExistingAlertId(alert.id)
      }
    } catch (err) {
      logger.error('Price alert toggle failed', { message: err instanceof Error ? err.message : String(err) })
    } finally {
      setBusy(false)
    }
  }

  const active = !!existingAlertId
  const label = active ? 'Quitar alerta de precio' : 'Avisarme si baja el precio'
  const ShownIcon = busy || checking ? Loader2 : active && hover ? BellOff : Bell

  return (
    <button
      type="button"
      onClick={handleClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      disabled={busy || checking}
      title={label}
      aria-label={label}
      aria-pressed={active}
      className={cn(
        'flex h-10 w-10 items-center justify-center rounded-full border transition-colors disabled:opacity-60',
        active
          ? 'border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/40 text-amber-500'
          : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:text-amber-500 hover:border-amber-200 dark:hover:border-amber-900',
        className
      )}
    >
      <ShownIcon size={18} className={cn((busy || checking) && 'animate-spin', active && !hover && 'fill-current')} />
    </button>
  )
}
