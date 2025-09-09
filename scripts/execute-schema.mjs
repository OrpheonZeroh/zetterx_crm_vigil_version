import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { config } from 'dotenv'

// Load environment variables
config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function executeSchema() {
  try {
    console.log('🚀 Reading SQL schema file...')
    const sqlContent = readFileSync('init/06-final-reset-and-rebuild.sql', 'utf8')
    
    console.log('📊 Executing SQL commands...')
    
    // Split by semicolons and execute each statement
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'))
    
    console.log(`📝 Found ${statements.length} SQL statements to execute`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        console.log(`⚡ Executing statement ${i + 1}/${statements.length}`)
        
        const { error } = await supabase.rpc('exec_sql', { 
          sql_query: statement 
        })
        
        if (error) {
          console.error(`❌ Error in statement ${i + 1}:`, error.message)
          console.error('Statement:', statement.substring(0, 100) + '...')
        }
      }
    }
    
    console.log('✅ Schema execution completed!')
    console.log('🔍 Verifying tables...')
    
    // Verify key tables exist
    const tables = ['inspections', 'quotes', 'quote_items', 'installation_slots']
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
      
      if (error) {
        console.error(`❌ Table ${table} verification failed:`, error.message)
      } else {
        console.log(`✅ Table ${table} exists`)
      }
    }
    
  } catch (error) {
    console.error('❌ Schema execution failed:', error.message)
    process.exit(1)
  }
}

executeSchema()
