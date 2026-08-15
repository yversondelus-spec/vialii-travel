import { MockHotelProvider } from '@/lib/providers/hotel/mockHotelProvider'
import type { HotelOption } from '@/lib/providers/hotel/types'
import type { Interest } from '@/constants/interests'

const hotelProvider = new MockHotelProvider()

/**
 * Higher score = better fit. Rewards spending close to (not over) the
 * budget actually set aside for lodging, then nudges toward interest
 * matches — a romantic trip favors 4-5 stars, a relax trip favors a spa,
 * a family trip favors a pool, an adventure trip is fine with something
 * simpler so more budget is left for activities.
 */
function scoreHotel(hotel: HotelOption, nights: number, budgetForHotel: number, interests: Interest[]): number {
  const totalCost = hotel.price * nights
  let score = 0

  if (budgetForHotel <= 0) {
    score -= hotel.stars // no budget left for hotel — prefer the cheapest option
  } else if (totalCost <= budgetForHotel) {
    score += 5 * (totalCost / budgetForHotel) // uses the available budget well, doesn't underspend
  } else {
    score -= 5 * ((totalCost - budgetForHotel) / budgetForHotel) // over budget — penalize proportionally
  }

  if (interests.includes('romantico') && hotel.stars >= 4) score += 2
  if (interests.includes('relax') && hotel.amenities.includes('Spa')) score += 1.5
  if (interests.includes('familiar') && hotel.amenities.includes('Piscina')) score += 1.5
  if (interests.includes('aventura') && hotel.stars <= 3) score += 0.5

  score += hotel.stars * 0.3
  return score
}

/** Full pool, best fit first — used both to pick the selected hotel (first element) and to offer real alternatives when swapping (the rest). */
export async function rankHotels(
  destination: string,
  checkIn: Date,
  checkOut: Date,
  budgetForHotel: number,
  interests: Interest[] = [],
  guests = 2
): Promise<HotelOption[]> {
  const nights = Math.max(1, Math.round((checkOut.getTime() - checkIn.getTime()) / 86_400_000))
  const hotels = await hotelProvider.searchHotels({ destination, checkIn, checkOut, guests, currency: 'CLP' })
  return [...hotels].sort((a, b) => scoreHotel(b, nights, budgetForHotel, interests) - scoreHotel(a, nights, budgetForHotel, interests))
}

export async function selectHotel(
  destination: string,
  checkIn: Date,
  checkOut: Date,
  budgetForHotel: number,
  interests: Interest[] = [],
  guests = 2
): Promise<HotelOption | null> {
  const ranked = await rankHotels(destination, checkIn, checkOut, budgetForHotel, interests, guests)
  return ranked[0] ?? null
}
