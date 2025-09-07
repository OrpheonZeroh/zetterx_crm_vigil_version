'use client'

import React, { useState } from 'react'
import { X, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface FilterModalProps {
  isOpen: boolean
  onClose: () => void
  onApplyFilter: (filters: CustomerFilters) => void
  currentFilters: CustomerFilters
}

export interface CustomerFilters {
  province?: string
  district?: string
  searchTerm?: string
  dateFrom?: string
  dateTo?: string
}

const PROVINCES = [
  'PANAMA', 'COLON', 'CHIRIQUI', 'VERAGUAS', 'HERRERA', 
  'LOS_SANTOS', 'COCLE', 'DARIEN', 'SAN_MIGUELITO'
]

export function FilterModal({ isOpen, onClose, onApplyFilter, currentFilters }: FilterModalProps) {
  const [filters, setFilters] = useState<CustomerFilters>(currentFilters)

  if (!isOpen) return null

  const handleApply = () => {
    onApplyFilter(filters)
    onClose()
  }

  const handleClear = () => {
    const clearedFilters: CustomerFilters = {}
    setFilters(clearedFilters)
    onApplyFilter(clearedFilters)
    onClose()
  }

  const handleChange = (field: keyof CustomerFilters, value: string) => {
    setFilters(prev => ({ ...prev, [field]: value || undefined }))
  }

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-in slide-in-from-bottom-4 duration-300 border border-slate-200/60">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Filter className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-900">Filtros de Clientes</h3>
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
              Buscar por nombre, email o teléfono
            </label>
            <input
              type="text"
              value={filters.searchTerm || ''}
              onChange={(e) => handleChange('searchTerm', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Escribe para buscar..."
            />
          </div>

          {/* Province Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Provincia
            </label>
            <select
              value={filters.province || ''}
              onChange={(e) => handleChange('province', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Todas las provincias</option>
              {PROVINCES.map(province => (
                <option key={province} value={province}>
                  {province.replace('_', ' ')}
                </option>
              ))}
            </select>
          </div>

          {/* District Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Distrito
            </label>
            <input
              type="text"
              value={filters.district || ''}
              onChange={(e) => handleChange('district', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Nombre del distrito"
            />
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
