import type { Vibe } from './vibes'

// Separate, deliberately, from constants/vibes.ts's Vibe type. Vibe tags
// social/content mood (feed items, destination cards — solo/pareja/fiesta as
// "who you're traveling with" flavor) and is used across the feed/explore
// surfaces; this Interest taxonomy is what the search form asks the
// traveler for ("what kind of trip"), matching the 12-item list from the
// product brief. Deliberately not merged into Vibe — different concept,
// different question — but bridged below so destination-resolution logic
// (constants/nationalOffers.ts, DESTINATION_VIBES) doesn't need re-tagging.
export type Interest =
  | 'playa'
  | 'aventura'
  | 'romantico'
  | 'familiar'
  | 'naturaleza'
  | 'ciudad'
  | 'gastronomia'
  | 'relax'
  | 'vida_nocturna'
  | 'shopping'
  | 'cultura'
  | 'experiencias'

export const INTERESTS: { id: Interest; label: string; icon: string }[] = [
  { id: 'playa', label: 'Playa', icon: '🏖️' },
  { id: 'aventura', label: 'Aventura', icon: '🏔️' },
  { id: 'romantico', label: 'Romántico', icon: '❤️' },
  { id: 'familiar', label: 'Familiar', icon: '👨‍👩‍👧' },
  { id: 'naturaleza', label: 'Naturaleza', icon: '🌿' },
  { id: 'ciudad', label: 'Ciudad', icon: '🏙️' },
  { id: 'gastronomia', label: 'Gastronomía', icon: '🍷' },
  { id: 'relax', label: 'Relax', icon: '🧘' },
  { id: 'vida_nocturna', label: 'Vida nocturna', icon: '🎉' },
  { id: 'shopping', label: 'Shopping', icon: '🛍️' },
  { id: 'cultura', label: 'Cultura', icon: '🎭' },
  { id: 'experiencias', label: 'Experiencias', icon: '📸' },
]

// Heuristic bridge, not a real recommender — lets the search form's richer
// interest taxonomy reuse the existing Vibe-tagged destination data
// (constants/vibes.ts DESTINATION_VIBES, constants/nationalOffers.ts) instead
// of re-tagging 28 destinations against a second taxonomy.
export const INTEREST_TO_VIBE: Record<Interest, Vibe[]> = {
  playa: ['playa'],
  aventura: ['naturaleza'],
  romantico: ['romantico', 'pareja'],
  familiar: ['naturaleza', 'playa'],
  naturaleza: ['naturaleza'],
  ciudad: ['fiesta', 'solo'],
  gastronomia: ['romantico', 'solo'],
  relax: ['playa', 'naturaleza'],
  vida_nocturna: ['fiesta'],
  shopping: ['fiesta', 'solo'],
  cultura: ['solo', 'romantico'],
  experiencias: ['naturaleza', 'solo'],
}

export function interestsToVibes(interests: Interest[]): Vibe[] {
  const vibes = new Set<Vibe>()
  for (const interest of interests) {
    for (const vibe of INTEREST_TO_VIBE[interest]) vibes.add(vibe)
  }
  return Array.from(vibes)
}
