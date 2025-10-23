import { scanCssFiles, fixCssImports, checkCssVariables } from '../utils/cssScanner';
import { getClassUsageReport } from '../utils/classUsage';
import { optimizer } from '../ai/optimizer';
import { applyCorrections } from '../src/utils/correctionEngine';

console.log('🚀 Avvio linting e ottimizzazione del progetto...\n');

// 1. Scansiona e correggi CSS
const cssFiles = scanCssFiles();
cssFiles.forEach(fixCssImports);
cssFiles.forEach(checkCssVariables);

// 2. Mappa classi usate vs definite
const usageReport = getClassUsageReport();
console.log('\n📊 Classi CSS usate vs definite:');
usageReport.unusedCssClasses.forEach((c: string) => console.warn(`❌ Mai usata: .${c}`));
usageReport.missingCssClasses.forEach((c: string) => console.warn(`❌ Non definita: .${c}`));

// 3. Analisi IA
console.log('\n🤖 Analisi IA in corso...');
optimizer.analyzeProject(cssFiles, usageReport).then((suggestions: string[]) => {
  console.log('\n💡 Suggerimenti IA reali:');
  suggestions.forEach((s: string) => console.log(`🔧 ${s}`));

  // 4. Applica correzioni al primo file CSS (esempio)
  const targetFile = cssFiles[0];
  applyCorrections(targetFile, {
    insertVariables: [
      '--blue-dark: #001f3f;',
      '--body-font: "Open Sans", sans-serif;'
    ],
    removeClasses: usageReport.unusedCssClasses.slice(0, 5),
    backup: true
  });

  // 5. Test mirato su un file specifico
  return optimizer.ask('Suggerisci miglioramenti CSS per il file Navbar.css');
}).then((response: string) => {
  console.log('\n🧠 Suggerimento mirato:');
  console.log(response);
});