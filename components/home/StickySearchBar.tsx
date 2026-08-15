'use client'

import { useEffect, useState } from 'react'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

/**
 * Keeps search reachable while scrolling the lifestyle sections without
 * duplicating TravelSearchForm's own state/validation in a second mini-form
 * — this just scrolls back to the real form (#search-form in app/page.tsx)
 * and lets that one do the work. Visibility is driven by whether the hero
 * (#hero-inspiration) is still on screen, not a raw scroll-Y threshold, so
 * it keeps working if the hero's height ever changes.
 */
export function StickySearchBar() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const hero = document.getElementById('hero-inspiration')
    if (!hero) return

    const observer = new IntersectionObserver(([entry]) => setVisible(!entry.isIntersecting), {
      // Header height (64px) plus a small buffer: sections below scroll to
      // exactly 64px from the top (scroll-mt-16), which lands the hero's
      // edge exactly on a bare -64px boundary — an ambiguous edge case for
      // isIntersecting. The extra 16px guarantees a real gap either side.
      rootMargin: '-80px 0px 0px 0px',
    })
    observer.observe(hero)
    return () => observer.disconnect()
  }, [])

  const scrollToSearch = () => {
    document.getElementById('search-form')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <div
      aria-hidden={!visible}
      className={cn(
        'fixed top-16 inset-x-0 z-40 transition-all duration-300',
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0 pointer-events-none'
      )}
    >
      <div className="backdrop-blur-xl bg-white/90 dark:bg-slate-950/90 border-b border-slate-200/50 dark:border-slate-800/50 shadow-sm">
        <div className="max-w-3xl mx-auto px-4 py-2.5">
          <button
            type="button"
            onClick={scrollToSearch}
            tabIndex={visible ? 0 : -1}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-full border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-left text-sm text-slate-500 dark:text-slate-400 hover:border-blue-300 dark:hover:border-blue-800 hover:text-slate-700 dark:hover:text-slate-300 transition-colors"
          >
            <Search size={16} className="shrink-0" />
            ¿A dónde quieres ir? Busca tu próximo viaje
          </button>
        </div>
      </div>
    </div>
  )
}

export default StickySearchBar
