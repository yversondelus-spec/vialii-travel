'use client'

import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/common/Button'
import { useAuth } from '@/lib/auth/authContext'
import { redeemReferralCode } from '@/lib/services/referralService'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function SignupForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const refCode = searchParams.get('ref')
  const { signup, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  // signup() updates auth state but doesn't hand back the new user directly —
  // this flag tells the effect below "a signup just happened, redeem the
  // referral once `user` shows up" instead of firing on every render where a
  // ref code and a (possibly pre-existing) user happen to both be present.
  const justSignedUp = useRef(false)

  useEffect(() => {
    if (justSignedUp.current && user && refCode) {
      justSignedUp.current = false
      redeemReferralCode(refCode, user.id, user.email).catch(() => {
        // Best-effort — a failed redeem shouldn't block the new account.
      })
    }
  }, [user, refCode])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!EMAIL_RE.test(email)) {
      setError('Ingresa un email válido')
      return
    }
    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres')
      return
    }
    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    justSignedUp.current = true
    const result = await signup(email, password)
    setLoading(false)

    if (result.error) {
      justSignedUp.current = false
      setError(result.error)
      return
    }
    router.push('/search')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {refCode && (
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 px-4 py-3 text-sm text-emerald-700 dark:text-emerald-400">
          🎁 Código de invitación <strong>{refCode}</strong> aplicado — ambos ganan $50.000 en créditos.
        </div>
      )}
      {error && (
        <div className="rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 px-4 py-3 text-sm text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      <div>
        <label htmlFor="email" className="block text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="tu@email.com"
        />
      </div>

      <div>
        <label htmlFor="password" className="block text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100">
          Contraseña
        </label>
        <input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="Mínimo 8 caracteres"
        />
      </div>

      <div>
        <label htmlFor="confirmPassword" className="block text-sm font-semibold mb-2 text-slate-900 dark:text-slate-100">
          Confirmar contraseña
        </label>
        <input
          id="confirmPassword"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-2 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="••••••••"
        />
      </div>

      <Button type="submit" fullWidth isLoading={loading}>
        {loading ? 'Creando cuenta...' : 'Crear cuenta'}
      </Button>

      <p className="text-center text-sm text-slate-600 dark:text-slate-400">
        ¿Ya tienes cuenta?{' '}
        <Link href="/auth/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
          Inicia sesión
        </Link>
      </p>
    </form>
  )
}
