export type Vibe = 'playa' | 'naturaleza' | 'fiesta' | 'romantico' | 'solo' | 'pareja'

// `gradient` is a colored tint (see DesireSearch.tsx) layered over each
// mood's VIBE_IMAGES photo below — not a flat-color replacement for it.
export const VIBES: { id: Vibe; label: string; icon: string; gradient: string }[] = [
  { id: 'playa', label: 'Playa', icon: '🏖️', gradient: 'from-blue-400 to-cyan-400' },
  { id: 'naturaleza', label: 'Naturaleza', icon: '🌲', gradient: 'from-emerald-400 to-green-400' },
  { id: 'fiesta', label: 'Fiesta', icon: '🎉', gradient: 'from-pink-400 to-rose-400' },
  { id: 'romantico', label: 'Romántico', icon: '💕', gradient: 'from-purple-400 to-pink-400' },
  { id: 'solo', label: 'Solo', icon: '🧑', gradient: 'from-amber-400 to-orange-400' },
  { id: 'pareja', label: 'Pareja', icon: '👫', gradient: 'from-indigo-400 to-purple-400' },
]

// Background photo per mood card (DesireSearch). Reuses hero images already
// verified in constants/destinations.ts instead of sourcing new URLs — same
// visual bar (curated Unsplash), zero extra 404 risk.
export const VIBE_IMAGES: Record<Vibe, string> = {
  playa: 'https://images.unsplash.com/photo-1552074284-5e88ef1aef18?w=600&h=400&fit=crop', // Cancún
  naturaleza: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=600&h=400&fit=crop', // Queenstown, NZ
  fiesta: 'https://images.unsplash.com/photo-1763110805416-22e7a6fffa58?w=600&h=400&fit=crop', // Rio de Janeiro
  romantico: 'https://images.unsplash.com/photo-1530841377377-3ff06c0ca713?w=600&h=400&fit=crop', // Santorini
  solo: 'https://images.unsplash.com/photo-1489749798305-4fea3ae63d43?w=600&h=400&fit=crop', // Marrakech
  pareja: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?w=600&h=400&fit=crop', // Paris
}

export type Continent = 'Europa' | 'América' | 'Asia' | 'África' | 'Oceanía'

export const CONTINENTS: { id: Continent; icon: string }[] = [
  { id: 'Europa', icon: '🇪🇺' },
  { id: 'América', icon: '🌎' },
  { id: 'Asia', icon: '🌏' },
  { id: 'África', icon: '🌍' },
  { id: 'Oceanía', icon: '🏝️' },
]

// FEATURED_DESTINATIONS (constants/destinations.ts) doesn't carry continent or
// vibe tags, and only spans Europe/Asia/América today — these two maps add
// that presentation-layer metadata without touching the destination data
// itself (search/scoring logic stays untouched).
export const DESTINATION_CONTINENT: Record<string, Continent> = {
  // Europa
  paris: 'Europa',
  santorini: 'Europa',
  barcelona: 'Europa',
  amsterdam: 'Europa',
  roma: 'Europa',
  londres: 'Europa',
  madrid: 'Europa',
  // América
  cartagena: 'América',
  'buenos-aires': 'América',
  'mexico-city': 'América',
  cancun: 'América',
  cusco: 'América',
  'rio-de-janeiro': 'América',
  bogota: 'América',
  // Asia
  tokyo: 'Asia',
  bali: 'Asia',
  bangkok: 'Asia',
  phuket: 'Asia',
  singapur: 'Asia',
  // África
  marrakech: 'África',
  'cape-town': 'África',
  egipto: 'África',
  // Oceanía
  sydney: 'Oceanía',
  'nueva-zelanda': 'Oceanía',
}

export const DESTINATION_VIBES: Record<string, Vibe[]> = {
  // Europa
  paris: ['romantico', 'pareja'],
  santorini: ['romantico', 'playa'],
  barcelona: ['fiesta', 'playa', 'pareja'],
  amsterdam: ['fiesta', 'solo'],
  roma: ['romantico', 'pareja'],
  londres: ['fiesta', 'solo'],
  madrid: ['fiesta', 'pareja'],
  // América
  cartagena: ['playa', 'fiesta'],
  'buenos-aires': ['fiesta', 'romantico'],
  'mexico-city': ['fiesta', 'solo'],
  cancun: ['playa', 'fiesta'],
  cusco: ['naturaleza', 'solo'],
  'rio-de-janeiro': ['playa', 'fiesta'],
  bogota: ['fiesta', 'solo'],
  // Asia
  tokyo: ['fiesta', 'solo'],
  bali: ['playa', 'naturaleza', 'solo'],
  bangkok: ['fiesta', 'solo'],
  phuket: ['playa', 'naturaleza'],
  singapur: ['solo', 'pareja'],
  // África
  marrakech: ['naturaleza', 'solo'],
  'cape-town': ['naturaleza', 'playa'],
  egipto: ['naturaleza', 'solo'],
  // Oceanía
  sydney: ['playa', 'solo'],
  'nueva-zelanda': ['naturaleza', 'solo'],
}

// /search only compares domestic Chilean transport (bus/flight/train — see
// lib/providers/transport). A "vibe" pick on the home page can't specify an
// international destination that flow doesn't cover, so it maps to a
// representative Chilean city instead, keeping /search's own logic
// completely untouched — this only chooses what to prefill.
export const DESIRE_TO_DESTINATION: Record<Vibe, string> = {
  playa: 'Iquique',
  naturaleza: 'Puerto Montt',
  fiesta: 'Valparaíso',
  romantico: 'Viña del Mar',
  solo: 'La Serena',
  pareja: 'Pucón',
}
