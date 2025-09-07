'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Eye, FileText, User, DollarSign, X, MapPin } from 'lucide-react'
import { cn } from '@/lib/utils'
import { WorkOrderService, type WorkOrder } from '@/lib/services/work-order-service'
import { useToast } from '@/components/ui/toast'
import { WorkOrderModal } from '@/components/work-orders/work-order-modal'
import { StatusBadge, ConfirmationModal } from '@/components/common'

interface WorkOrdersTableProps {
  workOrders?: WorkOrder[]
  onRefresh?: () => void
}

export function WorkOrdersTable({ workOrders: propWorkOrders = [], onRefresh }: WorkOrdersTableProps = {}) {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>(propWorkOrders)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ 
    isOpen: boolean; 
    workOrder: WorkOrder | null; 
    loading: boolean;
  }>({ isOpen: false, workOrder: null, loading: false })
  const [editModal, setEditModal] = useState<{ 
    isOpen: boolean; 
    workOrder: WorkOrder | null 
  }>({ isOpen: false, workOrder: null })
  const { showToast } = useToast()

  useEffect(() => {
    setWorkOrders(propWorkOrders)
  }, [propWorkOrders])

  const statusConfig = {
    lead: { label: 'Lead', color: 'bg-blue-100 text-blue-800' },
    quoted: { label: 'Cotizada', color: 'bg-yellow-100 text-yellow-800' },
    approved: { label: 'Aprobada', color: 'bg-purple-100 text-purple-800' },
    scheduled: { label: 'Programada', color: 'bg-orange-100 text-orange-800' },
    in_progress: { label: 'En Progreso', color: 'bg-indigo-100 text-indigo-800' },
    completed: { label: 'Completada', color: 'bg-green-100 text-green-800' },
    cancelled: { label: 'Cancelada', color: 'bg-red-100 text-red-800' }
  }

  const handleEdit = (workOrder: WorkOrder) => {
    setEditModal({ isOpen: true, workOrder })
  }

  const handleDelete = (workOrder: WorkOrder) => {
    setDeleteModal({ isOpen: true, workOrder, loading: false })
  }

  const confirmDelete = async () => {
    if (!deleteModal.workOrder?.id) return

    setDeleteModal(prev => ({ ...prev, loading: true }))

    try {
      await WorkOrderService.deleteWorkOrder(deleteModal.workOrder.id)
      
      showToast({
        type: 'success',
        title: 'Orden eliminada',
        message: `${deleteModal.workOrder.title} ha sido eliminada correctamente`
      })
      
      setDeleteModal({ isOpen: false, workOrder: null, loading: false })
      onRefresh?.()
    } catch (error: any) {
      console.error('Error deleting work order:', error)
      showToast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Error al eliminar la orden'
      })
    } finally {
      setDeleteModal(prev => ({ ...prev, loading: false }))
    }
  }

  const handleEditSave = () => {
    setEditModal({ isOpen: false, workOrder: null })
    onRefresh?.()
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (workOrders.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No hay órdenes de trabajo disponibles</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Orden
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cliente
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Valor Estimado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ubicación
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Creado Por
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fecha
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {workOrders.map((order) => (
            <tr key={order.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{order.title}</div>
                    <div className="text-sm text-gray-500">#{order.id}</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <User className="w-4 h-4 text-gray-400 mr-2" />
                  <div className="text-sm text-gray-900">{order.customer?.name || 'N/A'}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <StatusBadge status={order.status} />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">
                  ${order.estimated_value?.toFixed(2) || '0.00'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <MapPin className="w-4 h-4 text-gray-400 mr-2" />
                  <div className="text-sm text-gray-900 max-w-xs truncate">
                    {[order.address_line, order.district, order.province].filter(Boolean).join(', ') || 'N/A'}
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {order.created_by || 'N/A'}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {order.created_at ? new Date(order.created_at).toLocaleDateString('es-PA') : 'N/A'}
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
                    onClick={() => handleEdit(order)}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-green-600 hover:bg-green-50"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDelete(order)}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                    title="Eliminar"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, workOrder: null, loading: false })}
        onConfirm={confirmDelete}
        title="Eliminar Orden de Trabajo"
        message={`¿Estás seguro de que deseas eliminar la orden de trabajo "${deleteModal.workOrder?.title}"?`}
        confirmText="Eliminar"
        variant="danger"
        loading={deleteModal.loading}
        details={[
          { label: 'Cliente', value: deleteModal.workOrder?.customer?.name || 'N/A' },
          { label: 'Ubicación', value: deleteModal.workOrder?.address_line || 'N/A' },
          { label: 'Valor', value: `$${deleteModal.workOrder?.estimated_value?.toFixed(2) || '0.00'}` },
          { label: 'Estado', value: deleteModal.workOrder?.status || 'N/A' }
        ]}
      />

      {/* Edit Modal */}
      <WorkOrderModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, workOrder: null })}
        onSave={handleEditSave}
        workOrder={editModal.workOrder}
      />
    </div>
  )
}
