import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// Admin client with Service Role Key (server-side only)
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Token de autorización requerido' },
        { status: 401 }
      )
    }

    const token = authHeader.substring(7) // Remove 'Bearer ' prefix

    // Create client for token verification
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Verify token and get user
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autenticado' },
        { status: 401 }
      )
    }

    // Get user profile to check permissions
    const { data: profile } = await supabase
      .from('users')
      .select('role, is_active')
      .eq('id', user.id)
      .single()

    if (!profile || !profile.is_active || profile.role !== 'admin') {
      return NextResponse.json(
        { error: 'Sin permisos de administrador' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { email, password, full_name, role, phone } = body

    // Validate required fields
    if (!email || !password || !full_name || !role) {
      return NextResponse.json(
        { error: 'Campos requeridos: email, password, full_name, role' },
        { status: 400 }
      )
    }

    console.log(`🚀 Creating new user via API:`, { email, role })

    // Create auth user using admin client
    const { data: authData, error: authError2 } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name
      }
    })

    if (authError2) {
      console.error('Auth creation error:', authError2)
      return NextResponse.json(
        { error: authError2.message },
        { status: 400 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Error al crear usuario' },
        { status: 500 }
      )
    }

    console.log(`✅ Auth user created:`, authData.user.id)

    // Create user record in database
    const { data: userData, error: dbError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        email,
        full_name,
        role: role as 'admin' | 'ops' | 'sales' | 'tech' | 'viewer',
        is_active: true
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database creation error:', dbError)
      // If DB insert fails, try to clean up auth user
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id)
      return NextResponse.json(
        { error: dbError.message },
        { status: 500 }
      )
    }

    console.log(`✅ User record created in database`)

    return NextResponse.json({
      user: {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        role: userData.role,
        is_active: userData.is_active,
        created_at: userData.created_at
      }
    })

  } catch (error: any) {
    console.error('Unexpected error creating user:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
