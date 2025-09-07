'use client'

import React, { useState, useEffect } from 'react'
import { X, Calendar, Clock, User, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CalendarService, type InstallationSlot } from '@/lib/services/calendar-service'
import { WorkOrderService, type WorkOrder } from '@/lib/services/work-order-service'
import { useToast } from '@/components/ui/toast'

interface SlotModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  slot?: InstallationSlot | null
  selectedDate?: string
}

export function SlotModal({ isOpen, onClose, slot, onSave, selectedDate }: SlotModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState({
    work_order_id: slot?.work_order_id || '',
    technician_id: slot?.technician_id || '',
    scheduled_at: slot?.scheduled_at || selectedDate || new Date().toISOString().split('T')[0],
    start_time: slot?.start_time || '09:00',
    end_time: slot?.end_time || '10:00',
    status: slot?.status || 'scheduled' as InstallationSlot['status'],
    location: slot?.location || '',
    estimated_duration: slot?.estimated_duration || 60,
    notes: slot?.notes || ''
  })

  useEffect(() => {
    if (isOpen) {
      loadWorkOrders()
    }
  }, [isOpen])

  useEffect(() => {
    if (slot) {
      setFormData({
        work_order_id: slot.work_order_id || '',
        technician_id: slot.technician_id || '',
        scheduled_at: slot.scheduled_at || selectedDate || new Date().toISOString().split('T')[0],
        start_time: slot.start_time || '09:00',
        end_time: slot.end_time || '10:00',
        status: slot.status || 'scheduled',
        location: slot.location || '',
        estimated_duration: slot.estimated_duration || 60,
        notes: slot.notes || ''
      })
    } else {
      setFormData({
        work_order_id: '',
        technician_id: '',
        scheduled_at: selectedDate || new Date().toISOString().split('T')[0],
        start_time: '09:00',
        end_time: '10:00',
        status: 'scheduled',
        location: '',
        estimated_duration: 60,
        notes: ''
      })
    }
    setError('')
  }, [slot, isOpen, selectedDate])

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
    const startTime = e.target.value
    const endTime = calculateEndTime(startTime, formData.estimated_duration)
    setFormData(prev => ({ 
      ...prev, 
      start_time: startTime,
      end_time: endTime
    }))
  }

  const handleDurationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const duration = parseInt(e.target.value) || 60
    const endTime = calculateEndTime(formData.start_time, duration)
    setFormData(prev => ({ 
      ...prev, 
      estimated_duration: duration,
      end_time: endTime
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!formData.work_order_id || !formData.scheduled_at || !formData.start_time) {
        setError('Por favor completa todos los campos requeridos')
        return
      }

      const slotData = {
        ...formData,
        estimated_duration: parseInt(formData.estimated_duration.toString()) || 60
      }

      if (slot?.id) {
        await CalendarService.updateSlot(slot.id, slotData)
        showToast({
          type: 'success',
          title: 'Cita actualizada',
          message: `Cita del ${new Date(formData.scheduled_at).toLocaleDateString('es-PA')} ha sido actualizada`
        })
      } else {
        await CalendarService.createSlot(slotData)
        showToast({
          type: 'success',
          title: 'Cita creada',
          message: `Cita programada para el ${new Date(formData.scheduled_at).toLocaleDateString('es-PA')}`
        })
      }
      
      onSave()
      onClose()
    } catch (err: any) {
      console.error('Error saving slot:', err)
      setError(err.message || 'Error al guardar la cita')
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Error al guardar la cita'
      })
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
                    name="scheduled_at"
                    value={formData.scheduled_at}
                    onChange={handleChange}
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

              {/* Location */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Ubicación
                </label>
                <input
                  type="text"
                  name="location"
                  value={formData.location}
                  onChange={handleChange}
                  placeholder="Dirección o ubicación específica"
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
                    name="start_time"
                    value={formData.start_time}
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
                    name="end_time"
                    value={formData.end_time}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    readOnly
                  />
                </div>
              </div>

              {/* Duration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Duración Estimada (minutos)
                </label>
                <input
                  type="number"
                  name="estimated_duration"
                  value={formData.estimated_duration}
                  onChange={handleDurationChange}
                  min="15"
                  max="480"
                  step="15"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Technician */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Técnico Asignado
                </label>
                <select
                  name="technician_id"
                  value={formData.technician_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Sin asignar</option>
                  {/* Would need to load technicians/users */}
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
