import type { Interest } from '@/constants/interests'

const ALL_INTERESTS: Interest[] = [
  'playa', 'aventura', 'romantico', 'familiar', 'naturaleza', 'ciudad',
  'gastronomia', 'relax', 'vida_nocturna', 'shopping', 'cultura', 'experiencias',
]

/** Rough budget→interest heuristic, not a real recommender — just enough to make "Sorpréndeme" and gap-filling feel intentional. */
export function suggestInterestsByBudget(budget: number): Interest[] {
  if (budget < 300_000) return ['naturaleza', 'aventura']
  if (budget < 700_000) return ['playa', 'cultura']
  if (budget < 1_500_000) return ['romantico', 'gastronomia']
  return ['romantico', 'experiencias']
}

export function pickRandomInterest(): Interest {
  return ALL_INTERESTS[Math.floor(Math.random() * ALL_INTERESTS.length)]
}

/** "Joven promedio" range for the Sorpréndeme flow: $400k–$800k (total). */
export function pickSurpriseBudget(): number {
  return Math.round((400_000 + Math.random() * 400_000) / 10_000) * 10_000
}

/** A random day within the next two weeks. */
export function pickSurpriseDate(): string {
  const daysOut = 1 + Math.floor(Math.random() * 14)
  return new Date(Date.now() + daysOut * 86_400_000).toISOString().split('T')[0]
}

export type SearchScope = 'national' | 'international'

/** 65% national / 35% international, per the Sorpréndeme spec. */
export function pickSurpriseScope(): SearchScope {
  return Math.random() < 0.65 ? 'national' : 'international'
}

/** Rough day-counts behind the "duración aproximada" chips — used only to derive a return date when the traveler doesn't have exact dates. */
export const DURATION_OPTIONS: { id: string; label: string; days: number }[] = [
  { id: 'short', label: '3-5 días', days: 4 },
  { id: 'medium', label: '7-10 días', days: 8 },
  { id: 'long', label: '2 semanas', days: 14 },
]
