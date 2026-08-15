import { MockActivityProvider } from '@/lib/providers/activity/mockActivityProvider'
import type { Activity, ActivityCategory } from '@/lib/providers/activity/types'
import type { Interest } from '@/constants/interests'
import type { ItineraryDay, ItineraryItem } from '@/lib/types/trip'

const activityProvider = new MockActivityProvider()

const INTEREST_CATEGORY: Partial<Record<Interest, ActivityCategory>> = {
  aventura: 'Adventure',
  cultura: 'Culture',
  gastronomia: 'Food',
  playa: 'Beach',
  naturaleza: 'Nature',
  vida_nocturna: 'Nightlife',
}

function scoreActivity(activity: Activity, interests: Interest[]): number {
  const matchesInterest = interests.some((i) => INTEREST_CATEGORY[i] === activity.category)
  return activity.rating + (matchesInterest ? 2 : 0)
}

/** Full pool, best interest-match first — used both to pick the scheduled activities (first `maxCount`) and to offer real alternatives when swapping (the rest). */
export async function rankActivities(destination: string, attractions: string[] | undefined, interests: Interest[]): Promise<Activity[]> {
  const pool = await activityProvider.searchActivities({ destination, currency: 'CLP', attractions })
  return [...pool].sort((a, b) => scoreActivity(b, interests) - scoreActivity(a, interests))
}

/** Ranked by interest match first, rating second — caller trims to fit the actual remaining budget. */
export async function pickActivities(
  destination: string,
  attractions: string[] | undefined,
  interests: Interest[],
  maxCount: number
): Promise<Activity[]> {
  const ranked = await rankActivities(destination, attractions, interests)
  return ranked.slice(0, maxCount)
}

const MIDDLE_DAY_TITLES = ['Cultura', 'Aventura', 'Relax', 'Exploración', 'Gastronomía']

/**
 * Day 1 = arrival (light: land, check in, welcome dinner). Middle days =
 * 1-2 activities each, alternating so the trip doesn't feel packed end to
 * end. Last day = flexible morning + check-out, no new activities booked
 * against the clock.
 */
export function buildItinerary(startDate: Date, duration: number, activities: Activity[]): ItineraryDay[] {
  const days: ItineraryDay[] = []
  let activityCursor = 0

  for (let i = 0; i < duration; i++) {
    const date = new Date(startDate.getTime() + i * 86_400_000)
    const isFirstDay = i === 0
    const isLastDay = i === duration - 1
    const items: ItineraryItem[] = []

    if (isFirstDay) {
      items.push(
        { time: '14:00', title: 'Llegada al destino', type: 'arrival' },
        { time: '15:00', title: 'Check-in hotel', type: 'checkin' },
        { time: '19:00', title: 'Cena de bienvenida', type: 'meal' }
      )
    } else if (isLastDay) {
      items.push(
        { time: '10:00', title: 'Mañana libre', type: 'free' },
        { time: '12:00', title: 'Check-out hotel', type: 'checkout' }
      )
    } else {
      const activitiesToday = i % 2 === 0 ? 2 : 1
      for (let j = 0; j < activitiesToday && activityCursor < activities.length; j++) {
        const activity = activities[activityCursor]
        items.push({
          time: j === 0 ? '09:30' : '15:00',
          title: activity.name,
          type: 'activity',
          durationMinutes: activity.duration,
        })
        activityCursor++
      }
      items.push({ time: '19:30', title: 'Cena', type: 'meal' })
    }

    days.push({
      dayNumber: i + 1,
      date,
      title: isFirstDay ? 'Llegada' : isLastDay ? 'Último día' : MIDDLE_DAY_TITLES[(i - 1) % MIDDLE_DAY_TITLES.length],
      items,
    })
  }

  return days
}
