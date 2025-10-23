import inquirer from 'inquirer';
import fs from 'fs';
import path from 'path';
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
