import { isNetworkError } from '@/lib/utils/isNetworkError'
import { logger } from '@/lib/logger'
import type { Currency, CurrencyCode, ExchangeRates } from '@/lib/types/currency'

export const DEFAULT_CURRENCY: CurrencyCode = 'USD'

export const SUPPORTED_CURRENCIES: Currency[] = [
  // Principales
  { code: 'USD', symbol: '$', name: 'Dólar estadounidense', locale: 'en-US', decimals: 2, regions: ['USA', 'Global'], popular: true },
  { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE', decimals: 2, regions: ['Europe'], popular: true },
  { code: 'GBP', symbol: '£', name: 'Libra esterlina', locale: 'en-GB', decimals: 2, regions: ['UK'], popular: true },
  { code: 'JPY', symbol: '¥', name: 'Yen japonés', locale: 'ja-JP', decimals: 0, regions: ['Japan'] },
  { code: 'AUD', symbol: 'A$', name: 'Dólar australiano', locale: 'en-AU', decimals: 2, regions: ['Australia'] },
  { code: 'CAD', symbol: 'C$', name: 'Dólar canadiense', locale: 'en-CA', decimals: 2, regions: ['Canada'] },

  // Latinoamérica
  { code: 'CLP', symbol: '$', name: 'Peso chileno', locale: 'es-CL', decimals: 0, regions: ['Chile'], popular: true },
  { code: 'ARS', symbol: '$', name: 'Peso argentino', locale: 'es-AR', decimals: 0, regions: ['Argentina'], popular: true },
  { code: 'MXN', symbol: '$', name: 'Peso mexicano', locale: 'es-MX', decimals: 2, regions: ['Mexico'], popular: true },
  { code: 'BRL', symbol: 'R$', name: 'Real brasileño', locale: 'pt-BR', decimals: 2, regions: ['Brazil'], popular: true },
  { code: 'COP', symbol: '$', name: 'Peso colombiano', locale: 'es-CO', decimals: 0, regions: ['Colombia'], popular: true },
  { code: 'PEN', symbol: 'S/', name: 'Sol peruano', locale: 'es-PE', decimals: 2, regions: ['Peru'] },
  { code: 'UYU', symbol: '$U', name: 'Peso uruguayo', locale: 'es-UY', decimals: 0, regions: ['Uruguay'] },

  // Asia
  { code: 'INR', symbol: '₹', name: 'Rupia india', locale: 'en-IN', decimals: 2, regions: ['India'] },
  { code: 'THB', symbol: '฿', name: 'Baht tailandés', locale: 'th-TH', decimals: 2, regions: ['Thailand'] },
  { code: 'SGD', symbol: 'S$', name: 'Dólar de Singapur', locale: 'en-SG', decimals: 2, regions: ['Singapore'] },
  { code: 'HKD', symbol: 'HK$', name: 'Dólar de Hong Kong', locale: 'en-HK', decimals: 2, regions: ['Hong Kong'] },
  { code: 'CNY', symbol: '¥', name: 'Yuan chino', locale: 'zh-CN', decimals: 2, regions: ['China'] },
  { code: 'KRW', symbol: '₩', name: 'Won surcoreano', locale: 'ko-KR', decimals: 0, regions: ['South Korea'] },

  // Otros
  { code: 'NZD', symbol: 'NZ$', name: 'Dólar neozelandés', locale: 'en-NZ', decimals: 2, regions: ['New Zealand'] },
  { code: 'ZAR', symbol: 'R', name: 'Rand sudafricano', locale: 'en-ZA', decimals: 2, regions: ['South Africa'] },
  { code: 'MYR', symbol: 'RM', name: 'Ringgit malayo', locale: 'ms-MY', decimals: 2, regions: ['Malaysia'] },
  { code: 'PHP', symbol: '₱', name: 'Peso filipino', locale: 'en-PH', decimals: 2, regions: ['Philippines'] },
  { code: 'IDR', symbol: 'Rp', name: 'Rupia indonesia', locale: 'id-ID', decimals: 0, regions: ['Indonesia'] },
  { code: 'VND', symbol: '₫', name: 'Dong vietnamita', locale: 'vi-VN', decimals: 0, regions: ['Vietnam'] },
  { code: 'TRY', symbol: '₺', name: 'Lira turca', locale: 'tr-TR', decimals: 2, regions: ['Turkey'] },
  { code: 'AED', symbol: 'د.إ', name: 'Dirham de EAU', locale: 'ar-AE', decimals: 2, regions: ['UAE'] },
  { code: 'SAR', symbol: '﷼', name: 'Riyal saudí', locale: 'ar-SA', decimals: 2, regions: ['Saudi Arabia'] },
  { code: 'CHF', symbol: 'CHF', name: 'Franco suizo', locale: 'de-CH', decimals: 2, regions: ['Switzerland'] },
  { code: 'SEK', symbol: 'kr', name: 'Corona sueca', locale: 'sv-SE', decimals: 2, regions: ['Sweden'] },
  { code: 'NOK', symbol: 'kr', name: 'Corona noruega', locale: 'nb-NO', decimals: 2, regions: ['Norway'] },
]

const CURRENCY_BY_CODE = new Map(SUPPORTED_CURRENCIES.map((c) => [c.code, c]))

export function getCurrency(code: CurrencyCode): Currency {
  return CURRENCY_BY_CODE.get(code) ?? CURRENCY_BY_CODE.get(DEFAULT_CURRENCY)!
}

/**
 * Static snapshot, USD-based, used whenever the live rate fetch fails or is
 * skipped (offline, API down, SSR). Approximate — good enough for display
 * purposes, never for actual settlement math. Keep in sync roughly annually.
 */
const FALLBACK_RATES: Partial<Record<CurrencyCode, number>> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 149,
  AUD: 1.52,
  CAD: 1.36,
  CLP: 980,
  ARS: 1000,
  MXN: 17,
  BRL: 5.4,
  COP: 4100,
  PEN: 3.75,
  UYU: 40,
  INR: 84,
  THB: 34,
  SGD: 1.34,
  HKD: 7.8,
  CNY: 7.2,
  KRW: 1390,
  NZD: 1.66,
  ZAR: 18,
  MYR: 4.4,
  PHP: 57,
  IDR: 15800,
  VND: 25200,
  TRY: 34,
  AED: 3.67,
  SAR: 3.75,
  CHF: 0.88,
  SEK: 10.5,
  NOK: 10.8,
}

const CACHE_KEY_PREFIX = 'vialii_fx_rates_'
const CACHE_TTL_MS = 12 * 60 * 60 * 1000 // 12h — rates don't need to be second-fresh for display

function readCache(base: CurrencyCode): ExchangeRates | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CACHE_KEY_PREFIX + base)
    if (!raw) return null
    const cached = JSON.parse(raw) as ExchangeRates
    if (Date.now() - cached.fetchedAt > CACHE_TTL_MS) return null
    return cached
  } catch {
    return null
  }
}

function writeCache(rates: ExchangeRates) {
  if (typeof window === 'undefined') return
  try {
    localStorage.setItem(CACHE_KEY_PREFIX + rates.base, JSON.stringify(rates))
  } catch {
    // Storage full/unavailable — cache is a pure optimization, safe to skip.
  }
}

function fallbackRates(base: CurrencyCode): ExchangeRates {
  const baseRate = FALLBACK_RATES[base] ?? 1
  const rates: Partial<Record<CurrencyCode, number>> = {}
  for (const [code, rate] of Object.entries(FALLBACK_RATES) as [CurrencyCode, number][]) {
    rates[code] = rate / baseRate
  }
  return { base, rates, fetchedAt: Date.now(), isFallback: true }
}

/**
 * Fetches live exchange rates for `base`, relative to a free no-key API
 * (open.er-api.com). Falls back to a static approximate table on any
 * network failure, offline, or SSR — mirrors the Supabase-first /
 * local-fallback pattern used in lib/auth/authContext.tsx.
 */
export async function fetchExchangeRates(base: CurrencyCode = DEFAULT_CURRENCY): Promise<ExchangeRates> {
  const cached = readCache(base)
  if (cached) return cached

  if (typeof window === 'undefined') return fallbackRates(base)

  try {
    // Falls back to the static table below on timeout too, so a slow/hung
    // exchange-rate API never blocks the currency selector from working.
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`, { signal: AbortSignal.timeout(8_000) })
    if (!res.ok) throw new Error(`fetch failed with status ${res.status}`)
    const data = await res.json()
    if (data.result !== 'success' || !data.rates) throw new Error('unexpected response shape')

    const result: ExchangeRates = { base, rates: data.rates, fetchedAt: Date.now(), isFallback: false }
    writeCache(result)
    return result
  } catch (err) {
    if (!isNetworkError(err)) logger.error('Exchange rate fetch failed', { message: err instanceof Error ? err.message : String(err) })
    return fallbackRates(base)
  }
}

/** Converts `amount` from `from` to `to` using the given rates (relative to `rates.base`). */
export function convert(amount: number, from: CurrencyCode, to: CurrencyCode, rates: ExchangeRates): number {
  if (from === to) return amount

  const fromRate = from === rates.base ? 1 : rates.rates[from]
  const toRate = to === rates.base ? 1 : rates.rates[to]
  if (fromRate === undefined || toRate === undefined) return amount // unknown pair — display as-is rather than throw

  const amountInBase = amount / fromRate
  return amountInBase * toRate
}

export function formatCurrency(amount: number, code: CurrencyCode): string {
  const currency = getCurrency(code)
  const rounded = currency.decimals === 0 ? Math.round(amount) : amount
  const formatted = rounded.toLocaleString(currency.locale, {
    minimumFractionDigits: currency.decimals,
    maximumFractionDigits: currency.decimals,
  })
  return `${currency.symbol}${formatted}`
}

/**
 * Best-effort initial currency guess with no network call and no permission
 * prompt: maps the browser's IANA timezone to a likely local currency. Falls
 * back to region from `navigator.language`, then USD. This is a starting
 * suggestion, not a source of truth — the user can always override it via
 * the currency selector, and that choice is what gets persisted.
 */
const TIMEZONE_CURRENCY_MAP: Record<string, CurrencyCode> = {
  'America/Santiago': 'CLP',
  'America/Argentina/Buenos_Aires': 'ARS',
  'America/Mexico_City': 'MXN',
  'America/Sao_Paulo': 'BRL',
  'America/Bogota': 'COP',
  'America/Lima': 'PEN',
  'America/Montevideo': 'UYU',
  'America/New_York': 'USD',
  'America/Chicago': 'USD',
  'America/Denver': 'USD',
  'America/Los_Angeles': 'USD',
  'America/Toronto': 'CAD',
  'America/Vancouver': 'CAD',
  'Europe/Madrid': 'EUR',
  'Europe/Paris': 'EUR',
  'Europe/Berlin': 'EUR',
  'Europe/Rome': 'EUR',
  'Europe/Amsterdam': 'EUR',
  'Europe/Lisbon': 'EUR',
  'Europe/London': 'GBP',
  'Europe/Zurich': 'CHF',
  'Europe/Stockholm': 'SEK',
  'Europe/Oslo': 'NOK',
  'Europe/Istanbul': 'TRY',
  'Asia/Tokyo': 'JPY',
  'Asia/Shanghai': 'CNY',
  'Asia/Hong_Kong': 'HKD',
  'Asia/Singapore': 'SGD',
  'Asia/Bangkok': 'THB',
  'Asia/Kolkata': 'INR',
  'Asia/Manila': 'PHP',
  'Asia/Jakarta': 'IDR',
  'Asia/Ho_Chi_Minh': 'VND',
  'Asia/Kuala_Lumpur': 'MYR',
  'Asia/Dubai': 'AED',
  'Asia/Riyadh': 'SAR',
  'Asia/Seoul': 'KRW',
  'Australia/Sydney': 'AUD',
  'Australia/Melbourne': 'AUD',
  'Pacific/Auckland': 'NZD',
  'Africa/Johannesburg': 'ZAR',
}

export function detectCurrency(): CurrencyCode {
  if (typeof window === 'undefined') return DEFAULT_CURRENCY

  try {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone
    if (timezone && TIMEZONE_CURRENCY_MAP[timezone]) return TIMEZONE_CURRENCY_MAP[timezone]
  } catch {
    // Intl unsupported — fall through to language-based guess.
  }

  try {
    const region = new Intl.Locale(navigator.language).maximize().region
    if (region && REGION_CURRENCY_MAP[region]) return REGION_CURRENCY_MAP[region]
  } catch {
    // navigator.language missing/unparsable — use default.
  }

  return DEFAULT_CURRENCY
}

/** ISO 3166-1 alpha-2 region code -> likely currency. Fallback used only when the timezone lookup above misses. */
const REGION_CURRENCY_MAP: Record<string, CurrencyCode> = {
  CL: 'CLP', AR: 'ARS', MX: 'MXN', BR: 'BRL', CO: 'COP', PE: 'PEN', UY: 'UYU',
  US: 'USD', CA: 'CAD', GB: 'GBP', AU: 'AUD', NZ: 'NZD', ZA: 'ZAR',
  ES: 'EUR', FR: 'EUR', DE: 'EUR', IT: 'EUR', PT: 'EUR', NL: 'EUR', IE: 'EUR',
  CH: 'CHF', SE: 'SEK', NO: 'NOK', TR: 'TRY',
  JP: 'JPY', CN: 'CNY', HK: 'HKD', SG: 'SGD', TH: 'THB', IN: 'INR',
  PH: 'PHP', ID: 'IDR', VN: 'VND', MY: 'MYR', AE: 'AED', SA: 'SAR', KR: 'KRW',
}
