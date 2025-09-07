'use client'

import { supabase } from '@/lib/supabase'

export interface SalesMetrics {
  total_revenue: number
  total_invoices: number
  avg_invoice_value: number
  revenue_growth: number
  monthly_revenue: Array<{
    month: string
    revenue: number
    invoices: number
  }>
}

export interface CustomerMetrics {
  total_customers: number
  new_customers: number
  active_customers: number
  customer_growth: number
  top_customers: Array<{
    name: string
    total_spent: number
    orders_count: number
  }>
}

export interface WorkOrderMetrics {
  total_orders: number
  completed_orders: number
  pending_orders: number
  completion_rate: number
  avg_order_value: number
  orders_by_status: Array<{
    status: string
    count: number
  }>
}

export interface InstallationMetrics {
  total_installations: number
  completed_installations: number
  pending_installations: number
  success_rate: number
  avg_duration: number
  team_performance: Array<{
    team_name: string
    completed: number
    success_rate: number
  }>
}

export interface ReportFilters {
  start_date?: string
  end_date?: string
  customer_id?: string
  team_id?: string
}

export class ReportsService {
  // Get sales metrics
  static async getSalesMetrics(filters: ReportFilters = {}): Promise<SalesMetrics> {
    let query = supabase
      .from('invoices')
      .select(`
        id,
        issue_date,
        work_order:work_orders(estimated_value)
      `)

    if (filters.start_date) {
      query = query.gte('issue_date', filters.start_date)
    }
    if (filters.end_date) {
      query = query.lte('issue_date', filters.end_date)
    }

    const { data: invoices, error } = await query

    if (error) throw new Error(`Error fetching sales metrics: ${error.message}`)

    const totalRevenue = invoices?.reduce((sum, inv) => sum + (inv.work_order?.estimated_value || 0), 0) || 0
    const totalInvoices = invoices?.length || 0
    const avgInvoiceValue = totalInvoices > 0 ? totalRevenue / totalInvoices : 0

    // Calculate monthly revenue
    const monthlyData = invoices?.reduce((acc, inv) => {
      const month = new Date(inv.issue_date).toISOString().substring(0, 7)
      if (!acc[month]) {
        acc[month] = { revenue: 0, invoices: 0 }
      }
      acc[month].revenue += inv.work_order?.estimated_value || 0
      acc[month].invoices += 1
      return acc
    }, {} as Record<string, { revenue: number; invoices: number }>) || {}

    const monthlyRevenue = Object.entries(monthlyData).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      invoices: data.invoices
    }))

    return {
      total_revenue: totalRevenue,
      total_invoices: totalInvoices,
      avg_invoice_value: avgInvoiceValue,
      revenue_growth: 0, // Would need historical data to calculate
      monthly_revenue: monthlyRevenue
    }
  }

  // Get customer metrics
  static async getCustomerMetrics(filters: ReportFilters = {}): Promise<CustomerMetrics> {
    const { data: customers, error } = await supabase
      .from('customers')
      .select(`
        id,
        name,
        created_at,
        work_orders(estimated_value)
      `)

    if (error) throw new Error(`Error fetching customer metrics: ${error.message}`)

    const totalCustomers = customers?.length || 0
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const newCustomers = customers?.filter(c => c.created_at > thirtyDaysAgo).length || 0
    const activeCustomers = customers?.filter(c => c.work_orders && c.work_orders.length > 0).length || 0

    const topCustomers = customers
      ?.map(customer => ({
        name: customer.name,
        total_spent: customer.work_orders?.reduce((sum: number, order: any) => sum + (order.estimated_value || 0), 0) || 0,
        orders_count: customer.work_orders?.length || 0
      }))
      .sort((a, b) => b.total_spent - a.total_spent)
      .slice(0, 10) || []

    return {
      total_customers: totalCustomers,
      new_customers: newCustomers,
      active_customers: activeCustomers,
      customer_growth: 0,
      top_customers: topCustomers
    }
  }

  // Get work order metrics
  static async getWorkOrderMetrics(filters: ReportFilters = {}): Promise<WorkOrderMetrics> {
    let query = supabase
      .from('work_orders')
      .select('id, status, estimated_value, created_at')

    if (filters.start_date) {
      query = query.gte('created_at', filters.start_date)
    }
    if (filters.end_date) {
      query = query.lte('created_at', filters.end_date)
    }
    if (filters.customer_id) {
      query = query.eq('customer_id', filters.customer_id)
    }

    const { data: orders, error } = await query

    if (error) throw new Error(`Error fetching work order metrics: ${error.message}`)

    const totalOrders = orders?.length || 0
    const completedOrders = orders?.filter(o => o.status === 'completed').length || 0
    const pendingOrders = orders?.filter(o => ['lead', 'quoted', 'approved', 'scheduled', 'in_progress'].includes(o.status)).length || 0
    const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0
    const avgOrderValue = orders?.reduce((sum, order) => sum + (order.estimated_value || 0), 0) / totalOrders || 0

    const ordersByStatus = orders?.reduce((acc, order) => {
      acc[order.status] = (acc[order.status] || 0) + 1
      return acc
    }, {} as Record<string, number>) || {}

    const ordersStatusArray = Object.entries(ordersByStatus).map(([status, count]) => ({
      status,
      count
    }))

    return {
      total_orders: totalOrders,
      completed_orders: completedOrders,
      pending_orders: pendingOrders,
      completion_rate: completionRate,
      avg_order_value: avgOrderValue,
      orders_by_status: ordersStatusArray
    }
  }

  // Get installation metrics
  static async getInstallationMetrics(filters: ReportFilters = {}): Promise<InstallationMetrics> {
    let query = supabase
      .from('installation_slots')
      .select(`
        id,
        status,
        start_at,
        end_at,
        team:installer_teams(id, name)
      `)

    if (filters.start_date) {
      query = query.gte('start_at', filters.start_date)
    }
    if (filters.end_date) {
      query = query.lte('start_at', filters.end_date)
    }
    if (filters.team_id) {
      query = query.eq('team_id', filters.team_id)
    }

    const { data: installations, error } = await query

    if (error) throw new Error(`Error fetching installation metrics: ${error.message}`)

    const totalInstallations = installations?.length || 0
    const completedInstallations = installations?.filter(i => i.status === 'done').length || 0
    const pendingInstallations = installations?.filter(i => ['scheduled', 'confirmed', 'in_progress'].includes(i.status)).length || 0
    const successRate = totalInstallations > 0 ? (completedInstallations / totalInstallations) * 100 : 0

    // Calculate average duration
    const completedWithDuration = installations?.filter(i => i.status === 'done' && i.start_at && i.end_at) || []
    const avgDuration = completedWithDuration.length > 0
      ? completedWithDuration.reduce((sum, installation) => {
          const start = new Date(installation.start_at)
          const end = new Date(installation.end_at)
          return sum + (end.getTime() - start.getTime()) / (1000 * 60) // minutes
        }, 0) / completedWithDuration.length
      : 0

    // Team performance
    const teamPerformance = installations?.reduce((acc, installation) => {
      if (installation.team) {
        const teamName = installation.team.name
        if (!acc[teamName]) {
          acc[teamName] = { completed: 0, total: 0 }
        }
        acc[teamName].total += 1
        if (installation.status === 'done') {
          acc[teamName].completed += 1
        }
      }
      return acc
    }, {} as Record<string, { completed: number; total: number }>) || {}

    const teamPerformanceArray = Object.entries(teamPerformance).map(([teamName, data]) => ({
      team_name: teamName,
      completed: data.completed,
      success_rate: data.total > 0 ? (data.completed / data.total) * 100 : 0
    }))

    return {
      total_installations: totalInstallations,
      completed_installations: completedInstallations,
      pending_installations: pendingInstallations,
      success_rate: successRate,
      avg_duration: avgDuration,
      team_performance: teamPerformanceArray
    }
  }

  // Get dashboard summary
  static async getDashboardSummary(filters: ReportFilters = {}) {
    const [sales, customers, orders, installations] = await Promise.all([
      this.getSalesMetrics(filters),
      this.getCustomerMetrics(filters),
      this.getWorkOrderMetrics(filters),
      this.getInstallationMetrics(filters)
    ])

    return {
      sales,
      customers,
      orders,
      installations
    }
  }
}
