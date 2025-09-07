'use client'

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { WorkOrderService, type WorkOrder } from '@/lib/services/work-order-service'
import { CustomerService, type Customer } from '@/lib/services/customer-service'
import { useToast } from '@/components/ui/toast'

interface WorkOrderModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  workOrder?: WorkOrder | null
}

export function WorkOrderModal({ isOpen, onClose, workOrder, onSave }: WorkOrderModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [customers, setCustomers] = useState<Customer[]>([])
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState({
    customer_id: workOrder?.customer_id || '',
    title: workOrder?.title || '',
    status: workOrder?.status || 'lead',
    estimated_value: workOrder?.estimated_value || '',
    address_line: workOrder?.address_line || '',
    province: workOrder?.province || '',
    district: workOrder?.district || '',
    corregimiento: workOrder?.corregimiento || '',
    notes: workOrder?.notes || ''
  })

  useEffect(() => {
    if (isOpen) {
      loadCustomers()
    }
  }, [isOpen])

  useEffect(() => {
    if (workOrder) {
      setFormData({
        customer_id: workOrder.customer_id || '',
        title: workOrder.title || '',
        status: workOrder.status || 'lead',
        estimated_value: workOrder.estimated_value || '',
        address_line: workOrder.address_line || '',
        province: workOrder.province || '',
        district: workOrder.district || '',
        corregimiento: workOrder.corregimiento || '',
        notes: workOrder.notes || ''
      })
    } else {
      setFormData({
        customer_id: '',
        title: '',
        status: 'lead',
        estimated_value: '',
        address_line: '',
        province: '',
        district: '',
        corregimiento: '',
        notes: ''
      })
    }
    setError('')
  }, [workOrder, isOpen])

  const loadCustomers = async () => {
    try {
      const { customers } = await CustomerService.getCustomers({ limit: 1000 })
      setCustomers(customers)
    } catch (error) {
      console.error('Error loading customers:', error)
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
      if (!formData.customer_id || !formData.title) {
        setError('Por favor completa todos los campos requeridos')
        return
      }

      const workOrderData = {
        ...formData,
        estimated_value: formData.estimated_value ? parseFloat(formData.estimated_value.toString()) : undefined
      }

      if (workOrder?.id) {
        await WorkOrderService.updateWorkOrder(workOrder.id, workOrderData)
        showToast({
          type: 'success',
          title: 'Orden actualizada',
          message: `${formData.title} ha sido actualizada correctamente`
        })
      } else {
        await WorkOrderService.createWorkOrder(workOrderData)
        showToast({
          type: 'success',
          title: 'Orden creada',
          message: `${formData.title} ha sido creada correctamente`
        })
      }
      
      onSave()
      onClose()
    } catch (err: any) {
      console.error('Error saving work order:', err)
      setError(err.message || 'Error al guardar la orden de trabajo')
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Error al guardar la orden de trabajo'
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
          <h3 className="text-lg font-semibold text-gray-900">
            {workOrder ? 'Editar Orden de Trabajo' : 'Nueva Orden de Trabajo'}
          </h3>
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
            {/* Customer */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Cliente *
              </label>
              <select
                name="customer_id"
                value={formData.customer_id}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Selecciona un cliente</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Título *
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Instalación Radio Base Calle 50"
              />
            </div>

            {/* Status and Estimated Value */}
            <div className="grid grid-cols-2 gap-4">
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
                  <option value="lead">Lead</option>
                  <option value="quoted">Cotizada</option>
                  <option value="approved">Aprobada</option>
                  <option value="scheduled">Programada</option>
                  <option value="in_progress">En Progreso</option>
                  <option value="completed">Completada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Valor Estimado
                </label>
                <input
                  type="number"
                  step="0.01"
                  name="estimated_value"
                  value={formData.estimated_value}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="0.00"
                />
              </div>
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dirección
              </label>
              <input
                type="text"
                name="address_line"
                value={formData.address_line}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Dirección completa"
              />
            </div>

            {/* Location */}
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provincia
                </label>
                <input
                  type="text"
                  name="province"
                  value={formData.province}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Panamá"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Distrito
                </label>
                <input
                  type="text"
                  name="district"
                  value={formData.district}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Panamá"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Corregimiento
                </label>
                <input
                  type="text"
                  name="corregimiento"
                  value={formData.corregimiento}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Bella Vista"
                />
              </div>
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
                placeholder="Notas adicionales..."
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
                  workOrder ? 'Actualizar' : 'Crear Orden'
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
