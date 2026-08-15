'use client'

import { useEffect, useState } from 'react'
import { Gift, Copy, Check, Share2 } from 'lucide-react'
import { Card, CardBody, CardHeader } from '@/components/common/Card'
import { Button } from '@/components/common/Button'
import { useAuth } from '@/lib/auth/authContext'
import { getReferralStats } from '@/lib/services/referralService'
import type { ReferralStats } from '@/lib/types/referral'

export default function ReferralCard() {
  const { user } = useAuth()
  const [stats, setStats] = useState<ReferralStats | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    getReferralStats(user.id).then((s) => {
      if (!cancelled) setStats(s)
    })
    return () => {
      cancelled = true
    }
  }, [user])

  if (!user || !stats) {
    return (
      <Card>
        <CardBody className="text-center py-8 text-slate-500 dark:text-slate-400">Cargando tu código...</CardBody>
      </Card>
    )
  }

  const referralUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/r/${stats.code}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Clipboard denied — the code is still visible and selectable below.
    }
  }

  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    `Te invito a VIALII ✈️ Únete con mi código y ambos ganamos $50.000 en créditos: ${referralUrl}`
  )}`

  return (
    <Card>
      <CardHeader>
        <h2 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Gift size={16} className="text-pink-500" /> Invita amigos
        </h2>
      </CardHeader>
      <CardBody className="space-y-4">
        <p className="text-sm text-slate-600 dark:text-slate-400">
          Invita amigos, ambos obtienen <strong className="text-slate-900 dark:text-slate-100">$50.000 en créditos</strong> cuando se unan con tu código.
        </p>

        <div className="flex items-center gap-2">
          <div className="flex-1 rounded-xl border-2 border-dashed border-blue-300 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/30 px-4 py-3 text-center font-mono font-bold text-lg text-blue-700 dark:text-blue-300 tracking-wider">
            {stats.code}
          </div>
          <Button variant="outline" size="md" onClick={copyLink} aria-label="Copiar link de invitación">
            {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
          </Button>
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <Button variant="secondary" size="md" aria-label="Compartir por WhatsApp">
              <Share2 size={18} />
            </Button>
          </a>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-2">
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.invites}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">invitaciones</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{stats.redeems}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">canjeadas</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">${stats.reward.amount.toLocaleString('es-CL')}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">ganados</p>
          </div>
        </div>
      </CardBody>
    </Card>
  )
}
