'use client'

import { supabase } from '@/lib/supabase'

export interface InstallationSlot {
  id?: string
  work_order_id: string
  team_id?: string
  start_at: string
  end_at: string
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'done' | 'no_show' | 'cancelled'
  cost_estimate?: number
  notes?: string
  // Relations
  work_order?: {
    id: string
    title: string
    address_line?: string
    customer: {
      name: string
      phone?: string
    }
  }
  team?: {
    id: string
    name: string
  }
}

export interface CalendarFilters {
  start_date?: string
  end_date?: string
  status?: InstallationSlot['status']
  team_id?: string
  work_order_id?: string
  limit?: number
  offset?: number
}

export interface CalendarStats {
  total: number
  scheduled: number
  completed: number
  in_progress: number
  cancelled: number
  this_week: number
  next_week: number
  completion_rate: number
  avg_duration: number
}

export class CalendarService {
  // Create new installation slot
  static async createSlot(slotData: Omit<InstallationSlot, 'id'>): Promise<InstallationSlot> {
    const { data, error } = await supabase
      .from('installation_slots')
      .insert([slotData])
      .select(`
        *,
        work_order:work_orders(
          id,
          title,
          customer:customers(name, phone)
        ),
        team:installer_teams(id, name)
      `)
      .single()

    if (error) throw new Error(`Error creating installation slot: ${error.message}`)
    return data
  }

  // Get installation slots with filters and pagination
  static async getSlots(filters: CalendarFilters = {}): Promise<{
    slots: InstallationSlot[]
    total: number
    hasMore: boolean
  }> {
    let query = supabase
      .from('installation_slots')
      .select(`
        *,
        work_order:work_orders(
          id,
          title,
          customer:customers(name, phone)
        ),
        team:installer_teams(id, name)
      `, { count: 'exact' })

    // Apply filters
    if (filters.start_date) {
      query = query.gte('start_at', filters.start_date)
    }
    if (filters.end_date) {
      query = query.lte('start_at', filters.end_date)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.team_id) {
      query = query.eq('team_id', filters.team_id)
    }
    if (filters.work_order_id) {
      query = query.eq('work_order_id', filters.work_order_id)
    }

    // Pagination
    const limit = filters.limit || 50
    const offset = filters.offset || 0
    query = query.range(offset, offset + limit - 1)

    // Order by start date
    query = query.order('start_at', { ascending: true })

    const { data, error, count } = await query

    if (error) throw new Error(`Error fetching installation slots: ${error.message}`)

    return {
      slots: data || [],
      total: count || 0,
      hasMore: (data?.length || 0) === limit
    }
  }

  // Get slots for a specific date range (for calendar view)
  static async getSlotsForDateRange(startDate: string, endDate: string): Promise<InstallationSlot[]> {
    const { data, error } = await supabase
      .from('installation_slots')
      .select(`
        *,
        work_order:work_orders(
          id,
          title,
          customer:customers(name, phone)
        ),
        team:installer_teams(id, name)
      `)
      .gte('start_at', startDate)
      .lte('start_at', endDate)
      .order('start_at')

    if (error) throw new Error(`Error fetching slots for date range: ${error.message}`)
    return data || []
  }

  // Get single installation slot by ID
  static async getSlotById(id: string): Promise<InstallationSlot | null> {
    const { data, error } = await supabase
      .from('installation_slots')
      .select(`
        *,
        work_order:work_orders(
          id,
          title,
          customer:customers(name, phone)
        ),
        team:installer_teams(id, name)
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Error fetching installation slot: ${error.message}`)
    }
    return data
  }

  // Update installation slot
  static async updateSlot(id: string, updates: Partial<InstallationSlot>): Promise<InstallationSlot> {
    const { data, error } = await supabase
      .from('installation_slots')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        work_order:work_orders(
          id,
          title,
          customer:customers(name, phone)
        ),
        team:installer_teams(id, name)
      `)
      .single()

    if (error) throw new Error(`Error updating installation slot: ${error.message}`)
    return data
  }

  // Update slot status
  static async updateStatus(id: string, status: InstallationSlot['status']): Promise<void> {
    const { error } = await supabase
      .from('installation_slots')
      .update({ status })
      .eq('id', id)

    if (error) throw new Error(`Error updating slot status: ${error.message}`)
  }

  // Delete installation slot
  static async deleteSlot(id: string): Promise<void> {
    const { error } = await supabase
      .from('installation_slots')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`Error deleting installation slot: ${error.message}`)
  }

  // Reschedule slot
  static async rescheduleSlot(
    id: string, 
    newStartAt: string, 
    newEndAt: string,
    notes?: string
  ): Promise<InstallationSlot> {
    return this.updateSlot(id, {
      start_at: newStartAt,
      end_at: newEndAt,
      status: 'scheduled',
      notes: notes || `Rescheduled to ${newStartAt}`
    })
  }

  // Complete installation
  static async completeInstallation(id: string, notes?: string): Promise<InstallationSlot> {
    return this.updateSlot(id, {
      status: 'done',
      notes: notes || 'Installation completed'
    })
  }

  // Get available time slots for a date and team
  static async getAvailableSlots(date: string, teamId?: string): Promise<string[]> {
    let query = supabase
      .from('installation_slots')
      .select('start_at, end_at')
      .gte('start_at', date + 'T00:00:00')
      .lt('start_at', date + 'T23:59:59')
      .neq('status', 'cancelled')

    if (teamId) {
      query = query.eq('team_id', teamId)
    }

    const { data, error } = await query
    if (error) throw new Error(`Error fetching available slots: ${error.message}`)

    // Generate available time slots (simplified - would need more complex logic)
    const workingHours = ['08:00', '09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00']
    const bookedSlots = data?.map(slot => new Date(slot.start_at).toTimeString().substring(0, 5)) || []
    
    return workingHours.filter(time => !bookedSlots.includes(time))
  }

  // Get calendar statistics
  static async getCalendarStats(): Promise<CalendarStats> {
    // Get all slots
    const { data: allSlots, error: allError } = await supabase
      .from('installation_slots')
      .select('status, start_at, end_at, cost_estimate')

    if (allError) throw new Error(`Error fetching calendar stats: ${allError.message}`)

    const slots = allSlots || []
    const now = new Date()
    const thisWeekStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - now.getDay())
    const thisWeekEnd = new Date(thisWeekStart.getTime() + 7 * 24 * 60 * 60 * 1000)
    const nextWeekEnd = new Date(thisWeekEnd.getTime() + 7 * 24 * 60 * 60 * 1000)

    // Count by status
    const byStatus = slots.reduce((acc, slot) => {
      acc[slot.status] = (acc[slot.status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Count this week and next week
    const thisWeek = slots.filter(slot => {
      const slotDate = new Date(slot.start_at)
      return slotDate >= thisWeekStart && slotDate < thisWeekEnd
    }).length

    const nextWeek = slots.filter(slot => {
      const slotDate = new Date(slot.start_at)
      return slotDate >= thisWeekEnd && slotDate < nextWeekEnd
    }).length

    // Calculate completion rate
    const completed = byStatus.done || 0
    const total = slots.length
    const completionRate = total > 0 ? (completed / total) * 100 : 0

    // Calculate average duration
    const durations = slots
      .filter(slot => slot.start_at && slot.end_at)
      .map(slot => {
        const start = new Date(slot.start_at)
        const end = new Date(slot.end_at)
        return (end.getTime() - start.getTime()) / (1000 * 60) // minutes
      })
    const avgDuration = durations.length > 0 
      ? durations.reduce((sum, duration) => sum + duration, 0) / durations.length 
      : 0

    return {
      total,
      scheduled: byStatus.scheduled || 0,
      completed: byStatus.done || 0,
      in_progress: byStatus.in_progress || 0,
      cancelled: byStatus.cancelled || 0,
      this_week: thisWeek,
      next_week: nextWeek,
      completion_rate: Math.round(completionRate),
      avg_duration: Math.round(avgDuration)
    }
  }

  // Get upcoming installations (next 7 days)
  static async getUpcomingInstallations(): Promise<InstallationSlot[]> {
    const today = new Date().toISOString()
    const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

    const { data, error } = await supabase
      .from('installation_slots')
      .select(`
        *,
        work_order:work_orders(
          id,
          title,
          customer:customers(name, phone)
        ),
        team:installer_teams(id, name)
      `)
      .gte('start_at', today)
      .lte('start_at', nextWeek)
      .in('status', ['scheduled', 'confirmed', 'in_progress'])
      .order('start_at')

    if (error) throw new Error(`Error fetching upcoming installations: ${error.message}`)
    return data || []
  }

  // Get overdue installations
  static async getOverdueInstallations(): Promise<InstallationSlot[]> {
    const today = new Date().toISOString()

    const { data, error } = await supabase
      .from('installation_slots')
      .select(`
        *,
        work_order:work_orders(
          id,
          title,
          customer:customers(name, phone)
        ),
        team:installer_teams(id, name)
      `)
      .lt('start_at', today)
      .in('status', ['scheduled', 'confirmed', 'in_progress'])
      .order('start_at')

    if (error) throw new Error(`Error fetching overdue installations: ${error.message}`)
    return data || []
  }
}
