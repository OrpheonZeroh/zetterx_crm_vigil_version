'use client'

import { supabase } from '@/lib/supabase'

export interface Quote {
  id?: string
  work_order_id: string
  version: number
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'expired'
  subtotal: number
  itbms_total: number
  discount_total: number
  total: number
  notes?: string
  created_at?: string
  work_order?: {
    title: string
    customer_id: string
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
  work_order_id?: string
  status?: Quote['status']
  customer_id?: string
  date_from?: string
  date_to?: string
  search?: string
  limit?: number
  offset?: number
}

export class QuoteService {
  // Create new quote
  static async createQuote(quote: Omit<Quote, 'id' | 'created_at'>): Promise<Quote> {
    const { data, error } = await supabase
      .from('quotes')
      .insert([quote])
      .select(`
        *,
        work_orders:work_order_id(title, customer_id)
      `)
      .single()

    if (error) throw new Error(`Error creating quote: ${error.message}`)
    return data
  }

  // Get quote by ID
  static async getQuote(id: string): Promise<Quote | null> {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        work_orders:work_order_id(title, customer_id)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Error fetching quote: ${error.message}`)
    }
    return data
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
        work_orders:work_order_id(title, customer_id)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })

    // Apply filters
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
      query = query.or(`notes.ilike.%${filters.search}%`)
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

    return {
      quotes: data || [],
      total: count || 0
    }
  }

  // Update quote
  static async updateQuote(id: string, updates: Partial<Quote>): Promise<Quote> {
    const { data, error } = await supabase
      .from('quotes')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        work_orders:work_order_id(title, customer_id)
      `)
      .single()

    if (error) throw new Error(`Error updating quote: ${error.message}`)
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

  // Delete quote item
  static async deleteQuoteItem(id: string): Promise<void> {
    const { error } = await supabase
      .from('quote_items')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`Error deleting quote item: ${error.message}`)
  }

  // Get quotes by work order
  static async getQuotesByWorkOrder(workOrderId: string): Promise<Quote[]> {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        work_orders:work_order_id(title, customer_id)
      `)
      .eq('work_order_id', workOrderId)
      .order('version', { ascending: false })

    if (error) throw new Error(`Error fetching work order quotes: ${error.message}`)
    return data || []
  }

  // Get latest quote version for work order
  static async getLatestQuoteVersion(workOrderId: string): Promise<Quote | null> {
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        *,
        work_orders:work_order_id(title, customer_id)
      `)
      .eq('work_order_id', workOrderId)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Error fetching latest quote: ${error.message}`)
    }
    return data
  }

  // Create new quote version
  static async createNewVersion(workOrderId: string, baseQuoteId?: string): Promise<Quote> {
    // Get the current highest version
    const { data: maxVersionData } = await supabase
      .from('quotes')
      .select('version')
      .eq('work_order_id', workOrderId)
      .order('version', { ascending: false })
      .limit(1)
      .single()

    const newVersion = (maxVersionData?.version || 0) + 1

    let newQuote: Omit<Quote, 'id' | 'created_at'>

    if (baseQuoteId) {
      // Copy from existing quote
      const baseQuote = await this.getQuote(baseQuoteId)
      if (!baseQuote) throw new Error('Base quote not found')

      newQuote = {
        work_order_id: workOrderId,
        version: newVersion,
        status: 'draft',
        subtotal: baseQuote.subtotal,
        itbms_total: baseQuote.itbms_total,
        discount_total: baseQuote.discount_total,
        total: baseQuote.total,
        notes: baseQuote.notes
      }
    } else {
      // Create blank quote
      newQuote = {
        work_order_id: workOrderId,
        version: newVersion,
        status: 'draft',
        subtotal: 0,
        itbms_total: 0,
        discount_total: 0,
        total: 0
      }
    }

    const createdQuote = await this.createQuote(newQuote)

    // Copy items if based on existing quote
    if (baseQuoteId) {
      const baseItems = await this.getQuoteItems(baseQuoteId)
      for (const item of baseItems) {
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
    byStatus: { [key: string]: number }
    totalValue: number
    conversionRate: number
    thisMonth: number
  }> {
    // Get total quotes
    const { count: total } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })

    // Get quotes by status
    const { data: statusData } = await supabase
      .from('quotes')
      .select('status')

    const byStatus: { [key: string]: number } = {}
    statusData?.forEach(quote => {
      byStatus[quote.status] = (byStatus[quote.status] || 0) + 1
    })

    // Get total value
    const { data: valueData } = await supabase
      .from('quotes')
      .select('total')

    const totalValue = valueData?.reduce((sum, quote) => sum + quote.total, 0) || 0

    // Calculate conversion rate (approved / sent)
    const sent = byStatus['sent'] || 0
    const approved = byStatus['approved'] || 0
    const conversionRate = sent > 0 ? Math.round((approved / sent) * 100) : 0

    // Get quotes created this month
    const currentMonth = new Date()
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    
    const { count: thisMonth } = await supabase
      .from('quotes')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstDayOfMonth.toISOString())

    return {
      total: total || 0,
      byStatus,
      totalValue,
      conversionRate,
      thisMonth: thisMonth || 0
    }
  }
}
