#!/usr/bin/env node
/**
 * Monitor Vercel Deployment Status
 * Checks if the new APIs are deployed and responding
 */

const BASE_URL = 'https://vincanto-vetrina.vercel.app';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkEndpoint(name, url) {
  try {
    const response = await fetch(url);
    const text = await response.text();
    
    if (text.includes('A server error')) {
      return { status: 'error', message: 'Server error (API not found)' };
    }
    
    try {
      const data = JSON.parse(text);
      if (response.ok) {
        return { status: 'ok', message: 'Responding correctly' };
      } else {
        return { status: 'warn', message: data.error || 'API error' };
      }
    } catch {
      return { status: 'error', message: 'Invalid JSON response' };
    }
  } catch (error) {
    return { status: 'error', message: error.message };
  }
}

async function monitorDeploy() {
  log('\n═══════════════════════════════════════════', 'cyan');
  log('   Vercel Deployment Monitor', 'cyan');
  log('═══════════════════════════════════════════', 'cyan');
  
  const endpoints = [
    { name: 'Payments API', url: `${BASE_URL}/api/payments?action=verify-status` },
    { name: 'Emails API', url: `${BASE_URL}/api/emails?action=test` },
    { name: 'Analytics API', url: `${BASE_URL}/api/analytics?action=get-summary&days=30` },
  ];
  
  let allDeployed = true;
  
  for (const endpoint of endpoints) {
    const result = await checkEndpoint(endpoint.name, endpoint.url);
    
    if (result.status === 'ok') {
      log(`✅ ${endpoint.name}: ${result.message}`, 'green');
    } else if (result.status === 'warn') {
      log(`⚠️  ${endpoint.name}: ${result.message}`, 'yellow');
    } else {
      log(`❌ ${endpoint.name}: ${result.message}`, 'red');
      allDeployed = false;
    }
  }
  
  log('\n═══════════════════════════════════════════', 'cyan');
  
  if (allDeployed) {
    log('🎉 All APIs are deployed and responding!', 'green');
    log('\nNext steps:', 'cyan');
    log('  1. Run: node scripts/quick-api-test.mjs', 'yellow');
    log('  2. Check TEST_CHECKLIST.md for detailed testing', 'yellow');
  } else {
    log('⏳ Deployment still in progress...', 'yellow');
    log('\nWait 1-2 minutes and try again:', 'cyan');
    log('  node scripts/monitor-deploy.mjs', 'yellow');
    log('\nOr check Vercel Dashboard:', 'cyan');
    log('  https://vercel.com/befree1986/vincanto-vetrina/deployments', 'yellow');
  }
  
  log('');
}

monitorDeploy().catch(error => {
  log(`\n❌ Monitor failed: ${error.message}`, 'red');
  process.exit(1);
});
