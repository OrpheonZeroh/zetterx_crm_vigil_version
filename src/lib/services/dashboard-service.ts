'use client'

import { supabase } from '@/lib/supabase'

export interface DashboardStats {
  activeCustomers: number
  pendingOrders: number
  monthlyRevenue: number
  conversionRate: number
  customerGrowth: number
  orderGrowth: number
  revenueGrowth: number
  conversionGrowth: number
}

export interface ActivityItem {
  id: string
  type: 'customer' | 'order' | 'inspection' | 'invoice'
  message: string
  timestamp: string
  user_id?: string
}

export class DashboardService {
  // Get dashboard statistics from real data
  static async getDashboardStats(): Promise<DashboardStats> {
    try {
      // Get active customers count (no is_active field in schema, count all)
      const { count: activeCustomers } = await supabase
        .from('customers')
        .select('*', { count: 'exact', head: true })

      // Get pending orders count (using 'lead' status as schema shows available statuses)
      const { count: pendingOrders } = await supabase
        .from('work_orders')
        .select('*', { count: 'exact', head: true })
        .in('status', ['lead', 'quoted', 'scheduled'])

      // Get monthly revenue (current month invoices)
      const currentMonth = new Date()
      const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
      
      const { data: invoicesData } = await supabase
        .from('invoices')
        .select('total_amount')
        .gte('created_at', firstDayOfMonth.toISOString())
        .eq('status', 'accepted')

      const monthlyRevenue = invoicesData?.reduce((sum, invoice) => sum + (invoice.total_amount || 0), 0) || 0

      // Get conversion rate (issued vs accepted invoices)
      const { count: totalIssued } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'issued')

      const { count: acceptedInvoices } = await supabase
        .from('invoices')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'accepted')

      const conversionRate = totalIssued && totalIssued > 0 ? Math.round((acceptedInvoices || 0) / totalIssued * 100) : 0

      // For growth calculations, we'd need historical data comparison
      // For now, return mock growth values (in production, calculate from historical data)
      
      return {
        activeCustomers: activeCustomers || 0,
        pendingOrders: pendingOrders || 0,
        monthlyRevenue: monthlyRevenue,
        conversionRate: conversionRate,
        customerGrowth: 12, // TODO: Calculate from historical data
        orderGrowth: 5,     // TODO: Calculate from historical data
        revenueGrowth: 22,  // TODO: Calculate from historical data
        conversionGrowth: 3 // TODO: Calculate from historical data
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error)
      // Return default values if there's an error
      return {
        activeCustomers: 0,
        pendingOrders: 0,
        monthlyRevenue: 0,
        conversionRate: 0,
        customerGrowth: 0,
        orderGrowth: 0,
        revenueGrowth: 0,
        conversionGrowth: 0
      }
    }
  }

  // Get recent activity from multiple tables
  static async getRecentActivity(): Promise<ActivityItem[]> {
    try {
      const activities: ActivityItem[] = []

      // Get recent customers
      const { data: customers } = await supabase
        .from('customers')
        .select('id, name, created_at')
        .order('created_at', { ascending: false })
        .limit(3)

      customers?.forEach(customer => {
        activities.push({
          id: customer.id,
          type: 'customer',
          message: `Nuevo cliente registrado: ${customer.name}`,
          timestamp: customer.created_at
        })
      })

      // Get recent work orders
      const { data: orders } = await supabase
        .from('work_orders')
        .select('id, title, status, created_at')
        .order('created_at', { ascending: false })
        .limit(3)

      orders?.forEach(order => {
        const statusText = order.status === 'approved' ? 'aprobada' : order.status === 'completed' ? 'completada' : 'creada'
        activities.push({
          id: order.id,
          type: 'order',
          message: `Orden de trabajo "${order.title}" ${statusText}`,
          timestamp: order.created_at
        })
      })

      // Get recent inspections
      const { data: inspections } = await supabase
        .from('inspections')
        .select('id, notes, result, created_at, work_orders(title)')
        .order('created_at', { ascending: false })
        .limit(2)

      inspections?.forEach((inspection: any) => {
        const workOrderTitle = inspection.work_orders?.title || 'proyecto'
        activities.push({
          id: inspection.id,
          type: 'inspection',
          message: `Inspección completada para ${workOrderTitle}`,
          timestamp: inspection.created_at
        })
      })

      // Get recent invoices
      const { data: invoices } = await supabase
        .from('invoices')
        .select('id, doc_number, status, created_at')
        .eq('status', 'issued')
        .order('created_at', { ascending: false })
        .limit(2)

      invoices?.forEach(invoice => {
        activities.push({
          id: invoice.id,
          type: 'invoice',
          message: `Factura #${invoice.doc_number} emitida`,
          timestamp: invoice.created_at
        })
      })

      // Sort all activities by timestamp and return top 5
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5)
        
    } catch (error) {
      console.error('Error fetching recent activity:', error)
      return []
    }
  }
}
