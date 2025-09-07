'use client'

import { supabase } from '@/lib/supabase'

export interface Customer {
  id?: string
  name: string
  email?: string
  phone?: string
  address_line?: string
  country_code?: string
  ubi_code?: string
  province?: string
  district?: string
  corregimiento?: string
  tax_id_type?: string
  notes?: string
  created_at?: string
}

export interface CustomerFilters {
  search?: string
  province?: string
  district?: string
  limit?: number
  offset?: number
}

export class CustomerService {
  // Create new customer
  static async createCustomer(customer: Omit<Customer, 'id' | 'created_at'>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .insert([customer])
      .select()
      .single()

    if (error) throw new Error(`Error creating customer: ${error.message}`)
    return data
  }

  // Get customer by ID
  static async getCustomer(id: string): Promise<Customer | null> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Error fetching customer: ${error.message}`)
    }
    return data
  }

  // Get customers with filtering and pagination
  static async getCustomers(filters: CustomerFilters = {}): Promise<{
    customers: Customer[]
    total: number
  }> {
    let query = supabase
      .from('customers')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply search filter
    if (filters.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`)
    }

    // Apply location filters
    if (filters.province) {
      query = query.eq('province', filters.province)
    }
    if (filters.district) {
      query = query.eq('district', filters.district)
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit)
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error, count } = await query

    if (error) throw new Error(`Error fetching customers: ${error.message}`)

    return {
      customers: data || [],
      total: count || 0
    }
  }

  // Update customer
  static async updateCustomer(id: string, updates: Partial<Customer>): Promise<Customer> {
    const { data, error } = await supabase
      .from('customers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Error updating customer: ${error.message}`)
    return data
  }

  // Check if customer has related work orders
  static async getCustomerRelations(id: string): Promise<{ workOrders: number; invoices: number }> {
    const [workOrdersResult, invoicesResult] = await Promise.all([
      supabase.from('work_orders').select('id', { count: 'exact' }).eq('customer_id', id),
      supabase.from('invoices').select('id', { count: 'exact' }).eq('customer_id', id)
    ])

    return {
      workOrders: workOrdersResult.count || 0,
      invoices: invoicesResult.count || 0
    }
  }

  // Delete a customer (with cascade option)
  static async deleteCustomer(id: string, cascade: boolean = false): Promise<void> {
    if (cascade) {
      // Delete related records first
      await Promise.all([
        supabase.from('work_orders').delete().eq('customer_id', id),
        supabase.from('invoices').delete().eq('customer_id', id)
      ])
    } else {
      // Check for relations before deletion
      const relations = await this.getCustomerRelations(id)
      if (relations.workOrders > 0 || relations.invoices > 0) {
        throw new Error(`RELATIONS_EXIST:${relations.workOrders}:${relations.invoices}`)
      }
    }

    // Delete the customer
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`Error deleting customer: ${error.message}`)
  }

  // Search customers by name, email, or phone
  static async searchCustomers(query: string, limit: number = 10): Promise<Customer[]> {
    const { data, error } = await supabase
      .from('customers')
      .select('*')
      .or(`name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`)
      .limit(limit)
      .order('name')

    if (error) throw new Error(`Error searching customers: ${error.message}`)
    return data || []
  }

  // Get customer statistics
  static async getCustomerStats(): Promise<{
    total: number
    thisMonth: number
    provinces: { [key: string]: number }
  }> {
    // Get total customers
    const { count: total } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })

    // Get customers created this month
    const currentMonth = new Date()
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    
    const { count: thisMonth } = await supabase
      .from('customers')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstDayOfMonth.toISOString())

    // Get customers by province
    const { data: provinceData } = await supabase
      .from('customers')
      .select('province')
      .not('province', 'is', null)

    const provinces: { [key: string]: number } = {}
    provinceData?.forEach(customer => {
      const province = customer.province || 'Sin especificar'
      provinces[province] = (provinces[province] || 0) + 1
    })

    return {
      total: total || 0,
      thisMonth: thisMonth || 0,
      provinces
    }
  }
}
