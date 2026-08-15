export type NewsletterFrequency = 'daily' | 'weekly' | 'monthly'

export interface NewsletterSubscriber {
  id: string
  email: string
  subscribedAt: string
  frequency: NewsletterFrequency
  active: boolean
  /** Opaque per-subscriber token used by the unsubscribe link — not the row id, so guessing one id can't unsubscribe another email. */
  unsubscribeToken: string
}
