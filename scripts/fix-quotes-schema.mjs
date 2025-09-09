#!/usr/bin/env node

import dotenv from 'dotenv'
import { createClient } from '@supabase/supabase-js'

// Load environment variables
dotenv.config({ path: '.env.local' })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function fixQuotesSchema() {
  console.log('🔧 Fixing quotes table schema...')
  
  try {
    // First, let's check the current schema
    const { data: quotes, error: quotesError } = await supabase
      .from('quotes')
      .select('*')
      .limit(0)
    
    if (quotesError) {
      console.log('Current quotes table error:', quotesError.message)
    }
    
    // Try to add the missing column through a different approach
    console.log('Attempting to add customer_id column...')
    
    // Use the REST API directly to execute raw SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      },
      body: JSON.stringify({
        sql_query: `
          ALTER TABLE quotes ADD COLUMN IF NOT EXISTS customer_id UUID;
          ALTER TABLE quotes ADD CONSTRAINT fk_quotes_customer 
            FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE;
          ALTER TABLE quotes ALTER COLUMN work_order_id DROP NOT NULL;
        `
      })
    })
    
    if (response.ok) {
      console.log('✅ Schema updated successfully')
      
      // Test the new column
      const { data: testData, error: testError } = await supabase
        .from('quotes')
        .select('customer_id')
        .limit(1)
      
      if (testError) {
        console.log('❌ Test failed:', testError.message)
      } else {
        console.log('✅ customer_id column is now accessible')
      }
    } else {
      const errorText = await response.text()
      console.log('❌ Raw SQL execution failed:', errorText)
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

fixQuotesSchema()
