import type { Vibe } from './vibes'

export interface NationalOffer {
  id: string
  name: string
  tagline: string
  image: string
  vibes: Vibe[]
}

// Curated Chilean destinations for the "Nacional" scope — images individually
// verified (HTTP 200 + visually confirmed subject match), same bar as
// constants/destinations.ts. The mock transport providers (lib/providers/transport)
// don't validate city names, so any of these route straight into a working /search.
export const NATIONAL_OFFERS: NationalOffer[] = [
  {
    id: 'atacama',
    name: 'Atacama',
    tagline: 'Desierto, estrellas y aventura',
    image: 'https://images.unsplash.com/photo-1517824806704-9040b037703b?w=800&h=600&fit=crop',
    vibes: ['naturaleza', 'solo'],
  },
  {
    id: 'pucon',
    name: 'Pucón',
    tagline: 'Volcán, lago y adrenalina',
    image: 'https://images.unsplash.com/photo-1583020012106-fe5c36d3fd03?w=800&h=600&fit=crop',
    vibes: ['naturaleza', 'pareja'],
  },
  {
    id: 'puerto-varas',
    name: 'Puerto Varas',
    tagline: 'Paisaje de película, calma total',
    image: 'https://images.unsplash.com/photo-1578704399126-38975ba256d7?w=800&h=600&fit=crop',
    vibes: ['solo', 'pareja'],
  },
  {
    id: 'isla-de-pascua',
    name: 'Isla de Pascua',
    tagline: 'Una experiencia única en el mundo',
    image: 'https://images.unsplash.com/photo-1524536120883-854d2c00bf1f?w=800&h=600&fit=crop',
    vibes: ['solo', 'naturaleza'],
  },
]
