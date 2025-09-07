'use client'

import { useEffect, useState } from 'react'
import { Users, FileText, DollarSign, TrendingUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DashboardService, type DashboardStats } from '@/lib/services/dashboard-service'

export function DashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await DashboardService.getDashboardStats()
        setStats(data)
      } catch (error) {
        console.error('Error loading dashboard stats:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-PA', {
      style: 'currency',
      currency: 'PAB',
      minimumFractionDigits: 0
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-PA').format(num)
  }

  const formatGrowth = (growth: number) => {
    return growth > 0 ? `+${growth}%` : `${growth}%`
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="stats-card animate-pulse">
            <div className="flex items-center justify-between">
              <div>
                <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="w-12 h-12 bg-gray-200 rounded-lg"></div>
            </div>
            <div className="mt-4">
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">Error cargando estadísticas</p>
      </div>
    )
  }

  const statsConfig = [
    {
      name: 'Clientes Activos',
      value: formatNumber(stats.activeCustomers),
      change: formatGrowth(stats.customerGrowth),
      changeType: stats.customerGrowth >= 0 ? 'positive' : 'negative',
      icon: Users,
      color: 'text-blue-500',
      bgColor: 'bg-blue-50'
    },
    {
      name: 'Órdenes Pendientes',
      value: formatNumber(stats.pendingOrders),
      change: formatGrowth(stats.orderGrowth),
      changeType: stats.orderGrowth >= 0 ? 'positive' : 'negative',
      icon: FileText,
      color: 'text-green-500',
      bgColor: 'bg-green-50'
    },
    {
      name: 'Ingresos del Mes',
      value: formatCurrency(stats.monthlyRevenue),
      change: formatGrowth(stats.revenueGrowth),
      changeType: stats.revenueGrowth >= 0 ? 'positive' : 'negative',
      icon: DollarSign,
      color: 'text-purple-500',
      bgColor: 'bg-purple-50'
    },
    {
      name: 'Tasa de Conversión',
      value: `${stats.conversionRate}%`,
      change: formatGrowth(stats.conversionGrowth),
      changeType: stats.conversionGrowth >= 0 ? 'positive' : 'negative',
      icon: TrendingUp,
      color: 'text-orange-500',
      bgColor: 'bg-orange-50'
    }
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {statsConfig.map((stat) => (
        <div
          key={stat.name}
          className="stats-card"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="stats-label">{stat.name}</p>
              <p className="stats-value">{stat.value}</p>
            </div>
            <div className={cn(
              "w-12 h-12 rounded-lg flex items-center justify-center",
              stat.bgColor
            )}>
              <stat.icon className={cn("w-6 h-6", stat.color)} />
            </div>
          </div>
          
          <div className="mt-4 flex items-center">
            <span className={cn(
              "stats-change",
              stat.changeType === 'positive' ? 'stats-change-positive' : 'stats-change-negative'
            )}>
              {stat.change}
            </span>
            <span className="text-sm text-gray-500 ml-2">vs mes anterior</span>
          </div>
        </div>
      ))}
    </div>
  )
}
