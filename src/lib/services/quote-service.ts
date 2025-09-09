import { supabase } from '@/lib/supabase'

export interface Quote {
  id?: string
  customer_id: string
  work_order_id?: string
  version: number
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired'
  subtotal: number
  itbms_total: number
  discount_total: number
  total: number
  notes?: string
  created_at?: string
  customers?: {
    name: string
    email?: string
  }
  work_orders?: {
    title: string
    customer_id: string
    customers?: {
      name: string
    }
  }
  items?: QuoteItem[]
}

export interface QuoteItem {
  id?: string
  quote_id: string
  line_seq: number
  product_code?: string
  description: string
  quantity: number
  unit_price: number
  itbms_rate: number
  discount: number
  line_total: number
}

export interface QuoteFilters {
  customer_id?: string
  work_order_id?: string
  status?: Quote['status']
  date_from?: string
  date_to?: string
  search?: string
  limit?: number
  offset?: number
}

export class QuoteService {
  // Create new quote
  static async createQuote(quote: Omit<Quote, 'id' | 'created_at'>): Promise<Quote> {
    // First create a work order for this quote if customer_id is provided
    let workOrderId = quote.work_order_id
    
    if (!workOrderId && quote.customer_id) {
      const { data: workOrderData, error: woError } = await supabase
        .from('work_orders')
        .insert({
          customer_id: quote.customer_id,
          title: `Cotización #${Date.now()}`,
          status: 'lead',
          estimated_value: quote.total || 0
        })
        .select('id')
        .single()
      
      if (woError) throw new Error(`Error creating work order: ${woError.message}`)
      workOrderId = workOrderData.id
    }
    
    // Now create the quote with work_order_id
    const quoteData = {
      work_order_id: workOrderId,
      version: quote.version,
      status: quote.status,
      subtotal: quote.subtotal,
      itbms_total: quote.itbms_total,
      discount_total: quote.discount_total,
      total: quote.total,
      notes: quote.notes
    }
    
    const { data, error } = await supabase
      .from('quotes')
      .insert([quoteData])
      .select('*')
      .single()

    if (error) throw new Error(`Error creating quote: ${error.message}`)
    
    // Manually join customer data from work_order
    if (data.work_order_id) {
      const { data: workOrderData } = await supabase
        .from('work_orders')
        .select(`
          customer_id,
          customers!inner (
            id,
            name,
            email
          )
        `)
        .eq('id', data.work_order_id)
        .single()
      
      if (workOrderData?.customers) {
        data.customers = workOrderData.customers
        data.customer_id = workOrderData.customer_id
      }
    }
    
    return data
  }

  // Get quote by ID
  static async getQuote(id: string): Promise<Quote | null> {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        work_orders!inner (
          id,
          customer_id,
          customers!inner (
            id,
            name,
            email
          )
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Error fetching quote: ${error.message}`)
    }

    // Transform data to include customer info at quote level
    const quote = {
      ...data,
      customer_id: data.work_orders?.customer_id,
      customers: data.work_orders?.customers ? {
        name: data.work_orders.customers.name,
        email: data.work_orders.customers.email
      } : null
    }

    return quote
  }

  // Get quotes with filtering
  static async getQuotes(filters: QuoteFilters = {}): Promise<{
    quotes: Quote[]
    total: number
  }> {
    let query = supabase
      .from('quotes')
      .select(`
        *,
        work_orders!inner (
          id,
          customer_id,
          customers!inner (
            id,
            name,
            email
          )
        )
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.customer_id) {
      query = query.eq('work_orders.customer_id', filters.customer_id)
    }
    if (filters.work_order_id) {
      query = query.eq('work_order_id', filters.work_order_id)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.date_from) {
      query = query.gte('created_at', filters.date_from)
    }
    if (filters.date_to) {
      query = query.lte('created_at', filters.date_to)
    }
    if (filters.search) {
      query = query.or(`notes.ilike.%${filters.search}%,work_orders.customers.name.ilike.%${filters.search}%`)
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit)
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error, count } = await query

    if (error) throw new Error(`Error fetching quotes: ${error.message}`)

    // Transform data to include customer info at quote level
    const quotes = (data || []).map(quote => ({
      ...quote,
      customer_id: quote.work_orders?.customer_id,
      customers: quote.work_orders?.customers ? {
        name: quote.work_orders.customers.name,
        email: quote.work_orders.customers.email
      } : null
    }))

    return {
      quotes,
      total: count || 0
    }
  }

  // Update quote
  static async updateQuote(id: string, updates: Partial<Quote>): Promise<Quote> {
    const { data, error } = await supabase
      .from('quotes')
      .update(updates)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw new Error(`Error updating quote: ${error.message}`)
    
    // Manually join customer data if needed
    if (data.customer_id) {
      const { data: customerData } = await supabase
        .from('customers')
        .select('name, email')
        .eq('id', data.customer_id)
        .single()
      
      if (customerData) {
        data.customers = customerData
      }
    }
    
    return data
  }

  // Update quote status
  static async updateStatus(id: string, status: Quote['status']): Promise<Quote> {
    return this.updateQuote(id, { status })
  }

  // Add quote item
  static async addQuoteItem(item: Omit<QuoteItem, 'id'>): Promise<QuoteItem> {
    const { data, error } = await supabase
      .from('quote_items')
      .insert([item])
      .select()
      .single()

    if (error) throw new Error(`Error adding quote item: ${error.message}`)
    return data
  }

  // Get quote items
  static async getQuoteItems(quoteId: string): Promise<QuoteItem[]> {
    const { data, error } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', quoteId)
      .order('line_seq')

    if (error) throw new Error(`Error fetching quote items: ${error.message}`)
    return data || []
  }

  // Update quote item
  static async updateQuoteItem(id: string, updates: Partial<QuoteItem>): Promise<QuoteItem> {
    const { data, error } = await supabase
      .from('quote_items')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Error updating quote item: ${error.message}`)
    return data
  }

  // Delete quote
  static async deleteQuote(id: string): Promise<void> {
    // First delete quote items
    const { error: itemsError } = await supabase
      .from('quote_items')
      .delete()
      .eq('quote_id', id)

    if (itemsError) throw new Error(`Error deleting quote items: ${itemsError.message}`)

    // Then delete the quote
    const { error } = await supabase
      .from('quotes')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`Error deleting quote: ${error.message}`)
  }

  // Get quotes by customer
  static async getQuotesByCustomer(customerId: string): Promise<Quote[]> {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('customer_id', customerId)
      .order('version', { ascending: false })

    if (error) throw new Error(`Error fetching customer quotes: ${error.message}`)
    
    // Manually join customer data for each quote
    if (data && data.length > 0) {
      const { data: customerData } = await supabase
        .from('customers')
        .select('name, email')
        .eq('id', customerId)
        .single()
      
      if (customerData) {
        data.forEach(quote => {
          quote.customers = customerData
        })
      }
    }
    
    return data || []
  }

  // Get latest quote version for customer
  static async getLatestQuoteVersionForCustomer(customerId: string): Promise<Quote | null> {
    const { data, error } = await supabase
      .from('quotes')
      .select('*')
      .eq('customer_id', customerId)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Error fetching latest quote: ${error.message}`)
    }
    
    // Manually join customer data if needed
    if (data && data.customer_id) {
      const { data: customerData } = await supabase
        .from('customers')
        .select('name, email')
        .eq('id', data.customer_id)
        .single()
      
      if (customerData) {
        data.customers = customerData
      }
    }
    
    return data
  }

  // Create new quote version based on existing quote
  static async createQuoteVersion(originalQuoteId: string, changes: Partial<Quote> = {}): Promise<Quote> {
    const originalQuote = await this.getQuote(originalQuoteId)
    if (!originalQuote) {
      throw new Error('Original quote not found')
    }

    const newVersion = originalQuote.version + 1
    const newQuote: Omit<Quote, 'id' | 'created_at'> = {
      customer_id: originalQuote.customer_id,
      work_order_id: originalQuote.work_order_id,
      version: newVersion,
      status: 'draft',
      subtotal: originalQuote.subtotal,
      itbms_total: originalQuote.itbms_total,
      discount_total: originalQuote.discount_total,
      total: originalQuote.total,
      notes: originalQuote.notes,
      ...changes
    }

    const createdQuote = await this.createQuote(newQuote)

    // Copy items from original quote
    const originalItems = await this.getQuoteItems(originalQuoteId)
    for (const item of originalItems) {
      await this.addQuoteItem({
        quote_id: createdQuote.id!,
        line_seq: item.line_seq,
        product_code: item.product_code,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        itbms_rate: item.itbms_rate,
        discount: item.discount,
        line_total: item.line_total
      })
    }

    return createdQuote
  }

  // Calculate quote totals
  static async recalculateQuote(quoteId: string): Promise<Quote> {
    const items = await this.getQuoteItems(quoteId)
    
    let subtotal = 0
    let itbmsTotal = 0
    let discountTotal = 0

    items.forEach(item => {
      const lineSubtotal = item.quantity * item.unit_price
      const lineDiscount = item.discount
      const lineNet = lineSubtotal - lineDiscount
      const lineItbms = lineNet * (item.itbms_rate / 100)

      subtotal += lineSubtotal
      discountTotal += lineDiscount
      itbmsTotal += lineItbms
    })

    const total = subtotal - discountTotal + itbmsTotal

    return this.updateQuote(quoteId, {
      subtotal,
      itbms_total: itbmsTotal,
      discount_total: discountTotal,
      total
    })
  }

  // Get quote statistics
  static async getQuoteStats(): Promise<{
    total: number
    byStatus: Record<Quote['status'], number>
    totalValue: number
    conversionRate: number
    thisMonth: number
  }> {
    // Get all quotes data
    const { data, error } = await supabase
      .from('quotes')
      .select('status, total, created_at')

    if (error) throw new Error(`Error fetching quote stats: ${error.message}`)

    const total = data.length
    const byStatus: Record<Quote['status'], number> = {
      draft: 0,
      sent: 0,
      approved: 0,
      rejected: 0,
      expired: 0
    }

    let totalValue = 0
    let thisMonth = 0
    const currentMonth = new Date()
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)

    data.forEach(quote => {
      byStatus[quote.status as Quote['status']]++
      totalValue += quote.total || 0
      
      const createdAt = new Date(quote.created_at)
      if (createdAt >= firstDayOfMonth) {
        thisMonth++
      }
    })

    // Calculate conversion rate (approved / sent)
    const sent = byStatus.sent
    const approved = byStatus.approved
    const conversionRate = sent > 0 ? Math.round((approved / sent) * 100) : 0

    return {
      total,
      byStatus,
      totalValue,
      conversionRate,
      thisMonth
    }
  }

}
