'use client'

import React, { useState, useEffect } from 'react'
import { X, FileText, DollarSign } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { InvoiceService, type Invoice } from '@/lib/services/invoice-service'
import { WorkOrderService, type WorkOrder } from '@/lib/services/work-order-service'
import { CustomerService, type Customer } from '@/lib/services/customer-service'
import { useToast } from '@/components/ui/toast'

interface InvoiceModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  invoice?: Invoice | null
}

export function InvoiceModal({ isOpen, onClose, invoice, onSave }: InvoiceModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const { showToast } = useToast()
  
  const [formData, setFormData] = useState({
    work_order_id: invoice?.work_order_id || '',
    customer_id: invoice?.customer_id || '',
    env_code: invoice?.env_code || 1,
    emission_type: invoice?.emission_type || '01',
    doc_type: invoice?.doc_type || '01',
    doc_number: invoice?.doc_number || '',
    pos_code: invoice?.pos_code || '001',
    issue_date: invoice?.issue_date ? invoice.issue_date.split('T')[0] : new Date().toISOString().split('T')[0],
    nat_op: invoice?.nat_op || '1',
    tipo_op: invoice?.tipo_op || '1',
    dest: invoice?.dest || '1',
    // Receptor data
    rec_type: invoice?.rec_type || '1',
    rec_name: invoice?.rec_name || '',
    rec_address: invoice?.rec_address || '',
    rec_country: invoice?.rec_country || 'PA',
    rec_phone: invoice?.rec_phone || '',
    rec_email: invoice?.rec_email || '',
    // Totals
    total_net: invoice?.total_net || 0,
    total_itbms: invoice?.total_itbms || 0,
    total_amount: invoice?.total_amount || 0,
    items_total: invoice?.items_total || 0,
    status: invoice?.status || 'draft'
  })

  useEffect(() => {
    if (isOpen) {
      loadWorkOrders()
      loadCustomers()
      if (!invoice) {
        generateDocNumber()
      }
    }
  }, [isOpen])

  useEffect(() => {
    if (invoice) {
      setFormData({
        work_order_id: invoice.work_order_id || '',
        customer_id: invoice.customer_id || '',
        env_code: invoice.env_code || 1,
        emission_type: invoice.emission_type || '01',
        doc_type: invoice.doc_type || '01',
        doc_number: invoice.doc_number || '',
        pos_code: invoice.pos_code || '001',
        issue_date: invoice.issue_date ? invoice.issue_date.split('T')[0] : new Date().toISOString().split('T')[0],
        nat_op: invoice.nat_op || '1',
        tipo_op: invoice.tipo_op || '1',
        dest: invoice.dest || '1',
        rec_type: invoice.rec_type || '1',
        rec_name: invoice.rec_name || '',
        rec_address: invoice.rec_address || '',
        rec_country: invoice.rec_country || 'PA',
        rec_phone: invoice.rec_phone || '',
        rec_email: invoice.rec_email || '',
        total_net: invoice.total_net || 0,
        total_itbms: invoice.total_itbms || 0,
        total_amount: invoice.total_amount || 0,
        items_total: invoice.items_total || 0,
        status: invoice.status || 'draft'
      })
    } else {
      setFormData({
        work_order_id: '',
        customer_id: '',
        env_code: 1,
        emission_type: '01',
        doc_type: '01',
        doc_number: '',
        pos_code: '001',
        issue_date: new Date().toISOString().split('T')[0],
        nat_op: '1',
        tipo_op: '1',
        dest: '1',
        rec_type: '1',
        rec_name: '',
        rec_address: '',
        rec_country: 'PA',
        rec_phone: '',
        rec_email: '',
        total_net: 0,
        total_itbms: 0,
        total_amount: 0,
        items_total: 0,
        status: 'draft'
      })
    }
    setError('')
  }, [invoice, isOpen])

  const loadWorkOrders = async () => {
    try {
      const { workOrders } = await WorkOrderService.getWorkOrders({ limit: 1000 })
      setWorkOrders(workOrders)
    } catch (error) {
      console.error('Error loading work orders:', error)
    }
  }

  const loadCustomers = async () => {
    try {
      const { customers } = await CustomerService.getCustomers({ limit: 1000 })
      setCustomers(customers)
    } catch (error) {
      console.error('Error loading customers:', error)
    }
  }

  const generateDocNumber = async () => {
    try {
      const docNumber = await InvoiceService.generateInvoiceNumber('001')
      setFormData(prev => ({ ...prev, doc_number: docNumber }))
    } catch (error) {
      console.error('Error generating doc number:', error)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleCustomerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const customerId = e.target.value
    const customer = customers.find(c => c.id === customerId)
    
    setFormData(prev => ({
      ...prev,
      customer_id: customerId,
      rec_name: customer?.name || '',
      rec_email: customer?.email || '',
      rec_phone: customer?.phone || '',
      rec_address: customer?.address_line || ''
    }))
  }

  const calculateTotals = () => {
    const net = parseFloat(formData.total_net.toString()) || 0
    const itbms = net * 0.07 // 7% ITBMS rate
    const total = net + itbms
    
    setFormData(prev => ({
      ...prev,
      total_itbms: itbms,
      total_amount: total,
      items_total: total,
      total_gravado: net,
      total_discount: 0,
      total_isc: 0,
      total_received: total,
      num_payments: 1,
      num_items: 1
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      if (!formData.rec_name || !formData.doc_number) {
        setError('Por favor completa todos los campos requeridos')
        return
      }

      // Calculate totals before submitting
      calculateTotals()

      const invoiceData = {
        ...formData,
        issue_date: new Date(formData.issue_date).toISOString(),
        total_net: parseFloat(formData.total_net.toString()) || 0,
        total_itbms: parseFloat(formData.total_itbms.toString()) || 0,
        total_amount: parseFloat(formData.total_amount.toString()) || 0,
        items_total: parseFloat(formData.items_total.toString()) || 0,
        total_gravado: parseFloat(formData.total_net.toString()) || 0,
        total_discount: 0,
        total_isc: 0,
        total_received: parseFloat(formData.total_amount.toString()) || 0,
        num_payments: 1,
        num_items: 1
      }

      if (invoice?.id) {
        await InvoiceService.updateInvoice(invoice.id, invoiceData)
        showToast({
          type: 'success',
          title: 'Factura actualizada',
          message: `Factura ${formData.doc_number} ha sido actualizada correctamente`
        })
      } else {
        await InvoiceService.createInvoice(invoiceData)
        showToast({
          type: 'success',
          title: 'Factura creada',
          message: `Factura ${formData.doc_number} ha sido creada correctamente`
        })
      }
      
      onSave()
      onClose()
    } catch (err: any) {
      console.error('Error saving invoice:', err)
      setError(err.message || 'Error al guardar la factura')
      showToast({
        type: 'error',
        title: 'Error',
        message: err.message || 'Error al guardar la factura'
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl animate-in slide-in-from-bottom-4 duration-300 border border-slate-200/60 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <FileText className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-semibold text-gray-900">
              {invoice ? 'Editar Factura' : 'Nueva Factura'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Basic Info */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Información Básica</h4>
              
              {/* Work Order and Customer */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Orden de Trabajo
                  </label>
                  <select
                    name="work_order_id"
                    value={formData.work_order_id}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecciona orden</option>
                    {workOrders.map(order => (
                      <option key={order.id} value={order.id}>
                        {order.title}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cliente
                  </label>
                  <select
                    name="customer_id"
                    value={formData.customer_id}
                    onChange={handleCustomerChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Selecciona cliente</option>
                    {customers.map(customer => (
                      <option key={customer.id} value={customer.id}>
                        {customer.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Document Info */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Número Doc *
                  </label>
                  <input
                    type="text"
                    name="doc_number"
                    value={formData.doc_number}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Código POS
                  </label>
                  <input
                    type="text"
                    name="pos_code"
                    value={formData.pos_code}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Fecha Emisión
                  </label>
                  <input
                    type="date"
                    name="issue_date"
                    value={formData.issue_date}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estado
                </label>
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="draft">Borrador</option>
                  <option value="issued">Emitida</option>
                  <option value="accepted">Aceptada</option>
                  <option value="rejected">Rechazada</option>
                  <option value="cancelled">Cancelada</option>
                </select>
              </div>
            </div>

            {/* Right Column - Receptor Info and Totals */}
            <div className="space-y-4">
              <h4 className="text-lg font-medium text-gray-900 border-b pb-2">Información del Receptor</h4>
              
              {/* Receptor Name and Type */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo Receptor
                  </label>
                  <select
                    name="rec_type"
                    value={formData.rec_type}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="1">Natural</option>
                    <option value="2">Jurídica</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre Receptor *
                  </label>
                  <input
                    type="text"
                    name="rec_name"
                    value={formData.rec_name}
                    onChange={handleChange}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Contact Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    name="rec_phone"
                    value={formData.rec_phone}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="rec_email"
                    value={formData.rec_email}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Address */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dirección
                </label>
                <input
                  type="text"
                  name="rec_address"
                  value={formData.rec_address}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Totals */}
              <div className="border-t pt-4">
                <h4 className="text-lg font-medium text-gray-900 mb-4">Totales</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Neto
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="total_net"
                      value={formData.total_net}
                      onChange={handleChange}
                      onBlur={calculateTotals}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      ITBMS (7%)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="total_itbms"
                      value={formData.total_itbms}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Total Final
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      name="total_amount"
                      value={formData.total_amount}
                      readOnly
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 font-semibold"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 mt-8">
            <div className="text-sm text-gray-500">
              * Campos requeridos
            </div>
            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={loading}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 text-white"
              >
                {loading ? (
                  <>
                    <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                    Guardando...
                  </>
                ) : (
                  invoice ? 'Actualizar' : 'Crear Factura'
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
