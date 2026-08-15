'use client'

import React from 'react'
import { cn } from '@/lib/utils/cn'

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean
  interactive?: boolean
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, interactive = false, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'rounded-2xl bg-white border border-slate-200 shadow-sm dark:bg-slate-900 dark:border-slate-800',
        hover && 'hover:shadow-xl hover:border-slate-300 transition-all duration-300 dark:hover:border-slate-700',
        interactive && 'cursor-pointer hover:shadow-2xl hover:-translate-y-1 transition-all duration-300',
        className
      )}
      {...props}
    />
  )
)

Card.displayName = 'Card'

type CardHeaderProps = React.HTMLAttributes<HTMLDivElement>

const CardHeader = React.forwardRef<HTMLDivElement, CardHeaderProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-6 py-5 border-b border-slate-200 dark:border-slate-800', className)} {...props} />
  )
)

CardHeader.displayName = 'CardHeader'

type CardBodyProps = React.HTMLAttributes<HTMLDivElement>

const CardBody = React.forwardRef<HTMLDivElement, CardBodyProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-6 py-5', className)} {...props} />
  )
)

CardBody.displayName = 'CardBody'

type CardFooterProps = React.HTMLAttributes<HTMLDivElement>

const CardFooter = React.forwardRef<HTMLDivElement, CardFooterProps>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('px-6 py-5 border-t border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-800/50', className)} {...props} />
  )
)

CardFooter.displayName = 'CardFooter'

export { Card, CardHeader, CardBody, CardFooter }