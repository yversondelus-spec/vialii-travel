'use client'

import { useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { logger } from '@/lib/logger'

// Catches render/render-phase errors anywhere under this segment (i.e. most
// of the app — this file sits at the root). Route-level errors elsewhere in
// the tree bubble up here unless a more specific error.tsx intercepts first.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    logger.error('Unhandled render error', {
      message: error.message,
      digest: error.digest,
      stack: error.stack,
    })
  }, [error])

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-50 text-red-500 dark:bg-red-950/40 dark:text-red-400">
          <AlertTriangle size={24} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Algo salió mal</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Tuvimos un problema inesperado. Ya quedó registrado — intenta de nuevo o vuelve al inicio.
        </p>

        {process.env.NODE_ENV === 'development' && (
          <pre className="mb-6 max-h-48 overflow-auto rounded-lg bg-slate-100 dark:bg-slate-800 p-4 text-left text-xs text-slate-700 dark:text-slate-300">
            {error.message}
          </pre>
        )}

        <div className="flex items-center justify-center gap-3">
          <Button onClick={() => reset()}>Intentar de nuevo</Button>
          <Link href="/">
            <Button variant="secondary">Ir a inicio</Button>
          </Link>
        </div>

        {error.digest && <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">ID: {error.digest}</p>}
      </div>
    </div>
  )
}
