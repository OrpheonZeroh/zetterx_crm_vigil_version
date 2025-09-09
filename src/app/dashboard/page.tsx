'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { DashboardStats } from '@/components/dashboard/dashboard-stats'
import { RecentActivity } from '@/components/dashboard/recent-activity'
import { SalesGoalsChart } from '@/components/dashboard/sales-goals-chart'
import { useAuth } from '@/hooks/useAuth'

export default function DashboardPage() {
  const { user } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('es-PA', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('es-PA', { 
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <MainLayout>
      <div className="space-y-4 sm:space-y-6 lg:space-y-8">
        {/* Welcome Header */}
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-2">
                ¡Bienvenido, {user?.user_metadata?.full_name || 'Usuario'}!
              </h1>
              <p className="text-blue-100 text-sm sm:text-base lg:text-lg">
                {formatDate(currentTime)} - {formatTime(currentTime)}
              </p>
              <p className="text-blue-200 mt-2 text-sm sm:text-base">
                Panel de control de ZetterX CRM
              </p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-xs sm:text-sm text-blue-200">Último acceso</div>
              <div className="text-base sm:text-lg font-semibold">Hoy</div>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <DashboardStats />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
          {/* Sales Goals Chart */}
          <div className="order-2 lg:order-1">
            <SalesGoalsChart />
          </div>

          {/* Recent Activity */}
          <div className="lg:col-span-2 order-1 lg:order-2">
            <RecentActivity />
          </div>
        </div>
      </div>
    </MainLayout>
  )
}
