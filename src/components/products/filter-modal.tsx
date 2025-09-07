'use client'

import React, { useState } from 'react'
import { X, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilter: (filters: ProductFilters) => void
  currentFilters: ProductFilters
}

export interface ProductFilters {
  search?: string
  isService?: boolean
  status?: boolean
  priceMin?: number
  priceMax?: number
  dateFrom?: string
  dateTo?: string
}

export function FilterModal({ isOpen, onClose, onApplyFilter, currentFilters }: FilterModalProps) {
  const [filters, setFilters] = useState<ProductFilters>(currentFilters)

  if (!isOpen) return null

  const handleApply = () => {
    onApplyFilter(filters)
    onClose()
  }

  const handleClear = () => {
    const clearedFilters: ProductFilters = {}
    setFilters(clearedFilters)
    onApplyFilter(clearedFilters)
    onClose()
  }

  const handleChange = (field: keyof ProductFilters, value: string | boolean | number) => {
    setFilters(prev => ({ ...prev, [field]: value || undefined }))
  }

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in slide-in-from-bottom-4 duration-300 border border-slate-200/60">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Filter className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filtros de Productos</h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Search Term */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar por código o descripción
            </label>
            <input
              type="text"
              value={filters.search || ''}
              onChange={(e) => handleChange('search', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Escribe para buscar..."
            />
          </div>

          {/* Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo
            </label>
            <select
              value={filters.isService === undefined ? '' : filters.isService ? 'true' : 'false'}
              onChange={(e) => {
                const value = e.target.value
                if (value === '') {
                  handleChange('isService', undefined as any)
                } else {
                  handleChange('isService', value === 'true')
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Productos y Servicios</option>
              <option value="false">Solo Productos</option>
              <option value="true">Solo Servicios</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Estado
            </label>
            <select
              value={filters.status === undefined ? '' : filters.status.toString()}
              onChange={(e) => {
                const value = e.target.value
                if (value === '') {
                  handleChange('status', undefined as any)
                } else {
                  handleChange('status', value === 'true')
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todos los estados</option>
              <option value="true">Activos</option>
              <option value="false">Inactivos</option>
            </select>
          </div>

          {/* Price Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio mínimo
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={filters.priceMin || ''}
                onChange={(e) => handleChange('priceMin', parseFloat(e.target.value) || undefined as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio máximo
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={filters.priceMax || ''}
                onChange={(e) => handleChange('priceMax', parseFloat(e.target.value) || undefined as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="9999.99"
              />
            </div>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Desde
              </label>
              <input
                type="date"
                value={filters.dateFrom || ''}
                onChange={(e) => handleChange('dateFrom', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Hasta
              </label>
              <input
                type="date"
                value={filters.dateTo || ''}
                onChange={(e) => handleChange('dateTo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50 rounded-b-2xl">
          <Button
            variant="outline"
            onClick={handleClear}
            className="text-gray-600"
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
  )
}
