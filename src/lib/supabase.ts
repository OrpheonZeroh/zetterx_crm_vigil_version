import { createClient } from './supabase/client'

export const supabase = createClient()

// Database Types based on our schema
export interface Database {
  public: {
    Tables: {
      organization: {
        Row: {
          id: string
          name: string
          ruc_tipo: string | null
          ruc_numero: string | null
          ruc_dv: string | null
          branch_code: string | null
          phone: string | null
          email: string | null
          address_line: string | null
          ubi_code: string | null
          province: string | null
          district: string | null
          corregimiento: string | null
          coords: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          ruc_tipo?: string | null
          ruc_numero?: string | null
          ruc_dv?: string | null
          branch_code?: string | null
          phone?: string | null
          email?: string | null
          address_line?: string | null
          ubi_code?: string | null
          province?: string | null
          district?: string | null
          corregimiento?: string | null
          coords?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          ruc_tipo?: string | null
          ruc_numero?: string | null
          ruc_dv?: string | null
          branch_code?: string | null
          phone?: string | null
          email?: string | null
          address_line?: string | null
          ubi_code?: string | null
          province?: string | null
          district?: string | null
          corregimiento?: string | null
          coords?: string | null
          created_at?: string
        }
      }
      users: {
        Row: {
          id: string
          full_name: string
          email: string
          role: 'admin' | 'ops' | 'sales' | 'tech' | 'viewer'
          is_active: boolean
          created_at: string
        }
        Insert: {
          id?: string
          full_name: string
          email: string
          role: 'admin' | 'ops' | 'sales' | 'tech' | 'viewer'
          is_active?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          full_name?: string
          email?: string
          role?: 'admin' | 'ops' | 'sales' | 'tech' | 'viewer'
          is_active?: boolean
          created_at?: string
        }
      }
      customers: {
        Row: {
          id: string
          name: string
          email: string | null
          phone: string | null
          address_line: string | null
          country_code: string
          ubi_code: string | null
          province: string | null
          district: string | null
          corregimiento: string | null
          tax_id_type: string | null
          notes: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          email?: string | null
          phone?: string | null
          address_line?: string | null
          country_code?: string
          ubi_code?: string | null
          province?: string | null
          district?: string | null
          corregimiento?: string | null
          tax_id_type?: string | null
          notes?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string | null
          phone?: string | null
          address_line?: string | null
          country_code?: string
          ubi_code?: string | null
          province?: string | null
          district?: string | null
          corregimiento?: string | null
          tax_id_type?: string | null
          notes?: string | null
          created_at?: string
        }
      }
      work_orders: {
        Row: {
          id: string
          customer_id: string
          title: string
          status: 'lead' | 'quoted' | 'approved' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          estimated_value: number | null
          address_line: string | null
          province: string | null
          district: string | null
          corregimiento: string | null
          ubi_code: string | null
          notes: string | null
          created_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          title: string
          status?: 'lead' | 'quoted' | 'approved' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          estimated_value?: number | null
          address_line?: string | null
          province?: string | null
          district?: string | null
          corregimiento?: string | null
          ubi_code?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          title?: string
          status?: 'lead' | 'quoted' | 'approved' | 'scheduled' | 'in_progress' | 'completed' | 'cancelled'
          estimated_value?: number | null
          address_line?: string | null
          province?: string | null
          district?: string | null
          corregimiento?: string | null
          ubi_code?: string | null
          notes?: string | null
          created_by?: string | null
          created_at?: string
        }
      }
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Inserts<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updates<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
