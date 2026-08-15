'use client'

import { Star, Check } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

export interface SelectableOption {
  id: string
  title: string
  subtitle?: string
  price: number
  rating?: number
  isCurrent: boolean
}

interface AlternativeComponentProps {
  option: SelectableOption
  /** vs the currently-selected option's price — positive = more expensive. */
  priceDelta?: number
  onSelect: () => void
}

function formatCLP(value: number) {
  return `$${Math.round(Math.abs(value)).toLocaleString('es-CL')}`
}

/** One selectable alternative row — shared by transport/hotel/activity swap lists (ComponentSelector), so there's one row implementation instead of three near-identical ones. */
export default function AlternativeComponent({ option, priceDelta, onSelect }: AlternativeComponentProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      disabled={option.isCurrent}
      className={cn(
        'w-full flex items-center justify-between gap-3 rounded-xl border-2 px-4 py-3 text-left transition-colors',
        option.isCurrent
          ? 'border-blue-400 dark:border-blue-600 bg-blue-50 dark:bg-blue-950/30 cursor-default'
          : 'border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700'
      )}
    >
      <div className="min-w-0">
        <p className="font-semibold text-slate-900 dark:text-slate-100 truncate">{option.title}</p>
        {option.subtitle && <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{option.subtitle}</p>}
        {option.rating !== undefined && (
          <p className="flex items-center gap-1 text-xs text-amber-500 mt-0.5">
            <Star size={11} className="fill-amber-400" /> {option.rating.toFixed(1)}
          </p>
        )}
      </div>
      <div className="text-right shrink-0">
        {option.isCurrent ? (
          <span className="flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400">
            <Check size={13} /> Actual
          </span>
        ) : (
          <>
            <p className="font-bold text-slate-900 dark:text-slate-100">{formatCLP(option.price)}</p>
            {priceDelta !== undefined && priceDelta !== 0 && (
              <p className={cn('text-xs font-medium', priceDelta > 0 ? 'text-red-500' : 'text-emerald-500')}>
                {priceDelta > 0 ? '+' : '-'}
                {formatCLP(priceDelta)}
              </p>
            )}
          </>
        )}
      </div>
    </button>
  )
}
