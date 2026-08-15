import { Suspense } from 'react'
import SignupForm from '@/components/auth/SignupForm'

export default function SignupPage() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-1">Crea tu cuenta</h1>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
        Guarda tus viajes favoritos y compáralos cuando quieras
      </p>
      <Suspense fallback={null}>
        <SignupForm />
      </Suspense>
    </div>
  )
}
