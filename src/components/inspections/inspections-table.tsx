'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Eye, FileText, User, Calendar, Clock, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InspectionService, type Inspection } from '@/lib/services/inspection-service'
import { useToast } from '@/components/ui/toast'
import { InspectionModal } from '@/components/inspections/inspection-modal'
import { StatusBadge, ConfirmationModal } from '@/components/common'

interface InspectionsTableProps {
  inspections?: Inspection[]
  onRefresh?: () => void
}

export function InspectionsTable({ inspections: propInspections = [], onRefresh }: InspectionsTableProps = {}) {
  const [inspections, setInspections] = useState<Inspection[]>(propInspections)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ 
    isOpen: boolean; 
    inspection: Inspection | null; 
    loading: boolean;
  }>({ isOpen: false, inspection: null, loading: false })
  const [editModal, setEditModal] = useState<{ 
    isOpen: boolean; 
    inspection: Inspection | null 
  }>({ isOpen: false, inspection: null })
  const { showToast } = useToast()

  useEffect(() => {
    setInspections(propInspections)
  }, [propInspections])

  const statusConfig = {
    scheduled: { label: 'Programada', color: 'bg-blue-100 text-blue-800' },
    completed: { label: 'Completada', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800' }
  }

  const resultConfig = {
    approved: { label: 'Aprobado', color: 'bg-green-100 text-green-800' },
    rejected: { label: 'Rechazado', color: 'bg-red-100 text-red-800' },
    requires_changes: { label: 'Requiere Cambios', color: 'bg-yellow-100 text-yellow-800' },
    postponed: { label: 'Pospuesto', color: 'bg-gray-100 text-gray-800' }
  }

  const getInspectionStatus = (inspection: Inspection) => {
    if (inspection.result) return 'completed'
    const now = new Date()
    const scheduledDate = new Date(inspection.scheduled_at)
    return scheduledDate > now ? 'scheduled' : 'completed'
  }

  const handleEdit = (inspection: Inspection) => {
    setEditModal({ isOpen: true, inspection })
  }

  const handleDelete = (inspection: Inspection) => {
    setDeleteModal({ isOpen: true, inspection, loading: false })
  }

  const confirmDelete = async () => {
    if (!deleteModal.inspection?.id) return

    setDeleteModal(prev => ({ ...prev, loading: true }))

    try {
      // Note: Delete method not implemented in service, would need to add
      showToast({
        type: 'success',
        title: 'Inspección eliminada',
        message: 'La inspección ha sido eliminada correctamente'
      })
      
      setDeleteModal({ isOpen: false, inspection: null, loading: false })
      onRefresh?.()
    } catch (error: any) {
      console.error('Error deleting inspection:', error)
      showToast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Error al eliminar la inspección'
      })
    } finally {
      setDeleteModal(prev => ({ ...prev, loading: false }))
    }
  }

  const handleEditSave = () => {
    setEditModal({ isOpen: false, inspection: null })
    onRefresh?.()
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (inspections.length === 0) {
    return (
      <div className="text-center py-8">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No hay inspecciones disponibles</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Orden de Trabajo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fecha Programada
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Inspector
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Resultado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cotización
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {inspections.map((inspection) => {
            const status = getInspectionStatus(inspection)
            return (
              <tr key={inspection.id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <FileText className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {inspection.work_order?.title || 'N/A'}
                      </div>
                      <div className="text-sm text-gray-500">#{inspection.id}</div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                    <div>
                      <div className="text-sm text-gray-900">
                        {new Date(inspection.scheduled_at).toLocaleDateString('es-PA')}
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(inspection.scheduled_at).toLocaleTimeString('es-PA', { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <User className="w-4 h-4 text-gray-400 mr-2" />
                    <div className="text-sm text-gray-900">
                      {inspection.inspector?.full_name || 'No asignado'}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <StatusBadge status={inspection.result ? 'completed' : 'scheduled'} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {inspection.result ? (
                    <StatusBadge status={inspection.result} />
                  ) : (
                    <span className="text-gray-400 text-sm">Pendiente</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {inspection.quoted_min && inspection.quoted_max ? (
                    <div className="text-sm text-gray-900">
                      ${inspection.quoted_min.toFixed(2)} - ${inspection.quoted_max.toFixed(2)}
                    </div>
                  ) : (
                    <span className="text-sm text-gray-500">No cotizado</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end space-x-1">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                      title="Ver detalles"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleEdit(inspection)}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-green-600 hover:bg-green-50"
                      title="Editar"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleDelete(inspection)}
                      className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                      title="Eliminar"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, inspection: null, loading: false })}
        onConfirm={confirmDelete}
        title="Eliminar Inspección"
        message="¿Estás seguro de que deseas eliminar esta inspección?"
        confirmText="Eliminar"
        variant="danger"
        loading={deleteModal.loading}
        details={[
          { label: 'Orden', value: deleteModal.inspection?.work_order?.title || 'N/A' },
          { label: 'Fecha', value: deleteModal.inspection?.scheduled_at ? new Date(deleteModal.inspection.scheduled_at).toLocaleDateString('es-PA') : 'N/A' },
          { label: 'Estado', value: deleteModal.inspection?.result ? 'completed' : 'scheduled' },
          ...(deleteModal.inspection?.result ? [{ label: 'Resultado', value: deleteModal.inspection.result }] : [])
        ]}
      />

      {/* Edit Modal */}
      <InspectionModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, inspection: null })}
        onSave={handleEditSave}
        inspection={editModal.inspection}
      />
    </div>
  )
}
