import { supabase } from '@/lib/db/client'
import { withSupabaseFallback } from '@/lib/utils/supabaseCircuit'
import { getSavedTrips } from '@/lib/services/savedTripsService'
import type { SavedTrip } from '@/lib/types/auth'
import type { UserProfile } from '@/lib/types/userProfile'

// Same Supabase-first / localStorage-fallback pattern as the rest of
// lib/services. Usernames/bios/follows are additive metadata layered on top
// of the existing (untouched) auth users and saved trips — see
// lib/auth/authContext.tsx and lib/services/savedTripsService.ts.
const PROFILES_KEY = 'travelai_user_profiles'
const FOLLOWS_KEY = 'travelai_user_follows'

interface LocalFollow {
  id: string
  followerId: string
  followingId: string
  followedAt: string
}

function readProfiles(): UserProfile[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(PROFILES_KEY) ?? '[]')
  } catch {
    return []
  }
}
function writeProfiles(profiles: UserProfile[]) {
  localStorage.setItem(PROFILES_KEY, JSON.stringify(profiles))
}
function readFollows(): LocalFollow[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(FOLLOWS_KEY) ?? '[]')
  } catch {
    return []
  }
}
function writeFollows(follows: LocalFollow[]) {
  localStorage.setItem(FOLLOWS_KEY, JSON.stringify(follows))
}

function slugify(input: string): string {
  const base = input
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '') // strip accents (after NFD normalize above) — \p{} is a plain-ASCII Unicode property escape, not a literal combining-mark range
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
  return base || 'viajerx'
}

interface UserProfileRow {
  user_id: string
  username: string
  bio: string | null
  created_at: string
}

function rowToProfile(row: UserProfileRow): UserProfile {
  return { userId: row.user_id, username: row.username, bio: row.bio ?? '', createdAt: row.created_at }
}

export async function findProfileByUserId(userId: string): Promise<UserProfile | null> {
  try {
    return await withSupabaseFallback(
      async () => {
        const { data, error } = await supabase.from('user_profiles').select('*').eq('user_id', userId).maybeSingle()
        if (error) throw error
        return data ? rowToProfile(data) : null
      },
      () => readProfiles().find((p) => p.userId === userId) ?? null
    )
  } catch {
    return readProfiles().find((p) => p.userId === userId) ?? null
  }
}

/** Idempotent: returns the user's existing username, or mints one from their email. */
export async function ensureUsername(userId: string, email: string): Promise<string> {
  const existing = await findProfileByUserId(userId)
  if (existing) return existing.username

  const base = slugify(email.split('@')[0])
  let candidate = base
  let suffix = 1
  while (readProfiles().some((p) => p.username === candidate)) {
    suffix += 1
    candidate = `${base}-${suffix}`
  }

  const profile: UserProfile = { userId, username: candidate, bio: '', createdAt: new Date().toISOString() }

  await withSupabaseFallback(
    async () => {
      const { error } = await supabase
        .from('user_profiles')
        .upsert([{ user_id: userId, username: candidate, bio: '', created_at: profile.createdAt }], { onConflict: 'user_id' })
      if (error) throw error
    },
    () => writeProfiles([profile, ...readProfiles()])
  )

  return candidate
}

export async function getPublicProfile(username: string): Promise<UserProfile | null> {
  try {
    return await withSupabaseFallback(
      async () => {
        const { data, error } = await supabase.from('user_profiles').select('*').eq('username', username).maybeSingle()
        if (error) throw error
        return data ? rowToProfile(data) : null
      },
      () => readProfiles().find((p) => p.username === username) ?? null
    )
  } catch {
    return readProfiles().find((p) => p.username === username) ?? null
  }
}

/** Every saved trip is shown on the owner's public profile — there's no per-trip privacy toggle in this app. */
export async function getPublicSavedTrips(userId: string): Promise<SavedTrip[]> {
  return getSavedTrips(userId)
}

export async function getFollowerCount(userId: string): Promise<number> {
  try {
    return await withSupabaseFallback(
      async () => {
        const { count, error } = await supabase
          .from('user_follows')
          .select('id', { count: 'exact', head: true })
          .eq('following_id', userId)
        if (error) throw error
        return count ?? 0
      },
      () => readFollows().filter((f) => f.followingId === userId).length
    )
  } catch {
    return 0
  }
}

export async function isFollowing(followerId: string, targetUserId: string): Promise<boolean> {
  try {
    return await withSupabaseFallback(
      async () => {
        const { data, error } = await supabase
          .from('user_follows')
          .select('id')
          .eq('follower_id', followerId)
          .eq('following_id', targetUserId)
          .maybeSingle()
        if (error) throw error
        return !!data
      },
      () => readFollows().some((f) => f.followerId === followerId && f.followingId === targetUserId)
    )
  } catch {
    return false
  }
}

export async function followUser(followerId: string, targetUserId: string): Promise<boolean> {
  if (followerId === targetUserId) return false

  return withSupabaseFallback(
    async () => {
      const { error } = await supabase
        .from('user_follows')
        .insert([{ id: crypto.randomUUID(), follower_id: followerId, following_id: targetUserId, followed_at: new Date().toISOString() }])
      if (error) throw error
      return true
    },
    () => {
      if (readFollows().some((f) => f.followerId === followerId && f.followingId === targetUserId)) return true
      writeFollows([
        { id: crypto.randomUUID(), followerId, followingId: targetUserId, followedAt: new Date().toISOString() },
        ...readFollows(),
      ])
      return true
    }
  )
}

export async function unfollowUser(followerId: string, targetUserId: string): Promise<boolean> {
  return withSupabaseFallback(
    async () => {
      const { error } = await supabase.from('user_follows').delete().eq('follower_id', followerId).eq('following_id', targetUserId)
      if (error) throw error
      return true
    },
    () => {
      writeFollows(readFollows().filter((f) => !(f.followerId === followerId && f.followingId === targetUserId)))
      return true
    }
  )
}
