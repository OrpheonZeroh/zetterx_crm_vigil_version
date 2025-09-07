'use client'

import { supabase } from '@/lib/supabase'

export interface Inspection {
  id?: string
  work_order_id: string
  scheduled_at: string
  inspector_id?: string
  price_zone_id?: string
  quoted_min?: number
  quoted_max?: number
  notes?: string
  photos_urls?: string[]
  result?: string
  created_at?: string
  work_order?: {
    title: string
    customer_id: string
  }
  inspector?: {
    full_name: string
    email?: string
  }
}

export interface InspectionFilters {
  work_order_id?: string
  inspector_id?: string
  date_from?: string
  date_to?: string
  status?: 'scheduled' | 'completed' | 'cancelled'
  search?: string
  limit?: number
  offset?: number
}

export class InspectionService {
  // Create new inspection
  static async createInspection(inspection: Omit<Inspection, 'id' | 'created_at'>): Promise<Inspection> {
    const { data, error } = await supabase
      .from('inspections')
      .insert([inspection])
      .select(`
        *,
        work_orders:work_order_id(title, customer_id),
        users:inspector_id(full_name, email)
      `)
      .single()

    if (error) throw new Error(`Error creating inspection: ${error.message}`)
    return data
  }

  // Get inspection by ID
  static async getInspection(id: string): Promise<Inspection | null> {
    const { data, error } = await supabase
      .from('inspections')
      .select(`
        *,
        work_orders:work_order_id(title, customer_id),
        users:inspector_id(full_name, email)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Error fetching inspection: ${error.message}`)
    }
    return data
  }

  // Get inspections with filtering
  static async getInspections(filters: InspectionFilters = {}): Promise<{
    inspections: Inspection[]
    total: number
  }> {
    let query = supabase
      .from('inspections')
      .select(`
        *,
        work_orders:work_order_id(title, customer_id),
        users:inspector_id(full_name, email)
      `, { count: 'exact' })
      .order('scheduled_at', { ascending: false })

    // Apply filters
    if (filters.work_order_id) {
      query = query.eq('work_order_id', filters.work_order_id)
    }
    if (filters.inspector_id) {
      query = query.eq('inspector_id', filters.inspector_id)
    }
    if (filters.date_from) {
      query = query.gte('scheduled_at', filters.date_from)
    }
    if (filters.date_to) {
      query = query.lte('scheduled_at', filters.date_to)
    }
    if (filters.search) {
      query = query.or(`notes.ilike.%${filters.search}%,result.ilike.%${filters.search}%`)
    }

    // Apply pagination
    if (filters.limit) {
      query = query.limit(filters.limit)
    }
    if (filters.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1)
    }

    const { data, error, count } = await query

    if (error) throw new Error(`Error fetching inspections: ${error.message}`)

    return {
      inspections: data || [],
      total: count || 0
    }
  }

  // Update inspection
  static async updateInspection(id: string, updates: Partial<Inspection>): Promise<Inspection> {
    const { data, error } = await supabase
      .from('inspections')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        work_orders:work_order_id(title, customer_id),
        users:inspector_id(full_name, email)
      `)
      .single()

    if (error) throw new Error(`Error updating inspection: ${error.message}`)
    return data
  }

  // Complete inspection with result
  static async completeInspection(
    id: string, 
    result: string, 
    quotedMin?: number, 
    quotedMax?: number,
    photos?: string[]
  ): Promise<Inspection> {
    return this.updateInspection(id, {
      result,
      quoted_min: quotedMin,
      quoted_max: quotedMax,
      photos_urls: photos
    })
  }

  // Schedule inspection
  static async scheduleInspection(
    workOrderId: string,
    scheduledAt: string,
    inspectorId?: string
  ): Promise<Inspection> {
    return this.createInspection({
      work_order_id: workOrderId,
      scheduled_at: scheduledAt,
      inspector_id: inspectorId
    })
  }

  // Get inspections by work order
  static async getInspectionsByWorkOrder(workOrderId: string): Promise<Inspection[]> {
    const { data, error } = await supabase
      .from('inspections')
      .select(`
        *,
        work_orders:work_order_id(title, customer_id),
        users:inspector_id(full_name, email)
      `)
      .eq('work_order_id', workOrderId)
      .order('scheduled_at', { ascending: false })

    if (error) throw new Error(`Error fetching work order inspections: ${error.message}`)
    return data || []
  }

  // Get inspections by inspector
  static async getInspectionsByInspector(inspectorId: string): Promise<Inspection[]> {
    const { data, error } = await supabase
      .from('inspections')
      .select(`
        *,
        work_orders:work_order_id(title, customer_id),
        users:inspector_id(full_name, email)
      `)
      .eq('inspector_id', inspectorId)
      .order('scheduled_at', { ascending: false })

    if (error) throw new Error(`Error fetching inspector inspections: ${error.message}`)
    return data || []
  }

  // Get upcoming inspections
  static async getUpcomingInspections(inspectorId?: string): Promise<Inspection[]> {
    const now = new Date().toISOString()
    
    let query = supabase
      .from('inspections')
      .select(`
        *,
        work_orders:work_order_id(title, customer_id),
        users:inspector_id(full_name, email)
      `)
      .gte('scheduled_at', now)
      .is('result', null) // Not completed yet

    if (inspectorId) {
      query = query.eq('inspector_id', inspectorId)
    }

    query = query.order('scheduled_at', { ascending: true })

    const { data, error } = await query

    if (error) throw new Error(`Error fetching upcoming inspections: ${error.message}`)
    return data || []
  }

  // Get completed inspections
  static async getCompletedInspections(): Promise<Inspection[]> {
    const { data, error } = await supabase
      .from('inspections')
      .select(`
        *,
        work_orders:work_order_id(title, customer_id),
        users:inspector_id(full_name, email)
      `)
      .not('result', 'is', null)
      .order('created_at', { ascending: false })

    if (error) throw new Error(`Error fetching completed inspections: ${error.message}`)
    return data || []
  }

  // Get inspection statistics
  static async getInspectionStats(): Promise<{
    total: number
    completed: number
    scheduled: number
    thisMonth: number
    averageQuote: number
  }> {
    // Get total inspections
    const { count: total } = await supabase
      .from('inspections')
      .select('*', { count: 'exact', head: true })

    // Get completed inspections
    const { count: completed } = await supabase
      .from('inspections')
      .select('*', { count: 'exact', head: true })
      .not('result', 'is', null)

    // Get scheduled inspections (not completed)
    const { count: scheduled } = await supabase
      .from('inspections')
      .select('*', { count: 'exact', head: true })
      .is('result', null)

    // Get inspections created this month
    const currentMonth = new Date()
    const firstDayOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1)
    
    const { count: thisMonth } = await supabase
      .from('inspections')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', firstDayOfMonth.toISOString())

    // Get average quote from completed inspections
    const { data: quoteData } = await supabase
      .from('inspections')
      .select('quoted_min, quoted_max')
      .not('quoted_min', 'is', null)
      .not('quoted_max', 'is', null)

    let averageQuote = 0
    if (quoteData && quoteData.length > 0) {
      const totalQuotes = quoteData.reduce((sum, inspection) => {
        const avg = ((inspection.quoted_min || 0) + (inspection.quoted_max || 0)) / 2
        return sum + avg
      }, 0)
      averageQuote = totalQuotes / quoteData.length
    }

    return {
      total: total || 0,
      completed: completed || 0,
      scheduled: scheduled || 0,
      thisMonth: thisMonth || 0,
      averageQuote
    }
  }
}
