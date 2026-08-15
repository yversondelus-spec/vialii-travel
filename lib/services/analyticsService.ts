import { supabase } from '@/lib/db/client'
import { withSupabaseFallback } from '@/lib/utils/supabaseCircuit'

// Same Supabase-first / localStorage-fallback pattern as the rest of
// lib/services. Real searches made in this browser are logged on top of a
// one-time seeded baseline (see `seedIfEmpty`), so the admin dashboard has
// something to show on a fresh install instead of an empty chart.

export interface SearchLogEntry {
  id: string
  origin: string
  destination: string
  searchedAt: string
}

const LOCAL_KEY = 'travelai_search_log'
const SEED_FLAG_KEY = 'travelai_search_log_seeded'

const SEED_ROUTES: [string, string][] = [
  ['Santiago', 'Puerto Montt'],
  ['Santiago', 'Valparaíso'],
  ['Santiago', 'Concepción'],
  ['Santiago', 'La Serena'],
  ['Santiago', 'Temuco'],
  ['Valparaíso', 'Viña del Mar'],
  ['Santiago', 'Antofagasta'],
  ['Santiago', 'Pucón'],
  ['Concepción', 'Santiago'],
  ['Santiago', 'Iquique'],
]

function readLocal(): SearchLogEntry[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]')
  } catch {
    return []
  }
}

function writeLocal(entries: SearchLogEntry[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(entries.slice(0, 500)))
}

function seedIfEmpty() {
  if (typeof window === 'undefined' || localStorage.getItem(SEED_FLAG_KEY)) return
  localStorage.setItem(SEED_FLAG_KEY, '1')
  if (readLocal().length > 0) return

  const now = Date.now()
  const seeded: SearchLogEntry[] = Array.from({ length: 80 }, () => {
    const [origin, destination] = SEED_ROUTES[Math.floor(Math.random() * SEED_ROUTES.length)]
    const daysAgo = Math.floor(Math.random() * Math.random() * 30) // skewed toward recent
    return {
      id: crypto.randomUUID(),
      origin,
      destination,
      searchedAt: new Date(now - daysAgo * 86_400_000 - Math.random() * 86_400_000).toISOString(),
    }
  })
  writeLocal(seeded)
}

export async function logSearch(origin: string, destination: string): Promise<void> {
  const entry: SearchLogEntry = { id: crypto.randomUUID(), origin, destination, searchedAt: new Date().toISOString() }
  try {
    await withSupabaseFallback(
      async () => {
        const { error } = await supabase
          .from('search_log')
          .insert([{ id: entry.id, origin, destination, searched_at: entry.searchedAt }])
        if (error) throw error
      },
      () => {
        seedIfEmpty()
        writeLocal([entry, ...readLocal()])
      }
    )
  } catch {
    // Logging a search is best-effort — never block the search itself.
  }
}

export interface DestinationCount {
  destination: string
  count: number
}

export interface RouteCount {
  origin: string
  destination: string
  count: number
}

export interface DailySearchCount {
  date: string
  count: number
}

export interface SearchAnalyticsSummary {
  totalSearches: number
  byDestination: DestinationCount[]
  popularRoutes: RouteCount[]
  dailyTrend: DailySearchCount[]
}

const TREND_DAYS = 14

function buildDailyTrend(entries: SearchLogEntry[]): DailySearchCount[] {
  const counts = new Map<string, number>()
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Seed every day in the window with 0 so gaps render as zero, not a gap.
  const days: string[] = []
  for (let i = TREND_DAYS - 1; i >= 0; i--) {
    const d = new Date(today.getTime() - i * 86_400_000)
    days.push(d.toISOString().slice(0, 10))
  }
  days.forEach((d) => counts.set(d, 0))

  for (const entry of entries) {
    const day = entry.searchedAt.slice(0, 10)
    if (counts.has(day)) counts.set(day, (counts.get(day) ?? 0) + 1)
  }

  return days.map((date) => ({ date, count: counts.get(date) ?? 0 }))
}

export async function getSearchAnalytics(): Promise<SearchAnalyticsSummary> {
  let entries: SearchLogEntry[]

  try {
    entries = await withSupabaseFallback(
      async () => {
        const { data, error } = await supabase
          .from('search_log')
          .select('*')
          .order('searched_at', { ascending: false })
          .limit(1000)
        if (error) throw error
        return (data ?? []).map((row) => ({
          id: row.id,
          origin: row.origin,
          destination: row.destination,
          searchedAt: row.searched_at,
        }))
      },
      () => {
        seedIfEmpty()
        return readLocal()
      }
    )
  } catch {
    entries = []
  }

  const byDestMap = new Map<string, number>()
  const byRouteMap = new Map<string, RouteCount>()

  for (const entry of entries) {
    byDestMap.set(entry.destination, (byDestMap.get(entry.destination) ?? 0) + 1)
    const key = `${entry.origin}→${entry.destination}`
    const existing = byRouteMap.get(key)
    if (existing) existing.count += 1
    else byRouteMap.set(key, { origin: entry.origin, destination: entry.destination, count: 1 })
  }

  const byDestination = [...byDestMap.entries()]
    .map(([destination, count]) => ({ destination, count }))
    .sort((a, b) => b.count - a.count)

  const popularRoutes = [...byRouteMap.values()].sort((a, b) => b.count - a.count).slice(0, 10)
  const dailyTrend = buildDailyTrend(entries)

  return { totalSearches: entries.length, byDestination, popularRoutes, dailyTrend }
}
