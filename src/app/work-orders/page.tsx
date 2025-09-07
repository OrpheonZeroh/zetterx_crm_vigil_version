'use client'

import React, { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { RouteGuard } from '@/components/layout/route-guard'
import { WorkOrdersTable } from '@/components/work-orders/work-orders-table'
import { WorkOrderModal } from '@/components/work-orders/work-order-modal'
import { FilterModal } from '@/components/work-orders/filter-modal'
import { ExportModal } from '@/components/work-orders/export-modal'
import { Button } from '@/components/ui/button'
import { Calendar, MapPin, Plus, Search, User, Filter, Download, FileText, DollarSign } from 'lucide-react'
import { StatsCard } from '@/components/common'
import { WorkOrderService, type WorkOrder } from '@/lib/services/work-order-service'
import { useToast } from '@/components/ui/toast'

interface WorkOrderFilters {
  search?: string
  status?: 'lead' | 'quoted' | 'approved' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  customer_id?: string
  province?: string
  district?: string
  created_by?: string
}

export default function WorkOrdersPage() {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<WorkOrderFilters>({})
  const [stats, setStats] = useState({
    total: 0,
    byStatus: {} as { [key: string]: number },
    totalValue: 0,
    thisMonth: 0
  })
  const [modals, setModals] = useState({
    workOrder: false,
    filter: false,
    export: false
  })
  const { showToast } = useToast()

  useEffect(() => {
    loadWorkOrders()
    loadStats()
  }, [filters])

  const loadWorkOrders = async () => {
    try {
      setLoading(true)
      const { workOrders } = await WorkOrderService.getWorkOrders({ 
        limit: 100, 
        ...filters 
      })
      setWorkOrders(workOrders)
    } catch (error: any) {
      console.error('Error loading work orders:', error)
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Error al cargar las órdenes de trabajo'
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (workOrder: { id?: string; customer_id: string; title: string; status: string; estimated_value?: number }) => {
    try {
      const stats = await WorkOrderService.getWorkOrderStats()
      setStats(stats)
    } catch (error: unknown) {
      console.error('Error loading stats:', error)
    }
  }

  const loadStats = async () => {
    try {
      const stats = await WorkOrderService.getWorkOrderStats()
      setStats(stats)
    } catch (error: unknown) {
      console.error('Error loading stats:', error)
    }
  }

  const handleApplyFilters = (newFilters: WorkOrderFilters) => {
    setFilters(newFilters)
    showToast({
      type: 'success', 
      title: 'Filtros aplicados',
      message: 'Se han aplicado los filtros correctamente'
    })
  }

  const handleClearFilters = () => {
    setFilters({})
    showToast({
      type: 'success',
      title: 'Filtros limpiados', 
      message: 'Se han eliminado todos los filtros'
    })
  }
  
  return (
    <RouteGuard requiredModule="work-orders">
      <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary-900">
                Órdenes de Trabajo
              </h1>
              <p className="text-gray-600 mt-2">
                Gestiona tu pipeline de ventas y proyectos
              </p>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setModals(prev => ({ ...prev, filter: true }))}
                className="h-9 px-3 text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setModals(prev => ({ ...prev, export: true }))}
                className="h-9 px-3 text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button 
                size="sm"
                onClick={() => setModals(prev => ({ ...prev, workOrder: true }))}
                className="h-9 px-3 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Orden
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard
              title="Leads"
              value={stats.byStatus.lead || 0}
              icon={FileText}
              iconColor="text-blue-500"
            />
            <StatsCard
              title="Aprobadas"
              value={stats.byStatus.approved || 0}
              iconColor="text-green-500"
            />
            <StatsCard
              title="En Progreso"
              value={stats.byStatus.in_progress || 0}
              iconColor="text-purple-500"
            />
            <StatsCard
              title="Valor Total"
              value={`$${stats.totalValue.toFixed(0)}`}
              icon={DollarSign}
              iconColor="text-orange-500"
            />
          </div>

          {/* Conversion Rate */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Valor Total del Pipeline</h3>
                <p className="text-sm text-gray-600">Valor estimado de todas las órdenes</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary-600">${stats.totalValue.toFixed(2)}</div>
                <div className="text-sm text-blue-600">{stats.thisMonth} este mes</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Órdenes</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">{Math.round(((stats.byStatus.approved || 0) / (stats.byStatus.lead || 1)) * 100)}%</div>
                <div className="text-sm text-gray-600">Tasa Conversión</div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-gray-200">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="ml-2 text-gray-600">Cargando órdenes...</span>
              </div>
            ) : (
              <WorkOrdersTable workOrders={workOrders} onRefresh={loadWorkOrders} />
            )}
          </div>

          {/* Modals */}
          <WorkOrderModal
            isOpen={modals.workOrder}
            onClose={() => setModals(prev => ({ ...prev, workOrder: false }))}
            onSave={() => {
              setModals(prev => ({ ...prev, workOrder: false }))
              loadWorkOrders()
              loadStats()
            }}
          />

          <FilterModal
            isOpen={modals.filter}
            onClose={() => setModals(prev => ({ ...prev, filter: false }))}
            onApply={handleApplyFilters}
            onClear={handleClearFilters}
            currentFilters={filters}
          />

          <ExportModal
            isOpen={modals.export}
            onClose={() => setModals(prev => ({ ...prev, export: false }))}
            workOrders={workOrders}
          />
        </div>
      </MainLayout>
    </RouteGuard>
  )
}
