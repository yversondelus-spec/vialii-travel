'use client'

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { supabase } from '@/lib/db/client'
import { isNetworkError } from '@/lib/utils/isNetworkError'
import { shouldTrySupabase, recordSupabaseNetworkFailure, recordSupabaseSuccess } from '@/lib/utils/supabaseCircuit'
import { sendEmail, renderWelcomeEmail } from '@/lib/services/emailService'
import { logger } from '@/lib/logger'
import type { AuthUser } from '@/lib/types/auth'

interface AuthResult {
  error?: string
}

interface AuthContextValue {
  user: AuthUser | null
  loading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<AuthResult>
  signup: (email: string, password: string) => Promise<AuthResult>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// ---------------------------------------------------------------------------
// Local fallback backend
//
// The Supabase project referenced by .env.local isn't a live project (its
// anon key isn't even a JWT), so every real `supabase.auth.*` call fails at
// the network level in this environment. Real Supabase is always tried
// first; only when that specific call fails with a network-level error (not
// a credentials/validation error from a working backend) do we fall back to
// this localStorage-backed store, so the auth flow stays testable today.
// Point NEXT_PUBLIC_SUPABASE_URL/ANON_KEY at a real project and this
// fallback simply never triggers again.
//
// This is a demo convenience, not a security model: passwords are stored in
// plain text in localStorage. Never do this for a real backend.
// ---------------------------------------------------------------------------

const LOCAL_SESSION_KEY = 'travelai_local_session'
const LOCAL_USERS_KEY = 'travelai_local_users'

interface LocalUserRecord extends AuthUser {
  password: string
}

function readLocalUsers(): Record<string, LocalUserRecord> {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(LOCAL_USERS_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function writeLocalUsers(users: Record<string, LocalUserRecord>) {
  localStorage.setItem(LOCAL_USERS_KEY, JSON.stringify(users))
}

function persistLocalSession(user: AuthUser | null) {
  if (user) localStorage.setItem(LOCAL_SESSION_KEY, JSON.stringify(user))
  else localStorage.removeItem(LOCAL_SESSION_KEY)
}

function readLocalSession(): AuthUser | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(LOCAL_SESSION_KEY)
    return raw ? (JSON.parse(raw) as AuthUser) : null
  } catch {
    return null
  }
}

function localSignup(email: string, password: string): { user?: AuthUser; error?: string } {
  const users = readLocalUsers()
  if (users[email]) return { error: 'Ya existe una cuenta con este email' }

  const user: AuthUser = { id: crypto.randomUUID(), email, created_at: new Date().toISOString() }
  users[email] = { ...user, password }
  writeLocalUsers(users)
  persistLocalSession(user)
  return { user }
}

function localLogin(email: string, password: string): { user?: AuthUser; error?: string } {
  const users = readLocalUsers()
  const record = users[email]
  if (!record || record.password !== password) {
    return { error: 'Email o contraseña incorrectos' }
  }
  const user: AuthUser = { id: record.id, email: record.email, created_at: record.created_at }
  persistLocalSession(user)
  return { user }
}

function toAuthUser(supabaseUser: { id: string; email?: string; created_at: string }): AuthUser {
  return { id: supabaseUser.id, email: supabaseUser.email ?? '', created_at: supabaseUser.created_at }
}

async function sendWelcomeEmail(email: string) {
  try {
    const { subject, html } = renderWelcomeEmail(email)
    await sendEmail(email, 'welcome', subject, html)
  } catch (err) {
    // Never let a logging failure block signup itself.
    logger.error('Welcome email failed', { message: err instanceof Error ? err.message : String(err) })
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (cancelled) return
        setUser(data.session?.user ? toAuthUser(data.session.user) : readLocalSession())
      })
      .catch(() => {
        if (!cancelled) setUser(readLocalSession())
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    const { data: subscription } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) setUser(toAuthUser(session.user))
    })

    return () => {
      cancelled = true
      subscription.subscription.unsubscribe()
    }
  }, [])

  const login = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (shouldTrySupabase()) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        // supabase-js catches network failures itself and returns them as a
        // normal AuthError (message "Failed to fetch") instead of throwing —
        // so the fallback has to be checked here too, not just in `catch`.
        if (error && isNetworkError(error)) throw error
        if (error) return { error: error.message }
        if (!data.user) return { error: 'No se pudo iniciar sesión' }
        recordSupabaseSuccess()
        setUser(toAuthUser(data.user))
        return {}
      } catch (err) {
        if (!isNetworkError(err)) return { error: 'No se pudo iniciar sesión' }
        recordSupabaseNetworkFailure()
      }
    }

    const result = localLogin(email, password)
    if (result.error) return { error: result.error }
    setUser(result.user ?? null)
    return {}
  }, [])

  const signup = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (shouldTrySupabase()) {
      try {
        const { data, error } = await supabase.auth.signUp({ email, password })
        if (error && isNetworkError(error)) throw error
        if (error) return { error: error.message }
        if (!data.user) return { error: 'No se pudo crear la cuenta' }
        recordSupabaseSuccess()
        setUser(toAuthUser(data.user))
        await sendWelcomeEmail(email)
        return {}
      } catch (err) {
        if (!isNetworkError(err)) return { error: 'No se pudo crear la cuenta' }
        recordSupabaseNetworkFailure()
      }
    }

    const result = localSignup(email, password)
    if (result.error) return { error: result.error }
    setUser(result.user ?? null)
    await sendWelcomeEmail(email)
    return {}
  }, [])

  const logout = useCallback(async () => {
    try {
      await supabase.auth.signOut()
    } catch {
      // Supabase unreachable — local session is cleared below regardless.
    }
    persistLocalSession(null)
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
