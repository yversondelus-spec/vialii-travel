import { supabase } from '@/lib/db/client'
import { withSupabaseFallback } from '@/lib/utils/supabaseCircuit'
import type { TripComment } from '@/lib/types/comment'

// Same Supabase-first / localStorage-fallback pattern as the rest of lib/services.
const LOCAL_KEY = 'travelai_trip_comments'

function readLocal(): TripComment[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]')
  } catch {
    return []
  }
}
function writeLocal(comments: TripComment[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(comments))
}

interface TripCommentRow {
  id: string
  trip_id: string
  user_id: string
  author_username: string
  text: string
  created_at: string
  likes: number | null
}

function rowToComment(row: TripCommentRow): TripComment {
  return {
    id: row.id,
    tripId: row.trip_id,
    userId: row.user_id,
    authorUsername: row.author_username,
    text: row.text,
    createdAt: row.created_at,
    likes: row.likes ?? 0,
  }
}

export async function getComments(tripId: string): Promise<TripComment[]> {
  try {
    return await withSupabaseFallback(
      async () => {
        const { data, error } = await supabase
          .from('trip_comments')
          .select('*')
          .eq('trip_id', tripId)
          .order('created_at', { ascending: false })
        if (error) throw error
        return (data ?? []).map(rowToComment)
      },
      () =>
        readLocal()
          .filter((c) => c.tripId === tripId)
          .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1))
    )
  } catch {
    return []
  }
}

export async function addComment(
  tripId: string,
  userId: string,
  authorUsername: string,
  text: string
): Promise<TripComment> {
  const trimmed = text.trim()
  const comment: TripComment = {
    id: crypto.randomUUID(),
    tripId,
    userId,
    authorUsername,
    text: trimmed,
    createdAt: new Date().toISOString(),
    likes: 0,
  }

  await withSupabaseFallback(
    async () => {
      const { error } = await supabase.from('trip_comments').insert([
        {
          id: comment.id,
          trip_id: comment.tripId,
          user_id: comment.userId,
          author_username: comment.authorUsername,
          text: comment.text,
          created_at: comment.createdAt,
          likes: 0,
        },
      ])
      if (error) throw error
    },
    () => writeLocal([comment, ...readLocal()])
  )

  return comment
}

export async function deleteComment(commentId: string, userId: string): Promise<boolean> {
  return withSupabaseFallback(
    async () => {
      const { error } = await supabase.from('trip_comments').delete().eq('id', commentId).eq('user_id', userId)
      if (error) throw error
      return true
    },
    () => {
      const comments = readLocal()
      const target = comments.find((c) => c.id === commentId)
      if (!target || target.userId !== userId) return false
      writeLocal(comments.filter((c) => c.id !== commentId))
      return true
    }
  )
}

export async function likeComment(commentId: string): Promise<boolean> {
  return withSupabaseFallback(
    async () => {
      // No RPC/increment function configured — read-modify-write is the honest
      // client-side option available here (fine at this app's scale/demo
      // status; a real deployment would use a Postgres function instead).
      const { data, error: readError } = await supabase.from('trip_comments').select('likes').eq('id', commentId).maybeSingle()
      if (readError) throw readError
      if (!data) return false

      const { error: writeError } = await supabase
        .from('trip_comments')
        .update({ likes: (data.likes ?? 0) + 1 })
        .eq('id', commentId)
      if (writeError) throw writeError
      return true
    },
    () => {
      const comments = readLocal()
      const idx = comments.findIndex((c) => c.id === commentId)
      if (idx === -1) return false
      comments[idx] = { ...comments[idx], likes: comments[idx].likes + 1 }
      writeLocal(comments)
      return true
    }
  )
}
