'use client'

import { supabase } from '@/lib/supabase'

export interface WorkOrder {
  id?: string
  customer_id: string
  title: string
  status: 'lead' | 'quoted' | 'approved' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
  estimated_value?: number
  address_line?: string
  province?: string
  district?: string
  corregimiento?: string
  ubi_code?: string
  notes?: string
  created_by?: string
  created_at?: string
  customer?: {
    name: string
    email?: string
    phone?: string
  }
}

export interface WorkOrderFilters {
  status?: WorkOrder['status']
  customer_id?: string
  province?: string
  district?: string
  created_by?: string
  search?: string
  limit?: number
  offset?: number
}

export class WorkOrderService {
  // Create new work order
  static async createWorkOrder(workOrder: Omit<WorkOrder, 'id' | 'created_at'>): Promise<WorkOrder> {
    const { data, error } = await supabase
      .from('work_orders')
      .insert([workOrder])
      .select(`
        *,
        customers:customer_id(name, email, phone)
      `)
      .single()

    if (error) throw new Error(`Error creating work order: ${error.message}`)
    return data
  }

  // Get work order by ID
  static async getWorkOrder(id: string): Promise<WorkOrder | null> {
    const { data, error } = await supabase
      .from('work_orders')
      .select(`
        *,
        customers:customer_id(name, email, phone)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Error fetching work order: ${error.message}`)
    }
    return data
  }

  // Get work orders with filtering and pagination
  static async getWorkOrders(filters: WorkOrderFilters = {}): Promise<{
    workOrders: WorkOrder[]
    total: number
  }> {
    let query = supabase
      .from('work_orders')
      .select(`
        *,
        customers:customer_id(name, email, phone)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.customer_id) {
      query = query.eq('customer_id', filters.customer_id)
    }
    if (filters.province) {
      query = query.eq('province', filters.province)
    }
    if (filters.district) {
      query = query.eq('district', filters.district)
    }
    if (filters.created_by) {
      query = query.eq('created_by', filters.created_by)
    }

    // Apply search filter
    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,notes.ilike.%${filters.search}%`)
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit)
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error, count } = await query

    if (error) throw new Error(`Error fetching work orders: ${error.message}`)

    return {
      workOrders: data || [],
      total: count || 0
    }
  }

  // Update work order
  static async updateWorkOrder(id: string, updates: Partial<WorkOrder>): Promise<WorkOrder> {
    const { data, error } = await supabase
      .from('work_orders')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        customers:customer_id(name, email, phone)
      `)
      .single()

    if (error) throw new Error(`Error updating work order: ${error.message}`)
    return data
  }

  // Delete work order
  static async deleteWorkOrder(id: string): Promise<void> {
    const { error } = await supabase
      .from('work_orders')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`Error deleting work order: ${error.message}`)
  }

  // Update work order status
  static async updateStatus(id: string, status: WorkOrder['status']): Promise<WorkOrder> {
    return this.updateWorkOrder(id, { status })
  }

  // Get work orders by customer
  static async getWorkOrdersByCustomer(customerId: string): Promise<WorkOrder[]> {
    const { data, error } = await supabase
      .from('work_orders')
      .select(`
        *,
        customers:customer_id(name, email, phone)
      `)
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Error fetching customer work orders: ${error.message}`)
    return data || []
  }

  // Get work order statistics
  static async getWorkOrderStats(): Promise<{
    total: number
    byStatus: { [key: string]: number }
    totalValue: number
    thisMonth: number
  }> {
    // Get total work orders
    const { count: total } = await supabase
      .from('work_orders')
      .select('*', { count: 'exact', head: true })

    // Get work orders by status
    const { data: statusData } = await supabase
      .from('work_orders')
      .select('status')

    const byStatus: { [key: string]: number } = {}
    statusData?.forEach(order => {
      byStatus[order.status] = (byStatus[order.status] || 0) + 1
    })

    // Get total estimated value
    const { data: valueData } = await supabase
      .from('work_orders')
      .select('estimated_value')
      .not('estimated_value', 'is', null)

    const totalValue = valueData?.reduce((sum, order) => sum + (order.estimated_value || 0), 0) || 0

    // Get work orders created this month
    const currentMonth = new Date()
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    
    const { count: thisMonth } = await supabase
      .from('work_orders')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstDayOfMonth.toISOString())

    return {
      total: total || 0,
      byStatus,
      totalValue,
      thisMonth: thisMonth || 0
    }
  }

  // Get pending work orders (lead, quoted, scheduled)
  static async getPendingWorkOrders(): Promise<WorkOrder[]> {
    const { data, error } = await supabase
      .from('work_orders')
      .select(`
        *,
        customers:customer_id(name, email, phone)
      `)
      .in('status', ['lead', 'quoted', 'scheduled'])
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Error fetching pending work orders: ${error.message}`)
    return data || []
  }
}
