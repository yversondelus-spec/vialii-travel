'use client'

import { useEffect, useState } from 'react'
import { cn } from '@/lib/utils/cn'

// Multiple <ThemeToggle> instances can be mounted at once (Header + Profile
// settings, for example). Each keeps its own `isDark` state, so one instance
// toggling the theme needs to tell the others — this custom event is that
// channel; every instance dispatches it after a toggle and listens for it.
const THEME_CHANGE_EVENT = 'travelai:theme-change'

export function ThemeToggle({ className }: { className?: string }) {
  // Starts null so we render nothing on the server and match whatever the
  // no-FOUC script in layout.tsx already applied to <html> on first paint.
  const [isDark, setIsDark] = useState<boolean | null>(null)

  useEffect(() => {
    const sync = () => setIsDark(document.documentElement.classList.contains('dark'))
    sync()
    window.addEventListener(THEME_CHANGE_EVENT, sync)
    return () => window.removeEventListener(THEME_CHANGE_EVENT, sync)
  }, [])

  const toggle = () => {
    const next = !isDark
    document.documentElement.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
    window.dispatchEvent(new Event(THEME_CHANGE_EVENT))
  }

  if (isDark === null) {
    return <div className={cn('h-9 w-9', className)} aria-hidden="true" />
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      title={isDark ? 'Modo claro' : 'Modo oscuro'}
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors',
        'dark:text-slate-300 dark:hover:bg-slate-800 dark:hover:text-white',
        className
      )}
    >
      {isDark ? '☀️' : '🌙'}
    </button>
  )
}
