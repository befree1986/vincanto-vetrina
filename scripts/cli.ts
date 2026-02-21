import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { scanCssFiles } from '../utils/cssScanner';
import { getClassUsageReport } from '../utils/classUsage';
import { applyCorrections } from '../src/utils/correctionEngine';
import { saveReport } from '../utils/reportGenerator';
import {
  ensureDirectoriesExist,
  updateLearningStore,
  getLearningStore
} from '../utils/learningStore';
import { getOllamaSuggestions } from '../utils/ollamaSuggest';
import { generateContent } from '../utils/contentGenerator';
import { trackChange, generateChangelogMarkdown } from '../utils/publishTracker';
import { verifyContentOnline } from '../utils/webVerifier';
import { autoApplyCorrections } from '../utils/autoApply';
import { universalAutoApply } from '../utils/universalAutoApply';
import { batchUniversalApply } from '../utils/batchUniversalApply';
import { watchAndAutoApply } from '../utils/watchAndAutoApply';
import { suggestSeoImprovements } from '../utils/seoSuggest';
import { applySeoCorrections } from '../utils/seoAutoApply';
import { runFreePrompt } from '../utils/freePrompt';

ensureDirectoriesExist();

async function runInteractiveLint() {
  const cssFiles = scanCssFiles();
  const usageReport = getClassUsageReport();

  const { targetFile } = await inquirer.prompt([
    {
      type: 'list',
      name: 'targetFile',
      message: '📂 Quale file CSS vuoi correggere?',
      choices: cssFiles
    }
  ]);

  const rawCss = fs.readFileSync(targetFile, 'utf-8');
  const history = getLearningStore();
  const aiSuggestions = await getOllamaSuggestions({
    cssContent: rawCss,
    removedHistory: history.css.removed,
    insertedHistory: history.css.inserted
  });

  console.log('\n🤖 Suggerimenti IA:');
  console.log('🔸 Classi da considerare per rimozione:', aiSuggestions.suggestedRemovals);
  console.log('🔸 Variabili CSS consigliate:', aiSuggestions.suggestedVariables);

  const { removeClasses } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'removeClasses',
      message: '🧹 Seleziona le classi da rimuovere:',
      choices: usageReport.unusedCssClasses
    }
  ]);

  const { insertVariables } = await inquirer.prompt([
    {
      type: 'input',
      name: 'insertVariables',
      message: '➕ Inserisci variabili CSS (separate da virgola):',
      filter: (input: string) =>
        input.split(',').map((s: string) => s.trim()).filter(Boolean)
    }
  ]);

  const { confirmBackup } = await inquirer.prompt([
    {
      type: 'confirm',
      name: 'confirmBackup',
      message: '🗂️ Vuoi creare un backup del file prima di modificarlo?',
      default: true
    }
  ]);

  if (removeClasses.length || insertVariables.length) {
    applyCorrections(targetFile, {
      insertVariables,
      removeClasses,
      backup: confirmBackup
    });

    saveReport({
      filePath: targetFile,
      removedClasses: removeClasses,
      insertedVariables: insertVariables,
      backupCreated: confirmBackup
    });

    updateLearningStore('css', 'removed', removeClasses);
    updateLearningStore('css', 'inserted', insertVariables);

    trackChange(targetFile, 'Ottimizzazione CSS con rimozione classi e inserimento variabili');
    console.log('\n✅ Correzioni applicate con successo!');
  } else {
    console.log('\n⚠️ Nessuna modifica selezionata. Il file non è stato aggiornato.');
  }
}

async function runContentGenerator() {
  const { type, tema, struttura } = await inquirer.prompt([
    { type: 'list', name: 'type', message: '📦 Tipo di contenuto:', choices: ['pagina', 'testo', 'component', 'email'] },
    { type: 'input', name: 'tema', message: '🎯 Tema del contenuto:' },
    {
      type: 'input',
      name: 'struttura',
      message: '🧱 Struttura (sezioni separate da virgola):',
      filter: (input: string) => input.split(',').map((s: string) => s.trim()).filter(Boolean)
    }
  ]);

  const result = await generateContent({ type, tema, struttura, stile: 'Vincanto', lingua: 'it' });
  const fileName = `contenuti/${tema.replace(/\s+/g, '_')}.md`;
  fs.mkdirSync('contenuti', { recursive: true });
  fs.writeFileSync(fileName, result.content);
  trackChange(fileName, `Generazione contenuto IA: ${type} su "${tema}"`);
  console.log('\n🧠 Contenuto generato e salvato in:', fileName);
}

async function runSeoAutoApply() {
  const { filePath, keyword } = await inquirer.prompt([
    { type: 'input', name: 'filePath', message: '📄 File da correggere:' },
    { type: 'input', name: 'keyword', message: '🔍 Keyword principale:' }
  ]);

  const content = fs.readFileSync(filePath, 'utf-8');
  const suggestions = await suggestSeoImprovements(content, keyword);

  const headingStructure = suggestions.headings.reduce((acc, h) => {
    const [from, to] = h.split('→').map(s => s.trim());
    if (from && to) acc[from] = to;
    return acc;
  }, {} as Record<string, string>);

  const updated = applySeoCorrections(content, {
    title: suggestions.title,
    metaDescription: suggestions.metaDescription,
    headingStructure,
    altText: suggestions.altText,
    links: []
  });

  fs.writeFileSync(filePath, updated);
  updateLearningStore('seo', 'keywords', [keyword]);
  updateLearningStore('seo', 'meta', [suggestions.metaDescription]);

  console.log('\n✅ Correzioni SEO applicate con successo!');
}

async function runFreePromptCLI() {
  const { prompt } = await inquirer.prompt([
    { type: 'input', name: 'prompt', message: '🧠 Scrivi una richiesta libera per l’IA:' }
  ]);
  const result = await runFreePrompt(prompt);
  console.log('\n🧠 Risposta IA:\n', result.response);
}

async function runAutoApply() {
  const cssFiles = scanCssFiles();
  const { targetFile } = await inquirer.prompt([
    { type: 'list', name: 'targetFile', message: '📂 Seleziona il file CSS:', choices: cssFiles }
  ]);
  autoApplyCorrections(targetFile);
}

async function runUniversalAutoApply() {
  const { filePath } = await inquirer.prompt([
    { type: 'input', name: 'filePath', message: '📄 File da correggere automaticamente:' }
  ]);
  universalAutoApply(filePath);
}

async function runBatchUniversalApply() {
  const { directory } = await inquirer.prompt([
    { type: 'input', name: 'directory', message: '📁 Cartella da correggere in batch:' }
  ]);
  batchUniversalApply({ directory });
}

async function runWatchAndAutoApply() {
  const { directory } = await inquirer.prompt([
    { type: 'input', name: 'directory', message: '👁️ Cartella da monitorare:' }
  ]);
  watchAndAutoApply(directory);
}

async function runWebVerifier() {
  const { filePath, topic } = await inquirer.prompt([
    { type: 'input', name: 'filePath', message: '📄 File da verificare:' },
    { type: 'input', name: 'topic', message: '🌐 Argomento da confrontare online:' }
  ]);
  const content = fs.readFileSync(filePath, 'utf-8');
  await verifyContentOnline({ content, topic });
}

async function runPublishTracker() {
  const markdown = generateChangelogMarkdown();
  const fileName = `changelog/changelog_${Date.now()}.md`;
  fs.mkdirSync('changelog', { recursive: true });
  fs.writeFileSync(fileName, markdown);
  console.log('\n📦 Changelog generato in:', fileName);
}

async function runReplaceDomains() {
  console.log('\n🔍 Scansione INTERO PROGETTO per riferimenti a vercel.app...');

  const { mode } = await inquirer.prompt([
    {
      type: 'list',
      name: 'mode',
      message: '🔄 Modalità sostituzione domini:',
      choices: [
        { name: '👀 Simulazione (Mostra solo cosa verrebbe cambiato)', value: 'dry' },
        { name: '✍️  Manuale (Conferma per ogni file)', value: 'manual' },
        { name: '🚀 Automatica (Sostituisci tutto subito)', value: 'auto' }
      ]
    }
  ]);
  
  function getAllFiles(dirPath: string, arrayOfFiles: string[] = []) {
    const files = fs.readdirSync(dirPath);
    files.forEach(function(file) {
      // Ignora cartelle di sistema, dipendenze e build
      if (['node_modules', '.git', '.next', '.vercel', 'dist', 'coverage'].includes(file)) return;

      if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
        getAllFiles(path.join(dirPath, file), arrayOfFiles);
      } else {
        arrayOfFiles.push(path.join(dirPath, file));
      }
    });
    return arrayOfFiles;
  }

  const files = getAllFiles('./');
  let count = 0;
  const regex = /https?:\/\/vincanto[-a-zA-Z0-9]*\.vercel\.app/g;

  for (const file of files) {
    // Include più estensioni (xml, txt, env, yml, ecc.) per una pulizia completa
    if (file.match(/\.(ts|tsx|js|jsx|json|md|mdx|html|css|scss|xml|txt|yml|yaml)$/i) || path.basename(file).startsWith('.env')) {
      const content = fs.readFileSync(file, 'utf-8');
      
      if (regex.test(content)) {
        const matches = content.match(regex) || [];
        const uniqueMatches = [...new Set(matches)]; // Rimuove duplicati per visualizzazione pulita
        
        console.log(`\n📄 Trovato in: ${file}`);
        uniqueMatches.forEach(m => console.log(`   🔴 ${m}  -->  🟢 https://vincantomaiori.it`));

        if (mode === 'dry') {
          count++;
          continue;
        }

        let shouldReplace = true;
        if (mode === 'manual') {
          const { confirm } = await inquirer.prompt([
            { type: 'confirm', name: 'confirm', message: 'Sostituire in questo file?', default: true }
          ]);
          shouldReplace = confirm;
        }

        if (shouldReplace) {
          const newContent = content.replace(regex, 'https://vincantomaiori.it');
          fs.writeFileSync(file, newContent, 'utf-8');
          console.log(`   ✅ Aggiornato.`);
          count++;
        } else {
          console.log(`   ⏭️  Saltato.`);
        }
      }
    }
  }

  if (count === 0) {
    console.log('\n✨ Nessun riferimento a vercel.app trovato (o nessuna modifica effettuata).');
  } else {
    if (mode === 'dry') {
      console.log(`\n🔍 Trovati ${count} file con riferimenti da aggiornare.`);
    } else {
      console.log(`\n🎉 Aggiornati ${count} file.`);
    }
  }
}

async function runGitManager() {
  console.log('\n🐙 Gestione Repository Git');
  
  // Verifica se è un repo git
  try {
    execSync('git rev-parse --is-inside-work-tree', { stdio: 'ignore' });
  } catch {
    console.error('❌ Questa cartella non è inizializzata come repository Git.');
    const { init } = await inquirer.prompt([{ type: 'confirm', name: 'init', message: 'Vuoi inizializzare Git ora?', default: true }]);
    if (init) {
      execSync('git init');
      console.log('✅ Git inizializzato.');
    } else {
      return;
    }
  }

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: 'Scegli azione:',
      choices: [
        { name: '🚀 Push (Invia tutto a GitHub)', value: 'push' },
        { name: '🔗 Configura Remote (Collega a GitHub)', value: 'remote' },
        { name: '📊 Stato (Status)', value: 'status' },
        { name: '🔙 Indietro', value: 'back' }
      ]
    }
  ]);

  if (action === 'back') return;

  if (action === 'remote') {
    const currentRemote = execSync('git remote -v').toString();
    console.log('\nAttuale configurazione remote:\n' + (currentRemote || 'Nessun remote configurato.'));
    
    const { newRemote } = await inquirer.prompt([
      { type: 'input', name: 'newRemote', message: 'Inserisci URL repository GitHub (es. https://github.com/tuo-utente/vincanto.git):' }
    ]);
    
    if (newRemote) {
      try {
        execSync('git remote remove origin', { stdio: 'ignore' });
      } catch {}
      execSync(`git remote add origin ${newRemote}`);
      console.log('✅ Remote origin aggiornato.');
    }
  }

  if (action === 'status') {
    console.log('\n' + execSync('git status').toString());
  }

  if (action === 'push') {
    const { message } = await inquirer.prompt([
      { type: 'input', name: 'message', message: '💬 Messaggio commit:', default: 'Aggiornamento progetto' }
    ]);

    console.log('⏳ Aggiunta file...');
    execSync('git add .');
    
    console.log('⏳ Commit...');
    try {
      execSync(`git commit -m "${message}"`);
    } catch {
      console.log('ℹ️ Nessuna modifica da committare.');
    }

    console.log('⏳ Push verso GitHub...');
    try {
      execSync('git push');
      console.log('✅ Push completato!');
    } catch {
      console.log('⚠️ Push standard fallito. Provo push upstream (primo invio)...');
      try {
        execSync('git push -u origin main');
        console.log('✅ Primo push completato!');
      } catch (err) {
        console.error('❌ Errore durante il push. Verifica di aver configurato il remote correttamente.');
      }
    }
  }
}

async function main() {
  const { task } = await inquirer.prompt([
    {
      type: 'list',
      name: 'task',
      message: '🧭 Cosa vuoi fare?',
      choices: [
        { name: '🔧 Ottimizza CSS', value: 'lint' },
        { name: '🔁 Correzioni automatiche CSS', value: 'auto' },
        { name: '🧠 Correggi automaticamente qualsiasi file', value: 'universal' },
        { name: '🔃 Correggi tutti i file modificabili in una cartella', value: 'batch' },
        { name: '👁️ Monitoraggio automatico su cartella', value: 'watch' },
        { name: '📝 Genera contenuto IA', value: 'content' },
        { name: '🌐 Verifica contenuto con fonti online', value: 'verify' },
        { name: '📦 Verifica modifiche da pubblicare', value: 'publish' },
        { name: '📈 Ottimizza SEO contenuti e markup', value: 'seo' },
        { name: '🛠️ Applica suggerimenti SEO automaticamente', value: 'seo-auto' },
        { name: '🔍 Verifica SEO con confronto web e applica', value: 'seo-verify' },
        { name: '💬 Prompt libero IA', value: 'free' },
        { name: '🔄 Aggiorna domini (vincanto...vercel.app -> vincantomaiori.it)', value: 'replace-domains' },
        { name: '🚀 Pubblica su Vercel', value: 'deploy' },
        { name: '🐙 Gestione Git (Push su GitHub)', value: 'git' },
        { name: '🐞 Vedi Log Errori Vercel', value: 'logs' },
        { name: '❌ Esci', value: 'exit' },
      ]
    }
  ]);

  if (task === 'lint') await runInteractiveLint();
  if (task === 'auto') await runAutoApply();
  if (task === 'universal') await runUniversalAutoApply();
  if (task === 'batch') await runBatchUniversalApply();
  if (task === 'watch') await runWatchAndAutoApply();
  if (task === 'content') await runContentGenerator();
  if (task === 'verify') await runWebVerifier();
  if (task === 'publish') await runPublishTracker();
  if (task === 'seo-auto') await runSeoAutoApply();
  if (task === 'free') await runFreePromptCLI();
  if (task === 'replace-domains') await runReplaceDomains();
  if (task === 'git') await runGitManager();
  if (task === 'deploy') {
    const { mode } = await inquirer.prompt([
      {
        type: 'list',
        name: 'mode',
        message: '🚀 Opzioni di Pubblicazione Vercel:',
        choices: [
          { name: '⚡ Pubblica subito (sul progetto già collegato)', value: 'fast' },
          { name: '🔗 Cambia progetto di destinazione (re-link) e pubblica', value: 'relink' },
          { name: '❌ Annulla', value: 'exit' }
        ]
      }
    ]);

    if (mode === 'exit') return;

    if (mode === 'relink') {
      console.log('\n🔗 Avvio procedura di collegamento a un nuovo progetto...');
      try {
        execSync('npx vercel link', { stdio: 'inherit' });
      } catch (error) {
        console.error('\n❌ Collegamento interrotto.');
        return;
      }
    }

    console.log('\n🚀 Avvio deploy in produzione...');
    try {
      execSync('npx vercel --prod', { stdio: 'inherit' });
    } catch (error) {
      console.error('\n❌ Deploy interrotto o fallito.');
    }
  }
  if (task === 'logs') {
    console.log('\n🐞 Recupero ultimi log di produzione da Vercel...');
    try {
      execSync('npx vercel logs --prod --limit 20', { stdio: 'inherit' });
    } catch (error) {
      console.error('\n❌ Impossibile recuperare i log. Verifica il login con "npx vercel login".');
    }
  }
  if (task === 'seo') {
    const { filePath, keyword } = await inquirer.prompt([
      { type: 'input', name: 'filePath', message: '📄 File da analizzare:' },
      { type: 'input', name: 'keyword', message: '🔍 Keyword principale:' }
    ]);
    const content = fs.readFileSync(filePath, 'utf-8');
    const suggestions = await suggestSeoImprovements(content, keyword);
    console.log('\n📈 Suggerimenti SEO:');
    console.log('🔹 Titolo:', suggestions.title);
    console.log('🔹 Meta description:', suggestions.metaDescription);
    console.log('🔹 Headings:', suggestions.headings.join(', '));
    console.log('🔹 Alt text:', suggestions.altText);
  }
  if (task === 'exit') process.exit(0);
  if (task === 'seo-verify') {
  const { filePath, keyword } = await inquirer.prompt([
    { type: 'input', name: 'filePath', message: '📄 File da verificare e correggere:' },
    { type: 'input', name: 'keyword', message: '🔍 Keyword principale:' }
  ]);

  const content = fs.readFileSync(filePath, 'utf-8');
  const { verifySeoWithWebModels } = await import('../utils/seoVerifier');
  const result = await verifySeoWithWebModels(content, keyword);

  if (result.applied) {
    fs.writeFileSync(filePath, result.updated);
    console.log('\n✅ Ottimizzazione SEO applicata con confronto web!');
    console.log('🔗 Puoi verificare manualmente su:', result.googleSearchUrl);
  } else {
    console.log('\n⚠️ Verifica non disponibile.');
    console.log('🔗 Puoi confrontare manualmente su:', result.googleSearchUrl);
    console.log(result.message);
  }
}
}
main();
