'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Filter, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { MainLayout } from '@/components/layout/main-layout'
import { ProductsTable } from '@/components/products/products-table'
import { ProductModal } from '@/components/products/product-modal'
import { FilterModal, type ProductFilters } from '@/components/products/filter-modal'
import { ExportModal } from '@/components/products/export-modal'
import { ProductService, type Product } from '@/lib/services/product-service'
import { useToast } from '@/components/ui/toast'

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState({
    total: 0,
    services: 0,
    totalValue: 0
  })
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([])
  const [filters, setFilters] = useState<ProductFilters>({})
  const [newProductModal, setNewProductModal] = useState(false)
  const [filterModal, setFilterModal] = useState(false)
  const [exportModal, setExportModal] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    loadProducts()
  }, [])

  const loadProducts = async () => {
    try {
      setLoading(true)
      const response = await ProductService.getProducts()
      setProducts(response.products)
      setFilteredProducts(response.products)
      await loadStats()
    } catch (error) {
      console.error('Error loading products:', error)
      showToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron cargar los productos'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const statsData = await ProductService.getProductStats()
      setStats(statsData)
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const handleNewProduct = () => {
    loadProducts()
    setNewProductModal(false)
  }

  const handleApplyFilter = async (newFilters: ProductFilters) => {
    try {
      setFilters(newFilters)
      const response = await ProductService.getProducts({ filters: newFilters })
      setFilteredProducts(response.products)
      
      const activeFiltersCount = Object.keys(newFilters).filter(
        key => newFilters[key as keyof ProductFilters] !== undefined && 
               newFilters[key as keyof ProductFilters] !== ''
      ).length
      
      showToast({
        type: 'success',
        title: 'Filtros aplicados',
        message: activeFiltersCount > 0 
          ? `Se encontraron ${response.products.length} productos con los filtros aplicados`
          : `Mostrando todos los productos (${response.products.length})`
      })
    } catch (error) {
      console.error('Error applying filters:', error)
      showToast({
        type: 'error',
        title: 'Error',
        message: 'No se pudieron aplicar los filtros'
      })
    }
  }

  const getStatsArray = () => [
    {
      title: 'Total Productos',
      value: stats.total.toString(),
      change: '+' + Math.max(0, stats.total - (stats.total * 0.9)).toFixed(0),
      changeType: 'positive' as const
    },
    {
      title: 'Servicios',
      value: stats.services.toString(),
      change: '+' + Math.max(0, stats.services - (stats.services * 0.8)).toFixed(0),
      changeType: 'positive' as const
    },
    {
      title: 'Valor Inventario',
      value: '$' + stats.totalValue.toLocaleString('es-PA', { minimumFractionDigits: 2 }),
      change: '+5.2%',
      changeType: 'positive' as const
    }
  ]

  return (
    <MainLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-900">
              Productos y Servicios
            </h1>
            <p className="text-gray-600 mt-2">
              Gestiona tu catálogo de productos y servicios
            </p>
          </div>
          <div className="flex space-x-3">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setFilterModal(true)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
            {Object.keys(filters).filter(key => filters[key as keyof ProductFilters]).length > 0 && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                {Object.keys(filters).filter(key => filters[key as keyof ProductFilters]).length}
              </span>
            )}
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setExportModal(true)}
            disabled={filteredProducts.length === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            Exportar
          </Button>
          <Button 
            size="sm" 
            onClick={() => setNewProductModal(true)}
          >
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Producto
          </Button>
        </div>
        </div>

        {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {getStatsArray().map((stat, index) => (
            <div key={index} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-2">{stat.value}</p>
                </div>
                <div className={`text-sm ${stat.changeType === 'positive' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <ProductsTable
            products={filteredProducts}
            onRefresh={loadProducts}
          />
        </div>

        {/* New Product Modal */}
        <ProductModal
          isOpen={newProductModal}
          onClose={() => setNewProductModal(false)}
          onSave={handleNewProduct}
        />

        {/* Filter Modal */}
        <FilterModal
          isOpen={filterModal}
          onClose={() => setFilterModal(false)}
          onApplyFilter={handleApplyFilter}
          currentFilters={filters}
        />

        {/* Export Modal */}
        <ExportModal
          isOpen={exportModal}
          onClose={() => setExportModal(false)}
          products={filteredProducts}
          totalCount={products.length}
        />
      </div>
    </MainLayout>
  )
}
