'use client'

import { useEffect, useState } from 'react'
import { Search, DollarSign, Crown, Mail, LayoutDashboard, Route } from 'lucide-react'
import RequireAdmin from '@/components/admin/RequireAdmin'
import SearchesTrendChart from '@/components/admin/SearchesTrendChart'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { Badge } from '@/components/common/Badge'
import { cn } from '@/lib/utils/cn'
import { getSearchAnalytics, type SearchAnalyticsSummary } from '@/lib/services/analyticsService'
import { getAllInvoices } from '@/lib/services/subscriptionService'
import { getEmailLog } from '@/lib/services/emailService'
import type { Invoice } from '@/lib/types/subscription'
import type { EmailRecord, EmailType } from '@/lib/types/email'

type Tab = 'overview' | 'emails'

const EMAIL_TYPE_LABEL: Record<EmailType, string> = {
  welcome: 'Bienvenida',
  price_alert: 'Alerta de precio',
  invoice: 'Factura',
}

function StatTile({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Search }) {
  return (
    <Card>
      <CardBody className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400">
          <Icon size={18} />
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
          <p className="text-xl font-bold text-slate-900 dark:text-slate-100">{value}</p>
        </div>
      </CardBody>
    </Card>
  )
}

function tabClass(active: boolean) {
  return cn(
    'flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors',
    active
      ? 'border-blue-600 text-blue-600 dark:text-blue-400'
      : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
  )
}

function DestinationBars({ data }: { data: SearchAnalyticsSummary['byDestination'] }) {
  const top = data.slice(0, 8)
  const max = Math.max(...top.map((d) => d.count), 1)

  if (top.length === 0) {
    return <p className="text-sm text-slate-500 dark:text-slate-400">Sin búsquedas todavía.</p>
  }

  return (
    <div className="space-y-3">
      {top.map((row) => (
        <div key={row.destination}>
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-slate-700 dark:text-slate-300">{row.destination}</span>
            <span className="font-semibold text-slate-900 dark:text-slate-100">{row.count}</span>
          </div>
          <div className="h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full rounded-full bg-[var(--price-line)] transition-all duration-500"
              style={{ width: `${(row.count / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  )
}

function AdminDashboard() {
  const [tab, setTab] = useState<Tab>('overview')
  const [analytics, setAnalytics] = useState<SearchAnalyticsSummary | null>(null)
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [emails, setEmails] = useState<EmailRecord[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getSearchAnalytics(), getAllInvoices(), getEmailLog(100)]).then(
      ([analyticsResult, invoiceResult, emailResult]) => {
        setAnalytics(analyticsResult)
        setInvoices(invoiceResult)
        setEmails(emailResult)
        setLoading(false)
      }
    )
  }, [])

  const revenue = invoices.reduce((sum, inv) => sum + inv.amount, 0)
  const premiumCount = new Set(invoices.map((inv) => inv.userId)).size

  if (loading || !analytics) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="animate-spin text-4xl">⏳</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-8 sm:py-12">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <LayoutDashboard size={24} /> Panel de administración
          </h1>
          <p className="text-slate-600 dark:text-slate-400 mt-1">
            Datos de esta demo: búsquedas y suscripciones se registran localmente en tu navegador.
          </p>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatTile label="Búsquedas totales" value={analytics.totalSearches.toLocaleString('es-CL')} icon={Search} />
          <StatTile label="Ingresos" value={`$${revenue.toLocaleString('es-CL')}`} icon={DollarSign} />
          <StatTile label="Usuarios Premium" value={premiumCount.toLocaleString('es-CL')} icon={Crown} />
          <StatTile label="Emails enviados" value={emails.length.toLocaleString('es-CL')} icon={Mail} />
        </div>

        <div className="flex gap-1 border-b border-slate-200 dark:border-slate-800">
          <button type="button" onClick={() => setTab('overview')} className={tabClass(tab === 'overview')}>
            <Route size={15} /> Búsquedas y rutas
          </button>
          <button type="button" onClick={() => setTab('emails')} className={tabClass(tab === 'emails')}>
            <Mail size={15} /> Log de emails
          </button>
        </div>

        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="lg:col-span-2">
              <CardHeader>
                <h2 className="font-bold text-slate-900 dark:text-slate-100">Búsquedas por día (últimos 14 días)</h2>
              </CardHeader>
              <CardBody>
                <SearchesTrendChart data={analytics.dailyTrend} />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="font-bold text-slate-900 dark:text-slate-100">Búsquedas por destino</h2>
              </CardHeader>
              <CardBody>
                <DestinationBars data={analytics.byDestination} />
              </CardBody>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="font-bold text-slate-900 dark:text-slate-100">Rutas más populares</h2>
              </CardHeader>
              <CardBody className="p-0">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                      <th className="px-6 py-2 font-semibold">Ruta</th>
                      <th className="px-6 py-2 font-semibold text-right">Búsquedas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.popularRoutes.map((route) => (
                      <tr key={`${route.origin}-${route.destination}`} className="border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                        <td className="px-6 py-2.5 text-slate-700 dark:text-slate-300">
                          {route.origin} → {route.destination}
                        </td>
                        <td className="px-6 py-2.5 text-right font-semibold text-slate-900 dark:text-slate-100">
                          {route.count}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardBody>
            </Card>
          </div>
        )}

        {tab === 'emails' && (
          <Card>
            <CardBody className="p-0 overflow-x-auto">
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="text-left text-xs text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    <th className="px-6 py-2 font-semibold">Para</th>
                    <th className="px-6 py-2 font-semibold">Tipo</th>
                    <th className="px-6 py-2 font-semibold">Asunto</th>
                    <th className="px-6 py-2 font-semibold text-right">Enviado</th>
                  </tr>
                </thead>
                <tbody>
                  {emails.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-6 py-8 text-center text-slate-500 dark:text-slate-400">
                        Sin emails registrados todavía.
                      </td>
                    </tr>
                  ) : (
                    emails.map((email) => (
                      <tr key={email.id} className="border-b border-slate-50 dark:border-slate-800/50 last:border-0">
                        <td className="px-6 py-2.5 text-slate-700 dark:text-slate-300">{email.to}</td>
                        <td className="px-6 py-2.5">
                          <Badge variant="neutral" className="text-[10px]">
                            {EMAIL_TYPE_LABEL[email.type]}
                          </Badge>
                        </td>
                        <td className="px-6 py-2.5 text-slate-700 dark:text-slate-300">{email.subject}</td>
                        <td className="px-6 py-2.5 text-right text-slate-500 dark:text-slate-400 text-xs">
                          {new Date(email.sentAt).toLocaleString('es-CL')}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </CardBody>
          </Card>
        )}
      </div>
    </div>
  )
}

export default function AdminPage() {
  return (
    <RequireAdmin>
      <AdminDashboard />
    </RequireAdmin>
  )
}
