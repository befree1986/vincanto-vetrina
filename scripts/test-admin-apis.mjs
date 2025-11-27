#!/usr/bin/env node

/**
 * Test Script per Admin Panel APIs
 * Testa pagamenti, email, analytics e notifiche
 */

const BASE_URL = process.env.VERCEL_URL || 'http://localhost:5173';

// Colori per output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function success(message) {
  log(`✅ ${message}`, 'green');
}

function error(message) {
  log(`❌ ${message}`, 'red');
}

function info(message) {
  log(`ℹ️  ${message}`, 'cyan');
}

function section(message) {
  log(`\n${'='.repeat(50)}`, 'blue');
  log(message, 'blue');
  log('='.repeat(50), 'blue');
}

async function testPaymentsAPI() {
  section('🧪 Test Payments API');

  try {
    // Test 1: Get transactions
    info('Test 1: Get transactions...');
    const transactionsRes = await fetch(`${BASE_URL}/api/payments?action=get-transactions&limit=10`);
    const transactions = await transactionsRes.json();
    
    if (transactionsRes.ok) {
      success(`Transactions retrieved: ${transactions.transactions?.length || 0} records`);
    } else {
      error(`Failed to get transactions: ${transactions.error}`);
    }

    // Test 2: Create payment intent (simulato)
    info('Test 2: Create payment intent...');
    const intentRes = await fetch(`${BASE_URL}/api/payments?action=create-intent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: 100.00,
        booking_id: 1,
        customer_email: 'test@example.com',
        customer_name: 'Test User'
      })
    });
    
    if (intentRes.ok) {
      const intent = await intentRes.json();
      success(`Payment intent created: ${intent.paymentIntentId}`);
    } else {
      const err = await intentRes.json();
      error(`Failed to create intent: ${err.error}`);
    }

  } catch (err) {
    error(`Payments API test failed: ${err.message}`);
  }
}

async function testEmailsAPI() {
  section('📧 Test Emails API');

  try {
    // Test 1: Test SMTP connection
    info('Test 1: Test SMTP connection...');
    const testRes = await fetch(`${BASE_URL}/api/emails?action=test`);
    const testResult = await testRes.json();
    
    if (testResult.success) {
      success('SMTP connection verified');
    } else {
      error(`SMTP test failed: ${testResult.error}`);
    }

    // Test 2: Get email logs
    info('Test 2: Get email logs...');
    const logsRes = await fetch(`${BASE_URL}/api/emails?action=get-logs&limit=10`);
    const logs = await logsRes.json();
    
    if (logsRes.ok) {
      success(`Email logs retrieved: ${logs.logs?.length || 0} records`);
    } else {
      error(`Failed to get logs: ${logs.error}`);
    }

    // Test 3: Send test template email
    info('Test 3: Send template email (booking confirmation)...');
    const sendRes = await fetch(`${BASE_URL}/api/emails?action=send-template`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        to: 'test@example.com',
        template: 'booking_confirmation',
        variables: {
          customer_name: 'Test User',
          check_in: '2025-12-01',
          check_out: '2025-12-05',
          guests: '2',
          total_amount: '450.00'
        }
      })
    });
    
    if (sendRes.ok) {
      const sent = await sendRes.json();
      success(`Email sent: Message ID ${sent.messageId}`);
    } else {
      const err = await sendRes.json();
      error(`Failed to send email: ${err.error}`);
    }

  } catch (err) {
    error(`Emails API test failed: ${err.message}`);
  }
}

async function testAnalyticsAPI() {
  section('📊 Test Analytics API');

  try {
    // Test 1: Get today's analytics
    info('Test 1: Get today\'s analytics...');
    const today = new Date().toISOString().split('T')[0];
    const todayRes = await fetch(`${BASE_URL}/api/analytics?action=get-daily&date=${today}`);
    const todayData = await todayRes.json();
    
    if (todayRes.ok) {
      success(`Today's analytics: ${todayData.bookings_count || 0} bookings, €${todayData.revenue || 0}`);
    } else {
      error(`Failed to get analytics: ${todayData.error}`);
    }

    // Test 2: Aggregate today
    info('Test 2: Aggregate today\'s data...');
    const aggRes = await fetch(`${BASE_URL}/api/analytics?action=aggregate-today`, {
      method: 'POST'
    });
    const aggData = await aggRes.json();
    
    if (aggRes.ok) {
      success(`Aggregation completed for ${aggData.date}`);
    } else {
      error(`Failed to aggregate: ${aggData.error}`);
    }

    // Test 3: Get summary (last 30 days)
    info('Test 3: Get 30-day summary...');
    const summaryRes = await fetch(`${BASE_URL}/api/analytics?action=get-summary&days=30`);
    const summary = await summaryRes.json();
    
    if (summaryRes.ok) {
      success(`30-day summary: ${summary.total_bookings || 0} bookings, €${summary.total_revenue || 0}`);
      info(`  Airbnb: ${summary.total_airbnb || 0} bookings`);
      info(`  Booking: ${summary.total_booking || 0} bookings`);
      info(`  Holidu: ${summary.total_holidu || 0} bookings`);
      info(`  Direct: ${summary.total_direct || 0} bookings`);
    } else {
      error(`Failed to get summary: ${summary.error}`);
    }

  } catch (err) {
    error(`Analytics API test failed: ${err.message}`);
  }
}

async function testUnifiedAPI() {
  section('🔗 Test Unified API (iCal Export)');

  try {
    info('Testing iCal export endpoint...');
    const icalRes = await fetch(`${BASE_URL}/api/unified?action=ical-export`);
    const icalText = await icalRes.text();
    
    if (icalRes.ok && icalText.includes('BEGIN:VCALENDAR')) {
      success(`iCal export working: ${icalText.length} bytes`);
    } else {
      error('iCal export failed or invalid format');
    }
  } catch (err) {
    error(`Unified API test failed: ${err.message}`);
  }
}

async function runAllTests() {
  log('\n🚀 Starting Admin Panel API Tests\n', 'cyan');
  log(`Base URL: ${BASE_URL}`, 'yellow');
  
  await testPaymentsAPI();
  await testEmailsAPI();
  await testAnalyticsAPI();
  await testUnifiedAPI();
  
  section('✨ Test Suite Completed');
  log('\n📋 Next Steps:', 'yellow');
  log('1. Review test results above');
  log('2. Configure missing environment variables if any tests failed');
  log('3. Deploy database schema if not done yet');
  log('4. Test via Admin Panel UI\n');
}

// Run tests
runAllTests().catch(err => {
  error(`Fatal error: ${err.message}`);
  process.exit(1);
});
