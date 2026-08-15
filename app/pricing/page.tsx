'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Check, Sparkles } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import { useAuth } from '@/lib/auth/authContext'
import { getSubscription } from '@/lib/services/subscriptionService'
import { FREE_SAVED_TRIPS_LIMIT, PREMIUM_PRICE } from '@/lib/types/subscription'
import type { PlanTier } from '@/lib/types/subscription'

const FREE_FEATURES = [
  `${FREE_SAVED_TRIPS_LIMIT} viajes guardados`,
  'Comparador de transporte ilimitado',
  'Planificador de itinerarios con IA',
]

const PREMIUM_FEATURES = [
  'Viajes guardados ilimitados',
  'Alertas de precio por ruta',
  'Historial de precios',
  'Soporte prioritario',
]

function PricingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isAuthenticated } = useAuth()
  const [tier, setTier] = useState<PlanTier>('free')
  const upsell = searchParams.get('upsell')

  useEffect(() => {
    if (!user) return
    getSubscription(user.id).then((sub) => setTier(sub.tier))
  }, [user])

  const handleUpgradeClick = () => {
    router.push(isAuthenticated ? '/checkout' : '/auth/login')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-8 sm:py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-4">Elige tu plan</h1>
          <p className="text-lg text-slate-600 dark:text-slate-400">
            Compara buses, vuelos y trenes gratis. Desbloquea alertas de precio y viajes ilimitados con Premium.
          </p>
        </div>

        {upsell === 'trips' && (
          <div className="mb-8 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 text-center">
            Llegaste al límite de {FREE_SAVED_TRIPS_LIMIT} viajes guardados del plan Free. Mejora a Premium para
            guardar sin límite.
          </div>
        )}

        {upsell === 'alerts' && (
          <div className="mb-8 rounded-xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/30 px-4 py-3 text-sm text-amber-800 dark:text-amber-300 text-center">
            Las alertas de precio son una función Premium. Mejora tu plan para recibir un aviso cuando baje el
            precio de tu ruta.
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100">Free</h2>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 mt-2">$0</p>
            </CardHeader>
            <CardBody className="space-y-3">
              {FREE_FEATURES.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <Check size={16} className="text-green-500 shrink-0" /> {feature}
                </div>
              ))}
              <Button variant="secondary" fullWidth className="mt-4" disabled>
                {tier === 'free' ? 'Tu plan actual' : 'Plan Free'}
              </Button>
            </CardBody>
          </Card>

          <Card className="border-2 border-blue-500 relative overflow-visible">
            <Badge variant="primary" className="absolute -top-3 left-1/2 -translate-x-1/2 gap-1">
              <Sparkles size={12} /> Recomendado
            </Badge>
            <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0">
              <h2 className="text-xl font-bold">Premium</h2>
              <p className="text-3xl font-bold mt-2">
                ${PREMIUM_PRICE.toLocaleString('es-CL')}
                <span className="text-sm font-normal">/mes</span>
              </p>
            </CardHeader>
            <CardBody className="space-y-3">
              {PREMIUM_FEATURES.map((feature) => (
                <div key={feature} className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                  <Check size={16} className="text-green-500 shrink-0" /> {feature}
                </div>
              ))}
              <Button fullWidth className="mt-4" onClick={handleUpgradeClick} disabled={tier === 'premium'}>
                {tier === 'premium' ? 'Ya eres Premium' : 'Mejorar a Premium'}
              </Button>
            </CardBody>
          </Card>
        </div>

        <p className="text-center text-xs text-slate-400 dark:text-slate-500 mt-8">
          Checkout de demostración — no se realiza ningún cargo real.
        </p>
      </div>
    </div>
  )
}

export default function PricingPage() {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-24">
          <div className="animate-spin text-4xl">⏳</div>
        </div>
      }
    >
      <PricingContent />
    </Suspense>
  )
}
