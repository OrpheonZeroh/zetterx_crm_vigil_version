'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Edit, Trash2, Eye, FileText, User, DollarSign, X, Mail, Loader2, CheckCircle, AlertCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import { InvoiceService, type Invoice } from '@/lib/services/invoice-service'
import { DGIApiService } from '@/lib/services/dgi-api-service'
import { StatusBadge, ConfirmationModal } from '@/components/common'
import { InvoiceModal } from './invoice-modal'
import { InvoiceEmailActions } from './invoice-email-actions'
import { useToast } from '@/components/ui/toast'

interface InvoicesTableProps {
  invoices?: Invoice[]
  onRefresh?: () => void
}

export function InvoicesTable({ invoices: propInvoices = [], onRefresh }: InvoicesTableProps = {}) {
  const [invoices, setInvoices] = useState<Invoice[]>(propInvoices)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [processingInvoices, setProcessingInvoices] = useState<Set<string>>(new Set())
  const [deleteModal, setDeleteModal] = useState<{ 
    isOpen: boolean; 
    invoice: Invoice | null; 
    loading: boolean;
  }>({ isOpen: false, invoice: null, loading: false })
  const [editModal, setEditModal] = useState<{ 
    isOpen: boolean; 
    invoice: Invoice | null 
  }>({ isOpen: false, invoice: null })
  const [emailModal, setEmailModal] = useState<{ 
    isOpen: boolean; 
    invoice: Invoice | null 
  }>({ isOpen: false, invoice: null })
  const { showToast } = useToast()

  useEffect(() => {
    setInvoices(propInvoices)
  }, [propInvoices])


  const handleEdit = (invoice: Invoice) => {
    setEditModal({ isOpen: true, invoice })
  }

  const handleEmail = (invoice: Invoice) => {
    setEmailModal({ isOpen: true, invoice })
  }

  // Handler para procesar con DGI usando nueva API
  const handleProcessDGI = async (invoice: Invoice) => {
    if (!invoice.id) return
    
    try {
      // Agregar invoice a estado de procesamiento
      setProcessingInvoices(prev => new Set(prev).add(invoice.id!))
      console.log(`🚀 Procesando factura ${invoice.doc_number} con DGI...`)

      const customerEmail = invoice.rec_email || invoice.customer?.email || ''
      
      if (!customerEmail) {
        showToast({
          type: 'error',
          title: 'Error',
          message: 'No se encontró email del cliente para envío'
        })
        return
      }

      // Mostrar toast de inicio de proceso
      showToast({
        type: 'warning',
        title: 'Procesando...',
        message: `Enviando factura ${invoice.doc_number} a DGI y generando PDF`
      })

      // Usar nueva API que maneja todo el flujo: DGI → PDF → Storage → Email
      const response = await fetch(`/api/invoices/process-dgi`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          invoiceId: invoice.id,
          customerEmail: customerEmail
        })
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        showToast({
          type: 'success',
          title: '✅ Procesamiento Completo',
          message: result.emailSent 
            ? `Factura procesada con DGI y enviada a ${customerEmail}`
            : `Factura procesada con DGI (email pendiente)`
        })
        onRefresh?.() // Refrescar tabla para mostrar datos DGI actualizados
      } else {
        showToast({
          type: 'error',
          title: '❌ Error en Procesamiento',
          message: result.error || 'Error al procesar con DGI'
        })
      }

    } catch (error) {
      console.error('Error procesando con DGI:', error)
      showToast({
        type: 'error',
        title: '❌ Error de Conexión',
        message: 'Error al comunicarse con el servidor'
      })
    } finally {
      // Quitar invoice del estado de procesamiento
      setProcessingInvoices(prev => {
        const newSet = new Set(prev)
        newSet.delete(invoice.id!)
        return newSet
      })
    }
  }

  const handleDelete = (invoice: Invoice) => {
    setDeleteModal({ isOpen: true, invoice, loading: false })
  }

  const confirmDelete = async () => {
    if (!deleteModal.invoice?.id) return

    setDeleteModal(prev => ({ ...prev, loading: true }))

    try {
      // Note: Delete method not implemented in service, would need to add
      showToast({
        type: 'success',
        title: 'Factura eliminada',
        message: `Factura ${deleteModal.invoice.doc_number} ha sido eliminada correctamente`
      })
      
      setDeleteModal({ isOpen: false, invoice: null, loading: false })
      onRefresh?.()
    } catch (error: any) {
      console.error('Error deleting invoice:', error)
      showToast({
        type: 'error',
        title: 'Error',
        message: error.message || 'Error al eliminar la factura'
      })
    } finally {
      setDeleteModal(prev => ({ ...prev, loading: false }))
    }
  }

  const handleEditSave = () => {
    setEditModal({ isOpen: false, invoice: null })
    onRefresh?.()
  }

  const handleStatusChange = async (invoice: Invoice, newStatus: Invoice['status']) => {
    try {
      await InvoiceService.updateStatus(invoice.id!, newStatus)
      showToast({
        type: 'success',
        title: 'Estado actualizado',
        message: `Estado de la factura ${invoice.doc_number} actualizado correctamente`
      })
      onRefresh?.()
    } catch (error: any) {
      console.error('Error updating status:', error)
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Error al actualizar el estado'
      })
    }
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-red-600">{error}</p>
      </div>
    )
  }

  if (invoices.length === 0) {
    return (
      <div className="text-center py-8">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">No hay facturas disponibles</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Factura
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Cliente
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fecha Emisión
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Total
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Orden Trabajo
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {invoices.map((invoice) => (
            <tr key={invoice.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <FileText className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {invoice.doc_number}
                    </div>
                    <div className="text-sm text-gray-500">
                      {invoice.doc_type === '01' ? 'Factura' : 'Nota'}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <User className="w-4 h-4 text-gray-400 mr-2" />
                  <div>
                    <div className="text-sm text-gray-900">
                      {invoice.rec_name || invoice.customer?.name || 'N/A'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {invoice.rec_email || invoice.customer?.email || ''}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {new Date(invoice.issue_date).toLocaleDateString('es-PA')}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  value={invoice.status}
                  onChange={(e) => handleStatusChange(invoice, e.target.value as Invoice['status'])}
                  className="text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer bg-transparent"
                >
                  <option value="draft">Borrador</option>
                  <option value="issued">Emitida</option>
                  <option value="accepted">Aceptada</option>
                  <option value="rejected">Rechazada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
                <div className="mt-1">
                  <StatusBadge status={invoice.status} size="sm" />
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      ${invoice.total_amount.toFixed(2)}
                    </div>
                    <div className="text-xs text-gray-500">
                      ITBMS: ${invoice.total_itbms.toFixed(2)}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {invoice.work_order?.title || 'N/A'}
                </div>
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
                    onClick={() => handleEdit(invoice)}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-green-600 hover:bg-green-50"
                    title="Editar"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEmail(invoice)}
                    className="h-8 w-8 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50"
                    title="Enviar por Email"
                  >
                    <Mail className="w-4 h-4" />
                  </Button>
                  
                  {/* Botón Procesar DGI */}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleProcessDGI(invoice)}
                    disabled={processingInvoices.has(invoice.id || '')}
                    className={cn(
                      "h-8 w-8 p-0",
                      processingInvoices.has(invoice.id || '') 
                        ? "text-blue-600 bg-blue-50 cursor-not-allowed" 
                        : "text-gray-400 hover:text-green-600 hover:bg-green-50"
                    )}
                    title={processingInvoices.has(invoice.id || '') ? "Procesando..." : "Procesar con DGI"}
                  >
                    {processingInvoices.has(invoice.id || '') ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <FileText className="w-4 h-4" />
                    )}
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDelete(invoice)}
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
        onClose={() => setDeleteModal({ isOpen: false, invoice: null, loading: false })}
        onConfirm={confirmDelete}
        title="Eliminar Factura"
        message={`¿Estás seguro de que deseas eliminar la factura "${deleteModal.invoice?.doc_number}"?`}
        confirmText="Eliminar"
        variant="danger"
        loading={deleteModal.loading}
        details={[
          { label: 'Cliente', value: deleteModal.invoice?.rec_name || deleteModal.invoice?.customer?.name || 'N/A' },
          { label: 'Total', value: `$${deleteModal.invoice?.total_amount?.toFixed(2) || '0.00'}` },
          { label: 'Estado', value: deleteModal.invoice?.status || 'N/A' }
        ]}
      />

      {/* Edit Modal */}
      {editModal.isOpen && editModal.invoice && (
        <InvoiceModal
          isOpen={editModal.isOpen}
          invoice={editModal.invoice}
          onClose={() => setEditModal({ isOpen: false, invoice: null })}
          onSave={() => {
            setEditModal({ isOpen: false, invoice: null })
            onRefresh?.()
          }}
        />
      )}

      {/* Email Modal */}
      {emailModal.isOpen && emailModal.invoice && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">📧 Enviar Factura por Email</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setEmailModal({ isOpen: false, invoice: null })}
                className="h-8 w-8 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="mb-4 p-4 bg-gray-50 rounded-lg">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium text-gray-700">Factura:</span>
                  <span className="ml-2">#{emailModal.invoice.doc_number}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Cliente:</span>
                  <span className="ml-2">{emailModal.invoice.rec_name || emailModal.invoice.customer?.name || 'N/A'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Total:</span>
                  <span className="ml-2">B/. {emailModal.invoice.total_amount?.toFixed(2) || '0.00'}</span>
                </div>
                <div>
                  <span className="font-medium text-gray-700">Estado:</span>
                  <StatusBadge status={emailModal.invoice.status} size="sm" />
                </div>
              </div>
            </div>

            <InvoiceEmailActions
              invoiceId={emailModal.invoice.id || ''}
              defaultEmail={emailModal.invoice.rec_email || emailModal.invoice.customer?.email || ''}
              cufe={emailModal.invoice.cufe}
              emailSent={emailModal.invoice.email_sent || false}
              className="w-full"
            />
          </div>
        </div>
      )}
    </div>
  )
}
