'use client'

import React from 'react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  variant?: 'primary' | 'white' | 'gray'
  text?: string
  className?: string
}

export function LoadingSpinner({ 
  size = 'md', 
  variant = 'primary', 
  text,
  className 
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  }

  const variantClasses = {
    primary: 'border-blue-500 border-t-transparent',
    white: 'border-white border-t-transparent',
    gray: 'border-gray-400 border-t-transparent'
  }

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }

  return (
    <div className={cn('flex items-center justify-center', className)}>
      <div className={cn(
        'animate-spin border-2 rounded-full',
        sizeClasses[size],
        variantClasses[variant]
      )} />
      {text && (
        <span className={cn(
          'ml-2 text-gray-600',
          textSizeClasses[size]
        )}>
          {text}
        </span>
      )}
    </div>
  )
}

export function PageLoader({ text = 'Cargando...' }: { text?: string }) {
  return (
    <div className="flex items-center justify-center py-8">
      <LoadingSpinner size="lg" text={text} />
    </div>
  )
}

export function TableLoader({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="animate-pulse">
      <div className="bg-gray-50 border-b border-gray-200 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {[...Array(columns)].map((_, index) => (
            <div key={index} className="h-4 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
      {[...Array(rows)].map((_, rowIndex) => (
        <div key={rowIndex} className="border-b border-gray-200 p-4">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {[...Array(columns)].map((_, colIndex) => (
              <div key={colIndex} className="h-4 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}

export function ButtonLoader({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  return <LoadingSpinner size={size} variant="white" />
}
