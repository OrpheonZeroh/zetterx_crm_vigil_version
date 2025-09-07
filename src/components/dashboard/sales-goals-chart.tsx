'use client'

import React, { useEffect, useState } from 'react'
import { DashboardService } from '@/lib/services/dashboard-service'

export function SalesGoalsChart() {
  const [data, setData] = useState({
    achieved: 0,
    goal: 0,
    percentage: 0
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const stats = await DashboardService.getDashboardStats()
        // Calculate daily sales goal based on monthly revenue goal
        const monthlyGoal = 50000 // $50k monthly goal
        const daysInMonth = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).getDate()
        const dailyGoal = monthlyGoal / daysInMonth
        const achieved = stats.monthlyRevenue / daysInMonth // Average daily achieved
        const percentage = (achieved / dailyGoal) * 100

        setData({
          achieved: achieved,
          goal: dailyGoal,
          percentage: Math.min(percentage, 100)
        })
      } catch (error) {
        console.error('Error fetching sales goals:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded mb-4"></div>
          <div className="w-48 h-48 bg-gray-200 rounded-full mx-auto"></div>
        </div>
      </div>
    )
  }

  // Calculate angles for the pie chart
  const achievedAngle = (data.percentage / 100) * 360
  const remainingAngle = 360 - achievedAngle

  // Create SVG path for pie slices
  const createPath = (startAngle: number, endAngle: number, radius: number = 80) => {
    const start = polarToCartesian(100, 100, radius, endAngle)
    const end = polarToCartesian(100, 100, radius, startAngle)
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1"
    
    return [
      "M", 100, 100,
      "L", start.x, start.y,
      "A", radius, radius, 0, largeArcFlag, 0, end.x, end.y,
      "Z"
    ].join(" ")
  }

  const polarToCartesian = (centerX: number, centerY: number, radius: number, angleInDegrees: number) => {
    const angleInRadians = (angleInDegrees - 90) * Math.PI / 180.0
    return {
      x: centerX + (radius * Math.cos(angleInRadians)),
      y: centerY + (radius * Math.sin(angleInRadians))
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Meta de Ventas Diaria</h3>
        <div className="text-sm text-gray-500">
          {new Date().toLocaleDateString('es-PA', { 
            day: 'numeric', 
            month: 'long' 
          })}
        </div>
      </div>

      <div className="relative flex items-center justify-center">
        <svg width="200" height="200" viewBox="0 0 200 200" className="transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="#f3f4f6"
            strokeWidth="8"
          />
          
          {/* Achieved progress */}
          <circle
            cx="100"
            cy="100"
            r="80"
            fill="none"
            stroke="url(#blueGradient)"
            strokeWidth="8"
            strokeLinecap="round"
            strokeDasharray={`${(data.percentage / 100) * 502.4} 502.4`}
            className="transition-all duration-1000 ease-out"
            style={{
              transformOrigin: 'center'
            }}
          />

          {/* Gradient definition */}
          <defs>
            <linearGradient id="blueGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#1d4ed8" />
            </linearGradient>
          </defs>
        </svg>

        {/* Center content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <div className="text-3xl font-bold text-gray-900">
            {data.percentage.toFixed(0)}%
          </div>
          <div className="text-sm text-gray-500 mt-1">completado</div>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            ${data.achieved.toLocaleString('es-PA', { 
              minimumFractionDigits: 0,
              maximumFractionDigits: 0 
            })}
          </div>
          <div className="text-sm text-gray-500">Logrado</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-gray-900">
            ${data.goal.toLocaleString('es-PA', { 
              minimumFractionDigits: 0,
              maximumFractionDigits: 0 
            })}
          </div>
          <div className="text-sm text-gray-500">Meta Diaria</div>
        </div>
      </div>

      {/* Progress indicators */}
      <div className="mt-4 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-blue-700 rounded-full mr-2"></div>
          Logrado
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-gray-200 rounded-full mr-2"></div>
          Pendiente
        </div>
      </div>
    </div>
  )
}
