import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

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
    const { userId, newPassword } = body

    // Validate required fields
    if (!userId || !newPassword) {
      return NextResponse.json(
        { error: 'ID de usuario y nueva contraseña son requeridos' },
        { status: 400 }
      )
    }

    // Validate password strength
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/
    if (!passwordRegex.test(newPassword)) {
      return NextResponse.json(
        { error: 'La contraseña no cumple con los requisitos de seguridad' },
        { status: 400 }
      )
    }

    // Verify target user exists
    const { data: targetUser } = await supabase
      .from('users')
      .select('email, full_name')
      .eq('id', userId)
      .single()

    if (!targetUser) {
      return NextResponse.json(
        { error: 'Usuario no encontrado' },
        { status: 404 }
      )
    }

    // Prevent admin from resetting their own password this way
    if (userId === user.id) {
      return NextResponse.json(
        { error: 'No puedes cambiar tu propia contraseña desde aquí. Usa la sección de Seguridad.' },
        { status: 400 }
      )
    }

    console.log(`🔒 Admin ${user.email} resetting password for user: ${targetUser.email}`)

    // Update password using admin client
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    )

    if (updateError) {
      console.error('Password reset error:', updateError)
      return NextResponse.json(
        { error: 'Error al restablecer la contraseña' },
        { status: 500 }
      )
    }

    console.log(`✅ Password reset successfully for user: ${targetUser.email}`)

    // Log security event
    console.log(`🔐 Security Event: Admin ${user.email} reset password for ${targetUser.email} at ${new Date().toISOString()}`)

    return NextResponse.json({
      success: true,
      message: `Contraseña restablecida exitosamente para ${targetUser.full_name}`
    })

  } catch (error: any) {
    console.error('Unexpected error resetting password:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
