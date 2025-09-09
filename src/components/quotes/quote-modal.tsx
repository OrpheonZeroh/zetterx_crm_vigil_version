'use client'

import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { QuoteService, type Quote } from '@/lib/services/quote-service'
import { ProductService, type Product } from '@/lib/services/product-service'
import { CustomerService, type Customer } from '@/lib/services/customer-service'
import { useToast } from '@/components/ui/toast'
import { X, Plus, Trash2, FileText } from 'lucide-react'

interface QuoteModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (quote: Quote) => void
  quote?: Quote | null
  mode: 'create' | 'edit'
}

interface QuoteFormData {
  customer_id: string
  version: number
  status: Quote['status']
  subtotal: number
  itbms_total: number
  discount_total: number
  total: number
  notes: string
  items: QuoteItemForm[]
}

interface QuoteItemForm {
  line_seq: number
  product_id?: string
  product_code: string
  description: string
  quantity: number
  unit_price: number
  itbms_rate: number
  discount: number
  line_total: number
}

export default function QuoteModal({ isOpen, onClose, onSave, quote, mode }: QuoteModalProps) {
  const { showToast } = useToast()
  const [loading, setLoading] = useState(false)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [formData, setFormData] = useState<QuoteFormData>({
    customer_id: '',
    version: 1,
    status: 'draft',
    subtotal: 0,
    itbms_total: 0,
    discount_total: 0,
    total: 0,
    notes: '',
    items: []
  })

  useEffect(() => {
    if (isOpen) {
      loadCustomers()
      loadProducts()
      if (mode === 'edit' && quote) {
        setFormData({
          customer_id: quote.customer_id || quote.work_orders?.customer_id || '',
          version: quote.version,
          status: quote.status,
          subtotal: quote.subtotal,
          itbms_total: quote.itbms_total,
          discount_total: quote.discount_total,
          total: quote.total,
          notes: quote.notes || '',
          items: quote.items?.map((item, index) => ({
            line_seq: item.line_seq || index + 1,
            product_id: '',
            product_code: item.product_code || '',
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            itbms_rate: item.itbms_rate,
            discount: item.discount,
            line_total: item.line_total
          })) || []
        })
      } else {
        // Reset form for create mode
        setFormData({
          customer_id: '',
          version: 1,
          status: 'draft',
          subtotal: 0,
          itbms_total: 0,
          discount_total: 0,
          total: 0,
          notes: '',
          items: []
        })
      }
    }
  }, [isOpen, mode, quote])

  const loadCustomers = async () => {
    try {
      const { customers: data } = await CustomerService.getCustomers({ limit: 100 })
      setCustomers(data)
    } catch (error) {
      console.error('Error loading customers:', error)
      showToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los clientes'
      })
    }
  }

  const loadProducts = async () => {
    try {
      const { products: data } = await ProductService.getProducts({ limit: 200, filters: { isActive: true } })
      setProducts(data)
    } catch (error) {
      console.error('Error loading products:', error)
      showToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los productos'
      })
    }
  }

  const addItem = () => {
    const newItem: QuoteItemForm = {
      line_seq: formData.items.length + 1,
      product_id: '',
      product_code: '',
      description: '',
      quantity: 1,
      unit_price: 0,
      itbms_rate: 7,
      discount: 0,
      line_total: 0
    }
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, newItem]
    }))
  }

  const removeItem = (index: number) => {
    setFormData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }))
    calculateTotals()
  }

  const updateItem = (index: number, field: keyof QuoteItemForm, value: any) => {
    setFormData(prev => {
      const newItems = [...prev.items]
      newItems[index] = {
        ...newItems[index],
        [field]: value
      }
      
      // If product is selected, auto-fill details
      if (field === 'product_id' && value) {
        const product = products.find(p => p.id === value)
        if (product) {
          newItems[index] = {
            ...newItems[index],
            product_code: product.code || '',
            description: product.description,
            unit_price: product.unit_price,
            itbms_rate: product.itbms_rate
          }
        }
      }
      
      // Recalculate line total
      const item = newItems[index]
      const subtotal = item.quantity * item.unit_price
      const discountAmount = (subtotal * item.discount) / 100
      const afterDiscount = subtotal - discountAmount
      const itbmsAmount = (afterDiscount * item.itbms_rate) / 100
      item.line_total = afterDiscount + itbmsAmount
      
      return {
        ...prev,
        items: newItems
      }
    })
    calculateTotals()
  }

  const calculateTotals = () => {
    setTimeout(() => {
      setFormData(prev => {
        const subtotal = prev.items.reduce((sum, item) => {
          const lineSubtotal = item.quantity * item.unit_price
          const discountAmount = (lineSubtotal * item.discount) / 100
          return sum + (lineSubtotal - discountAmount)
        }, 0)
        
        const itbmsTotal = prev.items.reduce((sum, item) => {
          const lineSubtotal = item.quantity * item.unit_price
          const discountAmount = (lineSubtotal * item.discount) / 100
          const afterDiscount = lineSubtotal - discountAmount
          return sum + (afterDiscount * item.itbms_rate) / 100
        }, 0)
        
        const discountTotal = prev.items.reduce((sum, item) => {
          const lineSubtotal = item.quantity * item.unit_price
          return sum + (lineSubtotal * item.discount) / 100
        }, 0)
        
        const total = subtotal + itbmsTotal
        
        return {
          ...prev,
          subtotal,
          itbms_total: itbmsTotal,
          discount_total: discountTotal,
          total
        }
      })
    }, 100)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.customer_id) {
      showToast({
        type: 'error',
        title: 'Error de validación',
        message: 'Debe seleccionar un cliente'
      })
      return
    }

    setLoading(true)
    try {
      let savedQuote: Quote

      if (mode === 'create') {
        // Create quote directly with customer (no work order needed initially)
        savedQuote = await QuoteService.createQuote({
          customer_id: formData.customer_id,
          version: 1,
          status: formData.status,
          subtotal: formData.subtotal,
          itbms_total: formData.itbms_total,
          discount_total: formData.discount_total,
          total: formData.total,
          notes: formData.notes
        })

        // Add items
        for (const item of formData.items) {
          await QuoteService.addQuoteItem({
            quote_id: savedQuote.id!,
            line_seq: item.line_seq,
            product_code: item.product_code,
            description: item.description,
            quantity: item.quantity,
            unit_price: item.unit_price,
            itbms_rate: item.itbms_rate,
            discount: item.discount,
            line_total: item.line_total
          })
        }
      } else {
        // Edit mode
        savedQuote = await QuoteService.updateQuote(quote!.id!, {
          status: formData.status,
          subtotal: formData.subtotal,
          itbms_total: formData.itbms_total,
          discount_total: formData.discount_total,
          total: formData.total,
          notes: formData.notes
        })
      }

      showToast({
        type: 'success',
        title: 'Éxito',
        message: `Cotización ${mode === 'create' ? 'creada' : 'actualizada'} correctamente`
      })

      onSave(savedQuote)
      onClose()
    } catch (error) {
      console.error('Error saving quote:', error)
      showToast({
        type: 'error',
        title: 'Error',
        message: `No se pudo ${mode === 'create' ? 'crear' : 'actualizar'} la cotización`
      })
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300 border border-slate-200/60">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {mode === 'create' ? 'Nueva Cotización' : 'Editar Cotización'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={loading}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customer">Cliente *</Label>
              <Select
                value={formData.customer_id}
                onValueChange={(value) => setFormData(prev => ({ ...prev, customer_id: value }))}
                disabled={mode === 'edit'}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Seleccionar cliente" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer) => (
                    <SelectItem key={customer.id} value={customer.id!}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="status">Estado</Label>
              <Select
                value={formData.status}
                onValueChange={(value: Quote['status']) => setFormData(prev => ({ ...prev, status: value }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Borrador</SelectItem>
                  <SelectItem value="sent">Enviada</SelectItem>
                  <SelectItem value="approved">Aprobada</SelectItem>
                  <SelectItem value="rejected">Rechazada</SelectItem>
                  <SelectItem value="expired">Expirada</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Notas adicionales..."
              rows={3}
            />
          </div>

          {/* Items Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">Items de Cotización</h3>
              <Button type="button" onClick={addItem} variant="outline" size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Agregar Item
              </Button>
            </div>

            {formData.items.map((item, index) => (
              <div key={index} className="border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Item #{index + 1}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeItem(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Producto/Servicio</Label>
                    <Select
                      value={item.product_id || 'manual'}
                      onValueChange={(value) => updateItem(index, 'product_id', value === 'manual' ? '' : value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccionar producto..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">Manual (escribir descripción)</SelectItem>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id!}>
                            {product.code ? `${product.code} - ` : ''}{product.description}
                            {product.is_service && ' (Servicio)'}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Descripción *</Label>
                    <Input
                      value={item.description}
                      onChange={(e) => updateItem(index, 'description', e.target.value)}
                      placeholder="Descripción del producto/servicio..."
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Cantidad</Label>
                    <Input
                      type="number"
                      min="0.01"
                      step="0.01"
                      value={item.quantity || 0}
                      onChange={(e) => updateItem(index, 'quantity', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Precio Unitario</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.01"
                      value={item.unit_price || 0}
                      onChange={(e) => updateItem(index, 'unit_price', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>ITBMS %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={item.itbms_rate || 0}
                      onChange={(e) => updateItem(index, 'itbms_rate', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Descuento %</Label>
                    <Input
                      type="number"
                      min="0"
                      max="100"
                      step="0.01"
                      value={item.discount || 0}
                      onChange={(e) => updateItem(index, 'discount', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-sm text-gray-600">
                    Total línea: <span className="font-medium">${item.line_total.toFixed(2)}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* Totals Section */}
          <div className="border-t pt-4">
            <div className="grid grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Subtotal:</span>
                <div className="font-medium">${formData.subtotal.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-gray-600">Descuento:</span>
                <div className="font-medium text-red-600">-${formData.discount_total.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-gray-600">ITBMS:</span>
                <div className="font-medium">${formData.itbms_total.toFixed(2)}</div>
              </div>
              <div>
                <span className="text-gray-600">Total:</span>
                <div className="font-bold text-lg">${formData.total.toFixed(2)}</div>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="bg-blue-600 hover:bg-blue-700">
              {loading ? 'Guardando...' : (mode === 'create' ? 'Crear Cotización' : 'Actualizar')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
