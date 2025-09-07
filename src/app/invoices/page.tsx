'use client'

import React, { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { RouteGuard } from '@/components/layout/route-guard'
import { InvoicesTable } from '@/components/invoices/invoices-table'
import { InvoiceModal } from '@/components/invoices/invoice-modal'
import { Button } from '@/components/ui/button'
import { Plus, FileText, DollarSign, TrendingUp, Filter, Download } from 'lucide-react'
import { StatsCard } from '@/components/common'
import { InvoiceService, type Invoice } from '@/lib/services/invoice-service'
import { useToast } from '@/components/ui/toast'

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({
    total: 0,
    totalAmount: 0,
    byStatus: {} as { [key: string]: number },
    monthlyRevenue: 0,
    thisMonth: 0
  })
  const [invoiceModal, setInvoiceModal] = useState(false)
  const { showToast } = useToast()

  useEffect(() => {
    loadInvoices()
    loadStats()
  }, [])

  const loadInvoices = async () => {
    try {
      setLoading(true)
      const { invoices } = await InvoiceService.getInvoices({ limit: 100 })
      setInvoices(invoices)
    } catch (error: any) {
      console.error('Error loading invoices:', error)
      showToast({
        type: 'error',
        title: 'Error',
        message: 'Error al cargar las facturas'
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async () => {
    try {
      const stats = await InvoiceService.getInvoiceStats()
      setStats(stats)
    } catch (error: any) {
      console.error('Error loading stats:', error)
    }
  }

  return (
    <RouteGuard requiredModule="invoices">
      <MainLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary-900">
                Facturación
              </h1>
              <p className="text-gray-600 mt-2">
                Gestiona facturas, pagos y cumplimiento DGI
              </p>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                size="sm"
                className="h-9 px-3 text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              >
                <Filter className="w-4 h-4 mr-2" />
                Filtros
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                className="h-9 px-3 text-sm font-medium border-gray-300 text-gray-700 hover:bg-gray-50 hover:text-gray-900"
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar
              </Button>
              <Button 
                size="sm"
                onClick={() => setInvoiceModal(true)}
                className="h-9 px-3 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Plus className="w-4 h-4 mr-2" />
                Nueva Factura
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <StatsCard
              title="Borradores"
              value={stats.byStatus.draft || 0}
              icon={FileText}
              iconColor="text-blue-500"
            />
            <StatsCard
              title="Aceptadas"
              value={stats.byStatus.accepted || 0}
              iconColor="text-green-500"
            />
            <StatsCard
              title="Este Mes"
              value={stats.thisMonth}
              iconColor="text-purple-500"
            />
            <StatsCard
              title="Ingresos Mensuales"
              value={`$${stats.monthlyRevenue.toFixed(0)}`}
              icon={DollarSign}
              iconColor="text-orange-500"
            />
          </div>

          {/* Revenue Summary */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Resumen de Facturación</h3>
                <p className="text-sm text-gray-600">Estado actual de la facturación y cumplimiento DGI</p>
              </div>
              <div className="text-right">
                <div className="text-3xl font-bold text-primary-600">${stats.totalAmount.toFixed(2)}</div>
                <div className="text-sm text-blue-600">Total Facturado</div>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-4">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">{stats.total}</div>
                <div className="text-sm text-gray-600">Total Facturas</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">{stats.byStatus.issued || 0}</div>
                <div className="text-sm text-gray-600">Emitidas</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <div className="text-lg font-semibold text-gray-900">${(stats.totalAmount / (stats.total || 1)).toFixed(0)}</div>
                <div className="text-sm text-gray-600">Promedio por Factura</div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-lg border border-gray-200">
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
                <span className="ml-2 text-gray-600">Cargando facturas...</span>
              </div>
            ) : (
              <InvoicesTable invoices={invoices} onRefresh={loadInvoices} />
            )}
          </div>

          {/* Modal */}
          <InvoiceModal
            isOpen={invoiceModal}
            onClose={() => setInvoiceModal(false)}
            onSave={() => {
              setInvoiceModal(false)
              loadInvoices()
              loadStats()
            }}
          />
        </div>
      </MainLayout>
    </RouteGuard>
  )
}
