'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { AtSign } from 'lucide-react'
import { useAuth } from '@/lib/auth/authContext'
import { ensureUsername } from '@/lib/services/userProfileService'
import { cn } from '@/lib/utils/cn'

interface PublicProfileLinkProps {
  className?: string
}

/** Displays as @username (the familiar social-handle convention) while linking to the actual /user/[username] route. */
export default function PublicProfileLink({ className }: PublicProfileLinkProps) {
  const { user } = useAuth()
  const [username, setUsername] = useState<string | null>(null)

  useEffect(() => {
    if (!user) return
    let cancelled = false
    ensureUsername(user.id, user.email).then((name) => {
      if (!cancelled) setUsername(name)
    })
    return () => {
      cancelled = true
    }
  }, [user])

  if (!user || !username) return null

  return (
    <Link
      href={`/user/${username}`}
      className={cn('inline-flex items-center gap-1 text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline', className)}
    >
      <AtSign size={13} /> {username}
    </Link>
  )
}
