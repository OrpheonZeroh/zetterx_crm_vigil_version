'use client'

import React, { useEffect, useState } from 'react'
import { Eye, Edit, Trash2, Package } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ProductService, type Product } from '@/lib/services/product-service'
import { useToast } from '@/components/ui/toast'
import { AdvancedConfirmationModal } from '@/components/products/advanced-confirmation-modal'
import { ProductModal } from '@/components/products/product-modal'
import { cn } from '@/lib/utils'

interface ProductsTableProps {
  products?: Product[]
  onRefresh?: () => void
}

export function ProductsTable({ products: propProducts = [], onRefresh }: ProductsTableProps = {}) {
  const [products, setProducts] = useState<Product[]>(propProducts)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deleteModal, setDeleteModal] = useState<{ 
    isOpen: boolean; 
    product: Product | null; 
    loading: boolean;
    relations: { invoiceItems: number; quoteItems: number } | null;
  }>({
    isOpen: false,
    product: null,
    loading: false,
    relations: null
  })
  const [editModal, setEditModal] = useState<{ isOpen: boolean; product: Product | null }>({
    isOpen: false,
    product: null
  })
  const { showToast } = useToast()

  // Update products when props change
  useEffect(() => {
    setProducts(propProducts)
  }, [propProducts])

  const handleDeleteClick = async (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (!product) return

    // Check relations
    try {
      const relations = await ProductService.getProductRelations(productId)
      setDeleteModal({
        isOpen: true,
        product: product,
        loading: false,
        relations
      })
    } catch (err) {
      showToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudo verificar las relaciones del producto'
      })
    }
  }

  const handleEditClick = (productId: string) => {
    const product = products.find(p => p.id === productId)
    setEditModal({
      isOpen: true,
      product: product || null
    })
  }

  const handleDeleteConfirm = async (cascade: boolean = false) => {
    if (!deleteModal.product) return

    setDeleteModal(prev => ({ ...prev, loading: true }))

    try {
      await ProductService.deleteProduct(deleteModal.product.id!, cascade)
      setProducts(prev => prev.filter(p => p.id !== deleteModal.product!.id))
      showToast({
        type: 'success',
        title: 'Producto eliminado',
        message: `${deleteModal.product.description} ha sido eliminado correctamente${
          cascade ? ' junto con sus registros asociados' : ''
        }`
      })
      setDeleteModal({ isOpen: false, product: null, loading: false, relations: null })
    } catch (err: any) {
      console.error('Error deleting product:', err)
      let message = 'No se pudo eliminar el producto. Inténtalo de nuevo.'
      
      if (err.message?.startsWith('RELATIONS_EXIST:')) {
        const [, invoiceItems, quoteItems] = err.message.split(':')
        message = `El producto tiene ${invoiceItems} elementos en facturas y ${quoteItems} en cotizaciones.`
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
    setDeleteModal({ isOpen: false, product: null, loading: false, relations: null })
  }

  const handleEditSave = () => {
    // Refresh products list after edit
    refreshData()
    setEditModal({ isOpen: false, product: null })
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

  const getStatusColor = (status: boolean) => {
    return status 
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800'
  }

  const getTypeColor = (isService: boolean) => {
    return isService 
      ? 'bg-blue-100 text-blue-800' 
      : 'bg-purple-100 text-purple-800'
  }

  if (loading) {
    return (
      <div className="overflow-x-auto">
        <div className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando productos...</p>
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

  if (products.length === 0) {
    return (
      <div className="overflow-x-auto">
        <div className="p-8 text-center">
          <div className="text-gray-400 mb-4">
            <Package className="w-16 h-16 mx-auto mb-4" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos</h3>
          <p className="text-gray-600 mb-6">Comienza agregando tu primer producto</p>
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
              Producto
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Descripción
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Precio/ITBMS
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Tipo
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Estado
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {products.map((product) => (
            <tr key={product.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <Package className="w-5 h-5 text-gray-400 mr-3" />
                  <div>
                    <div className="text-sm font-medium text-gray-900">{product.code || 'Sin código'}</div>
                    <div className="text-sm text-gray-500">ID: {product.id?.substring(0, 8)}...</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="text-sm text-gray-900 max-w-xs truncate">
                  {product.description}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div>
                  <div className="text-sm font-medium text-gray-900">
                    ${(product.unit_price || 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">
                    ITBMS: {(product.itbms_rate || 0).toFixed(1)}%
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={cn(
                  "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                  getTypeColor(product.is_service || false)
                )}>
                  {product.is_service ? 'Servicio' : 'Producto'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className={cn(
                  "inline-flex px-2 py-1 text-xs font-semibold rounded-full",
                  getStatusColor(product.status !== false)
                )}>
                  {product.status !== false ? 'Activo' : 'Inactivo'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end space-x-2">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    title="Ver producto"
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => product.id && handleEditClick(product.id)}
                    title="Editar producto"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => product.id && handleDeleteClick(product.id)}
                    title="Eliminar producto"
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
          productName={deleteModal.product?.description || 'Producto'}
          relations={deleteModal.relations}
          loading={deleteModal.loading}
        />
      )}

      {/* Edit Product Modal */}
      <ProductModal
        isOpen={editModal.isOpen}
        onClose={() => setEditModal({ isOpen: false, product: null })}
        onSave={handleEditSave}
        product={editModal.product}
      />
    </div>
  )
}
