'use client'

import { useEffect, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/authContext'

export default function AuthLayout({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()

  // Already signed in? These pages don't apply anymore.
  useEffect(() => {
    if (!loading && isAuthenticated) router.replace('/search')
  }, [loading, isAuthenticated, router])

  if (loading || isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    )
  }

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8 group">
          <span className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-200 inline-block tracking-tight">
            VIALII
          </span>
        </Link>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-8">
          {children}
        </div>
      </div>
    </div>
  )
}
