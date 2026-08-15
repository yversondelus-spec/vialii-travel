'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/authContext'

/**
 * Client-side route guard.
 *
 * The session lives in localStorage (as specified), which a server-side
 * `middleware.ts` has no access to — Edge middleware runs before any client
 * JS and can't read localStorage, so a literal middleware-based redirect for
 * this session model would either never fire or always fire. This
 * client-side guard is the substitute that actually works: it redirects to
 * /auth/login once we know (after the initial session check) that no one is
 * signed in.
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()

  useEffect(() => {
    if (!loading && !isAuthenticated) router.replace('/auth/login')
  }, [loading, isAuthenticated, router])

  if (loading || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="text-center">
          <div className="animate-spin text-4xl mb-4">⏳</div>
          <p className="text-slate-600 dark:text-slate-400">Verificando sesión...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
