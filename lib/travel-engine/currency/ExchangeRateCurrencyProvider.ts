import type { CurrencyProvider } from './CurrencyProvider'
import type { CurrencyQuote } from '../core/models'
import { timedProviderCall } from '../core/observability'
import { ProviderError } from '../core/errors'
import { convert, fetchExchangeRates, SUPPORTED_CURRENCIES } from '@/lib/services/currencyService'
import type { CurrencyCode } from '@/lib/types/currency'

const SUPPORTED_CODES = new Set(SUPPORTED_CURRENCIES.map((c) => c.code))

function assertCurrencyCode(code: string, operation: string): CurrencyCode {
  if (!SUPPORTED_CODES.has(code as CurrencyCode)) {
    throw new ProviderError(`Unsupported currency code "${code}"`, { provider: 'exchange-rate-api', operation, code: 'VALIDATION_ERROR' })
  }
  return code as CurrencyCode
}

/**
 * Wraps the EXISTING `lib/services/currencyService.ts` — already does real
 * conversion via open.er-api.com with a static fallback table on failure
 * (see that file's own doc comment). This adapter only translates the
 * engine's `CurrencyProvider` contract to it, no new conversion logic.
 */
export class ExchangeRateCurrencyProvider implements CurrencyProvider {
  readonly id = 'exchange-rate-api'
  readonly name = 'open.er-api.com'
  readonly isConfigured = true

  async convertCurrency(amount: number, from: string, to: string): Promise<CurrencyQuote> {
    return timedProviderCall({ provider: this.id, vertical: 'currency', operation: 'convertCurrency' }, async () => {
      const fromCode = assertCurrencyCode(from, 'convertCurrency')
      const toCode = assertCurrencyCode(to, 'convertCurrency')

      const rates = await fetchExchangeRates(fromCode)
      const convertedAmount = convert(amount, fromCode, toCode, rates)

      return {
        provider: this.id,
        from: fromCode,
        to: toCode,
        rate: amount === 0 ? 0 : convertedAmount / amount,
        amount,
        convertedAmount,
        fetchedAt: new Date(rates.fetchedAt).toISOString(),
        isFallback: rates.isFallback,
      }
    })
  }
}
