import { logger } from '@/lib/logger'

interface MessageParam {
  role: 'user' | 'assistant'
  content: string
}

export async function callClaude(
  messages: MessageParam[],
  systemPrompt: string
): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY

  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not defined')
  }

  // Without this, a hung Anthropic request would hold the /api/ai/recommendations
  // route open indefinitely — 20s is generous for a single non-streaming call.
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 20_000)

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-5',
        max_tokens: 1024,
        system: systemPrompt,
        messages: messages,
      }),
      signal: controller.signal,
    })

    if (!response.ok) {
      const errorData = await response.json()
      logger.error('Anthropic API error', { status: response.status, errorData })
      throw new Error(
        `Anthropic API error: ${errorData.error?.message || 'Unknown error'}`
      )
    }

    const data = await response.json()
    if (!data.content || !data.content[0]) {
      throw new Error('Invalid response format from Anthropic')
    }

    return data.content[0].text
  } catch (error) {
    const isTimeout = error instanceof Error && error.name === 'AbortError'
    logger.error('Claude call failed', {
      message: isTimeout ? 'Timed out after 20s' : error instanceof Error ? error.message : String(error),
    })
    throw isTimeout ? new Error('Anthropic request timed out') : error
  } finally {
    clearTimeout(timeout)
  }
}

export async function generateDestinationRecommendations(
  budget: number,
  duration: number,
  travelers: number,
  interests: string[],
  currency: string
): Promise<string> {
  const systemPrompt = `You are an expert travel advisor. Recommend 3 destinations based on the user's preferences.

For each destination, provide:
- Name and country
- Why it matches their preferences
- Estimated cost breakdown (flights, hotel, activities)
- Best time to visit
- Travel difficulty level

Format as JSON array with objects containing: name, country, matchReason, estimatedCost, bestTime, difficulty`

  const userMessage = `
Recommend destinations for:
- Budget: $${budget.toLocaleString()} ${currency}
- Duration: ${duration} days
- Travelers: ${travelers} people
- Interests: ${interests.join(', ')}

Provide 3 recommendations in JSON format.
  `

  return callClaude(
    [{ role: 'user', content: userMessage }],
    systemPrompt
  )
}