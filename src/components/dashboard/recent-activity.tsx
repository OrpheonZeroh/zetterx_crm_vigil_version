'use client'

import { useEffect, useState } from 'react'
import { Clock, User, FileText, CheckCircle, DollarSign } from 'lucide-react'
import { cn } from '@/lib/utils'
import { DashboardService, type ActivityItem } from '@/lib/services/dashboard-service'

export function RecentActivity() {
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const data = await DashboardService.getRecentActivity()
        setActivities(data)
      } catch (error) {
        console.error('Error loading recent activity:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchActivity()
  }, [])

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'customer': return User
      case 'order': return FileText
      case 'inspection': return CheckCircle
      case 'invoice': return DollarSign
      default: return FileText
    }
  }

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'customer': return 'text-blue-500'
      case 'order': return 'text-green-500'
      case 'inspection': return 'text-purple-500'
      case 'invoice': return 'text-orange-500'
      default: return 'text-gray-500'
    }
  }

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const activityTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Ahora mismo'
    if (diffInMinutes < 60) return `Hace ${diffInMinutes} minuto${diffInMinutes !== 1 ? 's' : ''}`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `Hace ${diffInHours} hora${diffInHours !== 1 ? 's' : ''}`
    
    const diffInDays = Math.floor(diffInHours / 24)
    return `Hace ${diffInDays} día${diffInDays !== 1 ? 's' : ''}`
  }

  if (loading) {
    return (
      <div className="widget">
        <div className="flex items-center justify-between mb-6">
          <h3 className="widget-title">Actividad Reciente</h3>
          <Clock className="w-5 h-5 text-gray-400" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-start space-x-3 animate-pulse">
              <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
              <div className="flex-1">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="widget">
      <div className="flex items-center justify-between mb-6">
        <h3 className="widget-title">Actividad Reciente</h3>
        <Clock className="w-5 h-5 text-gray-400" />
      </div>

      <div className="space-y-4">
        {activities.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No hay actividad reciente</p>
          </div>
        ) : (
          activities.map((activity) => {
            const Icon = getActivityIcon(activity.type)
            const color = getActivityColor(activity.type)
            
            return (
              <div key={activity.id} className="flex items-start space-x-3">
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center bg-gray-50",
                  color
                )}>
                  <Icon className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTimeAgo(activity.timestamp)}
                  </p>
                </div>
              </div>
            )
          })
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-gray-200">
        <button className="w-full text-sm text-primary-600 hover:text-primary-700 font-medium transition-colors">
          Ver todas las actividades
        </button>
      </div>
    </div>
  )
}
