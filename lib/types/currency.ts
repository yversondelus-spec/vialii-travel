export type CurrencyCode =
  // Principales
  | 'USD' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD'
  // Latinoamérica
  | 'CLP' | 'ARS' | 'MXN' | 'BRL' | 'COP' | 'PEN' | 'UYU'
  // Asia
  | 'INR' | 'THB' | 'SGD' | 'HKD' | 'CNY' | 'KRW'
  // Otros
  | 'NZD' | 'ZAR' | 'MYR' | 'PHP' | 'IDR' | 'VND' | 'TRY' | 'AED' | 'SAR' | 'CHF' | 'SEK' | 'NOK'

export interface Currency {
  code: CurrencyCode
  symbol: string
  name: string
  /** BCP-47 locale used to format numbers for this currency (grouping/decimal style). */
  locale: string
  /** Decimal places typically shown (0 for currencies like CLP/JPY/VND that don't use cents). */
  decimals: number
  regions: string[]
  popular?: boolean
}

/** Rates keyed by currency code, all expressed relative to `base`. */
export interface ExchangeRates {
  base: CurrencyCode
  rates: Partial<Record<CurrencyCode, number>>
  fetchedAt: number
  /** True when these are the static fallback rates, not a live fetch. */
  isFallback: boolean
}
