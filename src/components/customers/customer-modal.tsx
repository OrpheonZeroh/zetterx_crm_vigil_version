'use client'

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomerService } from '@/lib/services/customer-service'
import { useToast } from '@/components/ui/toast'

interface CustomerModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  customer?: any
}

export function CustomerModal({ isOpen, onClose, customer, onSave }: CustomerModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { showToast } = useToast()
  const [formData, setFormData] = useState({
    name: customer?.name || '',
    email: customer?.email || '',
    phone: customer?.phone || '',
    address_line: customer?.address_line || '',
    province: customer?.province || '',
    district: customer?.district || '',
    corregimiento: customer?.corregimiento || '',
    tax_id_type: customer?.tax_id_type || '',
    notes: customer?.notes || ''
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      let result
      if (customer?.id) {
        result = await CustomerService.updateCustomer(customer.id, formData)
        showToast({
          type: 'success',
          title: 'Cliente actualizado',
          message: `${formData.name} ha sido actualizado correctamente`
        })
      } else {
        result = await CustomerService.createCustomer(formData)
        showToast({
          type: 'success',
          title: 'Cliente creado',
          message: `${formData.name} ha sido agregado al sistema`
        })
      }
      onSave()
      onClose()
    } catch (err: any) {
      const errorMessage = err.message || 'Error al guardar el cliente'
      setError(errorMessage)
      showToast({
        type: 'error',
        title: 'Error al guardar',
        message: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300 border border-slate-200/60">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {customer ? 'Editar Cliente' : 'Nuevo Cliente'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Nombre completo"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="cliente@email.com"
              />
            </div>

            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                Teléfono
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="+507 6123-4567"
              />
            </div>

            <div>
              <label htmlFor="tax_id_type" className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de ID
              </label>
              <select
                id="tax_id_type"
                name="tax_id_type"
                value={formData.tax_id_type}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar</option>
                <option value="cedula">Cédula</option>
                <option value="ruc">RUC</option>
                <option value="pasaporte">Pasaporte</option>
              </select>
            </div>

            <div>
              <label htmlFor="province" className="block text-sm font-medium text-gray-700 mb-1">
                Provincia
              </label>
              <select
                id="province"
                name="province"
                value={formData.province}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Seleccionar</option>
                <option value="PANAMA">Panamá</option>
                <option value="COLON">Colón</option>
                <option value="CHIRIQUI">Chiriquí</option>
                <option value="VERAGUAS">Veraguas</option>
                <option value="LOS SANTOS">Los Santos</option>
                <option value="HERRERA">Herrera</option>
                <option value="COCLE">Coclé</option>
                <option value="DARIEN">Darién</option>
                <option value="BOCAS DEL TORO">Bocas del Toro</option>
              </select>
            </div>

            <div>
              <label htmlFor="district" className="block text-sm font-medium text-gray-700 mb-1">
                Distrito
              </label>
              <input
                type="text"
                id="district"
                name="district"
                value={formData.district}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Distrito"
              />
            </div>

            <div>
              <label htmlFor="corregimiento" className="block text-sm font-medium text-gray-700 mb-1">
                Corregimiento
              </label>
              <input
                type="text"
                id="corregimiento"
                name="corregimiento"
                value={formData.corregimiento}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Corregimiento"
              />
            </div>
          </div>

          <div>
            <label htmlFor="address_line" className="block text-sm font-medium text-gray-700 mb-1">
              Dirección
            </label>
            <input
              type="text"
              id="address_line"
              name="address_line"
              value={formData.address_line}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Dirección completa"
            />
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notas
            </label>
            <textarea
              id="notes"
              name="notes"
              rows={3}
              value={formData.notes}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Notas adicionales..."
            />
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Guardando...' : (customer ? 'Actualizar' : 'Crear Cliente')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
