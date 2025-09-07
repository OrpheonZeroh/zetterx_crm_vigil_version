'use client'

import React, { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductService, type Product } from '@/lib/services/product-service'
import { useToast } from '@/components/ui/toast'

interface ProductModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: () => void
  product?: any
}

export function ProductModal({ isOpen, onClose, product, onSave }: ProductModalProps) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { showToast } = useToast()
  const [formData, setFormData] = useState({
    code: product?.code || '',
    description: product?.description || '',
    unit_price: product?.unit_price || '',
    itbms_rate: product?.itbms_rate || 7,
    is_service: product?.is_service || false,
    status: product?.status !== undefined ? product.status : true
  })

  useEffect(() => {
    if (product) {
      setFormData({
        code: product.code || '',
        description: product.description || '',
        unit_price: product.unit_price || '',
        itbms_rate: product.itbms_rate || 7,
        is_service: product.is_service || false,
        status: product.status !== undefined ? product.status : true
      })
    } else {
      setFormData({
        code: '',
        description: '',
        unit_price: '',
        itbms_rate: 7,
        is_service: false,
        status: true
      })
    }
    setError('')
  }, [product, isOpen])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const productData = {
        ...formData,
        unit_price: parseFloat(formData.unit_price.toString()),
        itbms_rate: parseFloat(formData.itbms_rate.toString())
      }

      let result
      if (product?.id) {
        result = await ProductService.updateProduct(product.id, productData)
        showToast({
          type: 'success',
          title: 'Producto actualizado',
          message: `${formData.description} ha sido actualizado correctamente`
        })
      } else {
        result = await ProductService.createProduct(productData)
        showToast({
          type: 'success',
          title: 'Producto creado',
          message: `${formData.description} ha sido agregado al catálogo`
        })
      }
      onSave()
      onClose()
    } catch (err: any) {
      const errorMessage = err.message || 'Error al guardar el producto'
      setError(errorMessage)
      showToast({
        type: 'error',
        title: 'Error al guardar',
        message: errorMessage
      })
    } finally {
      setLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked
      setFormData(prev => ({ ...prev, [name]: checked }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-in slide-in-from-bottom-4 duration-300 border border-slate-200/60">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {product ? 'Editar Producto' : 'Nuevo Producto'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-600 text-sm">{error}</p>
            </div>
          )}

          {/* Code */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Código del Producto
            </label>
            <input
              type="text"
              name="code"
              value={formData.code}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Ej: RADIO-001"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción *
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Descripción detallada del producto o servicio"
            />
          </div>

          {/* Price and ITBMS */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Precio Unitario *
              </label>
              <input
                type="number"
                name="unit_price"
                value={formData.unit_price}
                onChange={handleChange}
                required
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="0.00"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                ITBMS (%)
              </label>
              <input
                type="number"
                name="itbms_rate"
                value={formData.itbms_rate}
                onChange={handleChange}
                step="0.01"
                min="0"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="7.00"
              />
            </div>
          </div>

          {/* Type and Status */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo
              </label>
              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="is_service"
                    value="false"
                    checked={!formData.is_service}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_service: false }))}
                    className="mr-2"
                  />
                  Producto
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="is_service"
                    value="true"
                    checked={formData.is_service}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_service: true }))}
                    className="mr-2"
                  />
                  Servicio
                </label>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado
              </label>
              <select
                name="status"
                value={formData.status.toString()}
                onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value === 'true' }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
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
                  product ? 'Actualizar' : 'Crear Producto'
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
