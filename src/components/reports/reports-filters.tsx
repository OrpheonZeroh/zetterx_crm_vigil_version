'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Calendar, Filter, Download } from 'lucide-react'
import { ReportFilters } from '@/lib/services/reports-service'

interface ReportsFiltersProps {
  onFiltersChange: (filters: ReportFilters) => void
  onExport: () => void
  loading?: boolean
}

export function ReportsFilters({ onFiltersChange, onExport, loading }: ReportsFiltersProps) {
  const [filters, setFilters] = useState<ReportFilters>({
    start_date: '',
    end_date: ''
  })

  const handleFilterChange = (key: keyof ReportFilters, value: string) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const handleQuickFilter = (days: number) => {
    const endDate = new Date()
    const startDate = new Date(endDate.getTime() - days * 24 * 60 * 60 * 1000)
    
    const newFilters = {
      ...filters,
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0]
    }
    
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const clearFilters = () => {
    const emptyFilters: ReportFilters = {}
    setFilters({ start_date: '', end_date: '' })
    onFiltersChange(emptyFilters)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center text-lg font-semibold">
          <Filter className="w-5 h-5 mr-2" />
          Filtros de Reporte
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Date Range */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Fecha de Inicio
              </label>
              <Input
                type="date"
                value={filters.start_date}
                onChange={(e) => handleFilterChange('start_date', e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Fecha de Fin
              </label>
              <Input
                type="date"
                value={filters.end_date}
                onChange={(e) => handleFilterChange('end_date', e.target.value)}
                className="w-full"
              />
            </div>
          </div>

          {/* Quick Filters */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Filtros Rápidos
            </label>
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickFilter(7)}
                className="text-xs"
              >
                Últimos 7 días
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickFilter(30)}
                className="text-xs"
              >
                Últimos 30 días
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickFilter(90)}
                className="text-xs"
              >
                Últimos 3 meses
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleQuickFilter(365)}
                className="text-xs"
              >
                Último año
              </Button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-between pt-4 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={clearFilters}
              disabled={loading}
              className="text-sm"
            >
              Limpiar Filtros
            </Button>
            <Button
              onClick={onExport}
              disabled={loading}
              className="text-sm"
            >
              <Download className="w-4 h-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
