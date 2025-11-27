#!/usr/bin/env node
/**
 * Quick API Test - Vincanto Admin Panel
 * Tests all backend APIs for basic functionality
 */

const BASE_URL = 'https://vincanto-vetrina.vercel.app';

// Color codes for terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testAPI(name, url, options = {}) {
  try {
    log(`\n🧪 Testing: ${name}`, 'cyan');
    const response = await fetch(url, options);
    const data = await response.json();
    
    if (response.ok && data.success !== false) {
      log(`✅ PASS: ${name}`, 'green');
      log(`   Response: ${JSON.stringify(data).substring(0, 100)}...`, 'blue');
      return true;
    } else {
      log(`⚠️  WARN: ${name} - ${data.error || response.statusText}`, 'yellow');
      return false;
    }
  } catch (error) {
    log(`❌ FAIL: ${name} - ${error.message}`, 'red');
    return false;
  }
}

async function runTests() {
  log('═══════════════════════════════════════════', 'cyan');
  log('   Vincanto Admin - Quick API Test Suite', 'cyan');
  log('═══════════════════════════════════════════', 'cyan');
  
  const results = {
    passed: 0,
    failed: 0,
    total: 0
  };

  // Test 1: SMTP Connection
  log('\n📧 EMAIL SYSTEM', 'yellow');
  results.total++;
  if (await testAPI('SMTP Connection Test', `${BASE_URL}/api/emails?action=test`)) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 2: Payment Gateway Status
  log('\n💳 PAYMENT SYSTEM', 'yellow');
  results.total++;
  if (await testAPI('Payment Gateway Status', `${BASE_URL}/api/payments?action=verify-status`)) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 3: Analytics Summary
  log('\n📊 ANALYTICS SYSTEM', 'yellow');
  results.total++;
  if (await testAPI('Analytics Summary (30 days)', `${BASE_URL}/api/analytics?action=get-summary&days=30`)) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 4: Aggregate Today
  results.total++;
  if (await testAPI('Analytics Aggregation', `${BASE_URL}/api/analytics?action=aggregate-today`, {
    method: 'POST'
  })) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 5: Unified API (Admin Panel main endpoint)
  log('\n🔄 UNIFIED API', 'yellow');
  results.total++;
  if (await testAPI('Unified API - Get Bookings', `${BASE_URL}/api/unified?action=get-bookings`)) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Test 6: Calendar Sync
  results.total++;
  if (await testAPI('Calendar List', `${BASE_URL}/api/unified?action=get-calendari`)) {
    results.passed++;
  } else {
    results.failed++;
  }

  // Summary
  log('\n═══════════════════════════════════════════', 'cyan');
  log('   TEST SUMMARY', 'cyan');
  log('═══════════════════════════════════════════', 'cyan');
  log(`Total Tests: ${results.total}`, 'blue');
  log(`Passed: ${results.passed}`, 'green');
  log(`Failed: ${results.failed}`, results.failed > 0 ? 'red' : 'green');
  log(`Success Rate: ${Math.round((results.passed / results.total) * 100)}%`, 
      results.failed === 0 ? 'green' : 'yellow');

  if (results.failed === 0) {
    log('\n🎉 ALL TESTS PASSED!', 'green');
    log('Your admin panel backend is ready to use.', 'green');
  } else {
    log('\n⚠️  Some tests failed. Check the output above for details.', 'yellow');
    log('Common issues:', 'yellow');
    log('  - SMTP: Verify SMTP credentials in Vercel env vars', 'yellow');
    log('  - Payments: Verify Stripe API keys in Vercel env vars', 'yellow');
    log('  - Database: Ensure complete-admin-schema.sql was executed', 'yellow');
  }

  log('\n📚 For detailed testing, see TEST_CHECKLIST.md', 'blue');
  log('');
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test suite failed: ${error.message}`, 'red');
  process.exit(1);
});
