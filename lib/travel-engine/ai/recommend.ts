import { callClaude } from '@/lib/ai/anthropic'
import { logger } from '@/lib/logger'
import type { FlightSearchResponse } from '../orchestrator/TravelSearchOrchestrator'

export type AIFlightRecommendation =
  | { status: 'ok'; explanation: string; highlightedOfferId: string }
  | { status: 'insufficient_data'; reason: string }
  | { status: 'error'; reason: string }

const SYSTEM_PROMPT = `Eres el asistente de viajes de VIALII.
Tu única fuente de verdad son las ofertas de vuelo que se te entregan en el mensaje del usuario — ya vienen buscadas, normalizadas y ordenadas por un motor de comparación real.
Reglas estrictas:
- NUNCA inventes precios, disponibilidad, vuelos, horarios, políticas de tarifa ni reservas que no estén en la lista entregada.
- Solo puedes citar cifras (precio, duración, escalas, moneda) que aparezcan textualmente en la lista.
- Si la lista no alcanza para responder algo con certeza, dilo explícitamente en vez de adivinar.
Responde en español, en un párrafo breve (máximo 3 frases), explicando por qué la primera oferta de la lista es la mejor recomendación frente a las demás, citando cifras reales de la lista.`

function formatOffersForPrompt(searchResult: FlightSearchResponse): string {
  return searchResult.ranked
    .slice(0, 5)
    .map((ranked, index) => {
      const offer = ranked.offer
      const hours = Math.round(offer.durationMinutes / 60)
      const conditions = offer.refundable === undefined ? 'condiciones no informadas' : offer.refundable ? 'reembolsable' : 'no reembolsable'
      return `${index + 1}. Proveedor: ${offer.provider} | Aerolínea: ${offer.airline} | Precio: ${offer.price} ${offer.currency} | Duración: ${hours}h | Escalas: ${offer.stops} | ${conditions} | Puntaje VIALII: ${ranked.score.finalScore}/10`
    })
    .join('\n')
}

/**
 * The ONLY place the AI layer touches flight data — it receives the
 * orchestrator's already-ranked, already-priced `FlightSearchResponse` and
 * is explicitly forbidden (via the system prompt) from citing anything
 * outside it (Section 7). This is a prompt-level guarantee, not a
 * cryptographic one — Claude could still deviate; there's no code-level
 * validation that every number in its reply appears in the input. If that
 * matters more than a single well-constrained prompt, add a post-hoc
 * numeric cross-check before trusting this in a stricter context.
 */
export async function recommendFlight(searchResult: FlightSearchResponse): Promise<AIFlightRecommendation> {
  if (searchResult.offers.length === 0) {
    return { status: 'insufficient_data', reason: 'No hay ofertas de vuelo disponibles para generar una recomendación.' }
  }

  const topOfferId = searchResult.ranked[0]?.offer.id
  if (!topOfferId) {
    return { status: 'insufficient_data', reason: 'No se pudo determinar una oferta destacada.' }
  }

  try {
    const explanation = await callClaude(
      [{ role: 'user', content: `Ofertas disponibles, ya ordenadas por el motor de comparación de VIALII:\n${formatOffersForPrompt(searchResult)}` }],
      SYSTEM_PROMPT
    )
    return { status: 'ok', explanation: explanation.trim(), highlightedOfferId: topOfferId }
  } catch (error) {
    logger.error('AI flight recommendation failed', { message: error instanceof Error ? error.message : String(error) })
    return { status: 'error', reason: 'No se pudo generar una recomendación de IA en este momento.' }
  }
}
