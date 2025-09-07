import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function createTestUser() {
  try {
    const testEmail = 'admin@zetterx.com'
    const testPassword = 'ZetterX2024!'
    
    console.log('Creating test user...')
    
    // Create auth user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: testEmail,
      password: testPassword,
      email_confirm: true,
      user_metadata: {
        full_name: 'Administrador ZetterX'
      }
    })

    if (authError) {
      console.error('Error creating auth user:', authError)
      return
    }

    console.log('✅ Auth user created:', authData.user.email)

    // Create user record in our users table
    const { error: userError } = await supabase
      .from('users')
      .insert({
        id: authData.user.id,
        full_name: 'Administrador ZetterX',
        email: testEmail,
        role: 'admin',
        is_active: true
      })

    if (userError) {
      console.error('Error creating user record:', userError)
      return
    }

    console.log('✅ User record created in database')
    console.log('\n🎉 Test user created successfully!')
    console.log(`Email: ${testEmail}`)
    console.log(`Password: ${testPassword}`)
    
  } catch (error) {
    console.error('Error:', error)
  }
}

createTestUser()
