import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

// Admin client for password operations
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
    // Verify current user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Usuario no autenticado' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { currentPassword, newPassword } = body

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { error: 'Contraseña actual y nueva contraseña son requeridas' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json(
        { error: 'La nueva contraseña no cumple con los requisitos de seguridad' },
        { status: 400 }
      )
    }

    console.log(`🔒 Changing password for user: ${user.id}`)

    // Verify current password by attempting to sign in
    const { error: verifyError } = await supabase.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword
    })

    if (verifyError) {
      console.error('Current password verification failed:', verifyError)
      return NextResponse.json(
        { error: 'Contraseña actual incorrecta' },
        { status: 400 }
      )
    }

    // Update password using admin client
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.id,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Password update error:', updateError)
      return NextResponse.json(
        { error: 'Error al actualizar la contraseña' },
        { status: 500 }
      )
    }

    console.log(`✅ Password updated successfully for user: ${user.id}`)

    // Log security event
    console.log(`🔐 Security Event: Password changed for user ${user.email} at ${new Date().toISOString()}`)

    return NextResponse.json({
      success: true,
      message: 'Contraseña actualizada exitosamente'
    })

  } catch (error: any) {
    console.error('Unexpected error changing password:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
