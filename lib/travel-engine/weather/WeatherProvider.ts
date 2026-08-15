import type { WeatherForecastResult } from '../core/models'

/** Contract for weather sources (Section 13). No real weather API exists in this codebase yet — see UnconfiguredWeatherProvider.ts. */
export interface WeatherProvider {
  readonly id: string
  readonly name: string
  readonly isConfigured: boolean

  getForecast(destination: string, date: string): Promise<WeatherForecastResult>
}
