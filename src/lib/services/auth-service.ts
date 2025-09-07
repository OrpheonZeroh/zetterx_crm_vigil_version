'use client'

import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'

export type UserRole = 'admin' | 'ops' | 'sales' | 'tech' | 'viewer'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
  is_active: boolean
  created_at: string
}

export interface Permission {
  module: string
  actions: string[]
}

// Define permissions for each role
export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  admin: [
    { module: 'customers', actions: ['read', 'create', 'update', 'delete'] },
    { module: 'work-orders', actions: ['read', 'create', 'update', 'delete'] },
    { module: 'inspections', actions: ['read', 'create', 'update', 'delete'] },
    { module: 'products', actions: ['read', 'create', 'update', 'delete'] },
    { module: 'invoices', actions: ['read', 'create', 'update', 'delete'] },
    { module: 'reports', actions: ['read', 'create'] },
    { module: 'calendar', actions: ['read', 'create', 'update', 'delete'] },
    { module: 'settings', actions: ['read', 'create', 'update', 'delete'] },
  ],
  ops: [
    { module: 'customers', actions: ['read', 'create', 'update'] },
    { module: 'work-orders', actions: ['read', 'create', 'update'] },
    { module: 'inspections', actions: ['read', 'create', 'update'] },
    { module: 'products', actions: ['read', 'create', 'update'] },
    { module: 'invoices', actions: ['read', 'create', 'update'] },
    { module: 'reports', actions: ['read'] },
    { module: 'calendar', actions: ['read', 'create', 'update'] },
  ],
  sales: [
    { module: 'customers', actions: ['read', 'create', 'update'] },
    { module: 'work-orders', actions: ['read', 'create', 'update'] },
    { module: 'products', actions: ['read'] },
    { module: 'invoices', actions: ['read', 'create'] },
    { module: 'calendar', actions: ['read', 'create', 'update'] },
  ],
  tech: [
    { module: 'work-orders', actions: ['read', 'update'] },
    { module: 'inspections', actions: ['read', 'create', 'update'] },
    { module: 'calendar', actions: ['read'] },
  ],
  viewer: [
    { module: 'customers', actions: ['read'] },
    { module: 'work-orders', actions: ['read'] },
    { module: 'inspections', actions: ['read'] },
    { module: 'products', actions: ['read'] },
    { module: 'reports', actions: ['read'] },
    { module: 'calendar', actions: ['read'] },
  ],
}

export class AuthService {
  // Get current user
  static async getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser()
    return user
  }

  // Get current user profile with role
  static async getCurrentProfile(): Promise<UserProfile | null> {
    try {
      console.log('🔍 Getting current user profile...')
      const { data: { user }, error: authError } = await supabase.auth.getUser()
      
      if (authError) {
        console.error('❌ Auth error:', authError)
        return null
      }
      
      if (!user) {
        console.log('⚠️ No authenticated user found')
        return null
      }

      console.log('✅ User authenticated:', { id: user.id, email: user.email })

      // Verificar que podemos acceder a la tabla users
      console.log('📋 Querying users table for user:', user.id)
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        console.log('Profile query error details:', { 
          code: error.code, 
          message: error.message, 
          details: error.details,
          hint: error.hint 
        })
        
        // Si el usuario no existe en la tabla users, crearlo automáticamente
        if (error.code === 'PGRST116') {
          console.log('User not found in users table:', user.id, '- Creating new user record')
          // Crear registro de usuario automáticamente
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email,
              full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
              role: 'tech',
              is_active: true
            })
            .select()
            .single()

          if (createError) {
            console.error('Error creating user record:', createError)
            return null
          }

          return {
            id: newUser.id,
            email: user.email || '',
            full_name: newUser.full_name || '',
            role: newUser.role as UserRole || 'tech',
            is_active: newUser.is_active ?? true,
            created_at: newUser.created_at
          }
        }
        
        // Para otros errores, mostrar detalles completos
        console.error('Error fetching user profile:', {
          error,
          userId: user.id,
          userEmail: user.email
        })
        return null
      }

      if (!data) {
        console.log('No profile data found for user:', user.id)
        return null
      }

      return {
        id: data.id,
        email: user.email || '',
        full_name: data.full_name || '',
        role: data.role as UserRole || 'tech',
        is_active: data.is_active ?? true,
        created_at: data.created_at
      }
    } catch (err) {
      console.error('Unexpected error in getCurrentProfile:', err)
      return null
    }
  }

  // Check if user has permission for a specific module and action
  static async hasPermission(module: string, action: string): Promise<boolean> {
    const profile = await this.getCurrentProfile()
    if (!profile || !profile.is_active) return false

    const rolePermissions = ROLE_PERMISSIONS[profile.role]
    const modulePermission = rolePermissions.find(p => p.module === module)
    
    return modulePermission ? modulePermission.actions.includes(action) : false
  }

  // Check if user can access a module
  static async canAccessModule(module: string): Promise<boolean> {
    const profile = await this.getCurrentProfile()
    if (!profile || !profile.is_active) return false

    const rolePermissions = ROLE_PERMISSIONS[profile.role]
    return rolePermissions.some(p => p.module === module)
  }

  // Get user's accessible modules
  static async getAccessibleModules(): Promise<string[]> {
    const profile = await this.getCurrentProfile()
    if (!profile || !profile.is_active) return []

    const rolePermissions = ROLE_PERMISSIONS[profile.role]
    return rolePermissions.map(p => p.module)
  }

  // Create new user (Admin only)
  static async createUser(userInput: {
    email: string
    password: string
    full_name: string
    role: UserRole
    phone?: string
  }): Promise<{ user: UserProfile | null; error: string | null }> {
    try {
      // Check if current user is admin
      const canCreate = await this.hasPermission('users', 'create')
      if (!canCreate) {
        return { user: null, error: 'No tienes permisos para crear usuarios' }
      }

      // Create auth user
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: userInput.email,
        password: userInput.password,
        email_confirm: true
      })

      if (authError) {
        return { user: null, error: authError.message }
      }

      if (!authData.user) {
        return { user: null, error: 'Error al crear usuario' }
      }

      // Create user record
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .insert({
          id: authData.user.id,
          email: userInput.email,
          full_name: userInput.full_name,
          role: userInput.role,
          is_active: true
        })
        .select()
        .single()

      if (userError) {
        // Try to delete the auth user if user record creation fails
        await supabase.auth.admin.deleteUser(authData.user.id)
        return { user: null, error: userError.message }
      }

      return {
        user: {
          id: userRecord.id,
          email: userInput.email,
          full_name: userRecord.full_name,
          role: userRecord.role as UserRole,
          is_active: userRecord.is_active,
          created_at: userRecord.created_at
        },
        error: null
      }
    } catch (error: any) {
      return { user: null, error: error.message || 'Error al crear usuario' }
    }
  }

  // Get all users (Admin only)
  static async getUsers(): Promise<UserProfile[]> {
    const canRead = await this.hasPermission('users', 'read')
    if (!canRead) return []

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching users:', error)
      return []
    }

    return data.map(user => ({
      id: user.id,
      email: user.email || '',
      full_name: user.full_name || '',
      role: user.role as UserRole || 'tech',
      is_active: user.is_active ?? true,
      created_at: user.created_at
    }))
  }

  // Update user profile
  static async updateUserProfile(
    userId: string, 
    updates: Partial<Omit<UserProfile, 'id' | 'email' | 'created_at'>>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const canUpdate = await this.hasPermission('users', 'update')
      if (!canUpdate) {
        return { success: false, error: 'No tienes permisos para actualizar usuarios' }
      }

      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || 'Error al actualizar usuario' }
    }
  }

  // Toggle user active status
  static async toggleUserStatus(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const canUpdate = await this.hasPermission('users', 'update')
      if (!canUpdate) {
        return { success: false, error: 'No tienes permisos para actualizar usuarios' }
      }

      // Get current status
      const { data: currentUser } = await supabase
        .from('users')
        .select('is_active')
        .eq('id', userId)
        .single()

      const newStatus = !currentUser?.is_active

      const { error } = await supabase
        .from('users')
        .update({ 
          is_active: newStatus
        })
        .eq('id', userId)

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error: any) {
      return { success: false, error: error.message || 'Error al cambiar estado del usuario' }
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    await supabase.auth.signOut()
  }
}
