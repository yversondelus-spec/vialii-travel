'use client'

import { SearchX } from 'lucide-react'

type Tab = 'for_you' | 'best_price' | 'best_experience' | 'offers'

const TAB_EMPTY_COPY: Record<Tab, string> = {
  for_you: 'No encontramos una recomendación personalizada, pero mira las otras pestañas.',
  best_price: 'No hay opciones que mostrar con los filtros actuales.',
  best_experience: 'No encontramos opciones destacadas por comodidad — prueba "Mejor precio".',
  offers: 'No hay ofertas activas ahora mismo, pero mira "Mejor precio" o "Para ti".',
}

export default function EmptyResults({ tab }: { tab: Tab }) {
  return (
    <div className="text-center py-12 text-slate-500 dark:text-slate-400">
      <SearchX className="mx-auto mb-3 text-slate-300 dark:text-slate-700" size={32} />
      <p>{TAB_EMPTY_COPY[tab]}</p>
    </div>
  )
}
