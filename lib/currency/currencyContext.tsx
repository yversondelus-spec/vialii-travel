'use client'

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  DEFAULT_CURRENCY,
  SUPPORTED_CURRENCIES,
  convert,
  detectCurrency,
  fetchExchangeRates,
  formatCurrency,
  getCurrency,
} from '@/lib/services/currencyService'
import type { Currency, CurrencyCode, ExchangeRates } from '@/lib/types/currency'

const STORAGE_KEY = 'vialii_currency'

interface CurrencyContextValue {
  /** Currency the user has chosen to see prices in. */
  currency: CurrencyCode
  currencyInfo: Currency
  setCurrency: (code: CurrencyCode) => void
  /** True while the live exchange-rate fetch is in flight. Rates are usable (fallback) even while true. */
  loading: boolean
  /** True when `rates` is the static approximate table rather than a live fetch. */
  isFallbackRates: boolean
  /** Converts `amount` (in `from`) into the selected display currency and formats it, e.g. "$1.234". */
  displayPrice: (amount: number, from: CurrencyCode) => string
  /** Raw numeric conversion into the selected display currency, with no formatting. */
  convertToDisplay: (amount: number, from: CurrencyCode) => number
}

const CurrencyContext = createContext<CurrencyContextValue | undefined>(undefined)

function readStoredCurrency(): CurrencyCode | null {
  if (typeof window === 'undefined') return null
  const stored = localStorage.getItem(STORAGE_KEY)
  return stored && SUPPORTED_CURRENCIES.some((c) => c.code === stored) ? (stored as CurrencyCode) : null
}

export function CurrencyProvider({ children }: { children: ReactNode }) {
  // Lazy initializer avoids a render with the wrong currency before hydration reads localStorage.
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => readStoredCurrency() ?? DEFAULT_CURRENCY)
  const [rates, setRates] = useState<ExchangeRates | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Only auto-detect when the user has never explicitly picked a currency.
    const applyDetected = () => {
      if (readStoredCurrency()) return
      const detected = detectCurrency()
      if (detected !== DEFAULT_CURRENCY) setCurrencyState(detected)
    }
    applyDetected()
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = () => {
      fetchExchangeRates(DEFAULT_CURRENCY).then((result) => {
        if (!cancelled) {
          setRates(result)
          setLoading(false)
        }
      })
    }
    load()
    return () => {
      cancelled = true
    }
  }, [])

  const setCurrency = useCallback((code: CurrencyCode) => {
    setCurrencyState(code)
    localStorage.setItem(STORAGE_KEY, code)
  }, [])

  const convertToDisplay = useCallback(
    (amount: number, from: CurrencyCode) => {
      if (!rates) return amount
      return convert(amount, from, currency, rates)
    },
    [rates, currency]
  )

  const displayPrice = useCallback(
    (amount: number, from: CurrencyCode) => formatCurrency(convertToDisplay(amount, from), currency),
    [convertToDisplay, currency]
  )

  const value = useMemo<CurrencyContextValue>(
    () => ({
      currency,
      currencyInfo: getCurrency(currency),
      setCurrency,
      loading,
      isFallbackRates: rates?.isFallback ?? true,
      displayPrice,
      convertToDisplay,
    }),
    [currency, setCurrency, loading, rates, displayPrice, convertToDisplay]
  )

  return <CurrencyContext.Provider value={value}>{children}</CurrencyContext.Provider>
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext)
  if (!ctx) throw new Error('useCurrency must be used within a CurrencyProvider')
  return ctx
}
