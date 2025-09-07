'use client'

import React, { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { RouteGuard } from '@/components/layout/route-guard'
import { InspectionsTable } from '@/components/inspections/inspections-table'
import { InspectionModal } from '@/components/inspections/inspection-modal'
import { Button } from '@/components/ui/button'
import { Plus, Calendar, ClipboardCheck, TrendingUp } from 'lucide-react'
import { InspectionService, type Inspection } from '@/lib/services/inspection-service'
import { useToast } from '@/components/ui/toast'

export default function InspectionsPage() {
  const [inspections, setInspections] = useState<Inspection[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    scheduled: 0,
    thisMonth: 0,
    averageQuote: 0
  })
  const [inspectionModal, setInspectionModal] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    loadInspections()
    loadStats()
  }, [])

  const loadInspections = async () => {
    try {
      setLoading(true)
      const { inspections } = await InspectionService.getInspections({ limit: 100 })
      setInspections(inspections)
    } catch (error: any) {
      console.error('Error loading inspections:', error)
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Error al cargar las inspecciones'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const stats = await InspectionService.getInspectionStats()
      setStats(stats)
    } catch (error: any) {
      console.error('Error loading stats:', error)
    }
  }
  return (
    <RouteGuard requiredModule="inspections">
      <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary-900">
                Inspecciones
              </h1>
              <p className="text-gray-600 mt-2">
                Programa y gestiona las inspecciones
              </p>
            </div>
            <Button size="sm" onClick={() => setInspectionModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nueva Inspección
            </Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-blue-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {loading ? (
                      <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                    ) : (
                      stats.scheduled
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Programadas</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <ClipboardCheck className="h-8 w-8 text-green-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {loading ? (
                      <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                    ) : (
                      stats.completed
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Completadas</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-orange-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {loading ? (
                      <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                    ) : (
                      stats.scheduled - stats.completed
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Pendientes</div>
                </div>
              </div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="flex items-center">
                <Calendar className="h-8 w-8 text-purple-500 mr-3" />
                <div>
                  <div className="text-2xl font-bold text-gray-900">
                    {loading ? (
                      <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                    ) : (
                      stats.thisMonth
                    )}
                  </div>
                  <div className="text-sm text-gray-600">Este Mes</div>
                </div>
              </div>
            </div>
          </div>

          {/* Summary */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Resumen de Inspecciones</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-blue-600">Total Inspecciones</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0}%
                </div>
                <div className="text-sm text-green-600">Tasa de Finalización</div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-gray-200">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="ml-2 text-gray-600">Cargando inspecciones...</span>
              </div>
            ) : (
              <InspectionsTable inspections={inspections} onRefresh={loadInspections} />
            )}
          </div>

          {/* Modal */}
          <InspectionModal
            isOpen={inspectionModal}
            onClose={() => setInspectionModal(false)}
            onSave={() => {
              setInspectionModal(false)
              loadInspections()
              loadStats()
            }}
          />
        </div>
      </MainLayout>
    </RouteGuard>
  )
}
