'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, Mail, CheckCircle2 } from 'lucide-react'
import RequireAuth from '@/components/auth/RequireAuth'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import ReferralCard from '@/components/profile/ReferralCard'
import { useAuth } from '@/lib/auth/authContext'
import { getMyInvites } from '@/lib/services/referralService'
import type { ReferralInvite } from '@/lib/types/referral'

function maskEmail(email: string): string {
  const [local, domain] = email.split('@')
  if (!domain) return email
  const visible = local.slice(0, 2)
  return `${visible}${'*'.repeat(Math.max(local.length - 2, 1))}@${domain}`
}

function ReferralsContent() {
  const { user } = useAuth()
  const [invites, setInvites] = useState<ReferralInvite[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    getMyInvites(user.id).then((result) => {
      if (!cancelled) {
        setInvites(result)
        setLoading(false)
      }
    })
    return () => {
      cancelled = true
    }
  }, [user])

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 py-12">
      <div className="max-w-2xl mx-auto px-6 lg:px-8 space-y-6">
        <div>
          <Link
            href="/profile"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline mb-4"
          >
            <ArrowLeft size={15} /> Volver al perfil
          </Link>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Mis referidos</h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Comparte tu código y gana créditos por cada amigo que se una
          </p>
        </div>

        <ReferralCard />

        <Card>
          <CardHeader>
            <h2 className="font-bold text-slate-900 dark:text-slate-100">Historial de invitaciones</h2>
          </CardHeader>
          <CardBody>
            {loading ? (
              <p className="text-slate-500 dark:text-slate-400 text-sm">Cargando...</p>
            ) : invites.length === 0 ? (
              <div className="text-center py-8">
                <Mail className="mx-auto mb-3 text-slate-300 dark:text-slate-700" size={32} />
                <p className="text-slate-500 dark:text-slate-400 text-sm">
                  Aún no tienes invitaciones canjeadas. ¡Comparte tu código arriba!
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-slate-100 dark:divide-slate-800">
                {invites.map((invite) => (
                  <li key={invite.id} className="flex items-center justify-between py-3 first:pt-0 last:pb-0">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {maskEmail(invite.redeemedByEmail)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {new Date(invite.redeemedAt).toLocaleDateString('es-CL', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <span className="flex items-center gap-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                      <CheckCircle2 size={14} /> Canjeada
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  )
}

export default function ReferralsPage() {
  return (
    <RequireAuth>
      <ReferralsContent />
    </RequireAuth>
  )
}
