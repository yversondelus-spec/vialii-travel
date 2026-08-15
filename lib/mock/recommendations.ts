import type { DiscoveryQuery, Recommendation, TravelScore } from '@/types/domain'
import { FEATURED_DESTINATIONS } from '@/constants/destinations'

const DEFAULT_DURATION_DAYS = 7

export function generateMockRecommendations(query: DiscoveryQuery): Recommendation[] {
  // DiscoveryQuery.duration is optional (the form doesn't always collect
  // it) — everything below needs a real number, so default it once here.
  const duration = query.duration ?? DEFAULT_DURATION_DAYS

  return FEATURED_DESTINATIONS.slice(0, 3).map((destination, index) => {
    const flightPrice = 450000
    const hotelPrice = 200000
    const activityPrice = 80000
    const mealsPrice = duration * 50000
    const transfers = 30000

    const totalEstimate =
      flightPrice * query.travelers +
      hotelPrice * duration +
      activityPrice * duration +
      mealsPrice +
      transfers

    const score: TravelScore = {
      overall: 85 - index * 3,
      factors: {
        priceValue: 8,
        climate: 9,
        connectivity: 8.5,
        accommodation: 8.2,
        activities: 9.1,
        experience: 8.8,
      },
      explanation: `Perfect match for your ${query.interests.join(', ')} preferences`,
      recommendation: `${destination.name} offers excellent value`,
    }

    const recommendation: Recommendation = {
      id: `rec-${destination.id}-${index}`,
      destination,
      score,
      flights: [
        {
          id: `flight-${destination.id}`,
          provider: 'Mock Provider',
          airline: 'Airline X',
          flightNumber: 'XX123',
          departure: {
            airport: 'Santiago',
            airportCode: 'SCL',
            city: 'Santiago',
            time: query.startDate,
          },
          arrival: {
            airport: destination.name,
            airportCode: destination.id.toUpperCase(),
            city: destination.name,
            time: new Date(query.startDate.getTime() + 24 * 60 * 60 * 1000),
          },
          duration: 12,
          stops: 1,
          price: flightPrice,
          currency: query.currency,
          bookingUrl: '#',
          rating: 4.5,
        },
      ],
      accommodation: [
        {
          id: `hotel-${destination.id}`,
          provider: 'Mock Hotels',
          name: `${destination.name} Resort`,
          destination: destination.name,
          destinationId: destination.id,
          address: `Main Street, ${destination.name}`,
          images: destination.images.gallery,
          coordinates: destination.coordinates,
          checkIn: query.startDate,
          checkOut: new Date(query.startDate.getTime() + duration * 24 * 60 * 60 * 1000),
          nights: duration,
          roomType: 'Deluxe Double',
          pricePerNight: hotelPrice,
          totalPrice: hotelPrice * duration,
          currency: query.currency,
          amenities: ['WiFi', 'Pool', 'Gym'],
          rating: 4.7,
          reviews: 234,
          bookingUrl: '#',
          breakfast: true,
        },
      ],
      activities: [
        {
          id: `activity-${destination.id}`,
          name: `${destination.name} City Tour`,
          destination: destination.name,
          destinationId: destination.id,
          category: 'tour',
          price: activityPrice,
          currency: query.currency,
          duration: 4,
          groupSize: 15,
          rating: 4.6,
          reviewCount: 145,
          description: `Explore ${destination.name}`,
          images: destination.images.gallery,
          bookingUrl: '#',
          provider: 'Mock Tours',
          highlights: destination.attractions.slice(0, 3),
        },
      ],
      estimatedBudget: {
        flights: flightPrice * query.travelers,
        accommodation: hotelPrice * duration,
        meals: mealsPrice,
        activities: activityPrice * duration,
        transfers,
        insurance: 25000,
        miscellaneous: 50000,
        currency: query.currency,
        originalBudget: query.budget,
      },
      remainingBudget: Math.max(0, query.budget - totalEstimate),
      explanation: `This trip to ${destination.name} is curated for you.`,
      whyRecommended: [
        `Perfect for ${query.interests.join(' & ')} lovers`,
        `Great value at ${((totalEstimate / query.budget) * 100).toFixed(0)}% of budget`,
      ],
      ranking: index + 1,
    }

    return recommendation
  })
}