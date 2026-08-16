'use client'

import { useEffect, useRef, useState, useSyncExternalStore } from 'react'
import { ChevronDown, Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { useCurrency } from '@/lib/currency/currencyContext'
import { SUPPORTED_CURRENCIES } from '@/lib/services/currencyService'
import type { CurrencyCode } from '@/lib/types/currency'

const POPULAR = SUPPORTED_CURRENCIES.filter((c) => c.popular)
const OTHERS = SUPPORTED_CURRENCIES.filter((c) => !c.popular)

// El servidor no puede leer localStorage, asi que renderiza DEFAULT_CURRENCY
// mientras el cliente ya conoce la moneda guardada — dos textos distintos para
// el mismo nodo, que es lo que React reporta como hydration mismatch.
// `useSyncExternalStore` es la API que React da para esto: el tercer argumento
// es el snapshot del servidor (false) y el segundo el del cliente (true).
// Definidos fuera del componente para que las referencias sean estables.
const subscribeNoop = () => () => {}
const getClientSnapshot = () => true
const getServerSnapshot = () => false

export function CurrencySelector({ className }: { className?: string }) {
  const { currency, currencyInfo, setCurrency } = useCurrency()
  const [open, setOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const mounted = useSyncExternalStore(subscribeNoop, getClientSnapshot, getServerSnapshot)

  useEffect(() => {
    if (!open) return
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open])

  const pick = (code: CurrencyCode) => {
    setCurrency(code)
    setOpen(false)
  }

  return (
    <div ref={rootRef} className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Cambiar moneda"
        aria-expanded={open}
        title="Cambiar moneda"
        className="flex h-9 items-center gap-1 rounded-lg px-2.5 text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white"
      >
        {/* `invisible` en vez de vacio: reserva el ancho y evita que el header salte al hidratar. */}
        <span className={cn(!mounted && 'invisible')}>{mounted ? currencyInfo.code : 'USD'}</span>
        <ChevronDown size={14} className={cn('transition-transform', open && 'rotate-180')} />
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-64 max-h-96 overflow-y-auto rounded-xl border border-slate-200 bg-white shadow-lg dark:border-slate-800 dark:bg-slate-900">
          <div className="px-3 pt-3 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
            Monedas populares
          </div>
          <ul>
            {POPULAR.map((c) => (
              <li key={c.code}>
                <button
                  type="button"
                  onClick={() => pick(c.code)}
                  className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                    <span className="w-6 shrink-0 font-mono text-slate-400 dark:text-slate-500">{c.symbol}</span>
                    <span>
                      {c.name} <span className="text-slate-400 dark:text-slate-500">· {c.code}</span>
                    </span>
                  </span>
                  {currency === c.code && <Check size={16} className="shrink-0 text-blue-500" />}
                </button>
              </li>
            ))}
          </ul>

          {!showAll ? (
            <button
              type="button"
              onClick={() => setShowAll(true)}
              className="w-full px-3 py-2 text-left text-sm font-medium text-blue-600 hover:bg-slate-50 dark:text-blue-400 dark:hover:bg-slate-800"
            >
              Ver todas ({OTHERS.length}) »
            </button>
          ) : (
            <>
              <div className="px-3 pt-2 pb-1 text-xs font-semibold uppercase tracking-wide text-slate-400 dark:text-slate-500">
                Todas las monedas
              </div>
              <ul className="pb-2">
                {OTHERS.map((c) => (
                  <li key={c.code}>
                    <button
                      type="button"
                      onClick={() => pick(c.code)}
                      className="flex w-full items-center justify-between gap-2 px-3 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-slate-800"
                    >
                      <span className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                        <span className="w-6 shrink-0 font-mono text-slate-400 dark:text-slate-500">{c.symbol}</span>
                        <span>
                          {c.name} <span className="text-slate-400 dark:text-slate-500">· {c.code}</span>
                        </span>
                      </span>
                      {currency === c.code && <Check size={16} className="shrink-0 text-blue-500" />}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </div>
  )
}