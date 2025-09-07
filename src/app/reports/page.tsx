'use client'

import { useState, useEffect } from 'react'
import { MainLayout } from '@/components/layout/main-layout'
import { MetricCard } from '@/components/reports/metric-card'
import { SalesChart } from '@/components/reports/sales-chart'
import { StatusChart } from '@/components/reports/status-chart'
import { TopCustomersTable } from '@/components/reports/top-customers-table'
import { TeamPerformance } from '@/components/reports/team-performance'
import { ReportsFilters } from '@/components/reports/reports-filters'
import { ReportsService, ReportFilters } from '@/lib/services/reports-service'
import { 
  DollarSign, 
  Users, 
  ClipboardList, 
  Wrench, 
  TrendingUp,
  UserCheck,
  CheckCircle,
  Clock
} from 'lucide-react'

export default function ReportsPage() {
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState<ReportFilters>({})
  const [dashboardData, setDashboardData] = useState<any>(null)

  const loadReports = async (newFilters: ReportFilters = {}) => {
    try {
      setLoading(true)
      const data = await ReportsService.getDashboardSummary(newFilters)
      setDashboardData(data)
    } catch (error) {
      console.error('Error loading reports:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReports()
  }, [])

  const handleFiltersChange = (newFilters: ReportFilters) => {
    setFilters(newFilters)
    loadReports(newFilters)
  }

  const handleExport = () => {
    // Export functionality can be implemented here
    console.log('Exporting reports with filters:', filters)
  }

  if (loading) {
    return (
      <MainLayout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-primary-900">
                Reportes
              </h1>
              <p className="text-gray-600 mt-2">
                Análisis y métricas de tu negocio
              </p>
            </div>
          </div>
          
          <div className="bg-white p-12 rounded-lg border border-gray-200 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando reportes...</p>
          </div>
        </div>
      </MainLayout>
    )
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary-900">
              Reportes
            </h1>
            <p className="text-gray-600 mt-2">
              Análisis y métricas de tu negocio
            </p>
          </div>
        </div>

        {/* Filters */}
        <ReportsFilters 
          onFiltersChange={handleFiltersChange}
          onExport={handleExport}
          loading={loading}
        />

        {dashboardData && (
          <>
            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Ingresos Totales"
                value={dashboardData.sales.total_revenue}
                icon={DollarSign}
                description="Ingresos generados"
                trend="up"
              />
              <MetricCard
                title="Total Clientes"
                value={dashboardData.customers.total_customers}
                icon={Users}
                description={`${dashboardData.customers.new_customers} nuevos este mes`}
                trend="up"
              />
              <MetricCard
                title="Órdenes de Trabajo"
                value={dashboardData.orders.total_orders}
                icon={ClipboardList}
                description={`${dashboardData.orders.completion_rate.toFixed(1)}% completadas`}
                trend={dashboardData.orders.completion_rate > 80 ? 'up' : 'neutral'}
              />
              <MetricCard
                title="Instalaciones"
                value={dashboardData.installations.total_installations}
                icon={Wrench}
                description={`${dashboardData.installations.success_rate.toFixed(1)}% éxito`}
                trend={dashboardData.installations.success_rate > 85 ? 'up' : 'neutral'}
              />
            </div>

            {/* Secondary Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <MetricCard
                title="Valor Promedio Factura"
                value={dashboardData.sales.avg_invoice_value}
                icon={TrendingUp}
                description="Por factura"
              />
              <MetricCard
                title="Clientes Activos"
                value={dashboardData.customers.active_customers}
                icon={UserCheck}
                description="Con órdenes activas"
              />
              <MetricCard
                title="Órdenes Completadas"
                value={dashboardData.orders.completed_orders}
                icon={CheckCircle}
                description="Finalizadas exitosamente"
              />
              <MetricCard
                title="Tiempo Prom. Instalación"
                value={`${Math.round(dashboardData.installations.avg_duration)} min`}
                icon={Clock}
                description="Duración promedio"
              />
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <SalesChart data={dashboardData.sales} />
              <StatusChart 
                title="Estado de Órdenes de Trabajo"
                data={dashboardData.orders.orders_by_status}
                total={dashboardData.orders.total_orders}
              />
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TopCustomersTable data={dashboardData.customers} />
              <TeamPerformance data={dashboardData.installations} />
            </div>
          </>
        )}
      </div>
    </MainLayout>
  )
}
