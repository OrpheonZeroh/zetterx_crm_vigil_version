#!/usr/bin/env node

/**
 * 🧪 LOCAL DGI FLOW TESTER
 * Tests the complete DGI invoice flow without database dependencies
 */

import { InvoiceEmailTest } from '../src/lib/testing/invoice-email-test.js';

console.log('🚀 Starting DGI Flow Test Suite...\n');

async function runFullDGITest() {
  try {
    console.log('='.repeat(60));
    console.log('🧪 DGI INVOICE PROCESSING - FULL FLOW TEST');
    console.log('='.repeat(60));

    // Test 1: DGI Response Processing
    console.log('\n📋 TEST 1: DGI Response Processing');
    const processed = await InvoiceEmailTest.testDGIProcessing();
    console.log('✅ DGI processing completed successfully\n');

    // Test 2: PDF Generation
    console.log('📄 TEST 2: PDF Generation');
    const pdfBase64 = await InvoiceEmailTest.testPDFGeneration();
    console.log('✅ PDF generation completed successfully\n');

    // Test 3: Email Preparation
    console.log('📧 TEST 3: Email Preparation');
    const emailData = await InvoiceEmailTest.testEmailPreparation();
    console.log('✅ Email preparation completed successfully\n');

    // Test 4: Complete Flow Integration
    console.log('🔄 TEST 4: Complete Flow Integration');
    const result = await InvoiceEmailTest.runCompleteTest();
    console.log('✅ Complete flow test passed\n');

    console.log('='.repeat(60));
    console.log('🎉 ALL TESTS PASSED! DGI FLOW IS WORKING');
    console.log('='.repeat(60));

    console.log('\n📊 SUMMARY:');
    console.log(`- DGI Processing: ✅ Working`);
    console.log(`- PDF Generation: ✅ Working (${pdfBase64?.length || 0} chars)`);
    console.log(`- Email Preparation: ✅ Working`);
    console.log(`- Integration Flow: ✅ Working`);

    console.log('\n🏗️ NEXT STEPS:');
    console.log('1. Set up Supabase environment variables');
    console.log('2. Initialize database schema');
    console.log('3. Test with real API endpoints');
    console.log('4. Deploy to production environment');

    return true;

  } catch (error) {
    console.error('\n❌ TEST FAILED:', error);
    console.error('\nStack trace:', error.stack);
    return false;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const success = await runFullDGITest();
  process.exit(success ? 0 : 1);
}

export { runFullDGITest };
