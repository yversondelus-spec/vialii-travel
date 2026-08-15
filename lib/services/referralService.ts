import { supabase } from '@/lib/db/client'
import { withSupabaseFallback } from '@/lib/utils/supabaseCircuit'
import type { ReferralCode, ReferralInvite, ReferralStats } from '@/lib/types/referral'

// Same Supabase-first / localStorage-fallback pattern as savedTripsService.ts.
const CODES_KEY = 'travelai_referral_codes'
const INVITES_KEY = 'travelai_referral_invites'

const REWARD_PER_REDEEM_CLP = 50000

function readCodes(): ReferralCode[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(CODES_KEY) ?? '[]')
  } catch {
    return []
  }
}
function writeCodes(codes: ReferralCode[]) {
  localStorage.setItem(CODES_KEY, JSON.stringify(codes))
}
function readInvites(): ReferralInvite[] {
  if (typeof window === 'undefined') return []
  try {
    return JSON.parse(localStorage.getItem(INVITES_KEY) ?? '[]')
  } catch {
    return []
  }
}
function writeInvites(invites: ReferralInvite[]) {
  localStorage.setItem(INVITES_KEY, JSON.stringify(invites))
}

// No ambiguous chars (0/O, 1/I) — codes get typed/read aloud when shared.
const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
function randomSuffix(len = 5): string {
  let s = ''
  for (let i = 0; i < len; i++) s += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]
  return s
}

async function findCodeByUserId(userId: string): Promise<ReferralCode | null> {
  try {
    return await withSupabaseFallback(
      async () => {
        const { data, error } = await supabase.from('referral_codes').select('*').eq('user_id', userId).maybeSingle()
        if (error) throw error
        if (!data) return null
        return {
          id: data.id,
          userId: data.user_id,
          code: data.code,
          createdAt: data.created_at,
          invitesCount: data.invites_count,
          redeemCount: data.redeem_count,
        }
      },
      () => readCodes().find((c) => c.userId === userId) ?? null
    )
  } catch {
    return readCodes().find((c) => c.userId === userId) ?? null
  }
}

/** Idempotent: returns the user's existing code, or mints a new one. */
export async function generateReferralCode(userId: string): Promise<string> {
  const existing = await findCodeByUserId(userId)
  if (existing) return existing.code

  const code: ReferralCode = {
    id: crypto.randomUUID(),
    userId,
    code: `VIALII-${randomSuffix()}`,
    createdAt: new Date().toISOString(),
    invitesCount: 0,
    redeemCount: 0,
  }

  await withSupabaseFallback(
    async () => {
      const { error } = await supabase.from('referral_codes').insert([
        {
          id: code.id,
          user_id: code.userId,
          code: code.code,
          created_at: code.createdAt,
          invites_count: 0,
          redeem_count: 0,
        },
      ])
      if (error) throw error
    },
    () => writeCodes([code, ...readCodes()])
  )

  return code.code
}

/** $50.000 CLP credit per successful referral — same rate for every tier today. */
export function getRewardAmount(redeemCount: number): number {
  return redeemCount * REWARD_PER_REDEEM_CLP
}

export async function getMyInvites(userId: string): Promise<ReferralInvite[]> {
  const code = await findCodeByUserId(userId)
  if (!code) return []

  try {
    return await withSupabaseFallback(
      async () => {
        const { data, error } = await supabase
          .from('referral_invites')
          .select('*')
          .eq('referral_code_id', code.id)
          .order('redeemed_at', { ascending: false })
        if (error) throw error
        return (data ?? []).map((row) => ({
          id: row.id,
          referralCodeId: row.referral_code_id,
          redeemedByUserId: row.redeemed_by_user_id,
          redeemedByEmail: row.redeemed_by_email,
          redeemedAt: row.redeemed_at,
        }))
      },
      () =>
        readInvites()
          .filter((i) => i.referralCodeId === code.id)
          .sort((a, b) => (a.redeemedAt < b.redeemedAt ? 1 : -1))
    )
  } catch {
    return []
  }
}

export async function getReferralStats(userId: string): Promise<ReferralStats> {
  const code = (await findCodeByUserId(userId)) ?? { code: await generateReferralCode(userId), invitesCount: 0, redeemCount: 0 }
  const invites = await getMyInvites(userId)
  const redeemCount = Math.max(invites.length, code.redeemCount ?? 0)

  return {
    code: code.code,
    invites: Math.max(code.invitesCount ?? 0, redeemCount),
    redeems: redeemCount,
    reward: {
      type: 'credit',
      amount: getRewardAmount(redeemCount),
      description: `$${getRewardAmount(redeemCount).toLocaleString('es-CL')} en créditos acumulados`,
    },
  }
}

async function hasAlreadyRedeemed(newUserId: string): Promise<boolean> {
  try {
    return await withSupabaseFallback(
      async () => {
        const { data, error } = await supabase.from('referral_invites').select('id').eq('redeemed_by_user_id', newUserId).limit(1)
        if (error) throw error
        return (data?.length ?? 0) > 0
      },
      () => readInvites().some((i) => i.redeemedByUserId === newUserId)
    )
  } catch {
    return false
  }
}

/**
 * Redeems `code` on behalf of `newUserId`. Fails (returns false) if the code
 * doesn't exist, belongs to the redeemer themselves, or that user already
 * redeemed a referral before — each person gets credited once.
 */
export async function redeemReferralCode(code: string, newUserId: string, newUserEmail: string): Promise<boolean> {
  const normalized = code.trim().toUpperCase()
  if (!normalized) return false

  const owner = await withSupabaseFallback(
    async () => {
      const { data, error } = await supabase.from('referral_codes').select('*').eq('code', normalized).maybeSingle()
      if (error) throw error
      return data
        ? { id: data.id, userId: data.user_id, invitesCount: data.invites_count, redeemCount: data.redeem_count }
        : null
    },
    () => {
      const found = readCodes().find((c) => c.code === normalized)
      return found ? { id: found.id, userId: found.userId, invitesCount: found.invitesCount, redeemCount: found.redeemCount } : null
    }
  )

  if (!owner || owner.userId === newUserId) return false
  if (await hasAlreadyRedeemed(newUserId)) return false

  const invite: ReferralInvite = {
    id: crypto.randomUUID(),
    referralCodeId: owner.id,
    redeemedByUserId: newUserId,
    redeemedByEmail: newUserEmail,
    redeemedAt: new Date().toISOString(),
  }

  await withSupabaseFallback(
    async () => {
      const { error: insertError } = await supabase.from('referral_invites').insert([
        {
          id: invite.id,
          referral_code_id: invite.referralCodeId,
          redeemed_by_user_id: invite.redeemedByUserId,
          redeemed_by_email: invite.redeemedByEmail,
          redeemed_at: invite.redeemedAt,
        },
      ])
      if (insertError) throw insertError

      const { error: updateError } = await supabase
        .from('referral_codes')
        .update({ redeem_count: owner.redeemCount + 1, invites_count: owner.invitesCount + 1 })
        .eq('id', owner.id)
      if (updateError) throw updateError
    },
    () => {
      writeInvites([invite, ...readInvites()])
      writeCodes(
        readCodes().map((c) =>
          c.id === owner.id ? { ...c, redeemCount: c.redeemCount + 1, invitesCount: c.invitesCount + 1 } : c
        )
      )
    }
  )

  return true
}
