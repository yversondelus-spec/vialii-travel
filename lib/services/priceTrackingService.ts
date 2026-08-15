import { rankHotels } from './hotelSelectionService'
import type { CompleteTrip } from '@/lib/types/trip'
import type { Interest } from '@/constants/interests'

export interface PriceCheckResult {
  oldTotal: number
  newTotal: number
  delta: number
  changed: boolean
  hotelDelta: number
}

/**
 * "Precio actualizado en tiempo real" here means: re-run the same mock
 * hotel search this pack was built from (MockHotelProvider randomizes its
 * price on every call) and diff the result — that stands in for a live
 * price feed since no real Booking/Skyscanner API is connected in this
 * project (the one provider that DOES call something real is
 * lib/providers/transport/realFlightProvider.ts, gated behind a RapidAPI
 * key). There's no background poller here — this runs on demand, e.g. a
 * "🔄 Actualizar precios" button — and only tracks the hotel leg, the most
 * volatile component, rather than re-running the whole pipeline (which
 * would also reshuffle the activity list, not just its price).
 */
export async function checkForPriceChanges(
  trip: CompleteTrip,
  destination: string,
  startDate: Date,
  endDate: Date,
  interests: Interest[]
): Promise<PriceCheckResult> {
  const nights = Math.max(1, Math.round((endDate.getTime() - startDate.getTime()) / 86_400_000))
  const budgetForHotel = trip.costBreakdown.hotel // re-check against what was actually allotted, not a fresh budget split
  const ranked = await rankHotels(destination, startDate, endDate, budgetForHotel, interests)
  const hotel = ranked.find((h) => h.id === trip.hotel?.id) ?? ranked[0] ?? null

  const newHotelCost = hotel ? hotel.price * nights : trip.costBreakdown.hotel
  const oldTotal = trip.costBreakdown.total
  const newTotal = oldTotal - trip.costBreakdown.hotel + newHotelCost

  return {
    oldTotal,
    newTotal,
    delta: newTotal - oldTotal,
    changed: newTotal !== oldTotal,
    hotelDelta: newHotelCost - trip.costBreakdown.hotel,
  }
}
