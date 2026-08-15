import { NATIONAL_OFFERS } from './nationalOffers'

export interface ChileanTour {
  id: string
  name: string
  region: string
  city: string
  description: string
  /** Only set when a photo of the actual place was individually verified (HTTP 200 + visual match) — see constants/destinations.ts for why that bar exists. Missing means the UI falls back to a gradient card instead of guessing. */
  image?: string
  price: number
  currency: 'CLP'
  duration: number // horas
  difficulty: 'fácil' | 'moderado' | 'difícil'
  groupSize: number
  highlights: string[]
  includes: string[]
  excludes: string[]
  coordinates: { lat: number; lng: number }
  startTimes: string[]
  bestSeason: string
}

// Contenido editorial de VIALII (no listados de un operador real, no hay
// sistema de reservas en vivo detrás todavía) — por eso no hay rating ni
// review count: no existe ningún sistema de reseñas para tours, e inventar
// esos números sería el mismo problema que con los testimonios falsos (ver
// TrendingExperiencesSection.tsx). Precios en CLP, aproximados.
export const CHILEAN_TOURS: ChileanTour[] = [
  {
    id: 'cajon-maipo-trek',
    name: 'Trekking Cascada de las Ánimas',
    region: 'Metropolitana',
    city: 'Cajón del Maipo',
    description:
      'Caminata de 4 horas a través de bosques nativos y cascadas en el corazón del Cajón del Maipo. Ideal para principiantes y amantes de la naturaleza.',
    price: 42000,
    currency: 'CLP',
    duration: 4,
    difficulty: 'moderado',
    groupSize: 12,
    highlights: [
      'Cascadas de agua cristalina',
      'Bosque nativo de coihue y araucaria',
      'Vistas panorámicas del valle',
      'Piscinas naturales para refrescarse',
    ],
    includes: ['Guía experto en naturaleza', 'Transporte desde Santiago', 'Almuerzo picnic', 'Equipo de seguridad'],
    excludes: ['Bebidas alcohólicas', 'Seguro de viaje'],
    coordinates: { lat: -33.65, lng: -70.31 },
    startTimes: ['08:00', '10:30', '14:00'],
    bestSeason: 'Octubre - Abril',
  },
  {
    id: 'pucon-villarrica',
    name: 'Ascenso Volcán Villarrica',
    region: 'La Araucanía',
    city: 'Pucón',
    description:
      'Aventura de 8 horas escalando el volcán activo Villarrica (2847m). Vistas de lava y del lago desde la cumbre. Solo para personas con buen estado físico.',
    image: NATIONAL_OFFERS.find((o) => o.id === 'pucon')!.image,
    price: 84000,
    currency: 'CLP',
    duration: 8,
    difficulty: 'difícil',
    groupSize: 10,
    highlights: ['Vista desde la cumbre del volcán', 'Cráter activo y fumarolas', 'Vistas del Lago Villarrica', 'Aventura de escalada moderada'],
    includes: [
      'Guía certificado',
      'Transporte desde Pucón',
      'Equipo de escalada (crampones, piolets)',
      '2 comidas (desayuno y almuerzo)',
      'Seguro de accidente',
    ],
    excludes: ['Aclimatación previa', 'Entrenamientos adicionales'],
    coordinates: { lat: -39.42, lng: -71.94 },
    startTimes: ['06:00'],
    bestSeason: 'Diciembre - Marzo',
  },
  {
    id: 'laguna-del-laja',
    name: 'Kayak en Laguna del Laja',
    region: 'Biobío',
    city: 'Santa Bárbara',
    description:
      'Experiencia de kayak de 3 horas en laguna alpina a 1520m. Rodeado de volcanes y naturaleza virgen. Ideal para todos los niveles.',
    price: 61000,
    currency: 'CLP',
    duration: 3,
    difficulty: 'fácil',
    groupSize: 15,
    highlights: ['Agua cristalina de montaña', 'Volcanes Sierra Velluda y Antuco', 'Fauna nativa (pumas, guanacos)', 'Fotografía de paisaje único'],
    includes: ['Kayak y chaleco de flotación', 'Guía de naturaleza', 'Transporte desde Santa Bárbara', 'Snacks y bebidas'],
    excludes: ['Secador de cabello', 'Equipo fotográfico profesional'],
    coordinates: { lat: -37.57, lng: -71.66 },
    startTimes: ['09:00', '13:00'],
    bestSeason: 'Septiembre - Marzo',
  },
  {
    id: 'torres-del-paine',
    name: 'Torres del Paine - Trek 3 Días',
    region: 'Magallanes',
    city: 'Puerto Natales',
    description: 'Trek legendario en Patagonia. Recorre los glaciares y torres de granito más icónicas de Chile en 3 días intensos.',
    image: 'https://images.unsplash.com/photo-1723227300708-1ff74add4195?w=800&h=600&fit=crop',
    price: 279000,
    currency: 'CLP',
    duration: 72,
    difficulty: 'difícil',
    groupSize: 8,
    highlights: ['Torres de granito de 2500m', 'Glaciares Balmaceda y Paine', 'Fauna patagónica (guanacos, ñandúes)', 'Alojamiento en refugios boutique'],
    includes: ['Guía experimentado en Patagonia', 'Transporte desde Puerto Natales', 'Alojamiento 2 noches', 'Todas las comidas', 'Equipo de trekking'],
    excludes: ['Vuelo a Punta Arenas', 'Entrada al Parque (~$80.000 CLP)'],
    coordinates: { lat: -51.03, lng: -73.14 },
    startTimes: ['08:00'],
    bestSeason: 'Octubre - Marzo',
  },
  {
    id: 'atacama-stargazing',
    name: 'Observación de Estrellas Atacama',
    region: 'Atacama',
    city: 'San Pedro de Atacama',
    description: 'Noche de astronomía en el desierto más seco del mundo. Observa miles de estrellas con telescopio profesional.',
    image: NATIONAL_OFFERS.find((o) => o.id === 'atacama')!.image,
    price: 74000,
    currency: 'CLP',
    duration: 5,
    difficulty: 'fácil',
    groupSize: 12,
    highlights: ['Cielo estrellado sin contaminación lumínica', 'Telescopios profesionales', 'Presentación astronómica', 'Fotografía de cielo nocturno'],
    includes: ['Astrónomo profesional', 'Transporte desde San Pedro', 'Telescopio de última generación', 'Bebidas calientes y snacks'],
    excludes: ['Ropa abrigada', 'Cámara fotográfica'],
    coordinates: { lat: -22.91, lng: -68.2 },
    startTimes: ['20:00'],
    bestSeason: 'Abril - Septiembre',
  },
  {
    id: 'chiloe-folklore',
    name: 'Inmersión Cultural Chiloé - 2 Días',
    region: 'Los Lagos',
    city: 'Dalcahue',
    description: 'Experimenta la cultura única de Chiloé: mitología, gastronomía y arquitectura tradicional en 2 días.',
    price: 176000,
    currency: 'CLP',
    duration: 48,
    difficulty: 'fácil',
    groupSize: 10,
    highlights: ['Iglesias de madera patrimonio UNESCO', 'Gastronomía tradicional chilota', 'Mercado artesanal de Dalcahue', 'Kayak en estero Dalcahue'],
    includes: ['Guía cultural chilote', 'Alojamiento en casa tradicional', 'Todas las comidas (con mariscos)', 'Visita a astilleros de botes'],
    excludes: ['Transporte desde Puerto Montt'],
    coordinates: { lat: -42.38, lng: -73.4 },
    startTimes: ['10:00'],
    bestSeason: 'Octubre - Abril',
  },
]

export function getTourById(id: string): ChileanTour | undefined {
  return CHILEAN_TOURS.find((tour) => tour.id === id)
}

export function getToursByRegion(region: string): ChileanTour[] {
  return CHILEAN_TOURS.filter((tour) => tour.region.toLowerCase().includes(region.toLowerCase()))
}

export function searchTours(query: string): ChileanTour[] {
  const q = query.toLowerCase()
  return CHILEAN_TOURS.filter(
    (tour) =>
      tour.name.toLowerCase().includes(q) ||
      tour.city.toLowerCase().includes(q) ||
      tour.region.toLowerCase().includes(q) ||
      tour.highlights.some((h) => h.toLowerCase().includes(q))
  )
}
