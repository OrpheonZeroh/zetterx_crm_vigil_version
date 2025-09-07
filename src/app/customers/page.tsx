'use client'

import { useEffect, useState } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { RouteGuard } from '@/components/layout/route-guard'
import { CustomersTable } from '@/components/customers/customers-table'
import { CustomerModal } from '@/components/customers/customer-modal'
import { FilterModal, type CustomerFilters } from '@/components/customers/filter-modal'
import { ExportModal } from '@/components/customers/export-modal'
import { Button } from '@/components/ui/button'
import { Plus, Download, Filter } from 'lucide-react'
import { CustomerService, type Customer } from '@/lib/services/customer-service'
import { useToast } from '@/components/ui/toast'

export default function CustomersPage() {
  const [stats, setStats] = useState({
    total: 0,
    thisMonth: 0,
    provinces: {} as { [key: string]: number }
  })
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false)
  const [isExportModalOpen, setIsExportModalOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [activeFilters, setActiveFilters] = useState<CustomerFilters>({})
  const { showToast } = useToast()

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsData, customersData] = await Promise.all([
          CustomerService.getCustomerStats(),
          CustomerService.getCustomers({ limit: 1000 }) // Get more customers for export
        ])
        setStats(statsData)
        setCustomers(customersData.customers)
        setFilteredCustomers(customersData.customers)
      } catch (error) {
        console.error('Error loading data:', error)
        showToast({
          type: 'error',
          title: 'Error',
          message: 'No se pudieron cargar los datos'
        })
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('es-PA').format(num)
  }

  const handleApplyFilter = (filters: CustomerFilters) => {
    setActiveFilters(filters)
    let filtered = customers

    // Apply search term filter
    if (filters.searchTerm) {
      const searchLower = filters.searchTerm.toLowerCase()
      filtered = filtered.filter(customer => 
        customer.name?.toLowerCase().includes(searchLower) ||
        customer.email?.toLowerCase().includes(searchLower) ||
        customer.phone?.includes(searchLower)
      )
    }

    // Apply province filter
    if (filters.province) {
      filtered = filtered.filter(customer => customer.province === filters.province)
    }

    // Apply district filter
    if (filters.district) {
      filtered = filtered.filter(customer => 
        customer.district?.toLowerCase().includes(filters.district!.toLowerCase())
      )
    }

    // Apply date filters
    if (filters.dateFrom || filters.dateTo) {
      filtered = filtered.filter(customer => {
        if (!customer.created_at) return false
        const customerDate = new Date(customer.created_at)
        
        if (filters.dateFrom && customerDate < new Date(filters.dateFrom)) return false
        if (filters.dateTo && customerDate > new Date(filters.dateTo)) return false
        return true
      })
    }

    setFilteredCustomers(filtered)
    showToast({
      type: 'success',
      title: 'Filtros aplicados',
      message: `Se encontraron ${filtered.length} clientes`
    })
  }

  const refreshCustomers = async () => {
    try {
      setLoading(true)
      const { customers: newCustomers } = await CustomerService.getCustomers({ limit: 1000 })
      setCustomers(newCustomers)
      // Reapply current filters
      if (Object.keys(activeFilters).length > 0) {
        handleApplyFilter(activeFilters)
      } else {
        setFilteredCustomers(newCustomers)
      }
    } catch (error) {
      console.error('Error refreshing customers:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <RouteGuard requiredModule="customers">
      <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary-900">
                Clientes
              </h1>
              <p className="text-gray-600 mt-2">
                Gestiona tu base de clientes y contactos
              </p>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsFilterModalOpen(true)}
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
                {Object.keys(activeFilters).length > 0 && (
                  <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">
                    {Object.keys(activeFilters).length}
                  </span>
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsExportModalOpen(true)}
                disabled={filteredCustomers.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button size="sm" onClick={() => setIsModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Cliente
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-primary-900">
                {loading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  formatNumber(stats.total)
                )}
              </div>
              <div className="text-sm text-gray-600">Total Clientes</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-green-600">
                {loading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  formatNumber(stats.thisMonth)
                )}
              </div>
              <div className="text-sm text-gray-600">Nuevos este mes</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">
                {loading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  Object.keys(stats.provinces).length
                )}
              </div>
              <div className="text-sm text-gray-600">Provincias</div>
            </div>
            <div className="bg-white p-4 rounded-lg border border-gray-200">
              <div className="text-2xl font-bold text-orange-600">
                {loading ? (
                  <div className="animate-pulse bg-gray-200 h-8 w-16 rounded"></div>
                ) : (
                  stats.provinces['PANAMA'] || 0
                )}
              </div>
              <div className="text-sm text-gray-600">En Panamá</div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-gray-200">
            <CustomersTable 
              customers={filteredCustomers}
              onRefresh={refreshCustomers}
            />
          </div>

          {/* Modals */}
          <CustomerModal 
            isOpen={isModalOpen} 
            onClose={() => setIsModalOpen(false)}
            onSave={() => {
              setIsModalOpen(false)
              refreshCustomers()
            }}
          />

          <FilterModal
            isOpen={isFilterModalOpen}
            onClose={() => setIsFilterModalOpen(false)}
            onApplyFilter={handleApplyFilter}
            currentFilters={activeFilters}
          />

          <ExportModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            customers={filteredCustomers}
            totalCount={customers.length}
          />
        </div>
      </MainLayout>
    </RouteGuard>
  )
}
