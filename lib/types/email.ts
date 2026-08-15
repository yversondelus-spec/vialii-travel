export type EmailType = 'welcome' | 'price_alert' | 'invoice'

export interface EmailRecord {
  id: string
  to: string
  type: EmailType
  subject: string
  html: string
  sentAt: string
}
