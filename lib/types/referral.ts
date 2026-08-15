export interface ReferralCode {
  id: string
  userId: string
  code: string
  createdAt: string
  invitesCount: number
  redeemCount: number
  expiresAt?: string
}

export interface ReferralInvite {
  id: string
  referralCodeId: string
  redeemedByUserId: string
  redeemedByEmail: string
  redeemedAt: string
}

export interface ReferralReward {
  type: 'discount' | 'credit'
  amount: number
  description: string
}

export interface ReferralStats {
  code: string
  invites: number
  redeems: number
  reward: ReferralReward
}
