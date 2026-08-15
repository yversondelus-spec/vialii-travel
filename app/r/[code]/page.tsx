'use client'

import { use } from 'react'
import Link from 'next/link'
import { Gift, ArrowRight } from 'lucide-react'
import { Button } from '@/components/common/Button'

interface ReferralLandingProps {
  params: Promise<{ code: string }>
}

export default function ReferralLandingPage({ params }: ReferralLandingProps) {
  const { code } = use(params)
  const normalized = decodeURIComponent(code).toUpperCase()

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-16">
      <div className="max-w-md w-full text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl gradient-primary text-white">
          <Gift size={28} />
        </div>
        <h1 className="text-3xl font-bold text-slate-900 dark:text-white mb-2 tracking-tight">
          Tu amigo te invitó a VIALII
        </h1>
        <p className="text-slate-600 dark:text-slate-400 mb-6 leading-relaxed">
          Únete con el código de invitación y{' '}
          <strong className="text-slate-900 dark:text-slate-100">ambos ganan $50.000 en créditos</strong> para tu
          próximo viaje.
        </p>

        <div className="mb-8 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-4 py-3 text-center font-mono font-bold text-lg text-blue-700 dark:text-blue-300 tracking-wider">
          {normalized}
        </div>

        <Link href={`/auth/signup?ref=${encodeURIComponent(normalized)}`}>
          <Button size="lg" fullWidth>
            Únete y ambos ganan $50k <ArrowRight size={18} className="ml-2" />
          </Button>
        </Link>

        <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
            Inicia sesión
          </Link>
        </p>
      </div>
    </div>
  )
}
