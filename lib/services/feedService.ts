import { FEATURED_DESTINATIONS } from '@/constants/destinations'
import { DESTINATION_CONTINENT, DESTINATION_VIBES, type Vibe, type Continent } from '@/constants/vibes'

// There's no real "user-generated public trip" system in this app — trips
// are algorithmically built per destination (see lib/services/tripBuilder.ts).
// This generates a believable, varied inspiration feed from the 5 curated
// FEATURED_DESTINATIONS (same data /discover and /trip/[id] already use) by
// pairing each with a few duration/budget variants, deterministically seeded
// so the numbers stay stable across reloads instead of jittering.

function hashString(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0
  }
  return hash >>> 0
}

function mulberry32(seed: number) {
  let state = seed
  return () => {
    state |= 0
    state = (state + 0x6d2b79f5) | 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export interface FeedItem {
  id: string
  destinationId: string
  destinationName: string
  country: string
  image: string
  vibes: Vibe[]
  continent: Continent
  durationDays: number
  budgetCLP: number
  savesCount: number
  commentsCount: number
  trending: boolean
  creatorHandle: string
  tagline: string
}

const DURATIONS = [3, 5, 7]
const CREATOR_HANDLES = ['@vialii', '@wanderchile', '@mochilera_cl', '@trotamundos', '@viajerx']

const TAGLINES: Record<Vibe, string[]> = {
  playa: ['Sol, arena y nada más', 'Atardeceres que no vas a olvidar'],
  naturaleza: ['Desconecta de todo', 'Bosques, lagos y aire puro'],
  fiesta: ['La energía no para', 'Noches que se hacen leyenda'],
  romantico: ['Para perderse de a dos', 'El escape romántico perfecto'],
  solo: ['Vos, tu mochila y el mundo', 'El viaje que te vas a deber'],
  pareja: ['Aventura compartida', 'Recuerdos para toda la vida'],
}

function buildSeedItems(): FeedItem[] {
  const items: FeedItem[] = []

  for (const destination of FEATURED_DESTINATIONS) {
    const vibes = DESTINATION_VIBES[destination.id] ?? []
    const continent = DESTINATION_CONTINENT[destination.id] ?? 'América'
    const gallery = [destination.images.hero, ...destination.images.gallery]

    DURATIONS.forEach((duration, i) => {
      const seedKey = `${destination.id}-${duration}`
      const rand = mulberry32(hashString(seedKey))
      const primaryVibe = vibes[i % Math.max(vibes.length, 1)]

      items.push({
        id: seedKey,
        destinationId: destination.id,
        destinationName: destination.name,
        country: destination.country,
        image: gallery[i % gallery.length],
        vibes,
        continent,
        durationDays: duration,
        budgetCLP: 400_000 + Math.floor(rand() * 900_000),
        savesCount: 20 + Math.floor(rand() * 300),
        commentsCount: Math.floor(rand() * 40),
        trending: rand() > 0.55,
        creatorHandle: CREATOR_HANDLES[Math.floor(rand() * CREATOR_HANDLES.length)],
        tagline: primaryVibe
          ? TAGLINES[primaryVibe][i % TAGLINES[primaryVibe].length]
          : 'Tu próxima aventura',
      })
    })
  }

  return items
}

let cachedItems: FeedItem[] | null = null

function getSeedItems(): FeedItem[] {
  if (!cachedItems) cachedItems = buildSeedItems()
  return cachedItems
}

export interface FeedFilters {
  continent?: Continent
  vibe?: Vibe
  maxBudget?: number
}

function filterItems(items: FeedItem[], filters: FeedFilters): FeedItem[] {
  return items.filter((item) => {
    if (filters.continent && item.continent !== filters.continent) return false
    if (filters.vibe && !item.vibes.includes(filters.vibe)) return false
    if (filters.maxBudget && item.budgetCLP > filters.maxBudget) return false
    return true
  })
}

/** Paginated feed for /feed's infinite scroll. */
export function getFeedPage(filters: FeedFilters, offset: number, limit = 6): { items: FeedItem[]; hasMore: boolean } {
  const filtered = filterItems(getSeedItems(), filters).sort((a, b) => b.savesCount - a.savesCount)
  const page = filtered.slice(offset, offset + limit)
  return { items: page, hasMore: offset + limit < filtered.length }
}

export function getTrendingItems(limit = 6): FeedItem[] {
  return [...getSeedItems()]
    .filter((i) => i.trending)
    .sort((a, b) => b.savesCount - a.savesCount)
    .slice(0, limit)
}

export function getAllItems(): FeedItem[] {
  return getSeedItems()
}
