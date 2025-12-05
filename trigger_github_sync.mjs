#!/usr/bin/env node

/**
 * Triggerare manualmente il GitHub Actions workflow per Sync Calendari
 * Usa il GitHub API per triggerare il dispatch manuale
 */

const owner = 'befree1986';
const repo = 'vincanto-vetrina';
const workflowId = 'calendar-sync.yml'; // Nome del file workflow
const ref = 'master'; // Branch

// Token GitHub necessario - usa il valore dalla environment o chiedi
const githubToken = process.env.GITHUB_TOKEN;

if (!githubToken) {
  console.error('\n❌ ERRORE: GITHUB_TOKEN non configurato!');
  console.log('\n💡 Per triggerare il workflow:');
  console.log('  1. Vai a: https://github.com/settings/tokens');
  console.log('  2. Crea un Personal Access Token con scope: workflow, repo');
  console.log('  3. Esporta: export GITHUB_TOKEN="ghp_xxxxx"');
  console.log('  4. Rilancia questo script');
  process.exit(1);
}

async function triggerWorkflow() {
  try {
    console.log('\n🚀 === TRIGGER GITHUB ACTIONS WORKFLOW ===\n');
    console.log(`📋 Triggerando: ${owner}/${repo}`);
    console.log(`📝 Workflow: ${workflowId}`);
    console.log(`🌿 Branch: ${ref}\n`);
    
    const url = `https://api.github.com/repos/${owner}/${repo}/actions/workflows/${workflowId}/dispatches`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `token ${githubToken}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        ref: ref,
        inputs: {}
      })
    });

    if (response.status === 204) {
      console.log('✅ Workflow triggerato con successo!\n');
      console.log('📊 Controlla il progress qui:');
      console.log(`   https://github.com/${owner}/${repo}/actions\n`);
      console.log('⏳ Il sync inizierà tra pochi secondi...\n');
    } else if (response.status === 404) {
      console.error('❌ Workflow non trovato! Verifica il file calendar-sync.yml');
      const body = await response.text();
      console.error('Risposta:', body);
      process.exit(1);
    } else {
      console.error(`❌ Errore ${response.status}:`, response.statusText);
      const body = await response.text();
      console.error('Dettagli:', body);
      process.exit(1);
    }

  } catch (error) {
    console.error('❌ Errore durante il trigger:', error.message);
    process.exit(1);
  }
}

triggerWorkflow();
