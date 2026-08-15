'use client'

import { useState, type FormEvent } from 'react'
import { Mail, Check } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { subscribeEmail } from '@/lib/services/newsletterService'
import type { NewsletterFrequency } from '@/lib/types/newsletter'

export default function NewsletterSignup() {
  const [email, setEmail] = useState('')
  const [frequency, setFrequency] = useState<NewsletterFrequency>('weekly')
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle')

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setStatus('loading')
    const ok = await subscribeEmail(email, frequency)
    setStatus(ok ? 'done' : 'error')
  }

  if (status === 'done') {
    return (
      <div className="rounded-2xl border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/30 px-6 py-8 text-center">
        <Check className="mx-auto mb-2 text-emerald-500" size={28} />
        <p className="font-semibold text-emerald-800 dark:text-emerald-300">¡Listo! Ya estás suscrito.</p>
        <p className="text-sm text-emerald-700/80 dark:text-emerald-400/80 mt-1">
          Revisa tu correo para la próxima ronda de inspiración.
        </p>
      </div>
    )
  }

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-6 py-8 text-center">
      <Mail className="mx-auto mb-3 text-blue-600 dark:text-blue-400" size={28} />
      <h3 className="text-xl font-semibold text-slate-900 dark:text-slate-100 mb-1">Recibe inspiración en tu correo</h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-5 max-w-sm mx-auto leading-relaxed">
        Los mejores viajes curados para ti cada semana.
      </p>

      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2 max-w-md mx-auto">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="tu@email.com"
          className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
        <select
          value={frequency}
          onChange={(e) => setFrequency(e.target.value as NewsletterFrequency)}
          className="px-3 py-2.5 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        >
          <option value="daily">Diario</option>
          <option value="weekly">Semanal</option>
          <option value="monthly">Mensual</option>
        </select>
        <Button type="submit" isLoading={status === 'loading'}>
          Recibir inspiración
        </Button>
      </form>
      {status === 'error' && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-3">Ingresa un email válido.</p>
      )}
    </div>
  )
}
