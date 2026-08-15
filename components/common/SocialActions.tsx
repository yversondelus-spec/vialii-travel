'use client'

import { useEffect, useRef, useState } from 'react'
import { Share2, MessageCircle, Camera, Send, Link2, Check, MessageSquare } from 'lucide-react'
import SaveTripButton from '@/components/trip/SaveTripButton'
import { cn } from '@/lib/utils/cn'

interface SocialActionsProps {
  tripId: string
  tripData?: unknown
  shareTitle: string
  shareUrl?: string
  savesCount?: number
  commentsCount?: number
  creatorHandle?: string
  className?: string
  /** 'overlay' = white icon buttons for use on top of a photo (TravelCard); 'auto' = normal light/dark-aware styling (plain page backgrounds). */
  theme?: 'auto' | 'overlay'
}

type CopyTarget = 'link' | 'instagram' | null

/**
 * Like/save (reuses the existing SaveTripButton — same backend, no new
 * concept), share (WhatsApp / X / Instagram / copy link), comment count, and
 * creator attribution. Instagram has no web share-intent URL, so that option
 * copies the link and tells the user to paste it — same as the generic
 * "copy link" action, just with different copy.
 */
export default function SocialActions({
  tripId,
  tripData,
  shareTitle,
  shareUrl,
  savesCount,
  commentsCount,
  creatorHandle,
  className,
  theme = 'auto',
}: SocialActionsProps) {
  const overlay = theme === 'overlay'
  const [shareOpen, setShareOpen] = useState(false)
  const [copiedFor, setCopiedFor] = useState<CopyTarget>(null)
  // Anchored via getBoundingClientRect + clamped to the viewport, not plain
  // CSS `right-0` — the trigger can sit anywhere (a card near the left edge,
  // an overlay button near the right edge), and a fixed anchor side pushed
  // the 224px-wide menu off-screen when the trigger was close to a viewport
  // edge (e.g. -104px offscreen on a 375px-wide mobile view).
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !triggerRef.current?.contains(e.target as Node)
      ) {
        setShareOpen(false)
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  const MENU_WIDTH = 224
  const VIEWPORT_MARGIN = 12

  const toggleShare = () => {
    if (shareOpen) {
      setShareOpen(false)
      return
    }
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) {
      const left = Math.min(
        Math.max(VIEWPORT_MARGIN, rect.right - MENU_WIDTH),
        window.innerWidth - MENU_WIDTH - VIEWPORT_MARGIN
      )
      setMenuPos({ top: rect.bottom + 8, left })
    }
    setShareOpen(true)
  }

  const url = shareUrl ?? (typeof window !== 'undefined' ? window.location.href : '')

  const copyLink = async (target: Exclude<CopyTarget, null>) => {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedFor(target)
      setTimeout(() => setCopiedFor(null), 2000)
    } catch {
      // Clipboard API can be denied — the link stays selectable in the address bar either way.
    }
  }

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(`${shareTitle} ${url}`)}`
  const twitterHref = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(url)}`

  return (
    <div className={cn('flex items-center gap-2', className)}>
      <SaveTripButton
        tripId={tripId}
        tripData={tripData}
        className={overlay ? 'bg-white/90 hover:bg-white border-white/60 dark:bg-white/90 dark:hover:bg-white dark:border-white/60' : undefined}
      />
      {typeof savesCount === 'number' && (
        <span className={cn('text-xs font-medium', overlay ? 'text-white/90' : 'text-slate-500 dark:text-slate-400')}>
          {savesCount}
        </span>
      )}

      <div>
        <button
          ref={triggerRef}
          type="button"
          onClick={toggleShare}
          aria-label="Compartir"
          aria-expanded={shareOpen}
          className={cn(
            'flex h-10 w-10 items-center justify-center rounded-full border transition-colors',
            overlay
              ? 'bg-white/90 hover:bg-white border-white/60 text-slate-600'
              : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-400 hover:text-blue-500 hover:border-blue-200 dark:hover:border-blue-900'
          )}
        >
          <Share2 size={18} />
        </button>

        {shareOpen && menuPos && (
          <div
            ref={menuRef}
            style={{ top: menuPos.top, left: menuPos.left, width: MENU_WIDTH }}
            className="fixed rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-lg py-1.5 z-50"
          >
            <a
              href={whatsappHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <MessageCircle size={15} className="text-green-500" /> WhatsApp
            </a>
            <a
              href={twitterHref}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <Send size={15} className="text-sky-500" /> X / Twitter
            </a>
            <button
              type="button"
              onClick={() => copyLink('instagram')}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {copiedFor === 'instagram' ? (
                <Check size={15} className="text-green-500" />
              ) : (
                <Camera size={15} className="text-pink-500" />
              )}
              {copiedFor === 'instagram' ? 'Pégalo en tu historia' : 'Instagram'}
            </button>
            <button
              type="button"
              onClick={() => copyLink('link')}
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              {copiedFor === 'link' ? <Check size={15} className="text-green-500" /> : <Link2 size={15} />}
              {copiedFor === 'link' ? 'Copiado' : 'Copiar link'}
            </button>
          </div>
        )}
      </div>

      {typeof commentsCount === 'number' && (
        <div className={cn('flex items-center gap-1 text-xs', overlay ? 'text-white/80' : 'text-slate-400 dark:text-slate-500')}>
          <MessageSquare size={15} /> {commentsCount}
        </div>
      )}

      {creatorHandle && (
        <span className={cn('ml-auto text-xs truncate', overlay ? 'text-white/80' : 'text-slate-500 dark:text-slate-400')}>
          por{' '}
          <span className={cn('font-semibold', overlay ? 'text-white' : 'text-slate-700 dark:text-slate-300')}>
            {creatorHandle}
          </span>
        </span>
      )}
    </div>
  )
}
