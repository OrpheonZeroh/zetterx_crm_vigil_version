import { supabase } from '@/lib/supabase'
import { Tables, Inserts, Updates } from '@/lib/supabase'

export class UserService {
  // Get current user
  static async getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser()
    if (error) throw error
    return user
  }

  // Get user profile from users table
  static async getUserProfile(userId: string) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  }

  // Create user profile
  static async createUserProfile(userData: Inserts<'users'>) {
    const { data, error } = await supabase
      .from('users')
      .insert(userData)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Update user profile
  static async updateUserProfile(userId: string, updates: Updates<'users'>) {
    const { data, error } = await supabase
      .from('users')
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  }

  // Get all users (for admin)
  static async getAllUsers() {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  }

  // Check if user exists
  static async userExists(email: string) {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .single()
    
    if (error && error.code !== 'PGRST116') {
      throw error
    }
    
    return !!data
  }

  // Get technicians (users with tech/ops role only)
  static async getTechnicians() {
    const { data, error } = await supabase
      .from('users')
      .select('id, full_name, email, role')
      .in('role', ['tech', 'ops'])
      .eq('is_active', true)
      .order('full_name', { ascending: true })
    
    if (error) throw error
    return data || []
  }
}
