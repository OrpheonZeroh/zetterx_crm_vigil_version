'use client'

import { supabase } from '@/lib/supabase'

export interface WeeklyTarget {
  id: string
  week_start: string
  amount_target: number
}

export interface WeeklyTargetInput {
  week_start: string
  amount_target: number
}

export class SalesTargetService {
  // Get all weekly targets
  static async getWeeklyTargets(): Promise<WeeklyTarget[]> {
    const { data, error } = await supabase
      .from('weekly_targets')
      .select('*')
      .order('week_start', { ascending: false })

    if (error) throw new Error(`Error fetching weekly targets: ${error.message}`)
    return data || []
  }

  // Get target for specific week
  static async getWeeklyTarget(weekStart: string): Promise<WeeklyTarget | null> {
    const { data, error } = await supabase
      .from('weekly_targets')
      .select('*')
      .eq('week_start', weekStart)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Error fetching weekly target: ${error.message}`)
    }
    return data
  }

  // Create new weekly target
  static async createWeeklyTarget(targetData: WeeklyTargetInput): Promise<WeeklyTarget> {
    const { data, error } = await supabase
      .from('weekly_targets')
      .insert([targetData])
      .select()
      .single()

    if (error) throw new Error(`Error creating weekly target: ${error.message}`)
    return data
  }

  // Update weekly target
  static async updateWeeklyTarget(id: string, updates: Partial<WeeklyTargetInput>): Promise<WeeklyTarget> {
    const { data, error } = await supabase
      .from('weekly_targets')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Error updating weekly target: ${error.message}`)
    return data
  }

  // Delete weekly target
  static async deleteWeeklyTarget(id: string): Promise<void> {
    const { error } = await supabase
      .from('weekly_targets')
      .delete()
      .eq('id', id)

    if (error) throw new Error(`Error deleting weekly target: ${error.message}`)
  }

  // Get current week's target
  static async getCurrentWeekTarget(): Promise<WeeklyTarget | null> {
    const now = new Date()
    const monday = new Date(now)
    monday.setDate(now.getDate() - now.getDay() + 1) // Get Monday of current week
    const weekStart = monday.toISOString().split('T')[0]

    return this.getWeeklyTarget(weekStart)
  }

  // Get targets for date range (for monthly view)
  static async getTargetsInRange(startDate: string, endDate: string): Promise<WeeklyTarget[]> {
    const { data, error } = await supabase
      .from('weekly_targets')
      .select('*')
      .gte('week_start', startDate)
      .lte('week_start', endDate)
      .order('week_start', { ascending: true })

    if (error) throw new Error(`Error fetching targets in range: ${error.message}`)
    return data || []
  }

  // Generate weekly targets for a month
  static async generateMonthlyTargets(year: number, month: number, defaultAmount: number): Promise<WeeklyTarget[]> {
    const weeks: WeeklyTargetInput[] = []
    
    // Get first Monday of the month
    const firstDay = new Date(year, month - 1, 1)
    const firstMonday = new Date(firstDay)
    
    // Find the first Monday
    while (firstMonday.getDay() !== 1) {
      firstMonday.setDate(firstMonday.getDate() + 1)
    }

    // Generate 4-5 weeks for the month
    for (let i = 0; i < 5; i++) {
      const weekStart = new Date(firstMonday)
      weekStart.setDate(firstMonday.getDate() + (i * 7))
      
      // Stop if we're in the next month
      if (weekStart.getMonth() !== month - 1) break

      weeks.push({
        week_start: weekStart.toISOString().split('T')[0],
        amount_target: defaultAmount
      })
    }

    // Insert all weeks
    const { data, error } = await supabase
      .from('weekly_targets')
      .upsert(weeks, { 
        onConflict: 'week_start',
        ignoreDuplicates: false 
      })
      .select()

    if (error) throw new Error(`Error generating monthly targets: ${error.message}`)
    return data || []
  }

  // Calculate monthly target total
  static async getMonthlyTargetTotal(year: number, month: number): Promise<number> {
    const firstDay = new Date(year, month - 1, 1).toISOString().split('T')[0]
    const lastDay = new Date(year, month, 0).toISOString().split('T')[0]

    const targets = await this.getTargetsInRange(firstDay, lastDay)
    return targets.reduce((sum, target) => sum + target.amount_target, 0)
  }
}
