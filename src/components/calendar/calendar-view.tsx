'use client'

import React, { useState, useEffect } from 'react'
import { ChevronLeft, ChevronRight, Clock, User, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CalendarService, type InstallationSlot } from '@/lib/services/calendar-service'
import { cn } from '@/lib/utils'

interface CalendarViewProps {
  slots: InstallationSlot[]
  onSlotClick?: (slot: InstallationSlot) => void
  onDateClick?: (date: string) => void
  loading?: boolean
}

const MONTHS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
]

const DAYS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

export function CalendarView({ slots, onSlotClick, onDateClick, loading }: CalendarViewProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [view, setView] = useState<'month' | 'week'>('month')

  const statusColors: Record<InstallationSlot['status'], string> = {
    scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
    confirmed: 'bg-blue-100 text-blue-800 border-blue-200',
    in_progress: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    done: 'bg-green-100 text-green-800 border-green-200',
    no_show: 'bg-orange-100 text-orange-800 border-orange-200',
    cancelled: 'bg-red-100 text-red-800 border-red-200'
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1)
      } else {
        newDate.setMonth(prev.getMonth() + 1)
      }
      return newDate
    })
  }

  const navigateWeek = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev)
      const days = direction === 'prev' ? -7 : 7
      newDate.setDate(prev.getDate() + days)
      return newDate
    })
  }

  const getMonthDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const firstDayOfWeek = firstDay.getDay()
    const daysInMonth = lastDay.getDate()
    
    const days = []
    
    // Previous month days
    const prevMonth = new Date(year, month - 1, 0)
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonth.getDate() - i),
        isCurrentMonth: false
      })
    }
    
    // Current month days
    for (let day = 1; day <= daysInMonth; day++) {
      days.push({
        date: new Date(year, month, day),
        isCurrentMonth: true
      })
    }
    
    // Next month days
    const remainingDays = 42 - days.length // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      days.push({
        date: new Date(year, month + 1, day),
        isCurrentMonth: false
      })
    }
    
    return days
  }

  const getWeekDays = () => {
    const startOfWeek = new Date(currentDate)
    startOfWeek.setDate(currentDate.getDate() - currentDate.getDay())
    
    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(startOfWeek)
      date.setDate(startOfWeek.getDate() + i)
      days.push({
        date,
        isCurrentMonth: true
      })
    }
    
    return days
  }

  const getSlotsForDate = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0]
    return slots.filter(slot => slot.start_at.startsWith(dateStr))
  }

  const isToday = (date: Date) => {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  const formatTime = (time: string) => {
    return time.slice(0, 5) // "HH:MM"
  }

  const days = view === 'month' ? getMonthDays() : getWeekDays()

  if (loading) {
    return (
      <div className="bg-white rounded-lg border border-gray-200 p-8">
        <div className="flex items-center justify-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
          <span className="ml-2 text-gray-600">Cargando calendario...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold text-gray-900">
            {MONTHS[currentDate.getMonth()]} {currentDate.getFullYear()}
          </h2>
          <div className="flex items-center space-x-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => view === 'month' ? navigateMonth('prev') : navigateWeek('prev')}
              className="h-8 w-8 p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => view === 'month' ? navigateMonth('next') : navigateWeek('next')}
              className="h-8 w-8 p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={view === 'month' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('month')}
          >
            Mes
          </Button>
          <Button
            variant={view === 'week' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setView('week')}
          >
            Semana
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentDate(new Date())}
          >
            Hoy
          </Button>
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="p-4">
        {/* Days header */}
        <div className={cn(
          "grid gap-px mb-2",
          view === 'month' ? 'grid-cols-7' : 'grid-cols-7'
        )}>
          {DAYS.map(day => (
            <div key={day} className="p-2 text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        {/* Calendar body */}
        <div className={cn(
          "grid gap-px",
          view === 'month' ? 'grid-cols-7' : 'grid-cols-7'
        )}>
          {days.map((day, index) => {
            const daySlots = getSlotsForDate(day.date)
            const isCurrentDay = isToday(day.date)
            
            return (
              <div
                key={index}
                className={cn(
                  "min-h-24 p-2 border border-gray-100 cursor-pointer hover:bg-gray-50 transition-colors",
                  view === 'month' && "min-h-32",
                  !day.isCurrentMonth && "bg-gray-50 text-gray-400",
                  isCurrentDay && "bg-blue-50 border-blue-200"
                )}
                onClick={() => onDateClick?.(day.date.toISOString().split('T')[0])}
              >
                <div className={cn(
                  "text-sm mb-1",
                  isCurrentDay && "font-semibold text-blue-600"
                )}>
                  {day.date.getDate()}
                </div>
                
                {/* Slots for this day */}
                <div className="space-y-1">
                  {daySlots.slice(0, view === 'month' ? 3 : 8).map((slot) => (
                    <div
                      key={slot.id}
                      className={cn(
                        "text-xs p-1 rounded border cursor-pointer hover:shadow-sm transition-shadow",
                        statusColors[slot.status]
                      )}
                      onClick={(e) => {
                        e.stopPropagation()
                        onSlotClick?.(slot)
                      }}
                    >
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span className="font-medium">
                          {formatTime(slot.start_at)}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1 mt-1">
                        <User className="w-3 h-3" />
                        <span className="truncate">
                          {slot.work_order?.customer?.name || 'Sin cliente'}
                        </span>
                      </div>
                      {slot.work_order?.address_line && (
                        <div className="flex items-center space-x-1 mt-1">
                          <MapPin className="w-3 h-3" />
                          <span className="truncate">{slot.work_order.address_line}</span>
                        </div>
                      )}
                    </div>
                  ))}
                  
                  {daySlots.length > (view === 'month' ? 3 : 8) && (
                    <div className="text-xs text-gray-500 text-center">
                      +{daySlots.length - (view === 'month' ? 3 : 8)} más
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
