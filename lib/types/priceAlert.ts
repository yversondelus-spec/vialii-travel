export interface PriceAlert {
  id: string
  userId: string
  origin: string
  destination: string
  maxPrice: number
  currency: string
  active: boolean
  createdAt: string
  lastTriggeredAt?: string
}

export interface PricePoint {
  date: string
  price: number
}
