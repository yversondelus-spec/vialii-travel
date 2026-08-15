'use client'

import { useEffect, useState, type FormEvent } from 'react'
import Link from 'next/link'
import { MessageSquare, Heart, Trash2, Send } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { useAuth } from '@/lib/auth/authContext'
import { ensureUsername } from '@/lib/services/userProfileService'
import { getComments, addComment, deleteComment, likeComment } from '@/lib/services/commentService'
import type { TripComment } from '@/lib/types/comment'

interface CommentSectionProps {
  tripId: string
  onCountChange?: (count: number) => void
}

function relativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return 'ahora'
  if (minutes < 60) return `hace ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `hace ${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 30) return `hace ${days}d`
  return new Date(iso).toLocaleDateString('es-CL', { day: 'numeric', month: 'short' })
}

export default function CommentSection({ tripId, onCountChange }: CommentSectionProps) {
  const { user } = useAuth()
  const [comments, setComments] = useState<TripComment[]>([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [posting, setPosting] = useState(false)

  useEffect(() => {
    let cancelled = false
    const load = () => {
      setLoading(true)
      getComments(tripId).then((result) => {
        if (cancelled) return
        setComments(result)
        setLoading(false)
        onCountChange?.(result.length)
      })
    }
    load()
    return () => {
      cancelled = true
    }
    // onCountChange intentionally excluded — callers pass an inline setState fn that would otherwise re-trigger this on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tripId])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user || !text.trim()) return

    setPosting(true)
    const username = await ensureUsername(user.id, user.email)
    const comment = await addComment(tripId, user.id, username, text)
    setPosting(false)
    setText('')
    setComments((prev) => {
      const next = [comment, ...prev]
      onCountChange?.(next.length)
      return next
    })
  }

  const handleDelete = async (commentId: string) => {
    if (!user) return
    const ok = await deleteComment(commentId, user.id)
    if (!ok) return
    setComments((prev) => {
      const next = prev.filter((c) => c.id !== commentId)
      onCountChange?.(next.length)
      return next
    })
  }

  const handleLike = async (commentId: string) => {
    const ok = await likeComment(commentId)
    if (!ok) return
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, likes: c.likes + 1 } : c)))
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 sm:p-6">
      <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-4">
        <MessageSquare size={18} /> {comments.length} comentario{comments.length === 1 ? '' : 's'}
      </h2>

      {user ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-2 mb-6">
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Escribe un comentario..."
            className="flex-1 px-4 py-2.5 border border-slate-300 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-100 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <Button type="submit" size="md" isLoading={posting} disabled={!text.trim()} aria-label="Publicar comentario">
            <Send size={16} />
          </Button>
        </form>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">
          <Link href="/auth/login" className="text-blue-600 dark:text-blue-400 font-semibold hover:underline">
            Inicia sesión
          </Link>{' '}
          para comentar.
        </p>
      )}

      {loading ? (
        <p className="text-sm text-slate-500 dark:text-slate-400">Cargando comentarios...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-6">
          Sé el primero en comentar este viaje.
        </p>
      ) : (
        <ul className="space-y-4">
          {comments.map((comment) => (
            <li key={comment.id} className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full gradient-primary text-white text-sm font-bold">
                {comment.authorUsername.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link href={`/user/${comment.authorUsername}`} className="text-sm font-semibold text-slate-900 dark:text-slate-100 hover:underline">
                    @{comment.authorUsername}
                  </Link>
                  <span className="text-xs text-slate-400 dark:text-slate-500">{relativeTime(comment.createdAt)}</span>
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5 leading-relaxed break-words">{comment.text}</p>
                <div className="flex items-center gap-3 mt-1.5">
                  <button
                    type="button"
                    onClick={() => handleLike(comment.id)}
                    className="flex items-center gap-1 text-xs text-slate-400 hover:text-pink-500 dark:text-slate-500 dark:hover:text-pink-400 transition-colors"
                  >
                    <Heart size={13} /> {comment.likes > 0 ? comment.likes : 'Me gusta'}
                  </button>
                  {user?.id === comment.userId && (
                    <button
                      type="button"
                      onClick={() => handleDelete(comment.id)}
                      className="flex items-center gap-1 text-xs text-slate-400 hover:text-red-500 dark:text-slate-500 dark:hover:text-red-400 transition-colors"
                    >
                      <Trash2 size={13} /> Eliminar
                    </button>
                  )}
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
