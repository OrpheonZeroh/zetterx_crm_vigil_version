'use client'

import { supabase } from '@/lib/supabase'

export interface Installer {
  id?: string
  full_name: string
  phone?: string
  email?: string
  is_active: boolean
  created_at?: string
}

export interface InstallerTeam {
  id?: string
  name: string
  created_at?: string
  members?: InstallerTeamMember[]
}

export interface InstallerTeamMember {
  team_id: string
  installer_id: string
  is_lead: boolean
  installer?: Installer
}

export interface InstallationSlot {
  id?: string
  work_order_id: string
  team_id?: string
  start_at: string
  end_at: string
  status: 'scheduled' | 'confirmed' | 'in_progress' | 'done' | 'no_show' | 'cancelled'
  cost_estimate?: number
  notes?: string
  work_order?: {
    title: string
    customer_id: string
  }
  team?: InstallerTeam
}

export class InstallerService {
  // INSTALLERS
  static async createInstaller(installer: Omit<Installer, 'id' | 'created_at'>): Promise<Installer> {
    const { data, error } = await supabase
      .from('installers')
      .insert([installer])
      .select()
      .single()

    if (error) throw new Error(`Error creating installer: ${error.message}`)
    return data
  }

  static async getInstallers(activeOnly: boolean = true): Promise<Installer[]> {
    let query = supabase
      .from('installers')
      .select('*')
      .order('full_name')

    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    const { data, error } = await query

    if (error) throw new Error(`Error fetching installers: ${error.message}`)
    return data || []
  }

  static async getInstaller(id: string): Promise<Installer | null> {
    const { data, error } = await supabase
      .from('installers')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Error fetching installer: ${error.message}`)
    }
    return data
  }

  static async updateInstaller(id: string, updates: Partial<Installer>): Promise<Installer> {
    const { data, error } = await supabase
      .from('installers')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw new Error(`Error updating installer: ${error.message}`)
    return data
  }

  static async deactivateInstaller(id: string): Promise<Installer> {
    return this.updateInstaller(id, { is_active: false })
  }

  // INSTALLER TEAMS
  static async createInstallerTeam(team: Omit<InstallerTeam, 'id' | 'created_at'>): Promise<InstallerTeam> {
    const { data, error } = await supabase
      .from('installer_teams')
      .insert([team])
      .select()
      .single()

    if (error) throw new Error(`Error creating installer team: ${error.message}`)
    return data
  }

  static async getInstallerTeams(): Promise<InstallerTeam[]> {
    const { data, error } = await supabase
      .from('installer_teams')
      .select(`
        *,
        installer_team_members(
          is_lead,
          installers(*)
        )
      `)
      .order('name')

    if (error) throw new Error(`Error fetching installer teams: ${error.message}`)
    return data || []
  }

  static async getInstallerTeam(id: string): Promise<InstallerTeam | null> {
    const { data, error } = await supabase
      .from('installer_teams')
      .select(`
        *,
        installer_team_members(
          is_lead,
          installers(*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') return null
      throw new Error(`Error fetching installer team: ${error.message}`)
    }
    return data
  }

  static async addTeamMember(teamId: string, installerId: string, isLead: boolean = false): Promise<InstallerTeamMember> {
    const { data, error } = await supabase
      .from('installer_team_members')
      .insert([{
        team_id: teamId,
        installer_id: installerId,
        is_lead: isLead
      }])
      .select(`
        *,
        installers(*)
      `)
      .single()

    if (error) throw new Error(`Error adding team member: ${error.message}`)
    return data
  }

  static async removeTeamMember(teamId: string, installerId: string): Promise<void> {
    const { error } = await supabase
      .from('installer_team_members')
      .delete()
      .eq('team_id', teamId)
      .eq('installer_id', installerId)

    if (error) throw new Error(`Error removing team member: ${error.message}`)
  }

  static async updateTeamMemberLead(teamId: string, installerId: string, isLead: boolean): Promise<InstallerTeamMember> {
    const { data, error } = await supabase
      .from('installer_team_members')
      .update({ is_lead: isLead })
      .eq('team_id', teamId)
      .eq('installer_id', installerId)
      .select(`
        *,
        installers(*)
      `)
      .single()

    if (error) throw new Error(`Error updating team member lead status: ${error.message}`)
    return data
  }

  // INSTALLATION SLOTS
  static async createInstallationSlot(slot: Omit<InstallationSlot, 'id'>): Promise<InstallationSlot> {
    const { data, error } = await supabase
      .from('installation_slots')
      .insert([slot])
      .select(`
        *,
        work_orders:work_order_id(title, customer_id),
        installer_teams:team_id(*)
      `)
      .single()

    if (error) throw new Error(`Error creating installation slot: ${error.message}`)
    return data
  }

  static async getInstallationSlots(filters: {
    work_order_id?: string
    team_id?: string
    status?: InstallationSlot['status']
    date_from?: string
    date_to?: string
  } = {}): Promise<InstallationSlot[]> {
    let query = supabase
      .from('installation_slots')
      .select(`
        *,
        work_orders:work_order_id(title, customer_id),
        installer_teams:team_id(*)
      `)
      .order('start_at')

    if (filters.work_order_id) {
      query = query.eq('work_order_id', filters.work_order_id)
    }
    if (filters.team_id) {
      query = query.eq('team_id', filters.team_id)
    }
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.date_from) {
      query = query.gte('start_at', filters.date_from)
    }
    if (filters.date_to) {
      query = query.lte('start_at', filters.date_to)
    }

    const { data, error } = await query

    if (error) throw new Error(`Error fetching installation slots: ${error.message}`)
    return data || []
  }

  static async updateInstallationSlot(id: string, updates: Partial<InstallationSlot>): Promise<InstallationSlot> {
    const { data, error } = await supabase
      .from('installation_slots')
      .update(updates)
      .eq('id', id)
      .select(`
        *,
        work_orders:work_order_id(title, customer_id),
        installer_teams:team_id(*)
      `)
      .single()

    if (error) throw new Error(`Error updating installation slot: ${error.message}`)
    return data
  }

  static async updateSlotStatus(id: string, status: InstallationSlot['status']): Promise<InstallationSlot> {
    return this.updateInstallationSlot(id, { status })
  }

  static async getUpcomingSlots(teamId?: string): Promise<InstallationSlot[]> {
    const now = new Date().toISOString()
    
    let query = supabase
      .from('installation_slots')
      .select(`
        *,
        work_orders:work_order_id(title, customer_id),
        installer_teams:team_id(*)
      `)
      .gte('start_at', now)
      .in('status', ['scheduled', 'confirmed'])

    if (teamId) {
      query = query.eq('team_id', teamId)
    }

    query = query.order('start_at', { ascending: true })

    const { data, error } = await query

    if (error) throw new Error(`Error fetching upcoming slots: ${error.message}`)
    return data || []
  }

  static async getSlotsByWorkOrder(workOrderId: string): Promise<InstallationSlot[]> {
    const { data, error } = await supabase
      .from('installation_slots')
      .select(`
        *,
        work_orders:work_order_id(title, customer_id),
        installer_teams:team_id(*)
      `)
      .eq('work_order_id', workOrderId)
      .order('start_at')

    if (error) throw new Error(`Error fetching work order slots: ${error.message}`)
    return data || []
  }
}
