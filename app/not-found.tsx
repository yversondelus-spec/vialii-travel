import Link from 'next/link'
import { Compass } from 'lucide-react'
import { Button } from '@/components/common/Button'

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-blue-50 text-blue-500 dark:bg-blue-950/40 dark:text-blue-400">
          <Compass size={24} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">Página no encontrada</h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6">
          Este destino no existe (todavía). Volvamos a algo que sí puedas visitar.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link href="/">
            <Button>Ir a inicio</Button>
          </Link>
          <Link href="/search">
            <Button variant="secondary">Buscar viajes</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
