import fs from 'fs';
import path from 'path';

export interface CorrectionOptions {
  insertVariables?: string[];
  removeClasses?: string[];
  backup?: boolean;
}

export function applyCorrections(filePath: string, options: CorrectionOptions): void {
  const originalContent = fs.readFileSync(filePath, 'utf-8');

  // Backup
  if (options.backup) {
    const backupPath = path.join(
      path.dirname(filePath),
      `${path.basename(filePath, '.css')}.backup.css`
    );
    fs.writeFileSync(backupPath, originalContent);
    console.log(`🗂️ Backup creato: ${backupPath}`);
  }

  let updatedContent = originalContent;

  // Inserisci variabili CSS mancanti
  if (options.insertVariables && options.insertVariables.length) {
    const rootMatch = updatedContent.match(/:root\s*{[^}]*}/);
    const newVars = options.insertVariables.map((v: string) => `  ${v}`).join('\n');

    if (rootMatch) {
      updatedContent = updatedContent.replace(
        /(:root\s*{)([^}]*)(})/,
        `$1\n${newVars}\n$2$3`
      );
    } else {
      updatedContent = `:root {\n${newVars}\n}\n\n` + updatedContent;
    }

    console.log(`➕ Variabili inserite:\n${options.insertVariables.join('\n')}`);
  }

  // Rimuovi classi non usate
  if (options.removeClasses && options.removeClasses.length) {
    options.removeClasses.forEach((className: string) => {
      const regex = new RegExp(`\\.${className}\\s*{[^}]*}`, 'g');
      updatedContent = updatedContent.replace(regex, '');
    });

    console.log(`🧹 Classi rimosse:\n${options.removeClasses.join(', ')}`);
  }

  fs.writeFileSync(filePath, updatedContent);
  console.log(`✅ Modifiche applicate a: ${filePath}`);
}