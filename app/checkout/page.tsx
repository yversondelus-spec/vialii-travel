'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ShieldCheck, Sparkles, Check } from 'lucide-react'
import RequireAuth from '@/components/auth/RequireAuth'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { useAuth } from '@/lib/auth/authContext'
import { useCurrency } from '@/lib/currency/currencyContext'
import { getSubscription, upgradeToPremium } from '@/lib/services/subscriptionService'
import { PREMIUM_PRICE, PREMIUM_CURRENCY } from '@/lib/types/subscription'
import type { Invoice, PlanTier } from '@/lib/types/subscription'
import type { CurrencyCode } from '@/lib/types/currency'

function CheckoutContent() {
  const { user } = useAuth()
  const { currency, displayPrice } = useCurrency()
  const showConverted = currency !== PREMIUM_CURRENCY
  const [tier, setTier] = useState<PlanTier>('free')
  const [processing, setProcessing] = useState(false)
  const [invoice, setInvoice] = useState<Invoice | null>(null)

  useEffect(() => {
    if (!user) return
    getSubscription(user.id).then((sub) => setTier(sub.tier))
  }, [user])

  if (!user) return null

  const handleConfirm = async () => {
    setProcessing(true)
    const result = await upgradeToPremium(user.id, user.email)
    setInvoice(result)
    setTier('premium')
    setProcessing(false)
  }

  if (invoice) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-12 flex items-center justify-center px-4">
        <Card className="max-w-md w-full text-center">
          <CardBody className="py-10">
            <div className="text-5xl mb-4">🎉</div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">¡Ya eres Premium!</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Te enviamos un recibo a <strong>{user.email}</strong> (registrado en tu bandeja de emails de la demo).
            </p>

            <div className="rounded-xl border border-slate-200 dark:border-slate-800 p-4 text-left text-sm space-y-1 mb-6">
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">N° de factura</span>
                <span className="font-mono text-slate-700 dark:text-slate-300">{invoice.id.slice(0, 8)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Monto</span>
                <span className="font-semibold text-slate-900 dark:text-slate-100">
                  ${invoice.amount.toLocaleString('es-CL')} {invoice.currency}
                  {invoice.currency !== currency && (
                    <span className="ml-1 font-normal text-slate-400 dark:text-slate-500">
                      (~{displayPrice(invoice.amount, invoice.currency as CurrencyCode)})
                    </span>
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500 dark:text-slate-400">Fecha</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {new Date(invoice.issuedAt).toLocaleDateString('es-CL')}
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Link href="/alerts">
                <Button fullWidth>Configurar alertas de precio</Button>
              </Link>
              <Link href="/profile">
                <Button variant="secondary" fullWidth>
                  Ir a mi perfil
                </Button>
              </Link>
            </div>
          </CardBody>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-12 flex items-center justify-center px-4">
      <Card className="max-w-md w-full">
        <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0">
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Sparkles size={18} /> Mejorar a Premium
          </h1>
        </CardHeader>
        <CardBody>
          {tier === 'premium' ? (
            <div className="text-center py-6">
              <Check size={32} className="mx-auto text-green-500 mb-3" />
              <p className="text-slate-700 dark:text-slate-300 mb-4">Ya tienes el plan Premium.</p>
              <Link href="/alerts">
                <Button fullWidth>Ir a mis alertas de precio</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between py-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Plan Premium (mensual)</span>
                <span className="text-right">
                  <span className="font-semibold text-slate-900 dark:text-slate-100 block">
                    ${PREMIUM_PRICE.toLocaleString('es-CL')} {PREMIUM_CURRENCY}
                  </span>
                  {showConverted && (
                    <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
                      ~{displayPrice(PREMIUM_PRICE, PREMIUM_CURRENCY as CurrencyCode)}
                    </span>
                  )}
                </span>
              </div>
              <div className="flex items-center justify-between py-3 font-semibold">
                <span className="text-slate-900 dark:text-slate-100">Total hoy</span>
                <span className="text-right">
                  <span className="text-slate-900 dark:text-slate-100 block">
                    ${PREMIUM_PRICE.toLocaleString('es-CL')} {PREMIUM_CURRENCY}
                  </span>
                  {showConverted && (
                    <span className="text-xs font-normal text-slate-400 dark:text-slate-500">
                      ~{displayPrice(PREMIUM_PRICE, PREMIUM_CURRENCY as CurrencyCode)}
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-start gap-2 rounded-lg bg-slate-50 dark:bg-slate-800/50 p-3 text-xs text-slate-500 dark:text-slate-400 mt-2 mb-6">
                <ShieldCheck size={28} className="shrink-0 text-slate-400" />
                <span>
                  Este es un checkout de <strong>demostración</strong>: no se pide ni se procesa ningún dato de
                  pago real, y no se realiza ningún cargo. Un botón de confirmación simula la compra.
                </span>
              </div>

              <Button fullWidth isLoading={processing} onClick={handleConfirm}>
                {processing ? 'Procesando...' : 'Confirmar actualización (demo)'}
              </Button>
            </>
          )}
        </CardBody>
      </Card>
    </div>
  )
}

export default function CheckoutPage() {
  return (
    <RequireAuth>
      <CheckoutContent />
    </RequireAuth>
  )
}
