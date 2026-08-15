import { supabase } from './client'
import { logger } from '@/lib/logger'
import type { User, SavedSearch } from '@/lib/types/domain'
import type { SearchComparisonResult } from '@/lib/types/search'

/** Fields SearchService would log per completed search once analytics is wired up (see searchService.ts). */
interface SearchAnalyticData {
  origin: string
  destination: string
  num_passengers: number
  budget_range: string
  selected_transport: string
  selected_option: string
  price_paid: number
}

// ============================================
// USUARIOS
// ============================================
export async function getUser(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) return null
  return data as User
}

export async function createUser(email: string, name: string): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert([{ email, name, tier: 'free', searches_remaining: 3 }])
    .select()
    .single()

  if (error) throw error
  return data as User
}

export async function updateUserTier(userId: string, tier: 'free' | 'premium'): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({ tier })
    .eq('id', userId)

  if (error) throw error
}

// ============================================
// BÚSQUEDAS
// ============================================
export async function saveSearch(userId: string, search: SavedSearch): Promise<SavedSearch> {
  const { data, error } = await supabase
    .from('saved_searches')
    .insert([search])
    .select()
    .single()

  if (error) throw error
  return data as SavedSearch
}

export async function getUserSearches(userId: string): Promise<SavedSearch[]> {
  const { data, error } = await supabase
    .from('saved_searches')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) return []
  return data as SavedSearch[]
}

// ============================================
// CACHÉ
// ============================================
export async function getSearchCache(origin: string, destination: string, travelDate: Date, passengers: number) {
  const dateStr = travelDate.toISOString().split('T')[0]
  
  const { data, error } = await supabase
    .from('search_cache')
    .select('*')
    .eq('origin', origin)
    .eq('destination', destination)
    .eq('travel_date', dateStr)
    .eq('num_passengers', passengers)
    .single()

  if (error || !data) return null
  
  if (new Date(data.expires_at) < new Date()) return null
  
  return data.results
}

export async function saveSearchCache(origin: string, destination: string, travelDate: Date, passengers: number, results: SearchComparisonResult) {
  const dateStr = travelDate.toISOString().split('T')[0]
  const expiresAt = new Date(Date.now() + 6 * 60 * 60 * 1000)

  const { error } = await supabase
    .from('search_cache')
    .upsert([{
      origin,
      destination,
      travel_date: dateStr,
      num_passengers: passengers,
      results,
      cached_at: new Date(),
      expires_at: expiresAt
    }])

  if (error) throw error
}

// ============================================
// ANALYTICS
// ============================================
export async function logSearchAnalytic(data: SearchAnalyticData) {
  const { error } = await supabase
    .from('search_analytics')
    .insert([{
      origin: data.origin,
      destination: data.destination,
      num_passengers: data.num_passengers,
      budget_range: data.budget_range,
      selected_transport: data.selected_transport,
      selected_option: data.selected_option,
      price_paid: data.price_paid,
      search_date: new Date()
    }])

  if (error) logger.error('Analytics query failed', { message: error.message })
}
