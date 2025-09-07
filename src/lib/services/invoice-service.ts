'use client'

import { supabase } from '@/lib/supabase'

export interface Invoice {
  id?: string
  work_order_id?: string
  customer_id?: string
  env_code: number
  emission_type: string
  doc_type: string
  doc_number: string
  pos_code?: string
  issue_date: string
  exit_date?: string
  nat_op?: string
  tipo_op?: string
  dest?: string
  form_cafe?: string
  ent_cafe?: string
  env_fe?: string
  sale_tran_type?: string
  version?: string
  // Emisor data
  emis_name?: string
  emis_branch?: string
  emis_coords?: string
  emis_address?: string
  emis_ruc_tipo?: string
  emis_ruc_num?: string
  emis_ruc_dv?: string
  emis_ubi_code?: string
  emis_correg?: string
  emis_district?: string
  emis_province?: string
  emis_phone?: string
  // Receptor data
  rec_type?: string
  rec_name?: string
  rec_address?: string
  rec_country?: string
  rec_ubi_code?: string
  rec_correg?: string
  rec_district?: string
  rec_province?: string
  rec_phone?: string
  rec_email?: string
  // Totals
  total_net: number
  total_itbms: number
  total_isc: number
  total_gravado: number
  total_discount: number
  total_amount: number
  total_received: number
  num_payments?: number
  num_items?: number
  items_total: number
  status: string
  created_by?: string
  created_at?: string
  
  // DGI and Email fields
  cufe?: string
  dgi_protocol?: string
  dgi_status?: string
  dgi_message?: string
  qr_url?: string
  validation_url?: string
  dgi_data?: any
  email_sent?: boolean
  email_sent_at?: string
  email_address?: string
  invoice_number?: string
  
  // Relations
  customer?: {
    id: string
    name: string
    email?: string
  }
  work_order?: {
    id: string
    title: string
  }
}

export interface InvoiceItem {
  id?: string
  invoice_id: string
  line_seq: number
  product_code?: string
  description: string
  quantity: number
  clas_sabr?: string
  clas_cmp?: string
  unit_price: number
  unit_discount: number
  line_price: number
  line_total: number
  itbms_rate: number
  itbms_value: number
}

export interface InvoicePayment {
  id?: string
  invoice_id: string
  method_code: string
  amount: number
  created_at?: string
}

export interface InvoiceFilters {
  status?: Invoice['status']
  customer_id?: string
  work_order_id?: string
  date_from?: string
  date_to?: string
  search?: string
  limit?: number
  offset?: number
}

export class InvoiceService {
  // Create new invoice
  static async createInvoice(invoice: Omit<Invoice, 'id' | 'created_at'>): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .insert([invoice])
      .select(`
        *,
        customers:customer_id(name, email),
        work_orders:work_order_id(title)
      `)
      .single()

    if (error) throw new Error(`Error creating invoice: ${error.message}`)
    return data
  }

  // Get invoice by ID
  static async getInvoice(id: string): Promise<Invoice | null> {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        customers:customer_id(name, email),
        work_orders:work_order_id(title)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Error fetching invoice: ${error.message}`)
    }
    return data
  }

  // Get invoices with filtering
  static async getInvoices(filters: InvoiceFilters = {}): Promise<{
    invoices: Invoice[]
    total: number
  }> {
    let query = supabase
      .from('invoices')
      .select(`
        *,
        customers:customer_id(name, email),
        work_orders:work_order_id(title)
      `, { count: 'exact' })
      .order('issue_date', { ascending: false })

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.customer_id) {
      query = query.eq('customer_id', filters.customer_id)
    }
    if (filters.work_order_id) {
      query = query.eq('work_order_id', filters.work_order_id)
    }
    if (filters.date_from) {
      query = query.gte('issue_date', filters.date_from)
    }
    if (filters.date_to) {
      query = query.lte('issue_date', filters.date_to)
    }
    if (filters.search) {
      query = query.or(`doc_number.ilike.%${filters.search}%,rec_name.ilike.%${filters.search}%`)
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit)
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error, count } = await query

    if (error) throw new Error(`Error fetching invoices: ${error.message}`)

    return {
      invoices: data || [],
      total: count || 0
    }
  }

  // Update invoice
  static async updateInvoice(id: string, updates: Partial<Invoice>): Promise<Invoice> {
    const { data, error } = await supabase
      .from('invoices')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        customers:customer_id(name, email),
        work_orders:work_order_id(title)
      `)
      .single()

    if (error) throw new Error(`Error updating invoice: ${error.message}`)
    return data
  }

  // Update invoice status
  static async updateStatus(id: string, status: Invoice['status']): Promise<Invoice> {
    return this.updateInvoice(id, { status })
  }

  // Add invoice item
  static async addInvoiceItem(item: Omit<InvoiceItem, 'id'>): Promise<InvoiceItem> {
    const { data, error } = await supabase
      .from('invoice_items')
      .insert([item])
      .select()
      .single()

    if (error) throw new Error(`Error adding invoice item: ${error.message}`)
    return data
  }

  // Get invoice items
  static async getInvoiceItems(invoiceId: string): Promise<InvoiceItem[]> {
    const { data, error } = await supabase
      .from('invoice_items')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('line_seq')

    if (error) throw new Error(`Error fetching invoice items: ${error.message}`)
    return data || []
  }

  // Add invoice payment
  static async addInvoicePayment(payment: Omit<InvoicePayment, 'id' | 'created_at'>): Promise<InvoicePayment> {
    const { data, error } = await supabase
      .from('invoice_payments')
      .insert([payment])
      .select()
      .single()

    if (error) throw new Error(`Error adding invoice payment: ${error.message}`)
    return data
  }

  // Get invoice payments
  static async getInvoicePayments(invoiceId: string): Promise<InvoicePayment[]> {
    const { data, error } = await supabase
      .from('invoice_payments')
      .select('*')
      .eq('invoice_id', invoiceId)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Error fetching invoice payments: ${error.message}`)
    return data || []
  }

  // Get invoice statistics
  static async getInvoiceStats(): Promise<{
    total: number
    totalAmount: number
    byStatus: { [key: string]: number }
    monthlyRevenue: number
    thisMonth: number
  }> {
    // Get total invoices
    const { count: total } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })

    // Get invoices by status
    const { data: statusData } = await supabase
      .from('invoices')
      .select('status')

    const byStatus: { [key: string]: number } = {}
    statusData?.forEach(invoice => {
      byStatus[invoice.status] = (byStatus[invoice.status] || 0) + 1
    })

    // Get total amount from all accepted invoices
    const { data: totalData } = await supabase
      .from('invoices')
      .select('total_amount')
      .eq('status', 'accepted')

    const totalAmount = totalData?.reduce((sum, invoice) => sum + invoice.total_amount, 0) || 0

    // Get monthly revenue (current month)
    const currentMonth = new Date()
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    
    const { data: monthlyData } = await supabase
      .from('invoices')
      .select('total_amount')
      .eq('status', 'accepted')
      .gte('issue_date', firstDayOfMonth.toISOString())

    const monthlyRevenue = monthlyData?.reduce((sum, invoice) => sum + invoice.total_amount, 0) || 0

    // Get invoices created this month
    const { count: thisMonth } = await supabase
      .from('invoices')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstDayOfMonth.toISOString())

    return {
      total: total || 0,
      totalAmount,
      byStatus,
      monthlyRevenue,
      thisMonth: thisMonth || 0
    }
  }

  // Generate next invoice number
  static async generateInvoiceNumber(posCode: string): Promise<string> {
    const { data, error } = await supabase
      .from('invoices')
      .select('doc_number')
      .eq('pos_code', posCode)
      .order('doc_number', { ascending: false })
      .limit(1)

    if (error) throw new Error(`Error generating invoice number: ${error.message}`)

    if (data && data.length > 0) {
      const lastNumber = parseInt(data[0].doc_number) || 0
      return (lastNumber + 1).toString().padStart(8, '0')
    }
    
    return '00000001'
  }
}
