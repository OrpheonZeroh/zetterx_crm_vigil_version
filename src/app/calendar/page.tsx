'use client'

import React, { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { RouteGuard } from '@/components/layout/route-guard'
import { CalendarView } from '@/components/calendar/calendar-view'
import { SlotModal } from '@/components/calendar/slot-modal'
import { Button } from '@/components/ui/button'
import { Plus, Calendar, Clock, Users, CheckCircle, TrendingUp } from 'lucide-react'
import { StatsCard } from '@/components/common'
import { CalendarService, type InstallationSlot } from '@/lib/services/calendar-service'
import { useToast } from '@/components/ui/toast'

export default function CalendarPage() {
  const [slots, setSlots] = useState<InstallationSlot[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    scheduled: 0,
    completed: 0,
    in_progress: 0,
    this_week: 0,
    next_week: 0,
    completion_rate: 0,
    avg_duration: 0
  })
  const [slotModal, setSlotModal] = useState<{ isOpen: boolean; slot?: InstallationSlot | null; selectedDate?: string }>({
    isOpen: false,
    slot: null
  })
  const { showToast } = useToast()

  useEffect(() => {
    loadSlots()
    loadStats()
  }, [])

  const loadSlots = async () => {
    try {
      setLoading(true)
      // Load slots for current month
      const today = new Date()
      const startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0]
      const endDate = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0]
      
      const slotsData = await CalendarService.getSlotsForDateRange(startDate, endDate)
      setSlots(slotsData)
    } catch (error: any) {
      console.error('Error loading slots:', error)
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Error al cargar las citas'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const stats = await CalendarService.getCalendarStats()
      setStats(stats)
    } catch (error: unknown) {
      console.error('Error loading stats:', error)
    }
  }

  const handleSlotClick = (slot: InstallationSlot) => {
    setSlotModal({ isOpen: true, slot })
  }

  const handleDateClick = (date: string) => {
    setSlotModal({ isOpen: true, slot: null, selectedDate: date })
  }

  const handleSlotSave = () => {
    setSlotModal({ isOpen: false, slot: null })
    loadSlots()
    loadStats()
  }

  return (
    <RouteGuard requiredModule="calendar">
      <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary-900">
                Calendario de Instalaciones
              </h1>
              <p className="text-gray-600 mt-2">
                Programa y gestiona las instalaciones
              </p>
            </div>
            <Button size="sm" onClick={() => setSlotModal({ isOpen: true, slot: null })}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Cita
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard
              title="Programadas"
              value={stats.scheduled}
              icon={Calendar}
              iconColor="text-blue-500"
            />
            <StatsCard
              title="Completadas"
              value={stats.completed}
              icon={CheckCircle}
              iconColor="text-green-500"
            />
            <StatsCard
              title="Esta Semana"
              value={stats.this_week}
              icon={Clock}
              iconColor="text-purple-500"
            />
            <StatsCard
              title="Tasa Finalización"
              value={`${stats.completion_rate}%`}
              icon={TrendingUp}
              iconColor="text-orange-500"
            />
          </div>

          {/* Weekly Summary */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Resumen Semanal</h3>
                <p className="text-sm text-gray-600">Estado actual del calendario de instalaciones</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary-600">{stats.total}</div>
                <div className="text-sm text-blue-600">Total Citas</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">{stats.scheduled}</div>
                <div className="text-sm text-gray-600">Pendientes</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">{stats.completed}</div>
                <div className="text-sm text-gray-600">Finalizadas</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">{stats.this_week}</div>
                <div className="text-sm text-gray-600">Esta Semana</div>
              </div>
            </div>
          </div>

          {/* Calendar */}
          <div className="bg-white rounded-lg border border-gray-200">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="ml-2 text-gray-600">Cargando calendario...</span>
              </div>
            ) : (
              <CalendarView 
                slots={slots} 
                onSlotClick={handleSlotClick}
                onDateClick={handleDateClick}
              />
            )}
          </div>

          {/* Slot Modal */}
          <SlotModal
            isOpen={slotModal.isOpen}
            onClose={() => setSlotModal({ isOpen: false, slot: null })}
            onSave={handleSlotSave}
            slot={slotModal.slot}
            selectedDate={slotModal.selectedDate}
          />
        </div>
      </MainLayout>
    </RouteGuard>
  )
}
