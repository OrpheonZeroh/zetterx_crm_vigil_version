'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LucideIcon } from 'lucide-react'

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  changeLabel?: string
  icon: LucideIcon
  description?: string
  trend?: 'up' | 'down' | 'neutral'
}

export function MetricCard({ 
  title, 
  value, 
  change, 
  changeLabel, 
  icon: Icon, 
  description,
  trend = 'neutral'
}: MetricCardProps) {
  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      if (title.toLowerCase().includes('revenue') || title.toLowerCase().includes('valor')) {
        return new Intl.NumberFormat('es-PA', {
          style: 'currency',
          currency: 'PAB'
        }).format(val)
      }
      return val.toLocaleString('es-PA')
    }
    return val
  }

  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600'
      case 'down': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">
          {formatValue(value)}
        </div>
        {change !== undefined && (
          <p className={`text-xs ${getTrendColor()} flex items-center mt-1`}>
            <span className={`mr-1 ${trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}`}>
              {trend === 'up' ? '↗' : trend === 'down' ? '↘' : '→'}
            </span>
            {change > 0 ? '+' : ''}{change.toFixed(1)}%
            {changeLabel && (
              <span className="ml-1 text-gray-500">
                {changeLabel}
              </span>
            )}
          </p>
        )}
        {description && (
          <p className="text-xs text-gray-500 mt-1">
            {description}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
