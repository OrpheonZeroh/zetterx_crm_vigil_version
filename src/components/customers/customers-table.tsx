'use client'

import React, { useEffect, useState } from 'react'
import { Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { CustomerService, type Customer } from '@/lib/services/customer-service'
import { useToast } from '@/components/ui/toast'
import { AdvancedConfirmationModal } from '@/components/ui/advanced-confirmation-modal'
import { CustomerModal } from '@/components/customers/customer-modal'
import { cn } from '@/lib/utils'

interface CustomersTableProps {
  customers?: Customer[]
  onRefresh?: () => void
}

export function CustomersTable({ customers: propCustomers = [], onRefresh }: CustomersTableProps = {}) {
  const [customers, setCustomers] = useState<Customer[]>(propCustomers)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ 
    isOpen: boolean; 
    customer: Customer | null; 
    loading: boolean;
    relations: { workOrders: number; invoices: number } | null;
  }>({
    isOpen: false,
    customer: null,
    loading: false,
    relations: null
  })
  const [editModal, setEditModal] = useState<{ isOpen: boolean; customer: Customer | null }>({
    isOpen: false,
    customer: null
  })
  const { showToast } = useToast()

  // Update customers when props change
  useEffect(() => {
    setCustomers(propCustomers)
  }, [propCustomers])

  const handleDeleteClick = async (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    if (!customer) return

    // Check relations
    try {
      const relations = await CustomerService.getCustomerRelations(customerId)
      setDeleteModal({
        isOpen: true,
        customer: customer,
        loading: false,
        relations
      })
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo verificar las relaciones del cliente'
      })
    }
  }

  const handleEditClick = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId)
    setEditModal({
      isOpen: true,
      customer: customer || null
    })
  }

  const handleDeleteConfirm = async (cascade: boolean = false) => {
    if (!deleteModal.customer) return

    setDeleteModal(prev => ({ ...prev, loading: true }))

    try {
      await CustomerService.deleteCustomer(deleteModal.customer.id!, cascade)
      setCustomers(prev => prev.filter(c => c.id !== deleteModal.customer!.id))
      showToast({
        type: 'success',
        title: 'Cliente eliminado',
        message: `${deleteModal.customer.name} ha sido eliminado correctamente${
          cascade ? ' junto con sus órdenes de trabajo e facturas' : ''
        }`
      })
      setDeleteModal({ isOpen: false, customer: null, loading: false, relations: null })
    } catch (err: any) {
      console.error('Error deleting customer:', err)
      let message = 'No se pudo eliminar el cliente. Inténtalo de nuevo.'
      
      if (err.message?.startsWith('RELATIONS_EXIST:')) {
        const [, workOrders, invoices] = err.message.split(':')
        message = `El cliente tiene ${workOrders} órdenes de trabajo y ${invoices} facturas asociadas.`
      }
      
      showToast({
        type: 'error',
        title: 'Error al eliminar',
        message
      })
      setDeleteModal(prev => ({ ...prev, loading: false }))
    }
  }

  const handleDeleteCancel = () => {
    setDeleteModal({ isOpen: false, customer: null, loading: false, relations: null })
  }

  const handleEditSave = () => {
    // Refresh customers list after edit
    refreshData()
    setEditModal({ isOpen: false, customer: null })
  }

  const refreshData = () => {
    if (onRefresh) {
      onRefresh()
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A'
    return new Date(dateString).toLocaleDateString('es-PA')
  }

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <div className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando clientes...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="overflow-x-auto">
        <div className="p-8 text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={refreshData}>Reintentar</Button>
        </div>
      </div>
    )
  }

  if (customers.length === 0) {
    return (
      <div className="overflow-x-auto">
        <div className="p-8 text-center">
          <div className="text-gray-400 mb-4">
            <Eye className="w-16 h-16 mx-auto mb-4" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay clientes</h3>
          <p className="text-gray-600 mb-6">Comienza agregando tu primer cliente</p>
          <Button onClick={refreshData}>
            Actualizar
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cliente
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Contacto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Ubicación
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fecha de Registro
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {customers.map((customer) => (
            <tr key={customer.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                  <div className="text-sm text-gray-500">{customer.tax_id_type || 'ID'}: {customer.id?.substring(0, 8)}...</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm text-gray-900">{customer.email || 'Sin email'}</div>
                  <div className="text-sm text-gray-500">{customer.phone || 'Sin teléfono'}</div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {customer.district && customer.province 
                    ? `${customer.district}, ${customer.province}` 
                    : customer.province || 'Sin ubicación'}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(customer.created_at)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    title="Ver cliente"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => customer.id && handleEditClick(customer.id)}
                    title="Editar cliente"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => customer.id && handleDeleteClick(customer.id)}
                    title="Eliminar cliente"
                    className="text-red-600 hover:text-red-800"
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
      {deleteModal.relations && (
        <AdvancedConfirmationModal
          isOpen={deleteModal.isOpen}
          onClose={handleDeleteCancel}
          onConfirm={handleDeleteConfirm}
          customerName={deleteModal.customer?.name || 'Cliente'}
          relations={deleteModal.relations}
          loading={deleteModal.loading}
        />
      )}

      {/* Edit Customer Modal */}
      <CustomerModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, customer: null })}
        onSave={handleEditSave}
        customer={editModal.customer}
      />
    </div>
  )
}
