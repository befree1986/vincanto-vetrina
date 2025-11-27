#!/usr/bin/env node
/**
 * Auto-wait and test - Waits for Vercel deploy then runs tests
 */

import { execSync } from 'child_process';

const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function waitAndTest() {
  log('\n⏳ Waiting for Vercel deployment to complete...', 'cyan');
  log('   This usually takes 2-3 minutes', 'yellow');
  
  const maxAttempts = 12; // 12 attempts x 15 seconds = 3 minutes
  let attempt = 0;
  
  while (attempt < maxAttempts) {
    attempt++;
    const remaining = maxAttempts - attempt;
    
    log(`\n   Attempt ${attempt}/${maxAttempts} (${remaining * 15}s remaining)...`, 'cyan');
    
    try {
      // Run monitor script
      const output = execSync('node scripts/monitor-deploy.mjs', { encoding: 'utf-8' });
      
      // Check if all APIs are up
      if (output.includes('All APIs are deployed')) {
        log('\n✅ Deployment complete!', 'green');
        log('\n🧪 Running full test suite...', 'cyan');
        
        // Run full tests
        execSync('node scripts/quick-api-test.mjs', { stdio: 'inherit' });
        return;
      }
    } catch (error) {
      // Ignore errors, will retry
    }
    
    if (attempt < maxAttempts) {
      // Wait 15 seconds before next attempt
      await new Promise(resolve => setTimeout(resolve, 15000));
    }
  }
  
  log('\n⚠️  Deployment took longer than expected', 'yellow');
  log('   Check Vercel Dashboard:', 'yellow');
  log('   https://vercel.com/befree1986/vincanto-vetrina/deployments', 'cyan');
}

waitAndTest().catch(error => {
  log(`\n❌ Error: ${error.message}`, 'red');
  process.exit(1);
});
