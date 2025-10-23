import fs from 'fs';
import path from 'path';

export function saveReport({
  filePath,
  removedClasses,
  insertedVariables,
  backupCreated
}: {
  filePath: string;
  removedClasses: string[];
  insertedVariables: string[];
  backupCreated: boolean;
}) {
  const timestamp = new Date().toISOString();
  const report = `# 🧾 Report Ottimizzazione CSS\n\n` +
    `**File ottimizzato:** ${filePath}\n` +
    `**Backup creato:** ${backupCreated ? '✅ Sì' : '❌ No'}\n` +
    `**Data:** ${timestamp}\n\n` +
    `## 🔥 Classi rimosse\n${removedClasses.length ? removedClasses.map(c => `- ${c}`).join('\n') : 'Nessuna'}\n\n` +
    `## 🎨 Variabili inserite\n${insertedVariables.length ? insertedVariables.map(v => `- ${v}`).join('\n') : 'Nessuna'}\n`;

  const reportDir = path.resolve('reports');
  const reportPath = path.join(reportDir, `report-${Date.now()}.md`);

  fs.mkdirSync(reportDir, { recursive: true });
  fs.writeFileSync(reportPath, report, 'utf-8');

  console.log(`📄 Report salvato in: ${reportPath}`);
}