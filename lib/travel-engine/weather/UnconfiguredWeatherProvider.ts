import type { WeatherProvider } from './WeatherProvider'
import type { WeatherForecastResult } from '../core/models'

/**
 * No weather API is integrated in VIALII yet — this codebase doesn't have
 * one to wrap (Section 30: don't invent provider functionality). This
 * exists so `WeatherProvider` is a real, callable interface today: it
 * always returns the "not available" branch of `WeatherForecastResult`
 * explicitly, rather than the app silently omitting a weather section or
 * some other layer being tempted to fabricate a forecast (Section 7's rule
 * applies to every data source, not just the AI layer).
 */
export class UnconfiguredWeatherProvider implements WeatherProvider {
  readonly id = 'unconfigured'
  readonly name = 'No weather provider configured'
  readonly isConfigured = false

  async getForecast(): Promise<WeatherForecastResult> {
    return { available: false, provider: this.id, reason: 'No weather provider is configured for VIALII yet.' }
  }
}
