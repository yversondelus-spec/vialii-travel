import { supabase } from '@/lib/db/client'
import { withSupabaseFallback } from '@/lib/utils/supabaseCircuit'
import type { EmailRecord, EmailType } from '@/lib/types/email'
import type { PriceAlert } from '@/lib/types/priceAlert'
import type { Invoice } from '@/lib/types/subscription'

// No real email provider is configured anywhere in this project (no Resend/
// SendGrid key in .env.local) — sending is always simulated. What IS real is
// the template rendering and the persisted log, so the admin dashboard has
// something genuine to show. Swap `persistEmail`'s Supabase call for an
// actual provider call (e.g. Resend) to make this send for real; the
// templates below don't need to change.

const LOCAL_KEY = 'travelai_email_log'

function readLocal(): EmailRecord[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(LOCAL_KEY) ?? '[]')
  } catch {
    return []
  }
}

function writeLocal(records: EmailRecord[]) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(records))
}

async function persistEmail(record: EmailRecord): Promise<void> {
  return withSupabaseFallback(
    async () => {
      const { error } = await supabase.from('email_log').insert([
        {
          id: record.id,
          to_email: record.to,
          type: record.type,
          subject: record.subject,
          html: record.html,
          sent_at: record.sentAt,
        },
      ])
      if (error) throw error
    },
    () => {
      writeLocal([record, ...readLocal()].slice(0, 200))
    }
  )
}

export async function getEmailLog(limit = 50): Promise<EmailRecord[]> {
  try {
    return await withSupabaseFallback(
      async () => {
        const { data, error } = await supabase
          .from('email_log')
          .select('*')
          .order('sent_at', { ascending: false })
          .limit(limit)

        if (error) throw error
        return (data ?? []).map((row) => ({
          id: row.id,
          to: row.to_email,
          type: row.type,
          subject: row.subject,
          html: row.html,
          sentAt: row.sent_at,
        }))
      },
      () => readLocal().slice(0, limit)
    )
  } catch {
    return []
  }
}

// --- Templates --------------------------------------------------------

function emailShell(title: string, bodyHtml: string): string {
  return `<div style="font-family: -apple-system, sans-serif; max-width: 480px; margin: 0 auto; color: #0f172a;">
    <div style="background: linear-gradient(135deg,#2563eb,#06b6d4); padding: 24px; border-radius: 12px 12px 0 0; color: white;">
      <h1 style="margin:0; font-size: 20px;">✈️ VIALII</h1>
    </div>
    <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 12px 12px; background: white;">
      <h2 style="margin-top:0; font-size: 18px;">${title}</h2>
      ${bodyHtml}
    </div>
  </div>`
}

export function renderWelcomeEmail(email: string) {
  return {
    subject: '¡Bienvenido a VIALII!',
    html: emailShell(
      '¡Bienvenido a bordo! 🎉',
      `<p>Hola,</p>
       <p>Gracias por unirte a VIALII. Ya puedes comparar buses, vuelos y trenes, guardar tus viajes favoritos y planificar tu próxima aventura.</p>
       <p style="color:#64748b; font-size: 14px;">Cuenta: <strong>${email}</strong></p>`
    ),
  }
}

export function renderPriceAlertEmail(alert: PriceAlert, currentPrice: number) {
  return {
    subject: `📉 Bajó el precio: ${alert.origin} → ${alert.destination}`,
    html: emailShell(
      '¡Encontramos un precio mejor!',
      `<p>El precio de <strong>${alert.origin} → ${alert.destination}</strong> bajó a
       <strong>$${currentPrice.toLocaleString('es-CL')}</strong>, por debajo de tu límite de
       $${alert.maxPrice.toLocaleString('es-CL')}.</p>
       <p style="color:#64748b; font-size: 14px;">Alerta creada el ${new Date(alert.createdAt).toLocaleDateString('es-CL')}</p>`
    ),
  }
}

export function renderInvoiceEmail(invoice: Invoice) {
  return {
    subject: 'Recibo de tu suscripción Premium',
    html: emailShell(
      'Gracias por tu compra',
      `<p>Plan: <strong>Premium</strong></p>
       <p>Monto: <strong>$${invoice.amount.toLocaleString('es-CL')} ${invoice.currency}</strong></p>
       <p>Fecha: ${new Date(invoice.issuedAt).toLocaleDateString('es-CL')}</p>
       <p style="color:#64748b; font-size: 14px;">N° de factura: ${invoice.id}</p>`
    ),
  }
}

export async function sendEmail(to: string, type: EmailType, subject: string, html: string): Promise<EmailRecord> {
  const record: EmailRecord = {
    id: crypto.randomUUID(),
    to,
    type,
    subject,
    html,
    sentAt: new Date().toISOString(),
  }
  await persistEmail(record)
  return record
}
