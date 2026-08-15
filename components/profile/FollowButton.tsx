'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { UserPlus, UserCheck } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { useAuth } from '@/lib/auth/authContext'
import { followUser, unfollowUser, isFollowing, getFollowerCount } from '@/lib/services/userProfileService'

interface FollowButtonProps {
  targetUserId: string
  className?: string
}

export default function FollowButton({ targetUserId, className }: FollowButtonProps) {
  const router = useRouter()
  const { user } = useAuth()
  const [following, setFollowing] = useState(false)
  const [followerCount, setFollowerCount] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    getFollowerCount(targetUserId).then(setFollowerCount)
  }, [targetUserId])

  useEffect(() => {
    if (!user) return
    isFollowing(user.id, targetUserId).then(setFollowing)
  }, [user, targetUserId])

  // Own profile, or nothing to follow yet.
  if (user?.id === targetUserId) return null

  const toggle = async () => {
    if (!user) {
      router.push('/auth/login')
      return
    }
    setLoading(true)
    if (following) {
      await unfollowUser(user.id, targetUserId)
      setFollowing(false)
      setFollowerCount((c) => (c !== null ? Math.max(0, c - 1) : c))
    } else {
      await followUser(user.id, targetUserId)
      setFollowing(true)
      setFollowerCount((c) => (c !== null ? c + 1 : c))
    }
    setLoading(false)
  }

  return (
    <div className={className}>
      <Button
        variant={following ? 'secondary' : 'primary'}
        size="sm"
        isLoading={loading}
        onClick={toggle}
      >
        {following ? <UserCheck size={15} className="mr-1.5" /> : <UserPlus size={15} className="mr-1.5" />}
        {following ? 'Siguiendo' : 'Seguir'}
      </Button>
      {followerCount !== null && (
        <span className="block text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
          {followerCount} seguidor{followerCount === 1 ? '' : 'es'}
        </span>
      )}
    </div>
  )
}
