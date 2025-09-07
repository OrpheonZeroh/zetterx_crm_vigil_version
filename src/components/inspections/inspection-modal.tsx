'use client'

import React, { useState, useEffect } from 'react'
import { X, Calendar, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InspectionService, type Inspection } from '@/lib/services/inspection-service'
import { WorkOrderService, type WorkOrder } from '@/lib/services/work-order-service'
import { useToast } from '@/components/ui/toast'

interface InspectionModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  inspection?: Inspection | null
}

export function InspectionModal({ isOpen, onClose, inspection, onSave }: InspectionModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState({
    work_order_id: inspection?.work_order_id || '',
    scheduled_at: inspection?.scheduled_at ? new Date(inspection.scheduled_at).toISOString().slice(0, 16) : '',
    inspector_id: inspection?.inspector_id || '',
    quoted_min: inspection?.quoted_min || '',
    quoted_max: inspection?.quoted_max || '',
    notes: inspection?.notes || '',
    result: inspection?.result || ''
  })

  useEffect(() => {
    if (isOpen) {
      loadWorkOrders()
    }
  }, [isOpen])

  useEffect(() => {
    if (inspection) {
      setFormData({
        work_order_id: inspection.work_order_id || '',
        scheduled_at: inspection.scheduled_at ? new Date(inspection.scheduled_at).toISOString().slice(0, 16) : '',
        inspector_id: inspection.inspector_id || '',
        quoted_min: inspection.quoted_min || '',
        quoted_max: inspection.quoted_max || '',
        notes: inspection.notes || '',
        result: inspection.result || ''
      })
    } else {
      setFormData({
        work_order_id: '',
        scheduled_at: '',
        inspector_id: '',
        quoted_min: '',
        quoted_max: '',
        notes: '',
        result: ''
      })
    }
    setError('')
  }, [inspection, isOpen])

  const loadWorkOrders = async () => {
    try {
      const { workOrders } = await WorkOrderService.getWorkOrders({ limit: 1000 })
      setWorkOrders(workOrders)
    } catch (error) {
      console.error('Error loading work orders:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!formData.work_order_id || !formData.scheduled_at) {
        setError('Por favor completa todos los campos requeridos')
        return
      }

      const inspectionData = {
        ...formData,
        scheduled_at: new Date(formData.scheduled_at).toISOString(),
        quoted_min: formData.quoted_min ? parseFloat(formData.quoted_min.toString()) : undefined,
        quoted_max: formData.quoted_max ? parseFloat(formData.quoted_max.toString()) : undefined
      }

      if (inspection?.id) {
        await InspectionService.updateInspection(inspection.id, inspectionData)
        showToast({
          type: 'success',
          title: 'Inspección actualizada',
          message: 'La inspección ha sido actualizada correctamente'
        })
      } else {
        await InspectionService.createInspection(inspectionData)
        showToast({
          type: 'success',
          title: 'Inspección creada',
          message: 'La inspección ha sido programada correctamente'
        })
      }
      
      onSave()
      onClose()
    } catch (err: any) {
      console.error('Error saving inspection:', err)
      setError(err.message || 'Error al guardar la inspección')
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Error al guardar la inspección'
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
              {inspection ? 'Editar Inspección' : 'Nueva Inspección'}
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

          <div className="space-y-4">
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
                <option value="">Selecciona una orden</option>
                {workOrders.map(order => (
                  <option key={order.id} value={order.id}>
                    {order.title} - {order.customer?.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Scheduled Date and Inspector */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Fecha y Hora *
                </label>
                <input
                  type="datetime-local"
                  name="scheduled_at"
                  value={formData.scheduled_at}
                  onChange={handleChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Inspector
                </label>
                <input
                  type="text"
                  name="inspector_id"
                  value={formData.inspector_id}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="ID del inspector"
                />
              </div>
            </div>

            {/* Quote Range */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cotización Mínima
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="quoted_min"
                  value={formData.quoted_min}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cotización Máxima
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="quoted_max"
                  value={formData.quoted_max}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Result */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Resultado
              </label>
              <select
                name="result"
                value={formData.result}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Pendiente</option>
                <option value="approved">Aprobado</option>
                <option value="rejected">Rechazado</option>
                <option value="requires_changes">Requiere Cambios</option>
                <option value="postponed">Pospuesto</option>
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Notas adicionales sobre la inspección..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
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
                  inspection ? 'Actualizar' : 'Crear Inspección'
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
