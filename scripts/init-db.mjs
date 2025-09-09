import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
config({ path: join(__dirname, '../.env.local') });

// Get environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅ Set' : '❌ Missing');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? '✅ Set' : '❌ Missing');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function initializeDatabase() {
  try {
    console.log('🚀 Starting database connection test...');
    console.log('🔗 Testing Supabase connection...');
    
    // Try to check if emitters table exists
    console.log('🔍 Testing emitters table...');
    const { data: emitters, error: emittersError } = await supabase
      .from('emitters')
      .select('id, name, company_code')
      .limit(1);
    
    if (emittersError) {
      console.log('⚠️  Emitters table not found - schema needs to be initialized');
      console.log('');
      console.log('🏭 To initialize ZetterX Manufacturing CRM:');
      console.log('1. Go to your Supabase dashboard SQL Editor');
      console.log('2. Copy and paste init/00-consolidated-schema.sql');
      console.log('3. Run the SQL to create all tables and types');
      console.log('4. Copy and paste init/03-manufacturing-adapted-seed.sql');
      console.log('5. Run to populate with glass & aluminum manufacturing data');
      console.log('');
      console.log('🚀 After setup, run this script again to verify connection.');
      console.log('📋 Your manufacturing business will have:');
      console.log('   - Windows, doors, glass panels products');
      console.log('   - Installation teams and specialists');
      console.log('   - Manufacturing workflows (lead → quoted → approved → completed)');
      console.log('   - DGI integration ready for Panamá');
      return;
    } else {
      console.log('✅ Supabase connection successful!');
      console.log(`✅ Emitters table exists with ${emitters?.length || 0} records`);
      if (emitters && emitters.length > 0) {
        console.log('📊 Sample emitters:');
        emitters.forEach(e => console.log(`   - ${e.name} (${e.company_code})`));
      }
    }
    
    console.log('\n🎉 Database connection is working!');
    console.log('🚀 You can now test the DGI endpoints');
    
  } catch (error) {
    console.error('❌ Database test failed:', error.message);
    console.log('\n🔧 Make sure your .env.local has:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=your_supabase_url');
    console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
    process.exit(1);
  }
}

initializeDatabase();
