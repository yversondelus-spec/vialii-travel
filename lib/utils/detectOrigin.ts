const FALLBACK_ORIGIN = 'Santiago, Chile'
const TIMEOUT_MS = 4000

export interface OriginDetectionResult {
  origin: string
  /** false when this is the Santiago fallback, not an actual IP lookup — so the UI only shows "Detectamos que estás en..." when it's true. */
  detected: boolean
  countryName?: string
}

/**
 * Best-effort IP geolocation for the search form's origin field — always
 * user-editable, never blocks the form. ipapi.co's free tier needs no key;
 * on any failure (network, rate limit, missing data) this falls back to
 * Santiago, Chile rather than leaving the field blank or throwing.
 */
export async function detectOrigin(): Promise<OriginDetectionResult> {
  if (typeof window === 'undefined') return { origin: FALLBACK_ORIGIN, detected: false }

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS)

    const response = await fetch('https://ipapi.co/json/', { signal: controller.signal })
    clearTimeout(timeout)

    if (!response.ok) return { origin: FALLBACK_ORIGIN, detected: false }

    const data = await response.json()
    const city: string | undefined = data.city
    const country: string | undefined = data.country_name

    if (city && country) return { origin: `${city}, ${country}`, detected: true, countryName: country }
    if (country) return { origin: country, detected: true, countryName: country }
    return { origin: FALLBACK_ORIGIN, detected: false }
  } catch {
    return { origin: FALLBACK_ORIGIN, detected: false }
  }
}

export { FALLBACK_ORIGIN }
