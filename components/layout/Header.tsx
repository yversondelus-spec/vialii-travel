'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Button } from '@/components/common/Button'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { CurrencySelector } from '@/components/shared/CurrencySelector'
import UserMenu from '@/components/auth/UserMenu'
import { useAuth } from '@/lib/auth/authContext'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { isAuthenticated } = useAuth()

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 border-b border-slate-200/50 shadow-sm dark:bg-slate-950/80 dark:border-slate-800/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-500 to-cyan-500 bg-clip-text text-transparent group-hover:scale-105 transition-transform duration-200 inline-block tracking-tight">
              VIALII
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="/feed" className="text-slate-600 hover:text-blue-600 transition-colors font-medium dark:text-slate-300 dark:hover:text-blue-400">
              Feed
            </Link>
            <Link href="/explore" className="text-slate-600 hover:text-blue-600 transition-colors font-medium dark:text-slate-300 dark:hover:text-blue-400">
              Explore
            </Link>
            <Link href="/search" className="text-slate-600 hover:text-blue-600 transition-colors font-medium dark:text-slate-300 dark:hover:text-blue-400">
              Search
            </Link>
            <Link href="/pricing" className="text-slate-600 hover:text-blue-600 transition-colors font-medium dark:text-slate-300 dark:hover:text-blue-400">
              Pricing
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <CurrencySelector />
            <ThemeToggle />
            {isAuthenticated ? (
              <UserMenu />
            ) : (
              <>
                <Link href="/auth/login">
                  <Button variant="ghost" size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup">
                  <Button size="sm">Get Started</Button>
                </Link>
              </>
            )}
          </div>

          <div className="flex items-center gap-1 md:hidden">
            <CurrencySelector />
            <ThemeToggle />
            {isAuthenticated && <UserMenu />}
            <button
              className="text-slate-600 hover:text-slate-900 transition-colors dark:text-slate-300 dark:hover:text-white p-2"
              onClick={() => setIsOpen(!isOpen)}
              aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {isOpen ? '✕' : '☰'}
            </button>
          </div>
        </div>

        {isOpen && (
          <nav className="md:hidden pb-4 border-t border-slate-200/50 space-y-2 dark:border-slate-800/50">
            <Link href="/feed" className="block py-2 text-slate-600 hover:text-blue-600 transition-colors dark:text-slate-300 dark:hover:text-blue-400">
              Feed
            </Link>
            <Link href="/explore" className="block py-2 text-slate-600 hover:text-blue-600 transition-colors dark:text-slate-300 dark:hover:text-blue-400">
              Explore
            </Link>
            <Link href="/search" className="block py-2 text-slate-600 hover:text-blue-600 transition-colors dark:text-slate-300 dark:hover:text-blue-400">
              Search
            </Link>
            <Link href="/pricing" className="block py-2 text-slate-600 hover:text-blue-600 transition-colors dark:text-slate-300 dark:hover:text-blue-400">
              Pricing
            </Link>
            {!isAuthenticated && (
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-200/50 dark:border-slate-800/50">
                <Link href="/auth/login" onClick={() => setIsOpen(false)}>
                  <Button variant="ghost" fullWidth size="sm">
                    Sign In
                  </Button>
                </Link>
                <Link href="/auth/signup" onClick={() => setIsOpen(false)}>
                  <Button fullWidth size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </nav>
        )}
      </div>
    </header>
  )
}