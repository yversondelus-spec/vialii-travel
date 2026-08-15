'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/authContext'
import { isAdminEmail } from '@/lib/auth/adminAllowlist'

/**
 * Same client-side-guard reasoning as RequireAuth (see that file) — plus an
 * admin-email check. Not real role-based access control (there's no server
 * to enforce it), just enough gating for a demo admin view.
 */
export default function RequireAdmin({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { user, loading, isAuthenticated } = useAuth()
  const isAdmin = isAuthenticated && isAdminEmail(user?.email)

  useEffect(() => {
    if (!loading && !isAdmin) router.replace('/')
  }, [loading, isAdmin, router])

  if (loading || !isAdmin) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-slate-600 dark:text-slate-400">Verificando acceso...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
