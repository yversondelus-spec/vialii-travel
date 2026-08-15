'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { MailX, CheckCircle2, XCircle } from 'lucide-react'
import { unsubscribeByToken } from '@/lib/services/newsletterService'

interface UnsubscribePageProps {
  params: Promise<{ token: string }>
}

export default function UnsubscribePage({ params }: UnsubscribePageProps) {
  const { token } = use(params)
  const [status, setStatus] = useState<'loading' | 'done' | 'error'>('loading')

  useEffect(() => {
    let cancelled = false
    unsubscribeByToken(decodeURIComponent(token)).then((ok) => {
      if (!cancelled) setStatus(ok ? 'done' : 'error')
    })
    return () => {
      cancelled = true
    }
  }, [token])

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-6 py-16">
      <div className="max-w-sm w-full text-center">
        {status === 'loading' && (
          <>
            <div className="animate-spin text-4xl mb-4">⏳</div>
            <p className="text-slate-600 dark:text-slate-400">Procesando...</p>
          </>
        )}
        {status === 'done' && (
          <>
            <CheckCircle2 className="mx-auto mb-4 text-emerald-500" size={40} />
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">Te desuscribiste</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">
              Ya no recibirás más correos de inspiración de viajes de nuestra parte.
            </p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="mx-auto mb-4 text-red-500" size={40} />
            <h1 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-2">No pudimos procesar tu solicitud</h1>
            <p className="text-slate-600 dark:text-slate-400 mb-6">El link puede haber expirado o ya fue usado.</p>
          </>
        )}
        <Link href="/" className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline">
          <MailX size={15} /> Volver al inicio
        </Link>
      </div>
    </div>
  )
}
