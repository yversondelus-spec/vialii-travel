'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { User, Heart, LogOut, BellRing, LayoutDashboard } from 'lucide-react'
import { useAuth } from '@/lib/auth/authContext'
import { isAdminEmail } from '@/lib/auth/adminAllowlist'
import { cn } from '@/lib/utils/cn'

export default function UserMenu() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setIsOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  if (!user) return null

  const initial = user.email.charAt(0).toUpperCase()

  const handleLogout = async () => {
    setIsOpen(false)
    await logout()
    router.push('/')
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        aria-label="Menú de usuario"
        aria-expanded={isOpen}
        className="flex h-9 w-9 items-center justify-center rounded-full gradient-primary text-white font-semibold text-sm hover:scale-105 transition-transform"
      >
        {initial}
      </button>

      {isOpen && (
        <div
          className={cn(
            'absolute right-0 mt-2 w-56 rounded-xl border border-slate-200 dark:border-slate-800',
            'bg-white dark:bg-slate-900 shadow-lg py-1.5 z-50'
          )}
        >
          <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-800">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">{user.email}</p>
          </div>

          <Link
            href="/profile"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <User size={15} /> Perfil
          </Link>
          <Link
            href="/profile?tab=saved"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <Heart size={15} /> Viajes guardados
          </Link>
          <Link
            href="/alerts"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
          >
            <BellRing size={15} /> Alertas de precio
          </Link>
          {isAdminEmail(user.email) && (
            <Link
              href="/admin"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <LayoutDashboard size={15} /> Panel de administración
            </Link>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
          >
            <LogOut size={15} /> Cerrar sesión
          </button>
        </div>
      )}
    </div>
  )
}
