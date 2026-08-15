// Separate, deliberately, from lib/types/subscription.ts's simpler
// free/premium PlanTier (used by the real checkout/profile flow today).
// This is the richer 4-tier "shape" for a future paid-membership feature —
// nothing here is wired to real billing yet; see app/tours/[id]/book/page.tsx
// for where this gets selected without ever charging anything.

export type MembershipTier = 'free' | 'explorer' | 'adventurer' | 'legend'

export interface MembershipPlan {
  id: MembershipTier
  name: string
  price: number // CLP per month
  description: string
  icon: string
  features: string[]
  benefits: {
    discountPercentage: number
    freeBookingsPerYear: number
    prioritySupport: boolean
    exclusiveExperiences: boolean
    earnDoublePoints: boolean
  }
  color: string
}

export const MEMBERSHIP_PLANS: Record<MembershipTier, MembershipPlan> = {
  free: {
    id: 'free',
    name: 'Explorador',
    price: 0,
    description: 'Acceso básico a todas las experiencias',
    icon: '🌍',
    features: ['Búsqueda de experiencias ilimitada', 'Guardar hasta 3 viajes', 'Soporte por email', 'Reseñas y ratings comunitarios'],
    benefits: {
      discountPercentage: 0,
      freeBookingsPerYear: 0,
      prioritySupport: false,
      exclusiveExperiences: false,
      earnDoublePoints: false,
    },
    color: 'from-gray-400 to-gray-600',
  },
  explorer: {
    id: 'explorer',
    name: 'Aventurero',
    price: 4990,
    description: 'Para quien viaja 2-3 veces al año',
    icon: '✈️',
    features: [
      'Todo lo del plan Explorador',
      'Descuento 10% en todas las experiencias',
      'Guardar hasta 10 viajes',
      'Acceso anticipado a ofertas',
      'Soporte chat prioritario',
    ],
    benefits: {
      discountPercentage: 10,
      freeBookingsPerYear: 0,
      prioritySupport: true,
      exclusiveExperiences: false,
      earnDoublePoints: false,
    },
    color: 'from-blue-400 to-cyan-500',
  },
  adventurer: {
    id: 'adventurer',
    name: 'Expedicionario',
    price: 9990,
    description: 'Para viajeros frecuentes',
    icon: '🏔️',
    features: [
      'Todo lo del plan Aventurero',
      'Descuento 20% en todas las experiencias',
      'Guardar hasta 30 viajes',
      'Acceso a experiencias exclusivas',
      'Puntos dobles en cada reserva',
    ],
    benefits: {
      discountPercentage: 20,
      freeBookingsPerYear: 0,
      prioritySupport: true,
      exclusiveExperiences: true,
      earnDoublePoints: true,
    },
    color: 'from-purple-400 to-pink-500',
  },
  legend: {
    id: 'legend',
    name: 'Leyenda',
    price: 19990,
    description: 'La experiencia máxima de viaje',
    icon: '⭐',
    features: [
      'Todo lo del plan Expedicionario',
      'Descuento 30% en todas las experiencias',
      'Guardar viajes ilimitados',
      'Experiencias VIP exclusivas',
      'Puntos 5x en cada reserva',
    ],
    benefits: {
      discountPercentage: 30,
      freeBookingsPerYear: 0,
      prioritySupport: true,
      exclusiveExperiences: true,
      earnDoublePoints: true,
    },
    color: 'from-yellow-400 to-red-500',
  },
}

export interface UserMembership {
  userId: string
  tier: MembershipTier
  createdAt: string
  renewalDate?: string
  isActive: boolean
  pointsBalance: number
}
