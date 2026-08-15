import type { CurrencyQuote } from '../core/models'

/** Contract for currency conversion sources (Section 13). */
export interface CurrencyProvider {
  readonly id: string
  readonly name: string
  readonly isConfigured: boolean

  convertCurrency(amount: number, from: string, to: string): Promise<CurrencyQuote>
}
