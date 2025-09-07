'use client'

import React, { useState, useEffect } from 'react'
import { X, Search, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomerService, type Customer } from '@/lib/services/customer-service'

interface WorkOrderFilters {
  search?: string
  status?: 'lead' | 'quoted' | 'approved' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  customer_id?: string
  province?: string
  district?: string
  created_by?: string
}

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  onApply: (filters: WorkOrderFilters) => void
  onClear: () => void
  currentFilters: WorkOrderFilters
}

export function FilterModal({ isOpen, onClose, onApply, onClear, currentFilters }: FilterModalProps) {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filters, setFilters] = useState<WorkOrderFilters>(currentFilters)

  useEffect(() => {
    if (isOpen) {
      loadCustomers()
      setFilters(currentFilters)
    }
  }, [isOpen, currentFilters])

  const loadCustomers = async () => {
    try {
      const { customers } = await CustomerService.getCustomers({ limit: 1000 })
      setCustomers(customers)
    } catch (error) {
      console.error('Error loading customers:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFilters(prev => ({ ...prev, [name]: value || undefined }))
  }

  const handleApply = () => {
    onApply(filters)
    onClose()
  }

  const handleClear = () => {
    const clearedFilters: WorkOrderFilters = {
      search: undefined,
      status: undefined,
      customer_id: undefined,
      province: undefined,
      district: undefined,
      created_by: undefined
    }
    setFilters(clearedFilters)
    onClear()
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl animate-in slide-in-from-bottom-4 duration-300 border border-slate-200/60">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <Filter className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">Filtrar Órdenes</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="space-y-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  name="search"
                  value={filters.search || ''}
                  onChange={handleChange}
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Buscar por título o notas..."
                />
              </div>
            </div>

            {/* Status and Customer */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  name="status"
                  value={filters.status || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos los estados</option>
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
                  Cliente
                </label>
                <select
                  name="customer_id"
                  value={filters.customer_id || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todos los clientes</option>
                  {customers.map(customer => (
                    <option key={customer.id} value={customer.id}>
                      {customer.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Provincia
                </label>
                <select
                  name="province"
                  value={filters.province || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Todas las provincias</option>
                  <option value="Panamá">Panamá</option>
                  <option value="Panamá Oeste">Panamá Oeste</option>
                  <option value="Colón">Colón</option>
                  <option value="Chiriquí">Chiriquí</option>
                  <option value="Veraguas">Veraguas</option>
                  <option value="Los Santos">Los Santos</option>
                  <option value="Herrera">Herrera</option>
                  <option value="Coclé">Coclé</option>
                  <option value="Darién">Darién</option>
                  <option value="Bocas del Toro">Bocas del Toro</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Distrito
                </label>
                <input
                  type="text"
                  name="district"
                  value={filters.district || ''}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Ej: Panamá, San Miguelito..."
                />
              </div>
            </div>

            {/* Created By */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Creado por
              </label>
              <input
                type="text"
                name="created_by"
                value={filters.created_by || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ej: Carlos Sales, Ana Tech..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-6">
            <Button
              variant="outline"
              onClick={handleClear}
              className="text-gray-600 hover:text-gray-800"
            >
              Limpiar filtros
            </Button>
            <div className="flex space-x-3">
              <Button
                variant="outline"
                onClick={onClose}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleApply}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                Aplicar filtros
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
