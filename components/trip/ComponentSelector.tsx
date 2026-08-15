'use client'

import { useState } from 'react'
import { X, Wand2 } from 'lucide-react'
import AlternativeComponent, { type SelectableOption } from './AlternativeComponent'
import { cn } from '@/lib/utils/cn'

interface ComponentSelectorProps {
  title: string
  options: SelectableOption[]
  preferenceOptions?: { id: string; label: string }[]
  onPreferenceChange?: (id: string) => void
  onSelect: (id: string) => void
  onClose: () => void
}

/** Modal for swapping one pack component — the [Cambiar]/[Ver alternativas] destination from ModularPackBuilder. Same shell for transport, hotel, and activities; only the rows (built by the caller into SelectableOption) differ. */
export default function ComponentSelector({ title, options, preferenceOptions, onPreferenceChange, onSelect, onClose }: ComponentSelectorProps) {
  const [activePreference, setActivePreference] = useState<string | null>(null)
  const current = options.find((o) => o.isCurrent)

  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center px-4 py-8"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="component-selector-title"
    >
      <div
        className="bg-white dark:bg-slate-900 rounded-2xl w-full max-w-md max-h-full overflow-y-auto shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-5 py-4 flex items-center justify-between z-10">
          <h2 id="component-selector-title" className="text-lg font-bold text-slate-900 dark:text-slate-100">
            {title}
          </h2>
          <button type="button" onClick={onClose} aria-label="Cerrar" className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {preferenceOptions && preferenceOptions.length > 0 && (
            <div>
              <p className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2">
                <Wand2 size={12} /> Buscar con IA
              </p>
              <div className="flex flex-wrap gap-1.5">
                {preferenceOptions.map((pref) => (
                  <button
                    key={pref.id}
                    type="button"
                    onClick={() => {
                      const next = activePreference === pref.id ? null : pref.id
                      setActivePreference(next)
                      onPreferenceChange?.(next ?? '')
                    }}
                    className={cn(
                      'px-3 py-1.5 rounded-full text-xs font-semibold border-2 transition-colors',
                      activePreference === pref.id
                        ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white border-transparent'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:border-blue-300'
                    )}
                  >
                    {pref.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            {options.map((option) => (
              <AlternativeComponent
                key={option.id}
                option={option}
                priceDelta={current ? option.price - current.price : undefined}
                onSelect={() => onSelect(option.id)}
              />
            ))}
            {options.length === 0 && (
              <p className="text-center text-sm text-slate-500 dark:text-slate-400 py-6">No hay alternativas disponibles ahora mismo.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
