'use client'

import React from 'react'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface StatsCardProps {
  title: string
  value: string | number
  subtitle?: string
  icon?: LucideIcon
  iconColor?: string
  trend?: {
    value: number
    label?: string
    isPositive?: boolean
  }
  className?: string
  onClick?: () => void
}

export function StatsCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  iconColor = 'text-blue-500',
  trend,
  className,
  onClick
}: StatsCardProps) {
  const isClickable = !!onClick

  return (
    <div 
      className={cn(
        "bg-white p-4 rounded-lg border border-gray-200 transition-all duration-200",
        isClickable && "cursor-pointer hover:shadow-md hover:border-gray-300",
        className
      )}
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="flex items-center mb-2">
            {Icon && (
              <Icon className={cn("w-8 h-8 mr-3", iconColor)} />
            )}
            <div>
              <div className="text-2xl font-bold text-gray-900">{value}</div>
              {subtitle && (
                <div className="text-sm text-gray-600">{subtitle}</div>
              )}
            </div>
          </div>
          <div className="text-sm font-medium text-gray-700">{title}</div>
          
          {trend && (
            <div className="flex items-center mt-2">
              <span className={cn(
                "text-xs font-medium",
                trend.isPositive ? "text-green-600" : "text-red-600"
              )}>
                {trend.isPositive ? '+' : ''}{trend.value}%
              </span>
              {trend.label && (
                <span className="text-xs text-gray-500 ml-2">
                  {trend.label}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// Predefined color variants
export const StatsCardVariants = {
  blue: {
    iconColor: 'text-blue-500',
    valueColor: 'text-blue-600'
  },
  green: {
    iconColor: 'text-green-500', 
    valueColor: 'text-green-600'
  },
  purple: {
    iconColor: 'text-purple-500',
    valueColor: 'text-purple-600'
  },
  orange: {
    iconColor: 'text-orange-500',
    valueColor: 'text-orange-600'
  },
  red: {
    iconColor: 'text-red-500',
    valueColor: 'text-red-600'
  },
  gray: {
    iconColor: 'text-gray-500',
    valueColor: 'text-gray-600'
  }
}
