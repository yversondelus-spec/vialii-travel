export interface TripComment {
  id: string
  tripId: string
  userId: string
  authorUsername: string
  text: string
  createdAt: string
  likes: number
}
