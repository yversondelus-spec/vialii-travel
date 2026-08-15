'use client'

import React from 'react'
import { cn } from '@/lib/utils/cn'

interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'success' | 'warning' | 'danger' | 'neutral'
}

const variantStyles = {
  primary: 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-800 border border-blue-200 dark:from-blue-950 dark:to-cyan-950 dark:text-blue-300 dark:border-blue-900',
  success: 'bg-emerald-100 text-emerald-800 border border-emerald-200 dark:bg-emerald-950 dark:text-emerald-300 dark:border-emerald-900',
  warning: 'bg-amber-100 text-amber-800 border border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-900',
  danger: 'bg-red-100 text-red-800 border border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-900',
  neutral: 'bg-slate-100 text-slate-800 border border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
}

const Badge = React.forwardRef<HTMLDivElement, BadgeProps>(
  ({ className, variant = 'primary', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold',
        variantStyles[variant],
        className
      )}
      {...props}
    />
  )
)

Badge.displayName = 'Badge'

export { Badge }