import type { Itinerary, DayPlan, ItineraryActivity, Destination } from '@/types/domain'

export function generateItinerary(
  destination: Destination,
  duration: number,
  startDate: Date
): Itinerary {
  const days: DayPlan[] = []

  for (let i = 0; i < duration; i++) {
    const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000)
    const activities: ItineraryActivity[] = []

    if (i === 0) {
      // Arrival day
      activities.push(
        {
          id: `activity-${i}-1`,
          time: '14:00',
          title: 'Arrive at Airport',
          description: `Flight arrives at ${destination.name} airport`,
          location: `${destination.name} Airport`,
          duration: 180,
          estimatedCost: 0,
          type: 'transport',
        },
        {
          id: `activity-${i}-2`,
          time: '17:00',
          title: 'Check-in Hotel',
          description: 'Arrive at hotel and settle in',
          location: 'Hotel',
          duration: 60,
          estimatedCost: 0,
          type: 'check-in',
        },
        {
          id: `activity-${i}-3`,
          time: '19:00',
          title: 'Welcome Dinner',
          description: `Explore local cuisine at a traditional ${destination.name} restaurant`,
          location: 'Downtown',
          duration: 120,
          estimatedCost: 60000,
          type: 'dining',
        }
      )
    } else if (i === duration - 1) {
      // Last day
      activities.push(
        {
          id: `activity-${i}-1`,
          time: '08:00',
          title: 'Breakfast & Last Minute Shopping',
          description: 'Enjoy breakfast and shop for souvenirs',
          location: 'Hotel',
          duration: 120,
          estimatedCost: 40000,
          type: 'dining',
        },
        {
          id: `activity-${i}-2`,
          time: '11:00',
          title: 'Check-out Hotel',
          description: 'Leave hotel and head to airport',
          location: 'Hotel',
          duration: 60,
          estimatedCost: 0,
          type: 'check-out',
        },
        {
          id: `activity-${i}-3`,
          time: '14:00',
          title: 'Depart',
          description: 'Flight departs from airport',
          location: `${destination.name} Airport`,
          duration: 180,
          estimatedCost: 0,
          type: 'transport',
        }
      )
    } else {
      // Regular days
      activities.push(
        {
          id: `activity-${i}-1`,
          time: '08:00',
          title: 'Breakfast',
          description: 'Hotel breakfast included',
          location: 'Hotel',
          duration: 60,
          estimatedCost: 0,
          type: 'dining',
        },
        {
          id: `activity-${i}-2`,
          time: '10:00',
          title: `${destination.attractions[i % destination.attractions.length]} Tour`,
          description: `Guided tour of famous ${destination.name} landmark`,
          location: destination.attractions[i % destination.attractions.length],
          duration: 180,
          estimatedCost: 80000,
          type: 'tour',
        },
        {
          id: `activity-${i}-3`,
          time: '13:30',
          title: 'Lunch',
          description: 'Local restaurant lunch',
          location: 'Downtown',
          duration: 90,
          estimatedCost: 50000,
          type: 'dining',
        },
        {
          id: `activity-${i}-4`,
          time: '15:30',
          title: 'Free Time / Relax',
          description: 'Explore on your own or rest at the hotel',
          location: 'City',
          duration: 120,
          estimatedCost: 0,
          type: 'rest',
        },
        {
          id: `activity-${i}-5`,
          time: '18:00',
          title: 'Dinner',
          description: 'Dinner at a local restaurant',
          location: 'Downtown',
          duration: 120,
          estimatedCost: 70000,
          type: 'dining',
        }
      )
    }

    days.push({
      day: i + 1,
      date,
      title: i === 0 ? 'Arrival' : i === duration - 1 ? 'Departure' : `Day ${i + 1}`,
      activities,
      meals: {
        breakfast: {
          name: 'Breakfast',
          type: 'breakfast',
          location: 'Hotel',
          estimatedCost: 30000,
        },
        lunch: {
          name: 'Lunch',
          type: 'lunch',
          location: 'Local Restaurant',
          estimatedCost: 50000,
        },
        dinner: {
          name: 'Dinner',
          type: 'dinner',
          location: 'Downtown',
          estimatedCost: 70000,
        },
      },
      notes: '',
      estimatedCost: activities.reduce((sum, a) => sum + a.estimatedCost, 0),
    })
  }

  return {
    id: `itinerary-${Date.now()}`,
    tripId: '',
    days,
    generatedBy: 'ai',
    notes: `${duration}-day itinerary in ${destination.name}, ${destination.country}`,
    createdAt: new Date(),
    updatedAt: new Date(),
  }
}