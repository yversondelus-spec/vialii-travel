'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { BellRing, MailCheck, Crown } from 'lucide-react'
import RequireAuth from '@/components/auth/RequireAuth'
import PriceAlertForm from '@/components/alerts/PriceAlertForm'
import PriceAlertList from '@/components/alerts/PriceAlertList'
import { Card, CardBody } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { useAuth } from '@/lib/auth/authContext'
import { getSubscription } from '@/lib/services/subscriptionService'
import { getUserAlerts, checkAlerts } from '@/lib/services/priceAlertsService'
import type { PlanTier } from '@/lib/types/subscription'
import type { PriceAlert } from '@/lib/types/priceAlert'

function PremiumUpsell() {
  return (
    <Card className="max-w-lg mx-auto text-center">
      <CardBody className="py-12">
        <Crown size={36} className="mx-auto text-amber-500 mb-4" />
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
          Las alertas de precio son Premium
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Mejora a Premium para recibir un aviso apenas baje el precio de tu ruta favorita, y ver el historial
          completo de precios.
        </p>
        <Link href="/pricing">
          <Button>Ver planes</Button>
        </Link>
      </CardBody>
    </Card>
  )
}

function AlertsContent() {
  const { user } = useAuth()
  const [tier, setTier] = useState<PlanTier | null>(null)
  const [alerts, setAlerts] = useState<PriceAlert[]>([])
  const [checking, setChecking] = useState(false)
  const [checkResult, setCheckResult] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    getSubscription(user.id).then((sub) => setTier(sub.tier))
    getUserAlerts(user.id).then(setAlerts)
  }, [user])

  if (!user || tier === null) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    )
  }

  if (tier === 'free') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-12 px-4">
        <PremiumUpsell />
      </div>
    )
  }

  const handleCheckNow = async () => {
    setChecking(true)
    setCheckResult(null)
    const triggered = await checkAlerts(user.id, user.email)
    setAlerts((prev) =>
      prev.map((a) => {
        const match = triggered.find((t) => t.id === a.id)
        return match ? { ...a, lastTriggeredAt: match.lastTriggeredAt } : a
      })
    )
    setCheckResult(
      triggered.length > 0
        ? `¡${triggered.length} alerta${triggered.length === 1 ? '' : 's'} activada${triggered.length === 1 ? '' : 's'}! Revisa tu bandeja de emails de la demo.`
        : 'Ninguna ruta bajó de tu límite por ahora.'
    )
    setChecking(false)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-8 sm:py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <BellRing size={24} /> Alertas de precio
            </h1>
            <p className="text-slate-600 dark:text-slate-400 mt-1">
              Te avisamos cuando el precio de tu ruta baje del límite que definas.
            </p>
          </div>
          <Button variant="secondary" onClick={handleCheckNow} isLoading={checking}>
            <MailCheck size={15} className="mr-1.5" /> {checking ? 'Revisando...' : 'Revisar precios ahora'}
          </Button>
        </div>

        {checkResult && (
          <div className="rounded-xl border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 px-4 py-3 text-sm text-blue-800 dark:text-blue-300">
            {checkResult}
          </div>
        )}

        <PriceAlertForm onCreated={(alert) => setAlerts((prev) => [alert, ...prev])} />

        <PriceAlertList
          alerts={alerts}
          userId={user.id}
          onRemoved={(alertId) => setAlerts((prev) => prev.filter((a) => a.id !== alertId))}
        />

        <p className="text-center text-xs text-slate-400 dark:text-slate-500">
          &quot;Revisar precios ahora&quot; simula la revisión periódica que en producción correría en un cron job; los
          precios mostrados son datos de demostración, no tarifas reales.
        </p>
      </div>
    </div>
  )
}

export default function AlertsPage() {
  return (
    <RequireAuth>
      <AlertsContent />
    </RequireAuth>
  )
}
