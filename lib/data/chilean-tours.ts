// lib/data/chilean-tours.ts

export interface ChileanTour {
  id: string
  name: string
  region: string
  city: string
  description: string
  image: string
  price: number
  duration: number
  difficulty: 'fácil' | 'moderado' | 'difícil'
  groupSize: number
  highlights: string[]
  includes: string[]
  excludes: string[]
  rating: number
  reviews: number
  coordinates: { lat: number; lng: number }
  startTimes: string[]
  bestSeason: string
}

export const CHILEAN_TOURS: ChileanTour[] = [
  {
    id: 'cajon-maipu-trek',
    name: 'Trekking Cascada de las Ánimas',
    region: 'Metropolitana',
    city: 'Cajón del Maipo',
    description: 'Caminata de 4 horas a través de bosques nativos y cascadas. Ideal para principiantes.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    price: 45,
    duration: 4,
    difficulty: 'moderado',
    groupSize: 12,
    highlights: [
      'Cascadas de agua cristalina',
      'Bosque nativo',
      'Vistas panorámicas',
      'Piscinas naturales'
    ],
    includes: [
      'Guía experto',
      'Transporte desde Santiago',
      'Almuerzo picnic',
      'Equipo de seguridad'
    ],
    excludes: [
      'Bebidas alcohólicas',
      'Seguro de viaje'
    ],
    rating: 4.9,
    reviews: 347,
    coordinates: { lat: -33.65, lng: -70.31 },
    startTimes: ['08:00', '10:30', '14:00'],
    bestSeason: 'Octubre - Abril'
  },
  {
    id: 'pucon-villarrica',
    name: 'Ascenso Volcán Villarrica',
    region: 'La Araucanía',
    city: 'Pucón',
    description: 'Aventura de 8 horas escalando volcán activo (2847m). Solo para personas con buen estado físico.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    price: 89,
    duration: 8,
    difficulty: 'difícil',
    groupSize: 10,
    highlights: [
      'Vista desde la cumbre',
      'Cráter activo',
      'Vistas del Lago Villarrica',
      'Aventura de escalada'
    ],
    includes: [
      'Guía certificado',
      'Transporte desde Pucón',
      'Equipo de escalada',
      '2 comidas',
      'Seguro de accidente'
    ],
    excludes: [
      'Aclimatación previa'
    ],
    rating: 4.8,
    reviews: 523,
    coordinates: { lat: -39.42, lng: -71.94 },
    startTimes: ['06:00'],
    bestSeason: 'Diciembre - Marzo'
  },
  {
    id: 'laguna-del-laja',
    name: 'Kayak en Laguna del Laja',
    region: 'Biobío',
    city: 'Santa Bárbara',
    description: 'Kayak de 3 horas en laguna alpina a 1520m. Rodeado de volcanes. Ideal para todos.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    price: 65,
    duration: 3,
    difficulty: 'fácil',
    groupSize: 15,
    highlights: [
      'Agua cristalina de montaña',
      'Volcanes Sierra Velluda y Antuco',
      'Fauna nativa',
      'Fotografía de paisaje'
    ],
    includes: [
      'Kayak y chaleco',
      'Guía de naturaleza',
      'Transporte',
      'Snacks y bebidas'
    ],
    excludes: [
      'Secador de cabello'
    ],
    rating: 4.7,
    reviews: 289,
    coordinates: { lat: -37.57, lng: -71.66 },
    startTimes: ['09:00', '13:00'],
    bestSeason: 'Septiembre - Marzo'
  },
  {
    id: 'torres-del-paine',
    name: 'Torres del Paine - Trek 3 Días',
    region: 'Magallanes',
    city: 'Puerto Natales',
    description: 'Trek legendario en Patagonia. Recorre los glaciares y torres de granito más icónicas.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    price: 299,
    duration: 72,
    difficulty: 'difícil',
    groupSize: 8,
    highlights: [
      'Torres de granito',
      'Glaciares Balmaceda y Paine',
      'Fauna patagónica',
      'Alojamiento boutique'
    ],
    includes: [
      'Guía experiente',
      'Transporte',
      'Alojamiento 2 noches',
      'Todas las comidas',
      'Equipo de trekking'
    ],
    excludes: [
      'Vuelo a Punta Arenas',
      'Entrada al Parque'
    ],
    rating: 4.9,
    reviews: 712,
    coordinates: { lat: -51.03, lng: -73.14 },
    startTimes: ['08:00'],
    bestSeason: 'Octubre - Marzo'
  },
  {
    id: 'atacama-stargazing',
    name: 'Observación de Estrellas Atacama',
    region: 'Atacama',
    city: 'San Pedro de Atacama',
    description: 'Noche de astronomía en el desierto más seco. Observa miles de estrellas con telescopio.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    price: 79,
    duration: 5,
    difficulty: 'fácil',
    groupSize: 12,
    highlights: [
      'Cielo estrellado sin contaminación',
      'Telescopios profesionales',
      'Presentación astronómica',
      'Fotografía de cielo nocturno'
    ],
    includes: [
      'Astrónomo profesional',
      'Transporte',
      'Telescopio',
      'Bebidas calientes'
    ],
    excludes: [
      'Ropa abrigada'
    ],
    rating: 4.9,
    reviews: 658,
    coordinates: { lat: -22.91, lng: -68.20 },
    startTimes: ['20:00'],
    bestSeason: 'Abril - Septiembre'
  },
  {
    id: 'chiloé-folklore',
    name: 'Inmersión Cultural Chiloé - 2 Días',
    region: 'Los Lagos',
    city: 'Dalcahue',
    description: 'Experimenta la cultura única de Chiloé: mitología, gastronomía y arquitectura.',
    image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=600&fit=crop',
    price: 189,
    duration: 48,
    difficulty: 'fácil',
    groupSize: 10,
    highlights: [
      'Iglesias de madera UNESCO',
      'Gastronomía tradicional',
      'Mercado artesanal',
      'Kayak en estero'
    ],
    includes: [
      'Guía cultural',
      'Alojamiento',
      'Todas las comidas',
      'Visita a astilleros'
    ],
    excludes: [
      'Transporte desde Puerto Montt'
    ],
    rating: 4.8,
    reviews: 421,
    coordinates: { lat: -42.38, lng: -73.40 },
    startTimes: ['10:00'],
    bestSeason: 'Octubre - Abril'
  }
]

export function getTourById(id: string): ChileanTour | undefined {
  return CHILEAN_TOURS.find(tour => tour.id === id)
}

export function getToursByRegion(region: string): ChileanTour[] {
  return CHILEAN_TOURS.filter(tour => tour.region.toLowerCase().includes(region.toLowerCase()))
}

export function searchTours(query: string): ChileanTour[] {
  const q = query.toLowerCase()
  return CHILEAN_TOURS.filter(tour =>
    tour.name.toLowerCase().includes(q) ||
    tour.city.toLowerCase().includes(q) ||
    tour.region.toLowerCase().includes(q) ||
    tour.highlights.some(h => h.toLowerCase().includes(q))
  )
}
