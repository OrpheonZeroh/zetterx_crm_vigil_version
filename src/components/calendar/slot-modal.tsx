'use client'

import React, { useState, useEffect } from 'react'
import { X, Calendar, Clock, User, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CalendarService, type InstallationSlot } from '@/lib/services/calendar-service'
import { WorkOrderService, type WorkOrder } from '@/lib/services/work-order-service'
import { UserService } from '@/lib/services/user-service'
import { useToast } from '@/components/ui/toast'

interface SlotModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  slot?: InstallationSlot | null
  selectedDate?: string
}

interface Technician {
  id: string
  full_name: string
  email: string
  role: string
}

export function SlotModal({ isOpen, onClose, slot, onSave, selectedDate }: SlotModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [technicians, setTechnicians] = useState<Technician[]>([])
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState({
    work_order_id: slot?.work_order_id || '',
    team_id: slot?.team_id || '',
    start_at: slot?.start_at || `${selectedDate || new Date().toISOString().split('T')[0]}T09:00:00`,
    end_at: slot?.end_at || `${selectedDate || new Date().toISOString().split('T')[0]}T10:00:00`,
    status: slot?.status || 'scheduled' as InstallationSlot['status'],
    cost_estimate: slot?.cost_estimate || 0,
    notes: slot?.notes || ''
  })

  useEffect(() => {
    if (isOpen) {
      loadWorkOrders()
      loadTechnicians()
    }
  }, [isOpen])

  useEffect(() => {
    if (slot) {
      setFormData({
        work_order_id: slot.work_order_id || '',
        team_id: slot.team_id || '',
        start_at: slot.start_at || `${selectedDate || new Date().toISOString().split('T')[0]}T09:00:00`,
        end_at: slot.end_at || `${selectedDate || new Date().toISOString().split('T')[0]}T10:00:00`,
        status: slot.status || 'scheduled',
        cost_estimate: slot.cost_estimate || 0,
        notes: slot.notes || ''
      })
    } else {
      setFormData({
        work_order_id: '',
        team_id: '',
        start_at: `${selectedDate || new Date().toISOString().split('T')[0]}T09:00:00`,
        end_at: `${selectedDate || new Date().toISOString().split('T')[0]}T10:00:00`,
        status: 'scheduled',
        cost_estimate: 0,
        notes: ''
      })
    }
    setError('')
  }, [slot, selectedDate])

  const loadWorkOrders = async () => {
    try {
      const { workOrders } = await WorkOrderService.getWorkOrders({ limit: 1000 })
      // Filter to show only approved work orders without scheduled installations
      const availableOrders = workOrders.filter(order => 
        order.status === 'approved' || order.status === 'in_progress'
      )
      setWorkOrders(availableOrders)
    } catch (error) {
      console.error('Error loading work orders:', error)
    }
  }

  const loadTechnicians = async () => {
    try {
      const technicianData = await UserService.getTechnicians()
      setTechnicians(technicianData)
    } catch (error) {
      console.error('Error loading technicians:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const calculateEndTime = (startTime: string, duration: number) => {
    const [hours, minutes] = startTime.split(':').map(Number)
    const startMinutes = hours * 60 + minutes
    const endMinutes = startMinutes + duration
    const endHours = Math.floor(endMinutes / 60)
    const endMins = endMinutes % 60
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`
  }

  const handleStartTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value
    const dateStr = formData.start_at.split('T')[0]
    const startDateTime = `${dateStr}T${timeValue}:00`
    
    // Calculate end time (default 1 hour duration)
    const startTime = new Date(startDateTime)
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000) // Add 1 hour
    const endDateTime = endTime.toISOString().slice(0, 19)
    
    setFormData(prev => ({ 
      ...prev, 
      start_at: startDateTime,
      end_at: endDateTime
    }))
  }

  const handleEndTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const timeValue = e.target.value
    const dateStr = formData.end_at.split('T')[0]
    const endDateTime = `${dateStr}T${timeValue}:00`
    
    setFormData(prev => ({ 
      ...prev, 
      end_at: endDateTime
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!formData.work_order_id) {
        throw new Error('Debe seleccionar una orden de trabajo')
      }

      // Validate times
      const startDateTime = new Date(formData.start_at)
      const endDateTime = new Date(formData.end_at)
      
      if (endDateTime <= startDateTime) {
        throw new Error('La hora de fin debe ser posterior a la hora de inicio')
      }

      // Calculate duration in minutes
      const durationMinutes = (endDateTime.getTime() - startDateTime.getTime()) / (1000 * 60)
      
      if (durationMinutes < 15) {
        throw new Error('La duración mínima es de 15 minutos')
      }

      // Create slot data
      const slotData = {
        id: slot?.id,
        work_order_id: formData.work_order_id,
        team_id: formData.team_id,
        start_at: formData.start_at,
        end_at: formData.end_at,
        status: formData.status,
        cost_estimate: formData.cost_estimate,
        notes: formData.notes
      }

      if (slot?.id) {
        await CalendarService.updateSlot(slot.id, slotData)
      } else {
        await CalendarService.createSlot(slotData)
      }

      onSave?.()
      onClose()

      showToast({
        type: 'success',
        title: slot ? 'Cita actualizada' : 'Cita creada',
        message: slot ? 'La cita se actualizó correctamente' : 'La nueva cita se creó correctamente'
      })
    } catch (error: unknown) {
      console.error('Error saving slot:', error)
      setError(error instanceof Error ? error.message : 'Error al guardar la cita')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-in slide-in-from-bottom-4 duration-300 border border-slate-200/60 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Calendar className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              {slot ? 'Editar Cita' : 'Nueva Cita'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Información Básica</h4>
              
              {/* Work Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Orden de Trabajo *
                </label>
                <select
                  name="work_order_id"
                  value={formData.work_order_id}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Selecciona orden</option>
                  {workOrders.map(order => (
                    <option key={order.id} value={order.id}>
                      {order.title} - {order.customer?.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Date and Status */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    name="start_at"
                    value={formData.start_at.split('T')[0]}
                    onChange={(e) => {
                      const newDate = e.target.value
                      const startTime = formData.start_at.split('T')[1] || '09:00:00'
                      const endTime = formData.end_at.split('T')[1] || '10:00:00'
                      setFormData(prev => ({
                        ...prev,
                        start_at: `${newDate}T${startTime}`,
                        end_at: `${newDate}T${endTime}`
                      }))
                    }}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Estado
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="scheduled">Programada</option>
                    <option value="in_progress">En Progreso</option>
                    <option value="completed">Completada</option>
                    <option value="cancelled">Cancelada</option>
                    <option value="rescheduled">Reprogramada</option>
                  </select>
                </div>
              </div>

              {/* Cost Estimate */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estimado de Costo
                </label>
                <input
                  type="number"
                  name="cost_estimate"
                  value={formData.cost_estimate}
                  onChange={handleChange}
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Horario y Duración</h4>
              
              {/* Time */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora Inicio *
                  </label>
                  <input
                    type="time"
                    value={formData.start_at.split('T')[1]?.slice(0, 5) || '09:00'}
                    onChange={handleStartTimeChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Hora Fin
                  </label>
                  <input
                    type="time"
                    value={formData.end_at.split('T')[1]?.slice(0, 5) || '10:00'}
                    onChange={handleEndTimeChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Technician Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <User className="w-4 h-4 inline-block mr-1" />
                  Técnico Asignado
                </label>
                <select
                  name="team_id"
                  value={formData.team_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Seleccionar técnico</option>
                  {technicians.map(tech => (
                    <option key={tech.id} value={tech.id}>
                      {tech.full_name} ({tech.role})
                    </option>
                  ))}
                </select>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Notas
                </label>
                <textarea
                  name="notes"
                  value={formData.notes}
                  onChange={handleChange}
                  rows={3}
                  placeholder="Notas adicionales o instrucciones especiales"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-8">
            <div className="text-sm text-gray-500">
              * Campos requeridos
            </div>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  slot ? 'Actualizar' : 'Crear Cita'
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
