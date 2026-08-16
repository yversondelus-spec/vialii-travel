/**
 * Resolución ciudad -> código IATA para el Travel Engine.
 *
 * Devuelve `null` cuando no reconoce la ciudad, deliberadamente: el
 * comportamiento anterior (`|| 'SCL'`) convertía una ciudad desconocida en
 * una búsqueda Santiago->Santiago sin avisar a nadie. Es preferible no
 * ofrecer vuelos que ofrecer vuelos de una ruta que el usuario no pidió.
 */

/** Ciudad -> IATA. Claves normalizadas: minúsculas, sin acentos, sin país. */
const CITY_TO_IATA: Record<string, string> = {
  // Chile
  santiago: 'SCL',
  'puerto montt': 'PMC',
  antofagasta: 'ANF',
  calama: 'CJC',
  'san pedro de atacama': 'CJC',
  atacama: 'CJC',
  iquique: 'IQQ',
  arica: 'ARI',
  concepcion: 'CCP',
  temuco: 'ZCO',
  pucon: 'ZCO',
  villarrica: 'ZCO',
  'la serena': 'LSC',
  coyhaique: 'BBA',
  balmaceda: 'BBA',
  'punta arenas': 'PUQ',
  'puerto natales': 'PNT',
  'torres del paine': 'PNT',
  valdivia: 'ZAL',
  osorno: 'ZOS',
  copiapo: 'CPO',
  'isla de pascua': 'IPC',
  'rapa nui': 'IPC',
  castro: 'MHC',
  chiloe: 'MHC',
  
// Ciudades sin aeropuerto comercial propio -> hub mas cercano. La
  // geolocalizacion por IP suele caer en comunas pequeñas; sin esto la
  // busqueda nunca ofrece vuelos y el usuario no entiende por que.
  mulchen: 'CCP',      // ~100 km de Concepcion
  chillan: 'CCP',
  talca: 'SCL',
  curico: 'SCL',
  rancagua: 'SCL',
  'san fernando': 'SCL',
  linares: 'SCL',
  quillota: 'SCL',
  'san antonio': 'SCL',
  melipilla: 'SCL',
  ovalle: 'LSC',
  vallenar: 'CPO',
  angol: 'ZCO',
  victoria: 'ZCO',
  'puerto varas': 'PMC',
  frutillar: 'PMC',
  ancud: 'MHC',
  // Latinoamérica
  'buenos aires': 'EZE',
  mendoza: 'MDZ',
  bariloche: 'BRC',
  cordoba: 'COR',
  lima: 'LIM',
  cusco: 'CUZ',
  'la paz': 'LPB',
  'santa cruz': 'VVI',
  bogota: 'BOG',
  cartagena: 'CTG',
  medellin: 'MDE',
  'sao paulo': 'GRU',
  'rio de janeiro': 'GIG',
  'florianopolis': 'FLN',
  montevideo: 'MVD',
  'punta del este': 'PDP',
  asuncion: 'ASU',
  quito: 'UIO',
  guayaquil: 'GYE',
  caracas: 'CCS',
  'ciudad de mexico': 'MEX',
  cancun: 'CUN',
  'punta cana': 'PUJ',
  'san jose': 'SJO',
  panama: 'PTY',
  habana: 'HAV',
  'la habana': 'HAV',

  // Norteamérica
  'nueva york': 'JFK',
  'new york': 'JFK',
  miami: 'MIA',
  'los angeles': 'LAX',
  'san francisco': 'SFO',
  chicago: 'ORD',
  toronto: 'YYZ',

  // Europa
  madrid: 'MAD',
  barcelona: 'BCN',
  paris: 'CDG',
  londres: 'LHR',
  london: 'LHR',
  roma: 'FCO',
  milan: 'MXP',
  lisboa: 'LIS',
  amsterdam: 'AMS',
  berlin: 'BER',
  frankfurt: 'FRA',
  zurich: 'ZRH',
  atenas: 'ATH',
  santorini: 'JTR',
  estambul: 'IST',

  // Asia / Oceanía / África / Medio Oriente
  tokio: 'HND',
  tokyo: 'HND',
  bangkok: 'BKK',
  phuket: 'HKT',
  bali: 'DPS',
  denpasar: 'DPS',
  singapur: 'SIN',
  'hong kong': 'HKG',
  seul: 'ICN',
  dubai: 'DXB',
  doha: 'DOH',
  maldivas: 'MLE',
  male: 'MLE',
  sidney: 'SYD',
  sydney: 'SYD',
  melbourne: 'MEL',
  auckland: 'AKL',
  queenstown: 'ZQN',
  marrakech: 'RAK',
  casablanca: 'CMN',
  'ciudad del cabo': 'CPT',
  'el cairo': 'CAI',
}

/**
 * Normaliza lo que escribe el usuario para que coincida con las claves:
 * quita acentos, pasa a minúsculas, y descarta el país ("Calama, Chile" ->
 * "calama"), que es como la UI envía el origen autodetectado por IP.
 */
function normalize(input: string): string {
  return input
    .split(',')[0]
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

/** Ya es un código IATA (3 letras mayúsculas) tal como lo escribió el usuario. */
function isIataCode(input: string): boolean {
  return /^[A-Z]{3}$/.test(input.trim())
}

/**
 * Resuelve una ciudad a su código IATA, o `null` si no la reconoce.
 * Acepta también un código IATA directo (útil para scripts y tests).
 */
export function resolveIata(cityOrCode: string): string | null {
  if (!cityOrCode) return null
  if (isIataCode(cityOrCode)) return cityOrCode.trim()
  return CITY_TO_IATA[normalize(cityOrCode)] ?? null
}

/** Para diagnóstico: cuántas ciudades cubre el resolver hoy. */
export function knownCityCount(): number {
  return Object.keys(CITY_TO_IATA).length
}